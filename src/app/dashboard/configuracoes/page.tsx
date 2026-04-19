'use client';

import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { 
  Settings, 
  Building2, 
  User, 
  CreditCard, 
  Save, 
  Loader2,
  CheckCircle2,
  ShieldCheck
} from 'lucide-react';
import { motion } from 'framer-motion';
import { createClient } from '@/lib/supabase/client';
import { maskCNPJ, maskCPF } from '@/lib/masks';

export default function ConfiguracoesPage() {
  const supabase = createClient();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [config, setConfig] = useState({
    nome_pagador: 'Natan Portela da Silva',
    documento_pagador: '444.618.778-33',
  });

  useEffect(() => {
    fetchConfig();
  }, []);

  const fetchConfig = async () => {
    try {
      setLoading(true);
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) return;

      const { data, error } = await supabase
        .from('configuracoes')
        .select('*')
        .eq('user_id', userData.user.id)
        .single();

      if (data) {
        setConfig({
          nome_pagador: data.nome_pagador,
          documento_pagador: data.documento_pagador,
        });
      }
    } catch (error) {
      console.error('Error fetching config:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setSuccess(false);
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error('Usuário não autenticado');

      // Verifica se já existe uma configuração
      const { data: existing } = await supabase
        .from('configuracoes')
        .select('id')
        .eq('user_id', userData.user.id)
        .single();

      const payload = {
        user_id: userData.user.id,
        nome_pagador: config.nome_pagador,
        documento_pagador: config.documento_pagador,
      };

      let error;
      if (existing?.id) {
        ({ error } = await supabase
          .from('configuracoes')
          .update(payload)
          .eq('id', existing.id));
      } else {
        ({ error } = await supabase
          .from('configuracoes')
          .insert([payload]));
      }

      if (error) throw error;
      
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (error: any) {
      alert('Erro ao salvar: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDocChange = (val: string) => {
    const cleaned = val.replace(/\D/g, '');
    const masked = cleaned.length <= 11 ? maskCPF(val) : maskCNPJ(val);
    setConfig({ ...config, documento_pagador: masked });
  };

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-in fade-in duration-500">
        <div className="mb-12">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-marshall-gold/10 rounded-lg text-marshall-gold">
              <Settings size={24} />
            </div>
            <h1 className="text-4xl font-black tracking-tight italic">Configurações</h1>
          </div>
          <p className="text-zinc-500 font-medium">Gerencie as informações institucionais que aparecem em todos os recibos Marshall Gold.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
          <div className="md:col-span-8 space-y-6">
            <div className="glass p-8 rounded-[32px] space-y-8 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-8 opacity-[0.03] pointer-events-none">
                <Building2 size={120} />
              </div>

              <h2 className="text-xl font-black flex items-center gap-2 text-white uppercase italic tracking-tighter">
                <ShieldCheck size={20} className="text-marshall-gold" />
                Dados do Empregador / Pagador
              </h2>

              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 block ml-1">Nome Completo ou Razão Social</label>
                  <div className="relative group">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 group-focus-within:text-marshall-gold transition-colors" size={18} />
                    <input 
                      type="text" 
                      value={config.nome_pagador}
                      onChange={(e) => setConfig({ ...config, nome_pagador: e.target.value })}
                      placeholder="Ex: Marshall TDS Administração LTDA"
                      className="pl-12 w-full !h-[54px]"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 block ml-1">Documento (CPF ou CNPJ)</label>
                  <div className="relative group">
                    <CreditCard className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 group-focus-within:text-marshall-gold transition-colors" size={18} />
                    <input 
                      type="text" 
                      value={config.documento_pagador}
                      onChange={(e) => handleDocChange(e.target.value)}
                      placeholder="000.000.000-00"
                      className="pl-12 w-full !h-[54px]"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-4">
                <button 
                  onClick={handleSave}
                  disabled={saving}
                  className={`w-full h-14 rounded-2xl font-black uppercase tracking-widest flex items-center justify-center gap-3 transition-all ${
                    success 
                      ? 'bg-green-500/20 text-green-500 border border-green-500/20' 
                      : 'bg-marshall-gold text-white shadow-gold hover:translate-y-[-2px] active:scale-95'
                  }`}
                >
                  {saving ? (
                    <Loader2 className="animate-spin" size={20} />
                  ) : success ? (
                    <>
                      <CheckCircle2 size={20} />
                      <span>Configurações Salvas</span>
                    </>
                  ) : (
                    <>
                      <Save size={20} />
                      <span>Salvar Configurações</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            <div className="p-6 bg-marshall-gold/5 border border-marshall-gold/10 rounded-2xl flex items-start gap-4">
              <ShieldCheck className="text-marshall-gold mt-1 shrink-0" size={20} />
              <div className="text-xs text-marshall-gold/70 font-bold leading-relaxed uppercase tracking-tighter">
                Estas informações serão impressas no cabeçalho de todos os recibos (colaborador e empresa). Mantenha-as sempre atualizadas conforme o registro oficial daMarshall TDS.
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
