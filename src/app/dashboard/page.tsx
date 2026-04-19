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
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';

export default function DashboardOverview() {
  const supabase = createClient();
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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 animate-in fade-in duration-700">
        <div className="flex flex-col items-center text-center gap-6 mb-16">
          <div>
            <h1 className="text-4xl sm:text-6xl font-black text-white italic tracking-tight mb-4">
              Marshall <span className="text-marshall-gold">Recibos</span>
            </h1>
            <p className="text-zinc-500 font-medium max-w-2xl mx-auto text-sm sm:text-base leading-relaxed">
              Bem-vindo Marshall Recibos. Gerencie sua equipe e gere recibos em lote com segurança máxima.
            </p>
          </div>
          
          <Link href="/dashboard/gerar" className="relative group">
            <div className="absolute -inset-1 bg-gradient-to-r from-marshall-gold to-orange-500 rounded-2xl blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200" />
            <button className="relative button-primary px-10 py-5 gap-4 text-xl italic tracking-tight shadow-gold group">
              <PlusCircle size={28} className="group-hover:rotate-90 transition-transform duration-500" />
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

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch mt-8">
          {/* Permanent History CTA */}
          <div className="lg:col-span-12 glass p-10 rounded-[40px] flex flex-col items-center text-center border-white/5 bg-marshall-gold/[0.02]">
            <div className="w-16 h-16 rounded-2xl bg-marshall-gold/10 flex items-center justify-center text-marshall-gold mb-6">
               <Clock size={32} />
            </div>
            <h2 className="text-2xl font-black italic uppercase tracking-tighter mb-4">Veja o Histórico Permanente</h2>
            <p className="text-zinc-500 max-w-xl mb-8 font-medium">
              Todos os seus recibos gerados estão armazenados de forma segura e criptografada. Acesse a base completa para consultas ou re-emissões.
            </p>
            <Link href="/dashboard/historico">
              <button className="flex items-center gap-3 px-8 h-14 bg-white/5 border border-white/10 hover:bg-white/10 rounded-2xl text-base font-black italic uppercase tracking-widest transition-all hover:scale-105 group">
                Acessar Base de Dados
                <ArrowRight size={20} className="text-marshall-gold group-hover:translate-x-1 transition-transform" />
              </button>
            </Link>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
