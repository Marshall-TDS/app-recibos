'use client';

import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { 
  Users, 
  Calendar, 
  Printer,
  Info,
  Loader2,
  CheckCircle2,
  Search,
  ChevronRight,
  FileText,
  Briefcase,
  Settings,
  Archive,
  Download,
  AlertCircle,
  DollarSign,
  XCircle,
  Zap,
  Plus,
  Minus
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/lib/supabase';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';

interface Adicional {
  descricao: string;
  valor_mensal: number;
}

interface Colaborador {
  id: string;
  nome: string;
  documento: string;
  cargo: string;
  salario_base: number;
  dias_fevereiro: number;
  gratificacao_padrao: number;
  adicionais_padrao: Adicional[];
  nome_empresa: string;
}

const MESES_OPCOES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

export default function GerarReciboPage() {
  const [loading, setLoading] = useState(false);
  const [batchProgress, setBatchProgress] = useState({ current: 0, total: 0, status: '' });
  const [batchResults, setBatchResults] = useState<{ success: string[], failed: { name: string, error: string }[] } | null>(null);
  
  const [colaboradores, setColaboradores] = useState<Colaborador[]>([]);
  const [fetchingColabs, setFetchingColabs] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Estados do Histórico
  const [historico, setHistorico] = useState<any[]>([]);
  const [historicoLoading, setHistoricoLoading] = useState(false);
  const [filtroData, setFiltroData] = useState('');
  const [selectedHistoricoIds, setSelectedHistoricoIds] = useState<string[]>([]);
  
  const [config, setConfig] = useState({
    dataPagamento: new Date().toLocaleDateString('en-CA'), // YYYY-MM-DD local
    anoReferencia: new Date().getFullYear(),
    mesesSelecionados: [] as string[],
    gratificacaoMode: 'percent' as 'percent' | 'value',
    gratificacaoValue: '',
    descontoMode: 'value' as 'percent' | 'value',
    descontoValue: '',
    observacoes: ''
  });

  useEffect(() => {
    fetchColaboradores();
    fetchHistorico();
  }, []);

  const fetchHistorico = async (dateFilter?: string) => {
    try {
      setHistoricoLoading(true);
      let query = supabase
        .from('recibos')
        .select('*, colaboradores(nome)')
        .order('created_at', { ascending: false })
        .limit(10);

      if (dateFilter) {
        query = query.eq('data_referencia', dateFilter);
      }

      const { data, error } = await query;
      if (error) throw error;
      setHistorico(data || []);
    } catch (error: any) {
      console.error('Error fetching history:', error.message);
    } finally {
      setHistoricoLoading(false);
    }
  };

  const handleDownloadBulkHistorico = async () => {
    if (selectedHistoricoIds.length === 0) return;
    
    setLoading(true);
    const zip = new JSZip();
    const items = historico.filter(h => selectedHistoricoIds.includes(h.id));
    
    try {
      for (const item of items) {
        const name = item.colaboradores?.nome || 'Colaborador';
        const ref = item.meta_data?.referencia_texto || 'Recibo';
        
        const [blobColab, blobEmpresa] = await Promise.all([
          fetch(item.meta_data.via_colab_url).then(r => r.blob()),
          fetch(item.meta_data.via_empresa_url).then(r => r.blob())
        ]);
        
        zip.file(`${name}_${ref}_Via_Colaborador.pdf`, blobColab);
        zip.file(`${name}_${ref}_Via_Empresa.pdf`, blobEmpresa);
      }
      
      const zipBlob = await zip.generateAsync({ type: 'blob' });
      saveAs(zipBlob, `Historico_Marshall_${new Date().getTime()}.zip`);
    } catch (error: any) {
      alert('Erro ao baixar histórico: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchColaboradores = async () => {
    try {
      setFetchingColabs(true);
      const { data, error } = await supabase
        .from('colaboradores')
        .select('*')
        .eq('ativo', true)
        .order('nome');

      if (error) throw error;
      setColaboradores(data || []);
    } catch (error: any) {
      console.error('Error fetching colabs:', error.message);
    } finally {
      setFetchingColabs(false);
    }
  };

  const toggleMes = (mes: string) => {
    setConfig(prev => ({
      ...prev,
      mesesSelecionados: prev.mesesSelecionados.includes(mes)
        ? prev.mesesSelecionados.filter(m => m !== mes)
        : [...prev.mesesSelecionados, mes]
    }));
  };

  const getReferenciaTexto = () => {
    if (config.mesesSelecionados.length === 0) return '';
    
    // Lista ordenada de meses para garantir lógica consistente
    const mesesOrdenados = [...config.mesesSelecionados].sort((a, b) => 
      MESES_OPCOES.indexOf(a) - MESES_OPCOES.indexOf(b)
    );

    const spansEarlyYear = mesesOrdenados.some(m => ['Janeiro', 'Fevereiro', 'Março'].includes(m));
    const hasDecember = mesesOrdenados.includes('Dezembro');

    return mesesOrdenados.map(mes => {
      // Se tiver Dezembro e meses do início do ano, Dezembro é do ano anterior
      if (mes === 'Dezembro' && spansEarlyYear) {
        return `${mes}/${config.anoReferencia - 1}`;
      }
      return `${mes}/${config.anoReferencia}`;
    }).join(', ');
  };

  const calculateTotals = (colab: Colaborador) => {
    const numMeses = config.mesesSelecionados.length || 1;
    let baseTotal = 0;
    
    const includesFeb = config.mesesSelecionados.includes('Fevereiro');
    
    if (numMeses === 1 && includesFeb) {
      baseTotal = (colab.salario_base / 30) * (colab.dias_fevereiro || 30);
    } else if (numMeses > 1 && includesFeb) {
      const baseMesComum = colab.salario_base;
      const baseFev = (colab.salario_base / 30) * (colab.dias_fevereiro || 30);
      baseTotal = (baseMesComum * (numMeses - 1)) + baseFev;
    } else {
      baseTotal = colab.salario_base * numMeses;
    }

    const adicionaisTotal = (colab.adicionais_padrao?.reduce((acc, curr) => acc + (curr.valor_mensal || 0), 0) || 0) * numMeses;
    
    let gratificacao = 0;
    if (config.gratificacaoValue) {
      const val = parseFloat(config.gratificacaoValue);
      gratificacao = config.gratificacaoMode === 'percent' ? (baseTotal * (val / 100)) : val;
    }

    let desconto = 0;
    if (config.descontoValue) {
      const val = parseFloat(config.descontoValue);
      desconto = config.descontoMode === 'percent' ? (baseTotal * (val / 100)) : val;
    }

    return {
      base: baseTotal,
      base_unidade: colab.salario_base, // Adicionado para exibir valor unitário no PDF
      adicionais: adicionaisTotal,
      gratificacao,
      desconto,
      total: baseTotal + adicionaisTotal + gratificacao - desconto
    };
  };

  const handleGenerateBulk = async () => {
    if (selectedIds.length === 0) return;
    if (config.mesesSelecionados.length === 0) {
      alert('Selecione pelo menos um mês de referência.');
      return;
    }
    
    setLoading(true);
    setBatchResults(null);
    setBatchProgress({ current: 0, total: selectedIds.length, status: 'Iniciando processamento...' });
    
    const zip = new JSZip();
    const results = { success: [] as string[], failed: [] as { name: string, error: string }[] };

    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error('Não autenticado');

      const selectedPeople = colaboradores.filter(c => selectedIds.includes(c.id));
      
      for (let i = 0; i < selectedPeople.length; i++) {
        const colab = selectedPeople[i];
        setBatchProgress(prev => ({ ...prev, current: i + 1, status: `Gerando: ${colab.nome}` }));
        
        try {
          const calcs = calculateTotals(colab);
          
          const commonData = {
            colaborador: colab,
            valor: calcs.total.toLocaleString('pt-BR', { minimumFractionDigits: 2 }),
            valor_base: calcs.base.toLocaleString('pt-BR', { minimumFractionDigits: 2 }),
            valor_base_unidade: calcs.base_unidade.toLocaleString('pt-BR', { minimumFractionDigits: 2 }), // Novo campo
            valor_gratificacao: calcs.gratificacao.toLocaleString('pt-BR', { minimumFractionDigits: 2 }),
            valor_desconto: calcs.desconto.toLocaleString('pt-BR', { minimumFractionDigits: 2 }),
            adicionais_lista: colab.adicionais_padrao?.map(a => ({
              descricao: a.descricao,
              valor: (a.valor_mensal * config.mesesSelecionados.length).toLocaleString('pt-BR', { minimumFractionDigits: 2 })
            })) || [],
            referencia: getReferenciaTexto(),
            data: config.dataPagamento,
            observacoes: config.observacoes,
          };

          // Geração em paralelo das duas vias
          const [resColab, resEmpresa] = await Promise.all([
            fetch('/api/generate-pdf', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ ...commonData, via: 'Colaborador' }),
            }),
            fetch('/api/generate-pdf', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ ...commonData, via: 'Empresa' }),
            })
          ]);

          const jsonColab = await resColab.json();
          const jsonEmpresa = await resEmpresa.json();

          if (jsonColab.success && jsonEmpresa.success) {
            const [blobColab, blobEmpresa] = await Promise.all([
              fetch(jsonColab.pdfUrl).then(r => r.blob()),
              fetch(jsonEmpresa.pdfUrl).then(r => r.blob())
            ]);
            
            zip.file(jsonColab.filename, blobColab);
            zip.file(jsonEmpresa.filename, blobEmpresa);

            await supabase.from('recibos').insert([{
              colaborador_id: colab.id,
              data_referencia: config.dataPagamento,
              valor_total: calcs.total,
              meta_data: { 
                referencia_texto: config.mesesSelecionados.join(', '),
                calc_detalhe: calcs,
                via_colab_url: jsonColab.pdfUrl,
                via_empresa_url: jsonEmpresa.pdfUrl
              },
              user_id: userData.user.id
            }]);

            results.success.push(colab.nome);
          } else {
            throw new Error(jsonColab.error || jsonEmpresa.error || 'Erro na API de PDF');
          }
        } catch (err: any) {
          console.error(`Erro ao processar ${colab.nome}:`, err);
          results.failed.push({ name: colab.nome, error: err.message });
        }
      }

      setBatchProgress(prev => ({ ...prev, status: 'Finalizando arquivo ZIP...' }));
      
        if (results.success.length > 0) {
          const zipBlob = await zip.generateAsync({ type: 'blob' });
          saveAs(zipBlob, `Lote_Marshall_${config.mesesSelecionados.join('_')}.zip`);
          fetchHistorico(); // Atualiza histórico após gerar novo lote
        }

      setBatchResults(results);
    } catch (error: any) {
      alert('Erro Crítico: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8 h-full flex flex-col animate-in fade-in duration-500">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6 mb-8 sm:mb-12">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-marshall-gold/10 rounded-lg text-marshall-gold">
                <Printer size={24} />
              </div>
              <h1 className="text-3xl sm:text-4xl font-black tracking-tight italic">Gerar Recibos</h1>
            </div>
          </div>

          <AnimatePresence>
            {loading && (
              <motion.div 
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="flex items-center gap-4 glass px-6 py-3 rounded-2xl border-marshall-gold/20"
              >
                <div className="text-right">
                  <p className="text-[10px] font-black text-marshall-gold uppercase tracking-widest leading-none mb-1">Processando Lote</p>
                  <p className="text-xs font-bold text-white truncate max-w-[150px]">{batchProgress.status}</p>
                </div>
                <div className="relative w-12 h-12 flex items-center justify-center">
                  <svg className="w-full h-full -rotate-90">
                    <circle cx="24" cy="24" r="20" stroke="currentColor" strokeWidth="4" fill="transparent" className="text-white/5" />
                    <circle cx="24" cy="24" r="20" stroke="currentColor" strokeWidth="4" fill="transparent" 
                      strokeDasharray={126} 
                      strokeDashoffset={126 - (126 * (batchProgress.current / batchProgress.total))} 
                      strokeLinecap="round"
                      className="text-marshall-gold transition-all duration-500" 
                    />
                  </svg>
                  <span className="absolute text-[10px] font-black italic">{Math.round((batchProgress.current / batchProgress.total) * 100)}%</span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Configuração Esquerda */}
          <div className="lg:col-span-5 space-y-8">
            <div className="glass p-8 rounded-[40px] space-y-8 border-white/5 shadow-2xl">
              <section className="space-y-4">
                <h2 className="text-xs font-black text-marshall-gold uppercase tracking-[4px] mb-6 flex items-center gap-2">
                  <Calendar size={16} />
                  Período de Referência
                </h2>
                <div className="grid grid-cols-3 gap-2">
                  {MESES_OPCOES.map((mes) => (
                    <button
                      key={mes}
                      onClick={() => toggleMes(mes)}
                      className={`h-11 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                        config.mesesSelecionados.includes(mes)
                          ? 'bg-marshall-gold text-white shadow-gold border-marshall-gold'
                          : 'bg-white/5 text-zinc-500 border-white/5 hover:bg-white/10'
                      } border`}
                    >
                      {mes.substring(0, 3)}
                    </button>
                  ))}
                </div>

                <div className="grid grid-cols-2 gap-4 pt-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-zinc-600 block ml-1">Ano</label>
                    <select 
                      value={config.anoReferencia}
                      onChange={(e) => setConfig({...config, anoReferencia: parseInt(e.target.value)})}
                      className="w-full !h-12 !bg-white/5 border-white/5 font-bold text-sm"
                    >
                      {[2023, 2024, 2025, 2026, 2027].map(year => (
                        <option key={year} value={year}>{year}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-zinc-600 block ml-1 text-left">Pagamento</label>
                    <input 
                      type="date" 
                      value={config.dataPagamento}
                      onChange={(e) => setConfig({...config, dataPagamento: e.target.value})}
                      className="w-full !h-12 !bg-white/5 border-white/5 font-bold text-sm text-left px-4"
                    />
                  </div>
                </div>
              </section>

              <section className="space-y-6 pt-6 border-t border-white/5">
                <h2 className="text-xs font-black text-marshall-gold uppercase tracking-[4px] mb-6 flex items-center gap-2">
                  <DollarSign size={16} />
                  Ajustes Financeiros do Lote
                </h2>

                <div className="space-y-8">
                  {/* Gratificação */}
                  <div className="space-y-4">
                    <label className="text-[10px] font-black uppercase tracking-[2px] text-zinc-500 ml-1 flex items-center gap-2">
                      <Plus size={12} className="text-marshall-gold" />
                      Gratificação Extra do Lote
                    </label>
                    <div className="flex gap-3">
                      <div className="flex p-1 bg-black/40 rounded-xl border border-white/5 h-12 w-32 shrink-0">
                        <button 
                          onClick={() => setConfig({...config, gratificacaoMode: 'percent'})} 
                          className={`flex-1 rounded-lg text-[10px] font-black transition-all ${config.gratificacaoMode === 'percent' ? 'bg-marshall-gold text-white shadow-gold' : 'text-zinc-600 hover:text-white'}`}
                        >
                          %
                        </button>
                        <button 
                          onClick={() => setConfig({...config, gratificacaoMode: 'value'})} 
                          className={`flex-1 rounded-lg text-[10px] font-black transition-all ${config.gratificacaoMode === 'value' ? 'bg-marshall-gold text-white shadow-gold' : 'text-zinc-600 hover:text-white'}`}
                        >
                          R$
                        </button>
                      </div>
                      <input 
                        type="number" 
                        value={config.gratificacaoValue} 
                        onChange={e => setConfig({...config, gratificacaoValue: e.target.value})} 
                        placeholder={config.gratificacaoMode === 'percent' ? 'Ex: 10%' : 'R$ 0,00'} 
                        className="flex-1 !h-12 !bg-white/5 border-white/5 font-black text-white focus:border-marshall-gold/50 text-base" 
                      />
                    </div>
                  </div>

                  {/* Descontos */}
                  <div className="space-y-4">
                    <label className="text-[10px] font-black uppercase tracking-[2px] text-zinc-500 ml-1 flex items-center gap-2">
                      <Minus size={12} className="text-red-500" />
                      Descontos / Retenções
                    </label>
                    <div className="flex gap-3">
                      <div className="flex p-1 bg-black/40 rounded-xl border border-white/5 h-12 w-32 shrink-0">
                        <button 
                          onClick={() => setConfig({...config, descontoMode: 'percent'})} 
                          className={`flex-1 rounded-lg text-[10px] font-black transition-all ${config.descontoMode === 'percent' ? 'bg-red-500/20 text-red-500 border border-red-500/20 shadow-lg shadow-red-500/10' : 'text-zinc-600 hover:text-white'}`}
                        >
                          %
                        </button>
                        <button 
                          onClick={() => setConfig({...config, descontoMode: 'value'})} 
                          className={`flex-1 rounded-lg text-[10px] font-black transition-all ${config.descontoMode === 'value' ? 'bg-red-500/20 text-red-500 border border-red-500/20 shadow-lg shadow-red-500/10' : 'text-zinc-600 hover:text-white'}`}
                        >
                          R$
                        </button>
                      </div>
                      <input 
                        type="number" 
                        value={config.descontoValue} 
                        onChange={e => setConfig({...config, descontoValue: e.target.value})} 
                        placeholder={config.descontoMode === 'percent' ? 'Ex: 5%' : 'R$ 0,00'} 
                        className="flex-1 !h-12 !bg-white/5 border-white/5 font-black text-white focus:border-red-500/30 text-base" 
                      />
                    </div>
                  </div>
                </div>
              </section>
              <div className="pt-4">
                <button 
                  onClick={handleGenerateBulk}
                  disabled={loading || selectedIds.length === 0}
                  className="button-primary w-full h-14 sm:h-16 text-lg sm:text-xl italic tracking-tighter gap-3 shadow-gold disabled:opacity-20 transition-all translate-y-0 active:translate-y-1"
                >
                  {loading ? (
                    <Loader2 className="animate-spin" size={24} />
                  ) : (
                    <Zap size={24} className="fill-white" />
                  )}
                  {loading ? 'Processando...' : `Gerar ${selectedIds.length} Recibos`}
                </button>
              </div>
            </div>

            <AnimatePresence>
              {batchResults && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className={`glass p-8 rounded-[40px] border-2 ${batchResults.failed.length > 0 ? 'border-orange-500/30 bg-orange-500/5' : 'border-emerald-500/30 bg-emerald-500/5'}`}
                >
                  <h3 className="text-lg font-black italic uppercase tracking-tighter flex items-center gap-3 mb-6">
                    {batchResults.failed.length > 0 ? <AlertCircle className="text-orange-500" /> : <CheckCircle2 className="text-emerald-500" />}
                    Resultado do Processamento
                  </h3>
                  
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-xs font-bold uppercase tracking-widest">
                      <span className="text-zinc-400">Sucessos:</span>
                      <span className="text-emerald-500">{batchResults.success.length}</span>
                    </div>
                    <div className="flex items-center justify-between text-xs font-bold uppercase tracking-widest">
                      <span className="text-zinc-400">Falhas:</span>
                      <span className={`${batchResults.failed.length > 0 ? 'text-red-500' : 'text-zinc-500'}`}>{batchResults.failed.length}</span>
                    </div>
                  </div>

                  {batchResults.failed.length > 0 && (
                    <div className="mt-8 pt-6 border-t border-white/10 space-y-4">
                      <p className="text-[10px] font-black text-red-500 uppercase tracking-widest">Detalhes das Falhas:</p>
                      <div className="max-h-32 overflow-y-auto space-y-2 custom-scrollbar pr-2">
                        {batchResults.failed.map((f, i) => (
                          <div key={i} className="text-[10px] flex items-center justify-between bg-black/20 p-2 rounded-lg">
                            <span className="text-zinc-300 font-bold">{f.name}</span>
                            <span className="text-red-400/70 truncate ml-4 max-w-[150px]">{f.error}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Listagem Direita */}
          <div className="lg:col-span-7 flex flex-col h-fit">
            <div className="glass rounded-[32px] sm:rounded-[40px] overflow-hidden flex flex-col shadow-2xl border-white/5">
              <div className="p-6 sm:p-8 border-b border-white/5 bg-white/[0.01] flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="relative w-full sm:flex-1 group">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600 group-focus-within:text-marshall-gold transition-colors" size={20} />
                  <input 
                    type="text" 
                    placeholder="Filtrar colaboradores..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-12 w-full !h-12 sm:!h-14 !bg-transparent border-transparent focus:ring-0 text-sm font-bold text-left"
                  />
                </div>
                <button 
                  onClick={() => setSelectedIds(selectedIds.length === colaboradores.length ? [] : colaboradores.map(c => c.id))}
                  className="text-[10px] shrink-0 font-black text-marshall-gold uppercase tracking-[2px] w-full sm:w-auto"
                >
                  {selectedIds.length === colaboradores.length ? 'Limpar Tudo' : 'Todos'}
                </button>
              </div>

            <div className="overflow-y-auto max-h-[500px] min-h-[300px] sm:min-h-[400px] custom-scrollbar divide-y divide-white/[0.03]">
                {fetchingColabs ? (
                  <div className="h-48 flex flex-col items-center justify-center">
                    <Loader2 className="animate-spin text-marshall-gold mb-6" size={40} />
                    <p className="font-black uppercase tracking-widest text-[10px] text-zinc-600">Sincronizando...</p>
                  </div>
                ) : colaboradores.filter(c => c.nome.toLowerCase().includes(searchTerm.toLowerCase())).map((colab) => {
                  const isSelected = selectedIds.includes(colab.id);
                  const totals = calculateTotals(colab);
                  
                  return (
                    <div 
                      key={colab.id}
                      onClick={() => setSelectedIds(prev => isSelected ? prev.filter(i => i !== colab.id) : [...prev, colab.id])}
                      className={`p-6 sm:p-8 flex items-center gap-4 sm:gap-8 cursor-pointer transition-all group ${isSelected ? 'bg-marshall-gold/5' : 'hover:bg-white/[0.02]'}`}
                    >
                      <div className={`w-8 h-8 rounded-xl border-2 flex items-center justify-center shrink-0 transition-all ${isSelected ? 'bg-marshall-gold border-marshall-gold text-white shadow-[0_0_15px_rgba(219,170,61,0.4)]' : 'border-white/10 group-hover:border-white/20'}`}>
                        {isSelected && <CheckCircle2 size={18} />}
                      </div>

                      <div className="flex-1 min-w-0">
                        <h3 className="font-black text-white italic truncate text-lg sm:text-xl uppercase tracking-tighter group-hover:text-marshall-gold transition-colors leading-tight mb-1 text-left">{colab.nome}</h3>
                        <p className="text-[8px] sm:text-[10px] text-zinc-500 font-black uppercase tracking-widest text-left">
                          {colab.cargo} • Base: R$ {colab.salario_base.toLocaleString('pt-BR')} 
                        </p>
                      </div>

                      <div className="text-right shrink-0">
                        <p className="font-black text-white text-lg sm:text-2xl tracking-tighter italic">R$ {totals.total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Histórico Section */}
        <section className="space-y-6 animate-in slide-in-from-bottom-4 duration-700">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <h2 className="text-xl font-black italic uppercase tracking-tighter flex items-center gap-3">
              <Archive className="text-marshall-gold" size={24} />
              Recibos Gerados Recentemente
            </h2>
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <input 
                type="date" 
                value={filtroData}
                onChange={(e) => {
                  setFiltroData(e.target.value);
                  fetchHistorico(e.target.value);
                }}
                className="!h-10 !bg-white/5 border-white/5 rounded-xl px-4 text-xs font-bold text-left flex-1 sm:flex-none"
              />
              <button 
                onClick={handleDownloadBulkHistorico}
                disabled={selectedHistoricoIds.length === 0}
                className="flex items-center gap-2 px-6 h-10 bg-marshall-gold rounded-xl text-[10px] font-black uppercase tracking-widest hover:shadow-gold transition-all disabled:opacity-20 shrink-0"
              >
                <Download size={14} />
                <span className="hidden sm:inline">Baixar Selecionados</span>
                <span className="sm:hidden">Baixar</span>
              </button>
            </div>
          </div>

          <div className="glass rounded-[32px] sm:rounded-[40px] overflow-hidden border-white/5">
            <div className="overflow-x-auto custom-scrollbar">
              <table className="w-full text-left border-collapse min-w-[700px]">
                <thead>
                  <tr className="bg-white/[0.02] border-b border-white/5">
                    <th className="p-6 w-16">
                      <button 
                        onClick={() => setSelectedHistoricoIds(selectedHistoricoIds.length === historico.length ? [] : historico.map(h => h.id))}
                        className="w-5 h-5 rounded border border-white/20 flex items-center justify-center group"
                      >
                        {selectedHistoricoIds.length === historico.length && <div className="w-3 h-3 bg-marshall-gold rounded-sm" />}
                      </button>
                    </th>
                    <th className="p-6 text-[10px] font-black uppercase tracking-widest text-zinc-500">Colaborador</th>
                    <th className="p-6 text-[10px] font-black uppercase tracking-widest text-zinc-500">Referência</th>
                    <th className="p-6 text-[10px] font-black uppercase tracking-widest text-zinc-500">Faturamento</th>
                    <th className="p-6 text-[10px] font-black uppercase tracking-widest text-zinc-500">Data Pgto</th>
                    <th className="p-6 text-[10px] font-black uppercase tracking-widest text-zinc-500">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.03]">
                  {historicoLoading ? (
                    <tr>
                      <td colSpan={6} className="p-20 text-center">
                        <Loader2 className="animate-spin text-marshall-gold mx-auto mb-4" size={32} />
                        <p className="text-[10px] font-black uppercase tracking-[3px] text-zinc-500">Consultando Histórico...</p>
                      </td>
                    </tr>
                  ) : historico.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-20 text-center">
                        <Archive className="text-zinc-800 mx-auto mb-4" size={48} />
                        <p className="text-[10px] font-black uppercase tracking-[3px] text-zinc-600">Nenhum registro encontrado</p>
                      </td>
                    </tr>
                  ) : historico.map((item) => {
                    const isSelected = selectedHistoricoIds.includes(item.id);
                    return (
                      <tr key={item.id} className={`group border-b border-white/[0.02] transition-colors ${isSelected ? 'bg-marshall-gold/5' : 'hover:bg-white/[0.02]'}`}>
                        <td className="p-6">
                          <button 
                            onClick={() => setSelectedHistoricoIds(prev => isSelected ? prev.filter(id => id !== item.id) : [...prev, item.id])}
                            className={`w-5 h-5 rounded border transition-all flex items-center justify-center ${isSelected ? 'bg-marshall-gold border-marshall-gold' : 'border-white/20 group-hover:border-white/30'}`}
                          >
                            {isSelected && <div className="w-3 h-3 bg-white rounded-sm" />}
                          </button>
                        </td>
                        <td className="p-6">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-[10px] font-black text-marshall-gold">
                              {item.colaboradores?.nome?.charAt(0)}
                            </div>
                            <span className="font-black text-white text-sm italic uppercase tracking-tighter truncate max-w-[150px]">{item.colaboradores?.nome}</span>
                          </div>
                        </td>
                        <td className="p-6 text-xs font-bold text-zinc-400">{item.meta_data?.referencia_texto}</td>
                        <td className="p-6 text-sm font-black text-white italic">R$ {item.valor_total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                        <td className="p-6 text-xs font-bold text-zinc-500">{new Date(item.data_referencia).toLocaleDateString('pt-BR')}</td>
                        <td className="p-6">
                          <div className="flex items-center gap-2">
                            <a 
                              href={item.meta_data.via_colab_url} 
                              target="_blank" 
                              className="p-2 bg-white/5 rounded-lg text-zinc-500 hover:text-marshall-gold transition-colors"
                              title="Ver Via Colaborador"
                            >
                              <FileText size={16} />
                            </a>
                            <a 
                              href={item.meta_data.via_empresa_url} 
                              target="_blank" 
                              className="p-2 bg-white/5 rounded-lg text-zinc-500 hover:text-marshall-gold transition-colors"
                              title="Ver Via Empresa"
                            >
                              <Briefcase size={16} />
                            </a>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      </div>

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255, 255, 255, 0.05); border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(219, 170, 61, 0.2); }
      `}</style>
    </DashboardLayout>
  );
}
