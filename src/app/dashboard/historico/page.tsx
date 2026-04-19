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
  Briefcase
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/lib/supabase';

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
  const [searchTerm, setSearchTerm] = useState('');
  const [history, setHistory] = useState<Recibo[]>([]);
  const [loading, setLoading] = useState(true);

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
        .order('data_referencia', { ascending: false });

      if (error) throw error;
      setHistory(data || []);
    } catch (error: any) {
      console.error('Error fetching history:', error.message);
    } finally {
      setLoading(false);
    }
  };

  const filteredHistory = history.filter(item => {
    const nome = Array.isArray(item.colaboradores) 
      ? item.colaboradores[0]?.nome 
      : (item.colaboradores as any)?.nome || '';
      
    return nome.toLowerCase().includes(searchTerm.toLowerCase()) || 
           (item.meta_data?.referencia_texto || '').toLowerCase().includes(searchTerm.toLowerCase());
  });

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-in fade-in duration-500">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6 mb-12">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-marshall-gold/10 rounded-lg text-marshall-gold">
                <HistoryIcon size={24} />
              </div>
              <h1 className="text-4xl font-black tracking-tight italic">Registros de Emissão</h1>
            </div>
            <p className="text-zinc-500 font-medium">Histórico completo de todos os recibos Marshall Gold gerados pelo sistema.</p>
          </div>
          
          <div className="flex items-center gap-3 glass px-6 py-3 rounded-2xl border border-white/5">
            <span className="text-xs font-black text-zinc-500 uppercase tracking-widest leading-none">Total no Período</span>
            <span className="text-xl font-black text-white italic leading-none">
              R$ {filteredHistory.reduce((acc, curr) => acc + curr.valor_total, 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </span>
          </div>
        </div>

        {/* Search & Stats Bar */}
        <div className="flex flex-col md:flex-row gap-4 mb-10">
          <div className="relative flex-1 group">
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 group-focus-within:text-marshall-gold transition-colors">
              <Search size={20} />
            </div>
            <input 
              type="text" 
              placeholder="Pesquisar por colaborador, referência ou observação..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-12 w-full !h-14"
            />
          </div>
        </div>

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
                    className="glass p-6 pr-8 flex items-center justify-between group hover:border-marshall-gold/20 transition-all rounded-[24px]"
                  >
                    <div className="flex items-center gap-6">
                      <div className="w-14 h-14 rounded-2xl bg-white/[0.03] flex items-center justify-center text-zinc-500 group-hover:text-marshall-gold transition-colors shrink-0">
                        <FileText size={26} />
                      </div>
                      
                      <div className="min-w-0">
                        <h3 className="text-white font-black text-xl italic truncate group-hover:text-marshall-gold transition-colors">
                          {colabName}
                        </h3>
                        <div className="flex items-center gap-4 text-zinc-500 text-xs font-bold uppercase tracking-widest mt-1">
                          <span className="flex items-center gap-1.5 px-2 py-1 bg-white/5 rounded-lg border border-white/5">
                            <Calendar size={12} className="text-marshall-gold" />
                            {new Date(item.data_referencia).toLocaleDateString('pt-BR')}
                          </span>
                          <span className="flex items-center gap-1.5 px-2 py-1 bg-marshall-gold/10 text-marshall-gold rounded-lg border border-marshall-gold/10">
                            {item.meta_data?.referencia_texto || 'S/ Ref'}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-12">
                      <div className="text-right hidden sm:block">
                        <p className="text-[10px] text-zinc-600 font-black uppercase tracking-widest mb-0.5">Valor do Recibo</p>
                        <p className="text-white font-black text-2xl italic tracking-tight">
                          R$ {item.valor_total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </p>
                      </div>

                      <div className="flex items-center gap-3">
                        {item.meta_data?.via_colab_url ? (
                          <>
                            <button 
                              onClick={() => window.open(item.meta_data.via_colab_url, '_blank')}
                              title="Download Via Colaborador"
                              className="w-12 h-12 rounded-xl flex items-center justify-center bg-marshall-gold/10 text-marshall-gold hover:bg-marshall-gold hover:text-white border border-marshall-gold/10 hover:shadow-gold transition-all active:scale-95"
                            >
                              <User size={18} />
                            </button>
                            <button 
                              onClick={() => window.open(item.meta_data.via_empresa_url, '_blank')}
                              title="Download Via Empresa"
                              className="w-12 h-12 rounded-xl flex items-center justify-center bg-white/5 text-zinc-400 hover:text-white hover:bg-white/10 transition-all active:scale-90"
                            >
                              <Briefcase size={18} />
                            </button>
                          </>
                        ) : (
                          <>
                            <button 
                              onClick={() => item.pdf_url && window.open(item.pdf_url, '_blank')}
                              disabled={!item.pdf_url}
                              className="w-12 h-12 rounded-xl flex items-center justify-center bg-white/5 text-zinc-400 hover:text-white hover:bg-white/10 transition-all active:scale-90 disabled:opacity-20"
                            >
                              <Eye size={20} />
                            </button>
                            <button 
                              onClick={() => {
                                if (item.pdf_url) {
                                  const link = document.createElement('a');
                                  link.href = item.pdf_url;
                                  link.download = `Recibo_${item.id}.pdf`;
                                  link.click();
                                }
                              }}
                              disabled={!item.pdf_url}
                              className="w-12 h-12 rounded-xl flex items-center justify-center bg-marshall-gold/10 text-marshall-gold hover:bg-marshall-gold hover:text-white border border-marshall-gold/10 hover:shadow-gold transition-all active:scale-95 disabled:opacity-20"
                            >
                              <Download size={20} />
                            </button>
                          </>
                        )}
                        <ChevronRight className="text-zinc-800 ml-2" size={20} />
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
