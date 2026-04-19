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
    dataPagamento: new Date().toLocaleDateString('en-CA'),
    anoReferencia: new Date().getFullYear(),
    mesesSelecionados: [] as string[],
    gratificacaoMode: 'percent' as 'percent' | 'value',
    gratificacaoValue: '',
    descontoMode: 'value' as 'percent' | 'value',
    descontoValue: '',
    observacoes: ''
  });
  const [currentStep, setCurrentStep] = useState(1);

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

  const handleViewSecureReceipt = async (path: string) => {
    if (!path) return;
    try {
      const { data, error } = await supabase.storage
        .from('recibos')
        .createSignedUrl(path, 60);

      if (error) throw error;
      if (data?.signedUrl) {
        window.open(data.signedUrl, '_blank');
      }
    } catch (error: any) {
      alert('Erro ao carregar recibo seguro: ' + error.message);
    }
  };

  async function getSecureBlob(path: string) {
    const { data, error } = await supabase.storage
      .from('recibos')
      .createSignedUrl(path, 60);
    
    if (error || !data?.signedUrl) throw new Error('Não foi possível gerar link de download');
    const res = await fetch(data.signedUrl);
    return await res.blob();
  }

  const handleDownloadBulkHistorico = async () => {
    if (selectedHistoricoIds.length === 0) return;
    
    setLoading(true);
    setBatchProgress({ current: 0, total: selectedHistoricoIds.length * 2, status: 'Preparando arquivos...' });
    const zip = new JSZip();
    const items = historico.filter(h => selectedHistoricoIds.includes(h.id));
    
    try {
      let count = 0;
      for (const item of items) {
        const name = item.colaboradores?.nome || 'Colaborador';
        const ref = item.meta_data?.referencia_texto?.replace(/[^a-z0-9]/gi, '_') || 'Recibo';
        
        setBatchProgress(prev => ({ ...prev, current: ++count, status: `Baixando: ${name} (Via Colab)` }));
        const blobColab = await getSecureBlob(item.meta_data.via_colab_url);
        
        setBatchProgress(prev => ({ ...prev, current: ++count, status: `Baixando: ${name} (Via Empresa)` }));
        const blobEmpresa = await getSecureBlob(item.meta_data.via_empresa_url);
        
        zip.file(`${name}_${ref}_Via_Colaborador.pdf`, blobColab);
        zip.file(`${name}_${ref}_Via_Empresa.pdf`, blobEmpresa);
      }
      
      setBatchProgress(prev => ({ ...prev, status: 'Gerando ZIP...' }));
      const zipBlob = await zip.generateAsync({ type: 'blob' });
      saveAs(zipBlob, `Historico_Marshall_${new Date().getTime()}.zip`);
    } catch (error: any) {
      alert('Erro ao baixar histórico: ' + error.message);
    } finally {
      setLoading(false);
      setBatchProgress({ current: 0, total: 0, status: '' });
    }
  };

  const fetchColaboradores = async (query?: string) => {
    try {
      setFetchingColabs(true);
      let supabaseQuery = supabase
        .from('colaboradores')
        .select('*')
        .eq('ativo', true);
      
      if (query) {
        supabaseQuery = supabaseQuery.ilike('nome', `%${query}%`);
      } else {
        // Se não tem busca, carregamos pelo menos 6 para não deixar a tela vazia
        // Priorizamos mostrar os que já estão selecionados + alguns extras se necessário
        if (selectedIds.length > 0 && !query) {
          supabaseQuery = supabaseQuery.or(`id.in.(${selectedIds.join(',')}),ativo.eq.true`).limit(20);
        } else {
          supabaseQuery = supabaseQuery.limit(6);
        }
      }

      const { data, error } = await supabaseQuery.order('nome').limit(50);
      if (error) throw error;
      setColaboradores(data || []);
    } catch (error: any) {
      console.error('Error fetching colabs:', error.message);
    } finally {
      setFetchingColabs(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchColaboradores(searchTerm);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm]);

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
    
    return mesesOrdenados.map(mes => {
      let texto = `${mes}/${config.anoReferencia}`;
      
      // Se tiver meses do final do ano e meses do início do ano, os do final são do ano anterior
      if (['Outubro', 'Novembro', 'Dezembro'].includes(mes) && spansEarlyYear) {
        texto = `${mes}/${config.anoReferencia - 1}`;
      }
      
      // Regra Marshall: Fevereiro é até dia 20
      if (mes === 'Fevereiro') {
        texto += ' (Até 20/02)';
      }
      
      return texto;
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
      
      const fetchWithRetry = async (colabData: any, attempt = 1): Promise<any> => {
        try {
          const res = await fetch('/api/generate-pdf', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(colabData),
          });
          const json = await res.json();
          if (!json.success) throw new Error(json.error || 'Erro na API');
          return json;
        } catch (err: any) {
          if (attempt < 3) {
            // Delay progressivo: 1s, 2s...
            await new Promise(r => setTimeout(r, 1000 * attempt));
            return fetchWithRetry(colabData, attempt + 1);
          }
          throw err;
        }
      };

      for (let i = 0; i < selectedPeople.length; i++) {
        const colab = selectedPeople[i];
        setBatchProgress(prev => ({ ...prev, current: i + 1, status: `Processando: ${colab.nome}` }));
        
        try {
          const calcs = calculateTotals(colab);
          
          const commonData = {
            colaborador: colab,
            valor: calcs.total.toLocaleString('pt-BR', { minimumFractionDigits: 2 }),
            valor_base: calcs.base.toLocaleString('pt-BR', { minimumFractionDigits: 2 }),
            valor_base_unidade: calcs.base_unidade.toLocaleString('pt-BR', { minimumFractionDigits: 2 }),
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

          // Geração resiliente das duas vias
          const [jsonColab, jsonEmpresa] = await Promise.all([
            fetchWithRetry({ ...commonData, via: 'Colaborador' }),
            fetchWithRetry({ ...commonData, via: 'Empresa' })
          ]);

          if (jsonColab.success && jsonEmpresa.success) {
            // No motor novo, pdfUrl é o PATH dentro do bucket
            const [blobColab, blobEmpresa] = await Promise.all([
              getSecureBlob(jsonColab.pdfUrl),
              getSecureBlob(jsonEmpresa.pdfUrl)
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

  const StepIndicator = () => (
    <div className="flex items-center justify-between mb-12 sm:mb-16 max-w-2xl mx-auto px-4">
      {[1, 2, 3, 4].map((step) => (
        <React.Fragment key={step}>
          <div className="flex flex-col items-center gap-3 relative z-10">
            <div className={`w-10 h-10 sm:w-14 sm:h-14 rounded-2xl flex items-center justify-center font-black italic transition-all duration-500 border ${
              currentStep === step 
                ? 'bg-marshall-gold border-marshall-gold text-white shadow-[0_0_20px_rgba(219,170,61,0.3)] scale-110' 
                : currentStep > step 
                  ? 'bg-emerald-500/10 border-emerald-500/50 text-emerald-500' 
                  : 'bg-white/5 border-white/10 text-zinc-700'
            }`}>
              {currentStep > step ? <CheckCircle2 size={24} /> : step}
            </div>
            <span className={`text-[8px] sm:text-[9px] font-black uppercase tracking-[2px] sm:tracking-[3px] ${currentStep === step ? 'text-marshall-gold' : 'text-zinc-700'}`}>
              {step === 1 && 'Seleção'}
              {step === 2 && 'Datas'}
              {step === 3 && 'Ajustes'}
              {step === 4 && 'Revisar'}
            </span>
          </div>
          {step < 4 && (
            <div className="flex-1 h-[2px] bg-white/5 mx-2 mb-8 relative">
              <motion.div 
                className="absolute inset-0 bg-marshall-gold origin-left"
                initial={false}
                animate={{ scaleX: currentStep > step ? 1 : 0 }}
                transition={{ duration: 0.5 }}
              />
            </div>
          )}
        </React.Fragment>
      ))}
    </div>
  );

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto px-2 sm:px-6 lg:px-8 py-4 sm:py-8 h-full flex flex-col animate-in fade-in duration-500">
        <div className="flex flex-col items-center text-center mb-8 sm:mb-12">
          <div className="p-2 sm:p-3 bg-marshall-gold/10 rounded-2xl text-marshall-gold mb-3 sm:mb-4">
            <Printer size={28} />
          </div>
          <h1 className="text-3xl sm:text-5xl font-black tracking-tight italic mb-2 uppercase">GERAR <span className="text-marshall-gold">RECIBOS</span></h1>
          <p className="text-zinc-500 text-xs sm:text-base font-medium max-w-lg">Siga as etapas abaixo para emitir o lote de recibos Marshall Gold com segurança.</p>
        </div>

        <StepIndicator />

        <div className="flex-1">
          <AnimatePresence mode="wait">
            {currentStep === 1 && (
              <motion.div 
                key="step1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start"
              >
                <div className="lg:col-span-12 glass rounded-3xl overflow-hidden border-white/5 shadow-2xl">
                  <div className="p-4 sm:p-10 border-b border-white/5 bg-white/[0.01] flex flex-col sm:flex-row items-center justify-between gap-6">
                    <div className="relative w-full sm:flex-1 group">
                      <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-zinc-600 group-focus-within:text-marshall-gold transition-colors" size={24} />
                      <input 
                        type="text" 
                        placeholder="Pesquisar por nome ou CPF dos colaboradores..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-16 w-full !h-20 !bg-transparent border-transparent focus:ring-0 text-lg font-black italic tracking-tight text-white placeholder:text-zinc-700"
                      />
                    </div>
                    <div className="flex items-center justify-between w-full sm:w-auto px-6 py-4 bg-black/40 rounded-2xl border border-white/5 flex-1 sm:flex-none">
                      <div className="text-left">
                        <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest leading-none mb-1">Selecionados</p>
                        <p className="text-xl font-black text-marshall-gold italic">{selectedIds.length}</p>
                      </div>
                      <button 
                        onClick={() => setSelectedIds([])}
                        disabled={selectedIds.length === 0}
                        className="text-[10px] font-black text-red-400 group-hover:text-red-300 uppercase tracking-widest disabled:opacity-0 transition-all px-4 py-2 border border-white/5 rounded-xl hover:bg-white/5 ml-auto"
                      >
                        Limpar
                      </button>
                    </div>
                  </div>

                  <div className="overflow-y-auto max-h-[450px] min-h-[300px] custom-scrollbar divide-y divide-white/[0.03]">
                    {fetchingColabs ? (
                      <div className="h-64 flex flex-col items-center justify-center">
                        <Loader2 className="animate-spin text-marshall-gold mb-6" size={48} />
                        <p className="font-black uppercase tracking-[4px] text-xs text-zinc-600">Buscando na Base...</p>
                      </div>
                    ) : colaboradores.length > 0 ? (
                      colaboradores.map((colab) => {
                        const isSelected = selectedIds.includes(colab.id);
                        return (
                          <div 
                            key={colab.id}
                            onClick={() => setSelectedIds(prev => isSelected ? prev.filter(i => i !== colab.id) : [...prev, colab.id])}
                            className={`p-6 sm:p-8 flex items-center gap-6 cursor-pointer transition-all group ${isSelected ? 'bg-marshall-gold/10' : 'hover:bg-white/[0.02]'}`}
                          >
                            <div className={`w-10 h-10 rounded-2xl border-2 flex items-center justify-center shrink-0 transition-all ${isSelected ? 'bg-marshall-gold border-marshall-gold text-white shadow-gold' : 'border-white/10 group-hover:border-white/20'}`}>
                              {isSelected && <CheckCircle2 size={24} />}
                            </div>
                            <div className="flex-1">
                              <h3 className="font-black text-white italic text-xl uppercase tracking-tighter leading-tight mb-1">{colab.nome}</h3>
                              <p className="text-[10px] text-zinc-500 font-black uppercase tracking-widest">
                                {colab.cargo} • Doc: {colab.documento}
                              </p>
                            </div>
                            <div className="text-right">
                               <p className="text-xs font-black text-zinc-500 uppercase italic">Base</p>
                               <p className="text-lg font-black text-white italic tracking-tighter">R$ {colab.salario_base.toLocaleString('pt-BR')}</p>
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <div className="py-24 flex flex-col items-center justify-center text-zinc-700 italic">
                        <Users size={64} className="mb-6 opacity-10" />
                        <p className="font-black uppercase tracking-widest text-xs">Busque por colaboradores para iniciar</p>
                      </div>
                    )}
                  </div>
                  
                  <div className="p-6 sm:p-8 bg-black/40 border-t border-white/5 flex justify-end">
                    <button 
                      onClick={() => setCurrentStep(2)}
                      disabled={selectedIds.length === 0}
                      className="button-primary w-full sm:w-auto px-12 h-20 text-xl italic tracking-tighter gap-3 disabled:opacity-20"
                    >
                      <span>Próximo: Datas</span>
                      <ChevronRight size={24} />
                    </button>
                  </div>
                </div>
              </motion.div>
            )}

            {currentStep === 2 && (
              <motion.div 
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="max-w-3xl mx-auto w-full"
              >
                <div className="glass p-5 sm:p-10 rounded-3xl space-y-8 sm:space-y-12 border-white/5 shadow-2xl">
                  <header className="text-center">
                    <h2 className="text-xs font-black text-marshall-gold uppercase tracking-[5px] mb-4">Período de Referência</h2>
                    <p className="text-zinc-500 font-medium">Selecione os meses que serão contemplados neste lote.</p>
                  </header>

                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                    {MESES_OPCOES.map((mes) => (
                      <button
                        key={mes}
                        onClick={() => toggleMes(mes)}
                        className={`h-16 rounded-2xl text-xs font-black uppercase tracking-widest transition-all ${
                          config.mesesSelecionados.includes(mes)
                            ? 'bg-marshall-gold text-white shadow-gold border-marshall-gold'
                            : 'bg-white/5 text-zinc-500 border-white/5 hover:bg-white/10'
                        } border`}
                      >
                        {mes.substring(0, 3)}
                      </button>
                    ))}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 py-6 border-t border-white/5">
                    <div className="space-y-4 text-center">
                      <label className="text-[10px] font-black uppercase tracking-[3px] text-zinc-600 block">Ano de Referência</label>
                      <select 
                        value={config.anoReferencia}
                        onChange={(e) => setConfig({...config, anoReferencia: parseInt(e.target.value)})}
                        className="w-full h-16 bg-white/5 border-white/5 font-black text-lg italic text-center rounded-2xl"
                      >
                        {[2023, 2024, 2025, 2026, 2027].map(year => (
                          <option key={year} value={year}>{year}</option>
                        ))}
                      </select>
                    </div>
                    <div className="flex flex-col gap-2">
                      <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-4">
                        Data de Pagamento
                      </label>
                      <input 
                        type="date" 
                        value={config.dataPagamento}
                        onChange={(e) => setConfig({...config, dataPagamento: e.target.value})}
                        className="w-full h-16 bg-white/5 border-white/5 font-black text-lg italic text-center rounded-2xl px-6 focus:border-marshall-gold/30 transition-all"
                      />
                    </div>
                  </div>

                  {/* Preview da Referência */}
                  {config.mesesSelecionados.length > 0 && (
                    <motion.div 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-marshall-gold/5 border border-marshall-gold/20 rounded-2xl p-6 text-center"
                    >
                      <p className="text-[10px] font-black text-marshall-gold/50 uppercase tracking-widest mb-1">Preview da Referência</p>
                      <p className="text-lg font-black text-marshall-gold italic uppercase tracking-tight">
                        {getReferenciaTexto()}
                      </p>
                    </motion.div>
                  )}

                  <div className="flex flex-col sm:flex-row gap-4">
                    <button 
                      onClick={() => setCurrentStep(1)}
                      className="flex-1 h-16 bg-white/5 border border-white/10 text-zinc-500 font-black uppercase tracking-widest rounded-2xl hover:text-white transition-all order-2 sm:order-1"
                    >
                      Voltar
                    </button>
                    <button 
                      onClick={() => setCurrentStep(3)}
                      disabled={config.mesesSelecionados.length === 0}
                      className="flex-[2] button-primary h-16 text-lg italic tracking-tighter gap-3 disabled:opacity-20 order-1 sm:order-2"
                    >
                      Próximo: Ajustes
                      <ChevronRight size={20} />
                    </button>
                  </div>
                </div>
              </motion.div>
            )}

            {currentStep === 3 && (
              <motion.div 
                key="step3"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="max-w-3xl mx-auto w-full"
              >
                <div className="glass p-5 sm:p-10 rounded-3xl space-y-8 sm:space-y-12 border-white/5 shadow-2xl overflow-hidden">
                  <header className="text-center">
                    <h2 className="text-xs font-black text-marshall-gold uppercase tracking-[5px] mb-4">Ajustes Coletivos</h2>
                    <p className="text-zinc-500 font-medium">As regras abaixo serão aplicadas a todos os funcionários selecionados.</p>
                  </header>

                  <div className="space-y-10">
                    <div className="space-y-4">
                      <label className="text-[10px] font-black uppercase tracking-[3px] text-zinc-500 ml-1 flex items-center gap-3">
                        <Plus size={16} className="text-marshall-gold" />
                        Gratificação do Lote
                      </label>
                      <div className="flex items-center gap-4 bg-white/[0.03] p-3 rounded-2xl border border-white/5 shadow-inner">
                        <div className="flex p-1 bg-black/40 rounded-xl h-12 w-28 shrink-0">
                          <button 
                            onClick={() => setConfig({...config, gratificacaoMode: 'percent'})} 
                            className={`flex-1 rounded-lg text-xs font-black transition-all ${config.gratificacaoMode === 'percent' ? 'bg-marshall-gold text-white shadow-gold' : 'text-zinc-600 hover:text-white'}`}
                          >
                            %
                          </button>
                          <button 
                            onClick={() => setConfig({...config, gratificacaoMode: 'value'})} 
                            className={`flex-1 rounded-lg text-xs font-black transition-all ${config.gratificacaoMode === 'value' ? 'bg-marshall-gold text-white shadow-gold' : 'text-zinc-600 hover:text-white'}`}
                          >
                            R$
                          </button>
                        </div>
                        <input 
                          type="number" 
                          value={config.gratificacaoValue} 
                          onChange={e => setConfig({...config, gratificacaoValue: e.target.value})} 
                          placeholder={config.gratificacaoMode === 'percent' ? '10' : '0,00'} 
                          className="flex-1 h-20 bg-transparent border-none font-black text-white text-3xl sm:text-4xl px-2 focus:ring-0 transition-all placeholder:text-zinc-800" 
                        />
                        {config.gratificacaoMode === 'percent' && <span className="text-2xl font-black text-marshall-gold/30 pr-4">%</span>}
                        {config.gratificacaoMode === 'value' && <span className="text-2xl font-black text-marshall-gold/30 pr-4">R$</span>}
                      </div>
                    </div>

                    <div className="space-y-4">
                      <label className="text-[10px] font-black uppercase tracking-[3px] text-zinc-500 ml-1 flex items-center gap-3">
                        <Minus size={16} className="text-red-500" />
                        Descontos / Retenções
                      </label>
                      <div className="flex items-center gap-4 bg-white/[0.03] p-3 rounded-2xl border border-white/5 shadow-inner">
                        <div className="flex p-1 bg-black/40 rounded-xl h-12 w-28 shrink-0">
                          <button 
                            onClick={() => setConfig({...config, descontoMode: 'percent'})} 
                            className={`flex-1 rounded-lg text-xs font-black transition-all ${config.descontoMode === 'percent' ? 'bg-red-500 text-white shadow-[0_0_15px_rgba(239,68,68,0.3)]' : 'text-zinc-600 hover:text-white'}`}
                          >
                            %
                          </button>
                          <button 
                            onClick={() => setConfig({...config, descontoMode: 'value'})} 
                            className={`flex-1 rounded-lg text-xs font-black transition-all ${config.descontoMode === 'value' ? 'bg-red-500 text-white shadow-[0_0_15px_rgba(239,68,68,0.3)]' : 'text-zinc-600 hover:text-white'}`}
                          >
                            R$
                          </button>
                        </div>
                        <input 
                          type="number" 
                          value={config.descontoValue} 
                          onChange={e => setConfig({...config, descontoValue: e.target.value})} 
                          placeholder={config.descontoMode === 'percent' ? '5' : '0,00'} 
                          className="flex-1 h-20 bg-transparent border-none font-black text-white text-3xl sm:text-4xl px-2 focus:ring-0 transition-all placeholder:text-zinc-800" 
                        />
                        {config.descontoMode === 'percent' && <span className="text-2xl font-black text-red-500/20 pr-4">%</span>}
                        {config.descontoMode === 'value' && <span className="text-2xl font-black text-red-500/20 pr-4">R$</span>}
                      </div>
                    </div>

                    <div className="space-y-4 pt-6">
                      <label className="text-[10px] font-black uppercase tracking-[3px] text-zinc-500 ml-1">Observações Privadas</label>
                      <textarea 
                        value={config.observacoes}
                        onChange={(e) => setConfig({...config, observacoes: e.target.value})}
                        placeholder="Estas notas não aparecerão no recibo impresso..."
                        className="w-full bg-white/5 border-white/5 rounded-2xl p-6 font-bold text-sm min-h-[120px] focus:border-marshall-gold/30"
                      />
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-4 pt-6">
                    <button 
                      onClick={() => setCurrentStep(2)}
                      className="flex-1 h-16 bg-white/5 border border-white/10 text-zinc-500 font-black uppercase tracking-widest rounded-2xl hover:text-white transition-all order-2 sm:order-1"
                    >
                      Voltar
                    </button>
                    <button 
                      onClick={() => setCurrentStep(4)}
                      className="flex-[2] button-primary h-16 text-lg italic tracking-tighter gap-3 order-1 sm:order-2"
                    >
                      Revisar e Gerar
                      <CheckCircle2 size={20} />
                    </button>
                  </div>
                </div>
              </motion.div>
            )}

            {currentStep === 4 && (
              <motion.div 
                key="step4"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="max-w-4xl mx-auto w-full space-y-8"
              >
                <div className="glass p-4 sm:p-10 rounded-3xl border-white/5 shadow-2xl relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-64 h-64 bg-marshall-gold/10 blur-[100px] pointer-events-none" />
                  
                  <div className="flex flex-col lg:flex-row items-center justify-between gap-12 relative z-10">
                    <div className="flex-1 space-y-6 text-center lg:text-left">
                      <h2 className="text-[10px] font-black text-marshall-gold uppercase tracking-[5px] opacity-70">Confirmação de Transmissão</h2>
                      
                      <div className="space-y-1">
                        <p className="text-5xl sm:text-7xl font-black italic tracking-tighter leading-none uppercase">
                          {selectedIds.length} <span className="text-zinc-800 not-italic block lg:inline text-3xl sm:text-5xl ml-2">{selectedIds.length === 1 ? 'Colaborador' : 'Colaboradores'}</span>
                        </p>
                        <p className="text-zinc-600 font-bold uppercase tracking-widest text-[10px] sm:text-xs italic pt-4">Ref: {getReferenciaTexto()}</p>
                      </div>

                      <div className="flex flex-wrap gap-3 justify-center lg:justify-start">
                        <div className="px-4 py-2 bg-white/5 rounded-lg border border-white/5 flex items-center gap-3">
                          <span className="text-[8px] font-black text-zinc-500 uppercase tracking-widest">Ano</span>
                          <span className="text-xs font-black text-marshall-gold italic">{config.anoReferencia}</span>
                        </div>
                        <div className="px-4 py-2 bg-white/5 rounded-lg border border-white/5 flex items-center gap-3">
                          <span className="text-[8px] font-black text-zinc-500 uppercase tracking-widest">Pagamento</span>
                          <span className="text-xs font-black text-marshall-gold italic uppercase">{config.dataPagamento.split('-').reverse().join('/')}</span>
                        </div>
                      </div>

                      {/* Lista de nomes simplificada */}
                      <div className="pt-8 border-t border-white/5">
                        <p className="text-[9px] font-black text-zinc-700 uppercase tracking-widest mb-4">Integrantes deste lote:</p>
                        <div className="flex flex-wrap gap-2 justify-center lg:justify-start">
                          {colaboradores.filter(c => selectedIds.includes(c.id)).slice(0, 5).map(c => (
                            <span key={c.id} className="text-[9px] font-black text-white/50 px-3 py-1.5 bg-white/5 rounded-lg border border-white/5 hover:text-white transition-colors">
                              {c.nome.split(' ')[0]} {c.nome.split(' ').slice(-1)}
                            </span>
                          ))}
                          {selectedIds.length > 5 && (
                            <span className="text-[9px] font-black text-zinc-600 px-3 py-1.5 border border-white/5 border-dashed rounded-lg italic">
                              + {selectedIds.length - 5} outros
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="w-full lg:w-96 shrink-0 bg-white/5 p-6 sm:p-8 rounded-[32px] border border-white/10 space-y-6">
                      <button 
                        onClick={handleGenerateBulk}
                        disabled={loading}
                        className="w-full h-24 bg-gradient-to-br from-marshall-gold to-[#b38a31] rounded-2xl flex items-center justify-center gap-4 text-white shadow-gold hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50"
                      >
                        {loading ? (
                          <Loader2 className="animate-spin" size={32} />
                        ) : (
                          <Zap size={32} className="fill-white" />
                        )}
                        <span className="text-xl font-black tracking-tighter italic uppercase">{loading ? 'Gerando...' : 'Gerar Recibos'}</span>
                      </button>
                      <button 
                        onClick={() => setCurrentStep(3)}
                        disabled={loading}
                        className="w-full text-[10px] font-black text-zinc-500 hover:text-marshall-gold uppercase tracking-[4px] py-2 transition-colors flex items-center justify-center gap-2"
                      >
                        <Settings size={14} />
                        Ajustar Detalhes
                      </button>
                    </div>
                  </div>

                  <AnimatePresence>
                    {loading && (
                      <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mt-12 pt-12 border-t border-white/5 space-y-8"
                      >
                         <div className="flex items-center justify-between font-black uppercase tracking-[3px] text-[10px]">
                            <span className="text-zinc-600">Progresso do Lote</span>
                            <span className="text-marshall-gold">{Math.round((batchProgress.current / batchProgress.total) * 100)}%</span>
                         </div>
                         <div className="h-3 w-full bg-white/5 rounded-full overflow-hidden">
                            <motion.div 
                              className="h-full bg-marshall-gold shadow-gold"
                              initial={{ width: 0 }}
                              animate={{ width: `${(batchProgress.current / batchProgress.total) * 100}%` }}
                            />
                         </div>
                         <p className="text-sm font-bold text-center italic text-zinc-400 capitalize">{batchProgress.status}</p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {batchResults && (
                  <motion.div 
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`glass p-5 sm:p-10 rounded-3xl border-2 shadow-2xl overflow-hidden ${batchResults.failed.length > 0 ? 'border-orange-500/30 bg-orange-500/5' : 'border-emerald-500/30 bg-emerald-500/5'}`}
                  >
                    <div className="flex flex-col gap-8">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-8">
                        <div className="flex items-center gap-4">
                          <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${batchResults.failed.length > 0 ? 'bg-orange-500/20 text-orange-500' : 'bg-emerald-500/20 text-emerald-500'}`}>
                            {batchResults.failed.length > 0 ? <AlertCircle size={32} /> : <CheckCircle2 size={32} />}
                          </div>
                          <div>
                            <h3 className="text-2xl font-black italic tracking-tighter uppercase italic tracking-tighter">Lote Concluído</h3>
                            <p className={`text-sm font-bold uppercase tracking-widest ${batchResults.failed.length > 0 ? 'text-orange-500/70' : 'text-emerald-500/70'}`}>
                              {batchResults.success.length} Sucessos | {batchResults.failed.length} Falhas
                            </p>
                          </div>
                        </div>
                        
                        <div className="flex gap-4">
                            <button 
                              onClick={() => {
                                setBatchResults(null);
                                setSelectedIds([]);
                                setCurrentStep(1);
                              }}
                              className="bg-white/5 hover:bg-white/10 px-8 h-14 rounded-2xl font-black uppercase text-[10px] tracking-widest border border-white/10"
                            >
                              Novo Lote
                            </button>
                        </div>
                      </div>

                      {/* Detalhamento de Falhas */}
                      {batchResults.failed.length > 0 && (
                        <div className="pt-6 border-t border-white/5">
                          <p className="text-[10px] font-black text-orange-500/50 uppercase tracking-widest mb-4">Erros Identificados:</p>
                          <div className="space-y-3 max-h-48 overflow-y-auto custom-scrollbar pr-2">
                            {batchResults.failed.map((fail, idx) => (
                              <div key={idx} className="flex items-center justify-between bg-white/[0.02] p-4 rounded-xl border border-white/5">
                                <span className="font-bold text-white text-sm italic">{fail.name}</span>
                                <span className="text-[9px] font-black text-orange-500/70 uppercase tracking-wider bg-orange-500/10 px-3 py-1 rounded-full border border-orange-500/20">
                                  {fail.error}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
      </div>
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
