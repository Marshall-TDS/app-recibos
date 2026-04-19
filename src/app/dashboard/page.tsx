'use client';

import React, { useEffect, useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { 
  Users, 
  FileText, 
  TrendingUp, 
  PlusCircle,
  Clock,
  ArrowRight,
  Loader2,
  DollarSign
} from 'lucide-react';
import { motion } from 'framer-motion';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';

export default function DashboardOverview() {
  const [stats, setStats] = useState({
    totalColaboradores: 0,
    totalRecibos: 0,
    volumeFinanceiro: 0,
    ultimoRecibo: null as any
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      try {
        setLoading(true);
        
        // 1. Total de Colaboradores
        const { count: colabCount } = await supabase
          .from('colaboradores')
          .select('*', { count: 'exact', head: true });

        // 2. Total de Recibos
        const { count: receiptCount } = await supabase
          .from('recibos')
          .select('*', { count: 'exact', head: true });

        // 3. Volume Financeiro (Soma de todos os recibos visíveis pelo RLS)
        const { data: allReceipts } = await supabase
          .from('recibos')
          .select('valor_total');
        
        const totalVolume = allReceipts?.reduce((acc, curr) => acc + (Number(curr.valor_total) || 0), 0) || 0;

        // 4. Último Recibo para atividade recente
        const { data: recentReceipts } = await supabase
          .from('recibos')
          .select('*, colaboradores(nome)')
          .order('created_at', { ascending: false })
          .limit(1);

        setStats({
          totalColaboradores: colabCount || 0,
          totalRecibos: receiptCount || 0,
          volumeFinanceiro: totalVolume,
          ultimoRecibo: recentReceipts?.[0] || null
        });
      } catch (error) {
        console.error('Error fetching stats:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchStats();
  }, []);

  const statCards = [
    { 
      label: 'Equipe Ativa', 
      value: stats.totalColaboradores, 
      icon: Users, 
      color: 'text-marshall-gold',
      bg: 'bg-marshall-gold/10',
      href: '/dashboard/colaboradores'
    },
    { 
      label: 'Recibos Totais', 
      value: stats.totalRecibos, 
      icon: FileText, 
      color: 'text-marshall-gold',
      bg: 'bg-marshall-gold/10',
      href: '/dashboard/historico'
    },
    { 
      label: 'Volume Financeiro', 
      value: `R$ ${stats.volumeFinanceiro.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, 
      icon: DollarSign, 
      color: 'text-marshall-gold',
      bg: 'bg-marshall-gold/10',
      href: '/dashboard/historico'
    }
  ];

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-in fade-in duration-700">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6 mb-12">
          <div>
            <h1 className="text-4xl font-black text-white italic tracking-tight mb-3">
              Marshall <span className="text-marshall-gold">Receipts</span>
            </h1>
            <p className="text-zinc-500 font-medium max-w-2xl">
              Bem-vindo ao sistema Marshall de emissão de recibos profissionais. Gerencie sua equipe e gere documentos em lote com facilidade.
            </p>
          </div>
          
          <Link href="/dashboard/gerar">
            <button className="button-primary px-8 py-4 gap-3 text-lg italic tracking-tight shadow-gold group">
              <PlusCircle size={24} className="group-hover:rotate-90 transition-transform duration-500" />
              <span>Gerar Novo Lote</span>
            </button>
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          {statCards.map((stat, idx) => (
            <Link key={idx} href={stat.href}>
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
                className="glass p-8 flex items-center justify-between group cursor-pointer hover:bg-white/[0.04] transition-all rounded-3xl border-white/5 hover:border-marshall-gold/20"
              >
                <div>
                  <p className="text-zinc-500 text-[10px] font-black uppercase tracking-widest mb-1">{stat.label}</p>
                  <h3 className="text-2xl font-black italic text-white whitespace-nowrap">{stat.value}</h3>
                </div>
                <div className={`w-[60px] h-[60px] rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110 ${stat.bg} ${stat.color}`}>
                  <stat.icon size={28} />
                </div>
              </motion.div>
            </Link>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
          {/* Recent Activity Card */}
          <div className="lg:col-span-12 glass p-10 rounded-[40px] flex flex-col border-white/5">
            <div className="flex items-center justify-between mb-10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-marshall-gold/20 flex items-center justify-center text-marshall-gold">
                   <Clock size={20} />
                </div>
                <h2 className="text-xl font-black italic uppercase tracking-tighter">Último Lote Gerado</h2>
              </div>
              <Link href="/dashboard/historico" className="text-xs font-black text-zinc-500 hover:text-marshall-gold uppercase tracking-widest transition-colors">
                Ver Histórico Completo
              </Link>
            </div>

            <div className="flex-1 flex flex-col justify-center min-h-[120px]">
              {loading ? (
                <div className="flex items-center gap-3 text-zinc-600 font-bold uppercase tracking-widest text-xs animate-pulse justify-center">
                  <div className="w-4 h-4 rounded-full border-2 border-marshall-gold border-t-transparent animate-spin" />
                  Sincronizando Base...
                </div>
              ) : stats.ultimoRecibo ? (
                <div className="p-6 bg-white/[0.02] border border-white/5 rounded-3xl flex items-center justify-between group hover:border-marshall-gold/20 transition-all">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-marshall-gold/10 flex items-center justify-center text-marshall-gold font-black">
                      {stats.ultimoRecibo.colaboradores?.nome?.[0] || '?'}
                    </div>
                    <div>
                      <p className="text-white font-black text-lg italic">{stats.ultimoRecibo.colaboradores?.nome || 'N/A'}</p>
                      <p className="text-zinc-500 text-xs font-bold uppercase tracking-tighter">Emissão: {new Date(stats.ultimoRecibo.created_at).toLocaleDateString('pt-BR')}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-marshall-gold font-black text-2xl italic">
                      R$ {Number(stats.ultimoRecibo.valor_total).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </p>
                    <p className="text-[10px] text-zinc-600 font-black uppercase tracking-widest">Valor Líquido</p>
                  </div>
                </div>
              ) : (
                <div className="py-12 flex flex-col items-center justify-center text-zinc-700 italic border-2 border-dashed border-white/[0.02] rounded-3xl">
                  <FileText size={48} className="mb-4 opacity-10" />
                  <p className="font-bold uppercase tracking-widest text-xs">Nenhum registro encontrado</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
