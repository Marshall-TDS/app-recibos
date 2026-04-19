'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  Users, 
  FilePlus2, 
  History, 
  LogOut, 
  Settings,
  LayoutDashboard,
  ShieldCheck,
  Zap,
  Menu,
  X
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/lib/supabase';

const menuItems = [
  { icon: LayoutDashboard, label: 'Resumo', href: '/dashboard' },
  { icon: Users, label: 'Colaboradores', href: '/dashboard/colaboradores' },
  { icon: FilePlus2, label: 'Novo Recibo', href: '/dashboard/gerar' },
  { icon: History, label: 'Histórico', href: '/dashboard/historico' },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [isMaster, setIsMaster] = useState(false);
  const [userEmail, setUserEmail] = useState('');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const isHomolog = process.env.NEXT_PUBLIC_APP_ENV === 'homolog';

  useEffect(() => {
    checkUserRole();
    setIsMobileMenuOpen(false); // Fecha o menu ao mudar de página
  }, [pathname]);

  const checkUserRole = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      setUserEmail(user.email || '');
      const role = user.app_metadata?.role || user.user_metadata?.role;
      if (role === 'master') {
        setIsMaster(true);
      }
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    window.location.href = '/';
  };

  const SidebarContent = () => (
    <div className="flex flex-col h-full bg-[#0a0a0c]">
      <div className="p-8">
        <Link href="/dashboard" className="flex items-center gap-3 mb-10 hover:opacity-80 transition-opacity">
          <div className="relative w-10 h-10 flex items-center justify-center">
            <img 
              src="/logo-gold.png" 
              alt="Logo" 
              className="w-full h-full object-contain p-1 filter brightness-110"
            />
          </div>
          <span className="font-extrabold text-2xl tracking-tighter italic">MARSHALL</span>
        </Link>

        {isMaster && (
          <div className="mb-8 p-4 bg-marshall-gold/10 border border-marshall-gold/20 rounded-2xl flex items-center gap-3 group overflow-hidden relative">
            <div className="absolute inset-0 bg-gradient-to-r from-marshall-gold/0 via-marshall-gold/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
            <div className="w-8 h-8 rounded-lg bg-marshall-gold text-white flex items-center justify-center shrink-0 shadow-gold">
              <ShieldCheck size={18} />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-black text-marshall-gold uppercase tracking-widest leading-none mb-1 text-left">Master Admin</p>
              <p className="text-[10px] text-zinc-400 font-bold truncate text-left">{userEmail}</p>
            </div>
          </div>
        )}

        <nav className="space-y-2">
          {menuItems.map((item: any) => {
            const isActive = pathname === item.href;
            return (
              <Link 
                key={item.href} 
                href={item.href}
                className={`flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all duration-300 group ${
                  isActive 
                    ? 'bg-marshall-gold text-white font-bold shadow-gold' 
                    : 'text-zinc-500 hover:text-white hover:bg-white/[0.03]'
                }`}
              >
                <item.icon size={20} className={`shrink-0 transition-colors ${isActive ? 'text-white' : 'group-hover:text-marshall-gold'}`} />
                <span className="text-sm tracking-tight">{item.label}</span>
                {isActive && (
                  <motion.div 
                    layoutId="active-pill"
                    className="ml-auto w-1 h-4 bg-white/40 rounded-full"
                  />
                )}
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="mt-auto p-8 border-t border-white/5 space-y-1">
        <Link 
          href="/dashboard/configuracoes"
          className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
            pathname === '/dashboard/configuracoes' 
              ? 'bg-white/5 text-marshall-gold font-bold' 
              : 'text-zinc-500 hover:text-marshall-gold hover:bg-white/[0.03]'
          }`}
        >
          <Settings size={20} />
          <span className="text-sm font-bold tracking-tight">Configurações</span>
        </Link>
        <button 
          onClick={handleSignOut}
          className="w-full flex items-center gap-3 px-4 py-3 text-red-400/70 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition-all text-left group"
        >
          <LogOut size={20} className="group-hover:-translate-x-1 transition-transform" />
          <span className="text-sm font-bold tracking-tight">Encerrar Sessão</span>
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-[#0a0a0c] overflow-hidden text-white relative">
      {/* Homologation Banner */}
      <AnimatePresence>
        {isHomolog && (
          <motion.div 
            initial={{ y: -50 }}
            animate={{ y: 0 }}
            className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-orange-500 via-marshall-gold to-orange-500 z-[100] shadow-[0_0_20px_rgba(219,170,61,0.5)]"
          >
            <div className="absolute top-1 left-1/2 -translate-x-1/2 px-4 py-1 bg-marshall-gold text-[8px] font-black uppercase tracking-[3px] rounded-b-lg border-x border-b border-white/10 flex items-center gap-2">
              <Zap size={10} className="text-white fill-white animate-pulse" />
              Ambiente de Homologação
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mobile Top Bar */}
      <header className="fixed top-0 left-0 right-0 h-16 bg-[#0a0a0c]/80 backdrop-blur-xl border-b border-white/5 z-40 flex items-center justify-between px-6 lg:hidden">
        <div className="flex items-center gap-2">
          <img src="/logo-gold.png" alt="Logo" className="w-8 h-8 object-contain filter brightness-110" />
          <span className="font-extrabold text-lg tracking-tighter italic">MARSHALL</span>
        </div>
        <button 
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="p-2 bg-white/5 rounded-xl text-marshall-gold border border-white/10 active:scale-95 transition-all"
        >
          <AnimatePresence mode="wait">
            {isMobileMenuOpen ? (
              <motion.div
                key="close"
                initial={{ rotate: -90, opacity: 0 }}
                animate={{ rotate: 0, opacity: 1 }}
                exit={{ rotate: 90, opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                <X size={24} />
              </motion.div>
            ) : (
              <motion.div
                key="menu"
                initial={{ rotate: 90, opacity: 0 }}
                animate={{ rotate: 0, opacity: 1 }}
                exit={{ rotate: -90, opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                <Menu size={24} />
              </motion.div>
            )}
          </AnimatePresence>
        </button>
      </header>

      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex glass w-[280px] border-r border-white/5 flex-col z-20">
        <SidebarContent />
      </aside>

      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileMenuOpen(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
            />
            <motion.aside 
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed top-0 left-0 bottom-0 w-[280px] bg-[#0a0a0c] z-50 lg:hidden border-r border-white/5"
            >
              <SidebarContent />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <main className={`flex-1 overflow-y-auto overflow-x-hidden relative grid-bg px-4 sm:px-10 selection:bg-marshall-gold/30 ${isHomolog ? 'pt-24 lg:pt-16' : 'pt-24 lg:pt-10'} pb-10`}>
        {/* Dynamic ambient backdrops */}
        <div className="orb top-0 -right-20 w-[600px] h-[600px] bg-marshall-gold/5 blur-[120px]" />
        <div className="orb bottom-0 -left-20 w-[400px] h-[400px] bg-marshall-gold/10 blur-[100px]" />
        
        <div className="relative z-10 w-full max-w-7xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
