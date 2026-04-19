'use client';

import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { 
  FileText, 
  Download, 
  Eye, 
  Search,
  Calendar,
  Loader2,
  Clock,
  ChevronRight,
  History as HistoryIcon,
  User,
  Briefcase,
  Check,
  Zap,
  AlertCircle,
  X as XIcon,
  Square,
  CheckSquare
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { createClient } from '@/lib/supabase/client';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';

interface Recibo {
  id: string;
  data_referencia: string;
  valor_total: number;
  pdf_url?: string;
  meta_data: {
    referencia_texto: string;
    observacoes: string;
    via_colab_url?: string;
    via_empresa_url?: string;
  };
  colaboradores: {
    nome: string;
  } | { nome: string }[];
}

export default function HistoricoPage() {
  const supabase = createClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [history, setHistory] = useState<Recibo[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [downloading, setDownloading] = useState(false);
  const [batchProgress, setBatchProgress] = useState({ current: 0, total: 0, status: '' });

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('recibos')
        .select(`
          id,
          data_referencia,
          valor_total,
          pdf_url,
          meta_data,
          colaboradores(nome)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setHistory(data || []);
    } catch (error: any) {
      console.error('Error fetching history:', error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleViewSecureReceipt = async (path: string) => {
    if (!path) return;
    try {
      const { data, error } = await supabase.storage
        .from('recibos')
        .createSignedUrl(path, 60); // Link válido por 60 segundos

      if (error) throw error;
      if (data?.signedUrl) {
        window.open(data.signedUrl, '_blank');
      }
    } catch (error: any) {
      alert('Erro ao carregar recibo seguro: ' + error.message);
    }
  };

  const filteredHistory = history.filter(item => {
    const nome = Array.isArray(item.colaboradores) 
      ? item.colaboradores[0]?.nome 
      : (item.colaboradores as any)?.nome || '';
      
    return nome.toLowerCase().includes(searchTerm.toLowerCase()) || 
           (item.meta_data?.referencia_texto || '').toLowerCase().includes(searchTerm.toLowerCase());
  });

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === filteredHistory.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredHistory.map(h => h.id));
    }
  };

  async function getSecureBlob(path: string) {
    const { data, error } = await supabase.storage
      .from('recibos')
      .createSignedUrl(path, 60);
    
    if (error || !data?.signedUrl) throw new Error('Não foi possível gerar link');
    const res = await fetch(data.signedUrl);
    return await res.blob();
  }

  const handleDownloadBulk = async () => {
    if (selectedIds.length === 0) return;
    
    setDownloading(true);
    setBatchProgress({ current: 0, total: selectedIds.length * 2, status: 'Preparando ZIP...' });
    const zip = new JSZip();
    const items = history.filter(h => selectedIds.includes(h.id));
    
    try {
      let count = 0;
      for (const item of items) {
        const colabObject = Array.isArray(item.colaboradores) ? item.colaboradores[0] : item.colaboradores;
        const name = colabObject?.nome || 'Funcionario';
        const ref = item.meta_data?.referencia_texto?.replace(/[^a-z0-9]/gi, '_') || 'Recibo';
        
        // Via Colaborador
        if (item.meta_data.via_colab_url) {
          setBatchProgress(prev => ({ ...prev, current: ++count, status: `Baixando: ${name} (Via Colab)` }));
          const blob = await getSecureBlob(item.meta_data.via_colab_url);
          zip.file(`${name}_${ref}_Via_Colaborador.pdf`, blob);
        }

        // Via Empresa
        if (item.meta_data.via_empresa_url) {
          setBatchProgress(prev => ({ ...prev, current: ++count, status: `Baixando: ${name} (Via Empresa)` }));
          const blob = await getSecureBlob(item.meta_data.via_empresa_url);
          zip.file(`${name}_${ref}_Via_Empresa.pdf`, blob);
        }
      }
      
      setBatchProgress(prev => ({ ...prev, status: 'Finalizando ZIP...' }));
      const zipBlob = await zip.generateAsync({ type: 'blob' });
      saveAs(zipBlob, `Recibos_Marshall_Lote_${new Date().getTime()}.zip`);
      setSelectedIds([]);
    } catch (error: any) {
      alert('Erro ao baixar lote: ' + error.message);
    } finally {
      setDownloading(false);
      setBatchProgress({ current: 0, total: 0, status: '' });
    }
  };

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-in fade-in duration-500">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6 mb-12">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-marshall-gold/10 rounded-lg text-marshall-gold">
                <HistoryIcon size={24} />
              </div>
              <h1 className="text-3xl sm:text-4xl font-black tracking-tight italic">Registros de Emissão</h1>
            </div>
            <p className="text-zinc-500 font-medium">Histórico completo de todos os recibos Marshall Gold gerados pelo sistema.</p>
          </div>
          
          <div className="flex items-center gap-3 glass px-4 sm:px-6 py-3 rounded-2xl border border-white/5 w-full sm:w-auto justify-between sm:justify-start">
            <span className="text-[10px] sm:text-xs font-black text-zinc-500 uppercase tracking-widest leading-none">Total no Período</span>
            <span className="text-lg sm:text-xl font-black text-white italic leading-none">
              R$ {filteredHistory.reduce((acc, curr) => acc + curr.valor_total, 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </span>
          </div>
        </div>

        {/* Search & Selection Bar */}
        <div className="flex flex-col md:flex-row gap-4 sm:gap-6 mb-10 items-stretch md:items-end">
          <div className="relative flex-1 group w-full">
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 group-focus-within:text-marshall-gold transition-colors">
              <Search size={20} />
            </div>
            <input 
              type="text" 
              placeholder="Pesquisar recibos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-12 w-full !h-14 !text-sm sm:!text-base"
            />
          </div>

          <AnimatePresence>
            {selectedIds.length > 0 && (
              <motion.div 
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="flex items-center gap-4 w-full md:w-auto"
              >
                <button 
                  onClick={handleDownloadBulk}
                  disabled={downloading}
                  className="flex-1 md:flex-none button-primary h-14 px-8 italic font-black gap-3 shadow-gold-sm"
                >
                  {downloading ? (
                    <>
                      <Loader2 size={18} className="animate-spin" />
                      {Math.round((batchProgress.current / batchProgress.total) * 100)}%
                    </>
                  ) : (
                    <>
                      <Download size={18} />
                      Baixar {selectedIds.length} Itens
                    </>
                  )}
                </button>
                <button 
                  onClick={() => setSelectedIds([])}
                  className="w-14 h-14 glass flex items-center justify-center text-zinc-500 hover:text-white border-white/5 hover:bg-white/10 rounded-2xl"
                >
                  <XIcon size={20} />
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          <button 
            onClick={toggleSelectAll}
            className="text-[10px] font-black uppercase tracking-widest text-zinc-600 hover:text-marshall-gold transition-colors pb-2"
          >
            {selectedIds.length === filteredHistory.length ? 'Desmarcar Todos' : 'Selecionar Todos'}
          </button>
        </div>

        {/* Progress Bar (Visible when downloading) */}
        <AnimatePresence>
          {downloading && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="mb-8 overflow-hidden"
            >
              <div className="glass p-6 rounded-3xl border-marshall-gold/10">
                <div className="flex justify-between text-[10px] font-black uppercase tracking-[3px] mb-3">
                  <span className="text-marshall-gold">Gerando Pacote de Recibos</span>
                  <span className="text-zinc-500">{batchProgress.status}</span>
                </div>
                <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                  <motion.div 
                    className="h-full bg-marshall-gold"
                    initial={{ width: 0 }}
                    animate={{ width: `${(batchProgress.current / batchProgress.total) * 100}%` }}
                  />
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* History List */}
        <div className="space-y-4">
          <AnimatePresence mode="popLayout">
            {loading ? (
              Array(4).fill(0).map((_, i) => (
                <div key={i} className="glass h-24 rounded-2xl animate-pulse" />
              ))
            ) : filteredHistory.length === 0 ? (
              <div className="py-32 glass flex flex-col items-center justify-center text-zinc-700 rounded-[48px] border-dashed">
                <Clock size={64} className="mb-6 opacity-10" />
                <h2 className="text-xl font-black uppercase tracking-widest italic mb-2">Sem resultados</h2>
                <p className="font-medium text-zinc-600">Nenhum recibo foi encontrado com os termos pesquisados.</p>
              </div>
            ) : (
              filteredHistory.map((item, idx) => {
                const colabObject = Array.isArray(item.colaboradores) ? item.colaboradores[0] : item.colaboradores;
                const colabName = colabObject?.nome || 'Removido';

                return (
                  <motion.div 
                    layout
                    key={item.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.03 }}
                    className={`glass p-4 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between group hover:border-marshall-gold/20 transition-all rounded-[24px] gap-6 relative ${selectedIds.includes(item.id) ? 'border-marshall-gold/40 bg-marshall-gold/[0.03] shadow-gold-sm' : ''}`}
                  >
                    <div className="flex items-center gap-4 sm:gap-6 w-full sm:w-auto">
                      {/* Checkbox */}
                      <button 
                        onClick={(e) => { e.stopPropagation(); toggleSelect(item.id); }}
                        className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all shrink-0 ${selectedIds.includes(item.id) ? 'bg-marshall-gold text-white' : 'bg-white/5 text-zinc-700 hover:text-zinc-400'}`}
                      >
                        {selectedIds.includes(item.id) ? <CheckSquare size={18} /> : <Square size={18} />}
                      </button>

                      <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-white/[0.03] flex items-center justify-center text-zinc-500 group-hover:text-marshall-gold transition-colors shrink-0">
                        <FileText size={26} />
                      </div>
                      
                      <div className="min-w-0 flex-1">
                        <h3 className="text-white font-black text-lg sm:text-xl italic truncate group-hover:text-marshall-gold transition-colors">
                          {colabName}
                        </h3>
                        <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-zinc-500 text-[10px] font-bold uppercase tracking-widest mt-1.5">
                          <span className="flex items-center gap-1.5 px-2 py-1 bg-white/5 rounded-lg border border-white/5 shrink-0">
                            <Calendar size={12} className="text-marshall-gold" />
                            {new Date(item.data_referencia).toLocaleDateString('pt-BR')}
                          </span>
                          <span className="flex items-center px-2 py-1 bg-marshall-gold/10 text-marshall-gold rounded-lg border border-marshall-gold/10 line-clamp-1 max-w-[200px] sm:max-w-none">
                            {item.meta_data?.referencia_texto || 'S/ Ref'}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-4 sm:gap-12 w-full sm:w-auto border-t sm:border-t-0 border-white/5 pt-4 sm:pt-0">
                      <div className="text-left sm:text-right">
                        <p className="text-[9px] text-zinc-600 font-black uppercase tracking-widest mb-0.5">Valor do Recibo</p>
                        <p className="text-white font-black text-xl sm:text-2xl italic tracking-tight">
                          R$ {item.valor_total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </p>
                      </div>

                      <div className="flex items-center gap-3">
                        {item.meta_data?.via_colab_url ? (
                          <>
                            <button 
                              onClick={() => handleViewSecureReceipt(item.meta_data.via_colab_url!)}
                              title="Ver Via Colaborador"
                              className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center bg-marshall-gold/10 text-marshall-gold hover:bg-marshall-gold hover:text-white border border-marshall-gold/10 transition-all active:scale-95 shadow-lg shadow-black/20"
                            >
                              <User size={18} />
                            </button>
                            <button 
                              onClick={() => handleViewSecureReceipt(item.meta_data.via_empresa_url!)}
                              title="Ver Via Empresa"
                              className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center bg-white/5 text-zinc-400 hover:text-white hover:bg-white/10 transition-all active:scale-90"
                            >
                              <Briefcase size={18} />
                            </button>
                          </>
                        ) : (
                          <>
                            <button 
                              onClick={() => handleViewSecureReceipt(item.pdf_url!)}
                              disabled={!item.pdf_url}
                              className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center bg-white/5 text-zinc-400 hover:text-white hover:bg-white/10 transition-all active:scale-90 disabled:opacity-20"
                            >
                              <Eye size={18} />
                            </button>
                            <button 
                              onClick={() => handleViewSecureReceipt(item.pdf_url!)}
                              disabled={!item.pdf_url}
                              className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center bg-marshall-gold/10 text-marshall-gold hover:bg-marshall-gold hover:text-white border border-marshall-gold/10 transition-all active:scale-95 disabled:opacity-20"
                            >
                              <Download size={18} />
                            </button>
                          </>
                        )}
                        <ChevronRight className="hidden sm:block text-zinc-800 ml-2" size={20} />
                      </div>
                    </div>
                  </motion.div>
                );
              })
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
