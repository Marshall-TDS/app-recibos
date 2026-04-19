'use client';

import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { 
  Search, 
  UserPlus,
  Users,
  Filter,
  X,
  Loader2,
  Database,
  Briefcase,
  DollarSign,
  Plus,
  Trash2,
  CheckCircle2,
  Clock,
  ChevronRight,
  Settings,
  CreditCard,
  Wallet
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/lib/supabase';
import { maskCPF, maskCNPJ, applyPIXMask } from '@/lib/masks';

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
  ativo: boolean;
  tipo_chave_pix: string;
  chave_pix: string;
  razao_social?: string;
}

const PIX_TYPES = ['CPF', 'CNPJ', 'TELEFONE', 'EMAIL', 'ALEATORIA'];
const ADICIONAIS_SUGESTOES = ['Convênio Médico', 'Vale Alimentação', 'Bônus Performance', 'Auxílio Home Office'];

export default function ColaboradoresPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [colaboradores, setColaboradores] = useState<Colaborador[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'geral' | 'financeiro'>('geral');
  const [editingId, setEditingId] = useState<string | null>(null);

  const [form, setForm] = useState({
    nome: '',
    documento: '',
    cargo: '',
    nome_empresa: '',
    salario_base: '',
    gratificacao_padrao: '20',
    dias_fevereiro: 30,
    tipo_chave_pix: 'ALEATORIA',
    chave_pix: '',
    razao_social: '',
    adicionais_padrao: [] as Adicional[]
  });

  useEffect(() => {
    fetchColaboradores();
  }, []);

  const fetchColaboradores = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('colaboradores')
        .select('*')
        .order('nome', { ascending: true });

      if (error) throw error;
      setColaboradores(data || []);
    } catch (error: any) {
      console.error('Error fetching colaboradores:', error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (colab?: Colaborador) => {
    if (colab) {
      setEditingId(colab.id);
      setForm({
        nome: colab.nome,
        documento: colab.documento || '',
        cargo: colab.cargo || '',
        nome_empresa: colab.nome_empresa || '',
        salario_base: colab.salario_base?.toString() || '0',
        gratificacao_padrao: colab.gratificacao_padrao?.toString() || '20',
        dias_fevereiro: colab.dias_fevereiro || 30,
        tipo_chave_pix: colab.tipo_chave_pix || 'ALEATORIA',
        chave_pix: colab.chave_pix || '',
        razao_social: colab.razao_social || '',
        adicionais_padrao: colab.adicionais_padrao || []
      });
    } else {
      setEditingId(null);
      setForm({
        nome: '',
        documento: '',
        cargo: '',
        nome_empresa: '',
        salario_base: '',
        gratificacao_padrao: '20',
        dias_fevereiro: 30,
        tipo_chave_pix: 'ALEATORIA',
        chave_pix: '',
        razao_social: '',
        adicionais_padrao: []
      });
    }
    setActiveTab('geral');
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error('Não autenticado');

      const payload = {
        ...form,
        salario_base: parseFloat(form.salario_base) || 0,
        gratificacao_padrao: parseFloat(form.gratificacao_padrao) || 0,
        dias_fevereiro: parseInt(form.dias_fevereiro.toString()) || 30,
        user_id: userData.user.id
      };

      let error;
      if (editingId) {
        ({ error } = await supabase
          .from('colaboradores')
          .update(payload)
          .eq('id', editingId));
      } else {
        ({ error } = await supabase
          .from('colaboradores')
          .insert([payload]));
      }

      if (error) throw error;

      setIsModalOpen(false);
      fetchColaboradores();
    } catch (error: any) {
      alert('Erro ao salvar: ' + error.message);
    } finally {
      setIsSaving(false);
    }
  };

  const addAdicional = (sugestao: string = '') => {
    setForm({
      ...form,
      adicionais_padrao: [...form.adicionais_padrao, { descricao: sugestao, valor_mensal: 0 }]
    });
  };

  const removeAdicional = (index: number) => {
    const newAdd = [...form.adicionais_padrao];
    newAdd.splice(index, 1);
    setForm({ ...form, adicionais_padrao: newAdd });
  };

  const updateAdicional = (index: number, field: keyof Adicional, value: string | number) => {
    const newAdd = [...form.adicionais_padrao];
    newAdd[index] = { ...newAdd[index], [field]: field === 'valor_mensal' ? parseFloat(value.toString()) || 0 : value };
    setForm({ ...form, adicionais_padrao: newAdd });
  };

  const handleDocChange = (val: string) => {
    const cleaned = val.replace(/\D/g, '');
    const masked = cleaned.length <= 11 ? maskCPF(val) : maskCNPJ(val);
    setForm({ ...form, documento: masked });
  };

  const handlePIXChange = (val: string) => {
    const masked = applyPIXMask(form.tipo_chave_pix, val);
    setForm({ ...form, chave_pix: masked });
  };

  const filteredColaboradores = colaboradores.filter(c => 
    c.nome.toLowerCase().includes(searchTerm.toLowerCase()) || 
    c.documento?.includes(searchTerm)
  );

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-in fade-in duration-500">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6 mb-12">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-marshall-gold/10 rounded-lg text-marshall-gold">
                <Users size={24} />
              </div>
              <h1 className="text-4xl font-black tracking-tight text-white italic">Equipe Marshall</h1>
            </div>
          </div>
          
          <button 
            onClick={() => handleOpenModal()}
            className="button-primary w-full md:w-auto gap-2"
          >
            <UserPlus size={20} />
            <span>Novo Colaborador</span>
          </button>
        </div>

        <div className="flex flex-col md:flex-row gap-4 mb-10">
          <div className="relative flex-1 group">
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 group-focus-within:text-marshall-gold transition-colors">
              <Search size={20} />
            </div>
            <input 
              type="text" 
              placeholder="Pesquisar por nome, documento..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-12 w-full !h-14"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <AnimatePresence mode="popLayout">
            {loading ? (
              Array(6).fill(0).map((_, i) => (
                <div key={i} className="glass h-64 rounded-3xl animate-pulse" />
              ))
            ) : filteredColaboradores.length > 0 ? (
              filteredColaboradores.map((colab, idx) => (
                <motion.div
                  layout
                  key={colab.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ delay: idx * 0.05 }}
                  className="glass rounded-3xl overflow-hidden group hover:border-marshall-gold/30 transition-all duration-300 cursor-pointer"
                  onClick={() => handleOpenModal(colab)}
                >
                  <div className="p-8 h-full flex flex-col">
                    <div className="flex justify-between items-start mb-6">
                      <div className="flex items-start gap-4">
                        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-marshall-gold to-marshall-gold_dark flex items-center justify-center text-2xl font-black text-white shadow-lg shadow-marshall-gold/20 shrink-0 mt-1">
                          {colab.nome.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <h3 className="text-xl font-black text-white group-hover:text-marshall-gold transition-colors line-clamp-2 leading-tight">{colab.nome}</h3>
                          <p className="text-sm text-zinc-500 font-bold uppercase tracking-tighter mt-1">{colab.cargo || 'Cargo não definido'}</p>
                          {colab.razao_social && (
                            <p className="text-[10px] font-black text-marshall-gold uppercase tracking-widest mt-1.5 opacity-80 leading-relaxed">{colab.razao_social}</p>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4 flex-1">
                      <div className="flex items-center gap-3 text-zinc-400">
                        <Database size={16} className="text-marshall-gold/50" />
                        <span className="text-sm font-medium">{colab.documento || 'Sem doc.'}</span>
                      </div>
                      <div className="flex items-center gap-3 text-zinc-400">
                        <Wallet size={16} className="text-marshall-gold/50" />
                        <span className="text-sm font-medium truncate italic">{colab.chave_pix || 'PIX não informado'}</span>
                      </div>
                      <div className="pt-4 border-t border-white/5 flex gap-4">
                        <div>
                          <p className="text-[10px] text-zinc-500 uppercase font-black tracking-widest mb-1">Carga Salarial</p>
                          <p className="text-lg font-black text-white">R$ {colab.salario_base?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                        </div>
                        <div className="text-right ml-auto">
                          <p className="text-[10px] text-zinc-500 uppercase font-black tracking-widest mb-1">Regra Fev.</p>
                          <p className="text-lg font-black text-marshall-gold">{colab.dias_fevereiro || 30} DIAS</p>
                        </div>
                      </div>
                    </div>

                    <div className="mt-8 pt-6 border-t border-white/5 flex items-center justify-between">
                       <span className="text-[10px] font-black text-zinc-600 uppercase tracking-widest">
                        {colab.adicionais_padrao?.length || 0} ADICIONAIS
                       </span>
                      <div className="flex items-center gap-2 text-marshall-gold font-black text-sm group-hover:translate-x-1 transition-transform">
                        <span>Editar Ficha</span>
                        <ChevronRight size={16} />
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))
            ) : (
              <div className="col-span-full py-32 flex flex-col items-center justify-center glass !rounded-[32px] border-dashed">
                <Users size={64} className="text-zinc-700 mb-6" />
                <h2 className="text-2xl font-bold text-zinc-400">Equipe vazia</h2>
                <button onClick={() => handleOpenModal()} className="button-primary mt-8 px-12">Adicionar Novo</button>
              </div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/90 backdrop-blur-xl">
            {/* Overlay invisível para fechar ao clicar fora */}
            <div className="absolute inset-0" onClick={() => setIsModalOpen(false)} />
            
            <motion.div 
              initial={{ opacity: 0, y: "100%" }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: "100%" }}
              drag="y"
              dragConstraints={{ top: 0 }}
              dragElastic={0.2}
              onDragEnd={(_, info) => {
                if (info.offset.y > 100) setIsModalOpen(false);
              }}
              className="glass w-full max-w-2xl h-[92vh] sm:h-auto sm:max-h-[90vh] overflow-hidden rounded-t-[28px] sm:rounded-[28px] flex flex-col relative z-10 touch-none shadow-2xl"
            >
              {/* Apple Handle */}
              <div 
                onClick={() => setIsModalOpen(false)}
                className="w-full flex justify-center py-4 cursor-pointer sm:hidden"
              >
                <div className="w-12 h-1.5 bg-zinc-800 rounded-full" />
              </div>

              <div className="p-4 md:p-5 border-b border-white/5 bg-gradient-to-br from-marshall-gold/5 via-transparent to-transparent">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-marshall-gold/10 flex items-center justify-center text-marshall-gold shadow-inner shrink-0">
                      {editingId ? <Settings size={20} strokeWidth={2} /> : <UserPlus size={20} strokeWidth={2} />}
                    </div>
                    <div>
                      <h2 className="text-xl font-black text-white tracking-tight leading-tight">{editingId ? 'Editar Colaborador' : 'Novo Colaborador'}</h2>
                      <p className="text-zinc-500 font-bold uppercase tracking-widest text-[8px] mt-0.5 italic opacity-60">Marshall TDS</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="flex p-1 bg-black/40 rounded-xl w-full sm:w-auto border border-white/5 justify-center">
                      <button 
                        type="button"
                        onClick={() => setActiveTab('geral')}
                        className={`flex-1 sm:flex-none px-6 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'geral' ? 'bg-marshall-gold text-white shadow-gold' : 'text-zinc-500 hover:text-white'}`}
                      >
                        IDENTIFICAÇÃO
                      </button>
                      <button 
                        type="button"
                        onClick={() => setActiveTab('financeiro')}
                        className={`flex-1 sm:flex-none px-6 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'financeiro' ? 'bg-marshall-gold text-white shadow-gold' : 'text-zinc-500 hover:text-white'}`}
                      >
                        FINANCEIRO
                      </button>
                    </div>

                    <button 
                      onClick={() => setIsModalOpen(false)} 
                      className="p-2.5 bg-white/5 hover:bg-white/10 rounded-xl text-zinc-400 hover:text-white transition-all hidden sm:flex items-center justify-center"
                    >
                      <X size={18} />
                    </button>
                  </div>
                </div>
              </div>

              <form onSubmit={handleSave} className="flex-1 overflow-hidden flex flex-col">
                <div className="p-4 md:p-5 overflow-y-auto space-y-4 custom-scrollbar">
                  {activeTab === 'geral' ? (
                    <div className="space-y-4 animate-in slide-in-from-bottom-4 duration-500">
                      <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                        <div className="md:col-span-8 space-y-1.5">
                          <label className="text-[9px] font-black uppercase tracking-widest text-zinc-500 block ml-1">Assinatura / Nome Completo</label>
                          <input 
                            type="text" 
                            placeholder="EX: Gabriel Marshall Pereira"
                            value={form.nome}
                            onChange={(e) => setForm({...form, nome: e.target.value})}
                            required
                            className="!h-10"
                          />
                        </div>
                        <div className="md:col-span-4 space-y-1.5">
                          <label className="text-[9px] font-black uppercase tracking-widest text-zinc-500 block ml-1">Doc. (CPF/CNPJ)</label>
                          <input 
                            type="text" 
                            placeholder="000.000.000-00"
                            value={form.documento}
                            onChange={(e) => handleDocChange(e.target.value)}
                            required
                            className="!h-10"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                        <div className={`${form.documento.length > 14 ? 'md:col-span-7' : 'hidden'} space-y-1.5 animate-in fade-in duration-500`}>
                          <label className="text-[9px] font-black uppercase tracking-widest text-marshall-gold block ml-1 flex items-center gap-2">
                            <Briefcase size={12} />
                            Razão Social
                          </label>
                          <input 
                            type="text" 
                            placeholder="EX: Sursum LTDA"
                            value={form.razao_social}
                            onChange={(e) => setForm({...form, razao_social: e.target.value})}
                            className="border-marshall-gold/20 focus:border-marshall-gold !h-10"
                          />
                        </div>
                        <div className={`${form.documento.length > 14 ? 'md:col-span-5' : 'md:col-span-12'} space-y-1.5`}>
                          <label className="text-[9px] font-black uppercase tracking-widest text-zinc-500 block ml-1">Função / Cargo</label>
                          <input 
                            type="text" 
                            placeholder="EX: Desenvolvedor"
                            value={form.cargo}
                            onChange={(e) => setForm({...form, cargo: e.target.value})}
                            className="!h-10"
                          />
                        </div>
                      </div>

                      <div className="pt-6 border-t border-white/5">
                        <h3 className="text-xs font-black text-zinc-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                          <Wallet size={16} className="text-marshall-gold" />
                          Dados de Pagamento (PIX)
                        </h3>
                        <div className="grid grid-cols-1 sm:grid-cols-12 gap-4">
                          <div className="sm:col-span-3">
                            <select 
                              value={form.tipo_chave_pix}
                              onChange={(e) => setForm({...form, tipo_chave_pix: e.target.value, chave_pix: ''})}
                              className="w-full h-[40px] text-left"
                            >
                              {PIX_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                            </select>
                          </div>
                          <div className="sm:col-span-9">
                            <input 
                              type="text" 
                              placeholder="Insira a chave PIX..."
                              value={form.chave_pix}
                              onChange={(e) => handlePIXChange(e.target.value)}
                              className="w-full h-10 text-left"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
                      <div className="p-4 bg-white/[0.02] rounded-2xl border border-white/5 shadow-inner">
                        <div className="space-y-1.5">
                          <label className="text-[9px] font-black uppercase tracking-widest text-zinc-500 flex items-center gap-2 mb-1">
                            <DollarSign size={12} className="text-marshall-gold" />
                            Remuneração Base
                          </label>
                          <div className="relative">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-marshall-gold font-black text-sm">R$</span>
                            <input 
                              type="text" 
                              value={(Number(form.salario_base) || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                              onChange={(e) => {
                                const val = e.target.value.replace(/\D/g, '');
                                const floatVal = parseFloat(val) / 100 || 0;
                                setForm({...form, salario_base: floatVal.toString()});
                              }}
                              required
                              className="!h-12 pl-12 font-black text-lg text-white"
                            />
                          </div>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 block ml-1">Regra de Referência para Fevereiro</label>
                        <div className="grid grid-cols-2 gap-4">
                          <button 
                            type="button"
                            onClick={() => setForm({...form, dias_fevereiro: 30})}
                            className={`h-12 rounded-xl font-black uppercase tracking-widest text-[10px] transition-all border ${form.dias_fevereiro === 30 ? 'bg-marshall-gold text-white border-marshall-gold shadow-gold' : 'bg-white/5 text-zinc-500 border-white/5 hover:bg-white/10'}`}
                          >
                            30 Dias
                          </button>
                          <button 
                            type="button"
                            onClick={() => setForm({...form, dias_fevereiro: 20})}
                            className={`h-12 rounded-xl font-black uppercase tracking-widest text-[10px] transition-all border ${form.dias_fevereiro === 20 ? 'bg-marshall-gold text-white border-marshall-gold shadow-gold' : 'bg-white/5 text-zinc-500 border-white/5 hover:bg-white/10'}`}
                          >
                            20 Dias
                          </button>
                        </div>
                        <p className="text-[10px] text-zinc-600 font-bold uppercase mt-2 px-1">Esta regra será aplicada automaticamente ao detectar Fevereiro na referência.</p>
                      </div>

                       <div className="pt-6 border-t border-white/5 space-y-6">
                        <div className="flex items-center justify-between">
                          <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Lançamentos Adicionais / Sugestões</label>
                          <div className="flex gap-2">
                            {ADICIONAIS_SUGESTOES.slice(0, 2).map(s => (
                              <button 
                                key={s} 
                                type="button" 
                                onClick={() => addAdicional(s)}
                                className="px-3 py-1.5 bg-white/5 rounded-lg text-[10px] font-black text-zinc-500 hover:text-marshall-gold hover:bg-marshall-gold/10 transition-all border border-white/5"
                              >
                                + {s}
                              </button>
                            ))}
                          </div>
                        </div>
                        
                        <div className="space-y-4">
                          {form.adicionais_padrao.map((add, idx) => (
                            <motion.div 
                              layout
                              initial={{ opacity: 0, x: -20 }}
                              animate={{ opacity: 1, x: 0 }}
                              key={idx} 
                              className="flex flex-col sm:flex-row gap-4 sm:items-center p-5 sm:p-6 bg-white/[0.03] rounded-3xl border border-white/5 group/item hover:bg-white/[0.05] transition-all relative"
                            >
                              <div className="flex-1">
                                <label className="text-[9px] font-black text-zinc-600 uppercase mb-1 block">Descrição</label>
                                <input 
                                  placeholder="Ex: Convênio Médico"
                                  value={add.descricao}
                                  onChange={(e) => updateAdicional(idx, 'descricao', e.target.value)}
                                  className="!h-8 border-none !bg-transparent p-0 text-white font-black italic focus:ring-0 placeholder:text-zinc-700 w-full"
                                />
                              </div>
                              <div className="w-full sm:w-36 sm:px-4 sm:border-l border-white/5">
                                <label className="text-[9px] font-black text-zinc-600 uppercase mb-1 block text-left sm:text-right">Valor Mensal</label>
                                <div className="flex items-center justify-start sm:justify-end gap-1">
                                  <span className="text-[10px] font-bold text-marshall-gold/50">R$</span>
                                  <input 
                                    type="text"
                                    value={(add.valor_mensal || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                    onChange={(e) => {
                                      const val = e.target.value.replace(/\D/g, '');
                                      const floatVal = parseFloat(val) / 100 || 0;
                                      updateAdicional(idx, 'valor_mensal', floatVal);
                                    }}
                                    className="!h-8 border-none !bg-transparent p-0 text-left sm:text-right font-black text-marshall-gold focus:ring-0 w-full"
                                  />
                                </div>
                              </div>
                              <button 
                                type="button"
                                onClick={() => removeAdicional(idx)}
                                className="absolute top-4 right-4 sm:relative sm:top-0 sm:right-0 p-3 bg-red-500/10 text-red-500/50 hover:text-red-500 hover:bg-red-500/20 rounded-xl transition-all"
                              >
                                <Trash2 size={18} />
                              </button>
                            </motion.div>
                          ))}
                          <button 
                            type="button" 
                            onClick={() => addAdicional()}
                            className="w-full py-4 rounded-2xl border-2 border-dashed border-white/5 text-[10px] font-black text-zinc-600 uppercase tracking-widest hover:border-marshall-gold/40 hover:text-marshall-gold transition-all"
                          >
                            + Inserir Novo Lançamento Personalizado
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <div className="p-4 md:p-6 bg-black/50 border-t border-white/5 flex gap-3">
                  <button 
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="flex-1 bg-white/[0.03] border border-white/5 text-zinc-400 font-black uppercase tracking-widest hover:text-white transition-all h-10 rounded-xl text-[9px]"
                  >
                    Descartar
                  </button>
                  <button 
                    type="submit" 
                    disabled={isSaving}
                    className="button-primary flex-[1.8] text-xs uppercase tracking-[2px] h-10"
                  >
                    {isSaving ? <Loader2 className="animate-spin" size={18} /> : 'Salvar Alterações'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255, 255, 255, 0.08); border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(219, 170, 61, 0.3); }
      `}</style>
    </DashboardLayout>
  );
}
