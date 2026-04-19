'use client';

import React, { useState } from 'react';
import { Lock, Mail, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';
import Image from 'next/image';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter();
  const supabase = createClient();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg('');
    
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      if (data.session) {
        router.push('/dashboard');
      }
    } catch (err: any) {
      console.error('Login error:', err.message);
      setErrorMsg(err.message === 'Invalid login credentials' 
        ? 'E-mail ou senha incorretos.' 
        : 'Ocorreu um erro ao acessar o sistema.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center p-6 relative overflow-hidden bg-[#0a0a0c] lg:grid-bg">
      {/* Marshall Premium Background Orbs */}
      <div className="orb top-[-10%] left-[-10%] w-[45%] h-[45%] bg-marshall-gold" />
      <div className="orb bottom-[-10%] right-[-10%] w-[45%] h-[45%] bg-marshall-gold_dark" />
      <div className="orb top-[20%] right-[20%] w-[25%] h-[25%] bg-marshall-gold_light" />

      {/* Homologation Badge */}
      {process.env.NEXT_PUBLIC_APP_ENV === 'homolog' && (
        <div className="absolute top-0 left-0 right-0 py-3 bg-marshall-gold/10 backdrop-blur-xl border-b border-marshall-gold/20 flex justify-center z-[100]">
          <span className="text-[10px] font-black text-marshall-gold uppercase tracking-[5px] flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-marshall-gold animate-pulse shadow-[0_0_10px_rgba(219,170,61,0.8)]" />
            Ambiente de Homologação
          </span>
        </div>
      )}

      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 30 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className="glass w-full max-w-md p-10 relative z-10 rounded-3xl"
      >
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.6 }}
          className="flex flex-col items-center mb-12"
        >
          <div className="relative w-20 h-20 mb-8">
            <div className="absolute inset-0 bg-marshall-gold/20 rounded-full blur-2xl animate-pulse" />
            <div className="relative w-full h-full p-3 flex items-center justify-center">
               <Image 
                src="/logo-gold.png" 
                alt="Marshall Logo" 
                width={60} 
                height={60} 
                className="object-contain filter brightness-110"
                priority
              />
            </div>
          </div>
          <h1 className="text-4xl font-black text-white italic mb-2 text-center tracking-tighter">
            MARSHALL <span className="text-marshall-gold font-normal opacity-50 not-italic">TDS</span>
          </h1>
          <p className="text-zinc-500 text-center font-bold uppercase tracking-widest text-[10px]">
            Emissor de Recibos
          </p>
        </motion.div>

        <motion.form 
          onSubmit={handleLogin} 
          className="space-y-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.6 }}
        >
          {errorMsg && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="px-4 py-3 bg-red-500/10 border border-red-500/20 text-red-500 text-xs font-bold rounded-xl"
            >
              {errorMsg}
            </motion.div>
          )}

          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 block ml-1">E-mail Administrativo</label>
            <div className="relative group">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 group-focus-within:text-marshall-gold transition-colors">
                <Mail size={18} strokeWidth={2.5} />
              </div>
              <input 
                type="email" 
                placeholder="adm@marshall.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                required
                className="pl-12 w-full !h-14 font-medium"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 block ml-1">Senha de Acesso</label>
            <div className="relative group">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 group-focus-within:text-marshall-gold transition-colors">
                <Lock size={18} strokeWidth={2.5} />
              </div>
              <input 
                type="password" 
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                required
                className="pl-12 w-full !h-14 font-medium"
              />
            </div>
          </div>

          <motion.button 
            type="submit" 
            disabled={isLoading}
            className="button-primary w-full mt-4 h-16 text-lg italic tracking-tight"
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.98 }}
          >
            {isLoading ? (
              <Loader2 className="animate-spin text-white" size={24} />
            ) : (
              <div className="flex items-center gap-3">
                Logar
                <ArrowRight size={22} className="opacity-50" />
              </div>
            )}
          </motion.button>
        </motion.form>

        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="mt-12 pt-8 text-center border-t border-white/5"
        >
          <div className="flex items-center justify-center gap-2 text-zinc-600">
             <div className="w-1.5 h-1.5 rounded-full bg-emerald-500/50 animate-pulse" />
             <p className="text-[10px] font-black uppercase tracking-widest">
               Ambiente Protegido por SSL
             </p>
          </div>
        </motion.div>
      </motion.div>
    </main>
  );
}

const Loader2 = ({ className, size }: { className?: string, size?: number }) => (
  <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
  </svg>
);
