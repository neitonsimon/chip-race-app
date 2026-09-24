import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '../../src/lib/supabase';

export interface PokerBusinessLead {
  id: string;
  user_id: string | null;
  name: string;
  company: string | null;
  whatsapp: string;
  email: string | null;
  city: string | null;
  segment: string | null;
  referral_source: string | null;
  status: 'pendente' | 'contatado' | 'confirmado' | 'cancelado';
  notes: string | null;
  created_at: string;
}

interface PokerBusinessTabProps {
  currentUser?: any;
  isAdmin?: boolean;
}

export const PokerBusinessTab: React.FC<PokerBusinessTabProps> = ({ currentUser, isAdmin }) => {
  const [leads, setLeads] = useState<PokerBusinessLead[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pendente' | 'contatado' | 'confirmado' | 'cancelado'>('all');
  const [originFilter, setOriginFilter] = useState<string>('all');
  
  // Modals & Editing
  const [showAddModal, setShowAddModal] = useState(false);
  const [showTemplatesModal, setShowTemplatesModal] = useState(false);
  const [editingNotesLead, setEditingNotesLead] = useState<PokerBusinessLead | null>(null);
  const [notesDraft, setNotesDraft] = useState('');
  const [isSavingNotes, setIsSavingNotes] = useState(false);
  const [actionFeedback, setActionFeedback] = useState<string | null>(null);

  // New lead form
  const [newLead, setNewLead] = useState({
    name: '',
    company: '',
    whatsapp: '',
    city: 'Venâncio Aires',
    segment: '',
    referral_source: 'Cadastrado Manualmente',
    status: 'confirmado' as 'pendente' | 'contatado' | 'confirmado' | 'cancelado',
    notes: ''
  });
  const [isCreatingLead, setIsCreatingLead] = useState(false);

  const fetchLeads = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('poker_business_leads')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Erro ao carregar leads:', error);
      } else {
        setLeads((data as PokerBusinessLead[]) || []);
      }
    } catch (err) {
      console.error('Falha na requisição de leads:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLeads();

    // Subscribe to realtime changes
    const channel = supabase
      .channel('poker_business_leads_changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'poker_business_leads' },
        () => {
          fetchLeads();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const showNotification = (msg: string) => {
    setActionFeedback(msg);
    setTimeout(() => setActionFeedback(null), 3500);
  };

  // Status changer
  const handleUpdateStatus = async (leadId: string, newStatus: 'pendente' | 'contatado' | 'confirmado' | 'cancelado') => {
    try {
      const { error } = await supabase
        .from('poker_business_leads')
        .update({ status: newStatus })
        .eq('id', leadId);

      if (error) throw error;

      setLeads(prev => prev.map(l => l.id === leadId ? { ...l, status: newStatus } : l));
      showNotification(`Status atualizado para "${newStatus.toUpperCase()}" com sucesso!`);
    } catch (err: any) {
      alert('Erro ao atualizar status: ' + err.message);
    }
  };

  // Save Notes
  const handleSaveNotes = async () => {
    if (!editingNotesLead) return;
    setIsSavingNotes(true);
    try {
      const { error } = await supabase
        .from('poker_business_leads')
        .update({ notes: notesDraft.trim() || null })
        .eq('id', editingNotesLead.id);

      if (error) throw error;

      setLeads(prev => prev.map(l => l.id === editingNotesLead.id ? { ...l, notes: notesDraft.trim() || null } : l));
      setEditingNotesLead(null);
      showNotification('Observações salvas com sucesso!');
    } catch (err: any) {
      alert('Erro ao salvar notas: ' + err.message);
    } finally {
      setIsSavingNotes(false);
    }
  };

  // Delete lead
  const handleDeleteLead = async (lead: PokerBusinessLead) => {
    if (!window.confirm(`Tem certeza que deseja remover a solicitação de "${lead.name}"?`)) return;

    try {
      const { error } = await supabase
        .from('poker_business_leads')
        .delete()
        .eq('id', lead.id);

      if (error) throw error;

      setLeads(prev => prev.filter(l => l.id !== lead.id));
      showNotification(`Inscrição de ${lead.name} removida.`);
    } catch (err: any) {
      alert('Erro ao remover: ' + err.message);
    }
  };

  // Create lead manually
  const handleCreateLead = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLead.name.trim() || !newLead.whatsapp.trim()) {
      alert('Preencha os campos obrigatórios: Nome e WhatsApp.');
      return;
    }

    setIsCreatingLead(true);
    try {
      const { data, error } = await supabase
        .from('poker_business_leads')
        .insert({
          user_id: currentUser?.id || null,
          name: newLead.name.trim(),
          company: newLead.company.trim() || null,
          whatsapp: newLead.whatsapp.trim(),
          city: newLead.city.trim() || 'Venâncio Aires',
          segment: newLead.segment.trim() || null,
          referral_source: newLead.referral_source.trim() || null,
          status: newLead.status,
          notes: newLead.notes.trim() || null
        })
        .select()
        .single();

      if (error) throw error;

      if (data) {
        setLeads(prev => [data as PokerBusinessLead, ...prev]);
      }
      setShowAddModal(false);
      setNewLead({
        name: '',
        company: '',
        whatsapp: '',
        city: 'Venâncio Aires',
        segment: '',
        referral_source: 'Cadastrado Manualmente',
        status: 'confirmado',
        notes: ''
      });
      showNotification('Reserva adicionada com sucesso!');
    } catch (err: any) {
      alert('Erro ao adicionar reserva: ' + err.message);
    } finally {
      setIsCreatingLead(false);
    }
  };

  // Export CSV
  const handleExportCSV = () => {
    if (leads.length === 0) {
      alert('Não há dados para exportar.');
      return;
    }

    const headers = ['Data', 'Nome', 'Empresa', 'WhatsApp', 'Cidade', 'Segmento', 'Como Ficou Sabendo', 'Status', 'Observações'];
    const rows = leads.map(l => [
      `"${new Date(l.created_at).toLocaleString('pt-BR')}"`,
      `"${l.name.replace(/"/g, '""')}"`,
      `"${(l.company || '').replace(/"/g, '""')}"`,
      `"${l.whatsapp}"`,
      `"${(l.city || '').replace(/"/g, '""')}"`,
      `"${(l.segment || '').replace(/"/g, '""')}"`,
      `"${(l.referral_source || '').replace(/"/g, '""')}"`,
      `"${l.status.toUpperCase()}"`,
      `"${(l.notes || '').replace(/"/g, '""')}"`
    ]);

    const csvContent = '\uFEFF' + [headers.join(';'), ...rows.map(r => r.join(';'))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Poker_Business_Reservas_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // WhatsApp quick helper
  const openWhatsAppForLead = (lead: PokerBusinessLead) => {
    let clean = lead.whatsapp.replace(/\D/g, '');
    if (!clean.startsWith('55') && clean.length >= 10) {
      clean = '55' + clean;
    }
    const text = encodeURIComponent(
      `Olá ${lead.name}, tudo bem? Sou da organização do 1º POKER BUSINESS (Chip Race).\n\n` +
      `Recebemos a sua solicitação de participação para o evento no dia 21 de Outubro, no Varanda em Venâncio Aires.\n\n` +
      `Gostaria de confirmar os detalhes da sua vaga? Estamos à disposição!`
    );
    window.open(`https://wa.me/${clean}?text=${text}`, '_blank');
  };

  // Filtered Leads
  const filteredLeads = useMemo(() => {
    return leads.filter(lead => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch = !q || (
        lead.name.toLowerCase().includes(q) ||
        (lead.company && lead.company.toLowerCase().includes(q)) ||
        lead.whatsapp.toLowerCase().includes(q) ||
        (lead.city && lead.city.toLowerCase().includes(q)) ||
        (lead.segment && lead.segment.toLowerCase().includes(q)) ||
        (lead.referral_source && lead.referral_source.toLowerCase().includes(q))
      );

      const matchesStatus = statusFilter === 'all' || lead.status === statusFilter;
      const matchesOrigin = originFilter === 'all' || lead.referral_source === originFilter;

      return matchesSearch && matchesStatus && matchesOrigin;
    });
  }, [leads, searchQuery, statusFilter, originFilter]);

  // Counters
  const counts = useMemo(() => {
    const total = leads.length;
    const pendente = leads.filter(l => l.status === 'pendente').length;
    const contatado = leads.filter(l => l.status === 'contatado').length;
    const confirmado = leads.filter(l => l.status === 'confirmado').length;
    const cancelado = leads.filter(l => l.status === 'cancelado').length;
    const maxCapacity = 50;
    const percentConfirmed = Math.min(100, Math.round((confirmado / maxCapacity) * 100));

    return { total, pendente, contatado, confirmado, cancelado, maxCapacity, percentConfirmed };
  }, [leads]);

  // Unique origins for filter
  const origins = useMemo(() => {
    const set = new Set<string>();
    leads.forEach(l => {
      if (l.referral_source) set.add(l.referral_source);
    });
    return Array.from(set);
  }, [leads]);

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto">
      {/* Toast Feedback */}
      {actionFeedback && (
        <div className="fixed top-6 right-6 z-50 bg-[#16120a] border border-[#d4af37] text-[#f7e2a9] px-5 py-3 rounded-2xl shadow-[0_0_30px_rgba(212,175,55,0.4)] flex items-center gap-3 animate-in slide-in-from-top-4">
          <span className="material-icons-outlined text-emerald-400">check_circle</span>
          <span className="text-xs font-bold font-mono">{actionFeedback}</span>
        </div>
      )}

      {/* Top Header Card */}
      <div className="bg-gradient-to-r from-[#0d1017] via-[#141a24] to-[#0a0d14] rounded-3xl p-6 border border-[#d4af37]/35 shadow-[0_10px_35px_rgba(0,0,0,0.5)]">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <span className="px-2.5 py-1 rounded-lg bg-[#d4af37]/15 border border-[#d4af37]/40 text-[#f7e2a9] font-mono text-[10px] font-bold uppercase tracking-widest">
                Gestão de Evento
              </span>
              <span className="text-xs font-mono text-gray-400 flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                Sincronização em tempo real
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-display font-black text-white uppercase tracking-wider flex items-center gap-2">
              1º POKER <span className="bg-gradient-to-r from-[#FFF5D0] via-[#E8C15A] to-[#94711D] bg-clip-text text-transparent">BUSINESS</span>
            </h1>
            <p className="text-xs sm:text-sm font-mono text-gray-300">
              21 de Outubro de 2026 • Varanda (Venâncio Aires — RS) • Restrito a 50 convidados
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={fetchLeads}
              disabled={isLoading}
              className="px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-gray-200 text-xs font-mono flex items-center gap-1.5 transition-all cursor-pointer"
              title="Recarregar lista"
            >
              <span className={`material-icons-outlined text-sm ${isLoading ? 'animate-spin' : ''}`}>sync</span>
              <span>Atualizar</span>
            </button>

            <button
              onClick={() => setShowTemplatesModal(true)}
              className="px-3.5 py-2 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-xs font-mono font-bold flex items-center gap-1.5 transition-all cursor-pointer"
              title="Copiar modelos de mensagens no WhatsApp"
            >
              <span className="material-icons-outlined text-sm">chat</span>
              <span>Modelos WhatsApp</span>
            </button>

            <button
              onClick={handleExportCSV}
              className="px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-gray-200 text-xs font-mono flex items-center gap-1.5 transition-all cursor-pointer"
              title="Exportar planilha CSV"
            >
              <span className="material-icons-outlined text-sm">download</span>
              <span>Exportar CSV</span>
            </button>

            <button
              onClick={() => setShowAddModal(true)}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#d4af37] via-[#f7e2a9] to-[#b88f28] text-black text-xs font-display font-bold uppercase tracking-wider flex items-center gap-1.5 shadow-[0_0_20px_rgba(212,175,55,0.3)] hover:scale-105 transition-all cursor-pointer"
            >
              <span className="material-icons-outlined text-sm font-bold">add</span>
              <span>Nova Reserva</span>
            </button>
          </div>
        </div>

        {/* Capacity Progress Bar */}
        <div className="mt-6 pt-5 border-t border-white/10">
          <div className="flex items-center justify-between text-xs font-mono mb-2">
            <span className="text-gray-300 flex items-center gap-1.5">
              <span className="material-icons-outlined text-sm text-[#d4af37]">groups</span>
              Ocupação do Evento: <strong className="text-white">{counts.confirmado} de {counts.maxCapacity} confirmados</strong>
            </span>
            <span className="text-[#f7e2a9] font-bold">
              {counts.percentConfirmed}% preenchido ({counts.maxCapacity - counts.confirmado} vagas restantes)
            </span>
          </div>
          <div className="w-full h-3 bg-black/50 rounded-full overflow-hidden border border-white/10 relative">
            <div
              className="h-full bg-gradient-to-r from-[#b88f28] via-[#d4af37] to-emerald-400 transition-all duration-700 rounded-full shadow-[0_0_15px_rgba(212,175,55,0.5)]"
              style={{ width: `${counts.percentConfirmed}%` }}
            />
          </div>
        </div>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {/* Total */}
        <div 
          onClick={() => setStatusFilter('all')}
          className={`p-4 rounded-2xl border transition-all cursor-pointer ${statusFilter === 'all' ? 'bg-[#181d2a] border-[#d4af37] shadow-[0_0_20px_rgba(212,175,55,0.2)]' : 'bg-[#0d1017]/80 border-white/5 hover:border-white/20'}`}
        >
          <span className="text-[10px] font-mono uppercase tracking-wider text-gray-400 block mb-1">
            Total Solicitações
          </span>
          <div className="text-2xl sm:text-3xl font-display font-black text-white">
            {counts.total}
          </div>
          <span className="text-[10px] text-gray-500 font-mono mt-1 block">Inscrições recebidas</span>
        </div>

        {/* Pendentes */}
        <div 
          onClick={() => setStatusFilter('pendente')}
          className={`p-4 rounded-2xl border transition-all cursor-pointer ${statusFilter === 'pendente' ? 'bg-[#2a2414] border-amber-500 shadow-[0_0_20px_rgba(245,158,11,0.2)]' : 'bg-[#0d1017]/80 border-white/5 hover:border-white/20'}`}
        >
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] font-mono uppercase tracking-wider text-amber-400 block">
              Pendentes
            </span>
            {counts.pendente > 0 && (
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse"></span>
            )}
          </div>
          <div className="text-2xl sm:text-3xl font-display font-black text-amber-300">
            {counts.pendente}
          </div>
          <span className="text-[10px] text-gray-500 font-mono mt-1 block">Aguardando contato</span>
        </div>

        {/* Contatados */}
        <div 
          onClick={() => setStatusFilter('contatado')}
          className={`p-4 rounded-2xl border transition-all cursor-pointer ${statusFilter === 'contatado' ? 'bg-[#162338] border-blue-500 shadow-[0_0_20px_rgba(59,130,246,0.2)]' : 'bg-[#0d1017]/80 border-white/5 hover:border-white/20'}`}
        >
          <span className="text-[10px] font-mono uppercase tracking-wider text-blue-400 block mb-1">
            Contatados
          </span>
          <div className="text-2xl sm:text-3xl font-display font-black text-blue-300">
            {counts.contatado}
          </div>
          <span className="text-[10px] text-gray-500 font-mono mt-1 block">Em negociação</span>
        </div>

        {/* Confirmados */}
        <div 
          onClick={() => setStatusFilter('confirmado')}
          className={`p-4 rounded-2xl border transition-all cursor-pointer ${statusFilter === 'confirmado' ? 'bg-[#132c22] border-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.2)]' : 'bg-[#0d1017]/80 border-white/5 hover:border-white/20'}`}
        >
          <span className="text-[10px] font-mono uppercase tracking-wider text-emerald-400 block mb-1">
            Confirmados
          </span>
          <div className="text-2xl sm:text-3xl font-display font-black text-emerald-300">
            {counts.confirmado}
          </div>
          <span className="text-[10px] text-gray-500 font-mono mt-1 block">Vagas garantidas</span>
        </div>

        {/* Cancelados */}
        <div 
          onClick={() => setStatusFilter('cancelado')}
          className={`p-4 rounded-2xl border transition-all cursor-pointer ${statusFilter === 'cancelado' ? 'bg-[#29171b] border-rose-500 shadow-[0_0_20px_rgba(244,63,94,0.2)]' : 'bg-[#0d1017]/80 border-white/5 hover:border-white/20'}`}
        >
          <span className="text-[10px] font-mono uppercase tracking-wider text-rose-400 block mb-1">
            Cancelados
          </span>
          <div className="text-2xl sm:text-3xl font-display font-black text-rose-300">
            {counts.cancelado}
          </div>
          <span className="text-[10px] text-gray-500 font-mono mt-1 block">Desistências / Não</span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-[#0d1017] p-3 rounded-2xl border border-white/10">
        {/* Search */}
        <div className="relative flex-1">
          <span className="material-icons-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">
            search
          </span>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar por nome, empresa, whatsapp, cidade ou segmento..."
            className="w-full bg-black/40 border border-white/10 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-[#d4af37] transition-colors"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
            >
              <span className="material-icons-outlined text-sm">close</span>
            </button>
          )}
        </div>

        {/* Status Filter */}
        <div className="flex items-center gap-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-xs text-gray-300 focus:outline-none focus:border-[#d4af37]"
          >
            <option value="all">Todos os Status</option>
            <option value="pendente">Apenas Pendentes</option>
            <option value="contatado">Apenas Contatados</option>
            <option value="confirmado">Apenas Confirmados</option>
            <option value="cancelado">Apenas Cancelados</option>
          </select>

          {origins.length > 0 && (
            <select
              value={originFilter}
              onChange={(e) => setOriginFilter(e.target.value)}
              className="bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-xs text-gray-300 focus:outline-none focus:border-[#d4af37]"
            >
              <option value="all">Todas as Origens</option>
              {origins.map(orig => (
                <option key={orig} value={orig}>{orig}</option>
              ))}
            </select>
          )}
        </div>
      </div>

      {/* Leads List / Table */}
      <div className="bg-[#0b0e15] border border-white/10 rounded-2xl overflow-hidden shadow-2xl">
        {isLoading ? (
          <div className="py-20 text-center space-y-3">
            <div className="w-8 h-8 rounded-full border-2 border-[#d4af37] border-t-transparent animate-spin mx-auto"></div>
            <p className="text-xs font-mono text-gray-400">Carregando solicitações do Poker Business...</p>
          </div>
        ) : filteredLeads.length === 0 ? (
          <div className="py-16 text-center space-y-2">
            <span className="material-icons-outlined text-4xl text-gray-600">inbox</span>
            <p className="text-sm font-semibold text-gray-300">Nenhuma solicitação encontrada</p>
            <p className="text-xs text-gray-500 font-mono">
              {searchQuery || statusFilter !== 'all' || originFilter !== 'all'
                ? 'Tente ajustar os filtros ou termo de busca.'
                : 'As inscrições enviadas pelo site aparecerão aqui automaticamente.'}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-white/5">
            {filteredLeads.map((lead) => {
              const formattedDate = new Date(lead.created_at).toLocaleString('pt-BR', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              });

              const statusBadgeStyles = {
                pendente: 'bg-amber-500/15 border-amber-500/40 text-amber-300',
                contatado: 'bg-blue-500/15 border-blue-500/40 text-blue-300',
                confirmado: 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300',
                cancelado: 'bg-rose-500/15 border-rose-500/40 text-rose-300'
              }[lead.status];

              return (
                <div 
                  key={lead.id}
                  className="p-4 sm:p-5 hover:bg-white/[0.02] transition-colors flex flex-col lg:flex-row lg:items-center justify-between gap-4"
                >
                  {/* Lead Info */}
                  <div className="flex items-start gap-3.5 flex-1 min-w-0">
                    <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#d4af37]/20 to-[#94711d]/20 border border-[#d4af37]/40 flex items-center justify-center text-[#f7e2a9] font-display font-black text-sm shrink-0 shadow-[0_0_12px_rgba(212,175,55,0.15)]">
                      {lead.name.charAt(0).toUpperCase()}
                    </div>

                    <div className="space-y-1 min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-display font-bold text-sm sm:text-base text-white truncate">
                          {lead.name}
                        </span>
                        
                        {/* Status selector */}
                        <div className="relative inline-block">
                          <select
                            value={lead.status}
                            onChange={(e) => handleUpdateStatus(lead.id, e.target.value as any)}
                            className={`text-[10px] font-mono font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-lg border focus:outline-none cursor-pointer ${statusBadgeStyles}`}
                          >
                            <option value="pendente" className="bg-[#12151e] text-amber-300">Pendente</option>
                            <option value="contatado" className="bg-[#12151e] text-blue-300">Contatado</option>
                            <option value="confirmado" className="bg-[#12151e] text-emerald-300">Confirmado</option>
                            <option value="cancelado" className="bg-[#12151e] text-rose-300">Cancelado</option>
                          </select>
                        </div>

                        <span className="text-[10px] font-mono text-gray-500">
                          {formattedDate}
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-300">
                        {lead.company && (
                          <div className="flex items-center gap-1 text-gray-200 font-medium">
                            <span className="material-icons-outlined text-xs text-[#d4af37]">business</span>
                            <span>{lead.company}</span>
                          </div>
                        )}
                        {lead.segment && (
                          <div className="flex items-center gap-1 text-gray-400">
                            <span className="material-icons-outlined text-xs text-gray-500">category</span>
                            <span>{lead.segment}</span>
                          </div>
                        )}
                        {lead.city && (
                          <div className="flex items-center gap-1 text-gray-400">
                            <span className="material-icons-outlined text-xs text-gray-500">place</span>
                            <span>{lead.city}</span>
                          </div>
                        )}
                        {lead.referral_source && (
                          <div className="flex items-center gap-1 text-[11px] font-mono px-2 py-0.5 rounded bg-white/5 text-gray-400 border border-white/5">
                            <span className="text-gray-500">Origem:</span> {lead.referral_source}
                          </div>
                        )}
                      </div>

                      {/* Notes Preview */}
                      {lead.notes && (
                        <div className="mt-1.5 p-2 rounded-xl bg-black/40 border border-white/5 text-xs text-amber-200/90 font-mono flex items-start gap-1.5 max-w-xl">
                          <span className="material-icons-outlined text-xs text-amber-400 mt-0.5 shrink-0">edit_note</span>
                          <span className="italic leading-relaxed">{lead.notes}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actions Bar */}
                  <div className="flex items-center gap-2 self-end lg:self-center shrink-0 pt-2 lg:pt-0">
                    {/* WhatsApp Action */}
                    <button
                      onClick={() => openWhatsAppForLead(lead)}
                      className="px-3 py-1.5 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/35 text-emerald-300 text-xs font-mono font-bold flex items-center gap-1.5 transition-all shadow-[0_0_15px_rgba(16,185,129,0.15)] cursor-pointer"
                      title="Abrir WhatsApp com mensagem pré-formatada"
                    >
                      <span className="material-icons-outlined text-sm text-emerald-400">chat</span>
                      <span>{lead.whatsapp}</span>
                    </button>

                    {/* Copy Phone */}
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(lead.whatsapp);
                        showNotification(`Número ${lead.whatsapp} copiado!`);
                      }}
                      className="p-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white border border-white/5 transition-all cursor-pointer"
                      title="Copiar número de telefone"
                    >
                      <span className="material-icons-outlined text-sm">content_copy</span>
                    </button>

                    {/* Notes button */}
                    <button
                      onClick={() => {
                        setEditingNotesLead(lead);
                        setNotesDraft(lead.notes || '');
                      }}
                      className="px-2.5 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white border border-white/5 text-xs font-mono flex items-center gap-1 transition-all cursor-pointer"
                      title="Adicionar ou editar anotação interna"
                    >
                      <span className="material-icons-outlined text-sm text-[#d4af37]">note_alt</span>
                      <span className="hidden sm:inline">Notas</span>
                    </button>

                    {/* Delete button */}
                    <button
                      onClick={() => handleDeleteLead(lead)}
                      className="p-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 hover:text-rose-300 border border-rose-500/20 transition-all cursor-pointer"
                      title="Excluir lead"
                    >
                      <span className="material-icons-outlined text-sm">delete_outline</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal: Editar Anotações */}
      {editingNotesLead && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0e121a] border border-[#d4af37]/40 rounded-3xl p-6 max-w-lg w-full shadow-[0_0_50px_rgba(0,0,0,0.9)] animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <span className="material-icons-outlined text-[#d4af37]">edit_note</span>
                <h3 className="font-display font-bold text-base text-white uppercase tracking-wider">
                  Notas Internas: {editingNotesLead.name}
                </h3>
              </div>
              <button
                onClick={() => setEditingNotesLead(null)}
                className="text-gray-400 hover:text-white"
              >
                <span className="material-icons-outlined">close</span>
              </button>
            </div>

            <p className="text-xs text-gray-400 font-mono mb-3">
              Insira detalhes como preferências, contatos realizados, confirmação de acompanhante ou detalhes de pagamento:
            </p>

            <textarea
              rows={4}
              value={notesDraft}
              onChange={(e) => setNotesDraft(e.target.value)}
              placeholder="Ex: Ligado em 22/09. Confirmou presença com sócio. PIX enviado via WhatsApp..."
              className="w-full bg-black/50 border border-white/10 focus:border-[#d4af37] rounded-xl p-3 text-xs text-white placeholder-gray-600 focus:outline-none transition-colors"
            />

            <div className="flex items-center justify-end gap-2.5 mt-4">
              <button
                onClick={() => setEditingNotesLead(null)}
                className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 text-xs font-mono transition-all"
              >
                Cancelar
              </button>
              <button
                onClick={handleSaveNotes}
                disabled={isSavingNotes}
                className="px-5 py-2 rounded-xl bg-gradient-to-r from-[#d4af37] to-[#b88f28] text-black text-xs font-display font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all"
              >
                {isSavingNotes ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
                    <span>Salvando...</span>
                  </>
                ) : (
                  <span>Salvar Notas</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Nova Reserva Manual */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0e121a] border border-[#d4af37]/40 rounded-3xl p-6 max-w-lg w-full shadow-[0_0_50px_rgba(0,0,0,0.9)] animate-in fade-in zoom-in-95 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <span className="material-icons-outlined text-[#d4af37]">person_add</span>
                <h3 className="font-display font-bold text-base text-white uppercase tracking-wider">
                  Adicionar Reserva Manual
                </h3>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-gray-400 hover:text-white"
              >
                <span className="material-icons-outlined">close</span>
              </button>
            </div>

            <form onSubmit={handleCreateLead} className="space-y-3.5">
              <div>
                <label className="block text-[11px] font-mono uppercase text-gray-400 mb-1">
                  Nome Completo *
                </label>
                <input
                  type="text"
                  required
                  value={newLead.name}
                  onChange={(e) => setNewLead(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Nome do convidado / empresário"
                  className="w-full bg-black/50 border border-white/10 focus:border-[#d4af37] rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-gray-600 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-mono uppercase text-gray-400 mb-1">
                    WhatsApp *
                  </label>
                  <input
                    type="text"
                    required
                    value={newLead.whatsapp}
                    onChange={(e) => setNewLead(prev => ({ ...prev, whatsapp: e.target.value }))}
                    placeholder="(51) 99999-9999"
                    className="w-full bg-black/50 border border-white/10 focus:border-[#d4af37] rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-gray-600 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-mono uppercase text-gray-400 mb-1">
                    Empresa
                  </label>
                  <input
                    type="text"
                    value={newLead.company}
                    onChange={(e) => setNewLead(prev => ({ ...prev, company: e.target.value }))}
                    placeholder="Empresa ou Organização"
                    className="w-full bg-black/50 border border-white/10 focus:border-[#d4af37] rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-gray-600 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-mono uppercase text-gray-400 mb-1">
                    Cidade
                  </label>
                  <input
                    type="text"
                    value={newLead.city}
                    onChange={(e) => setNewLead(prev => ({ ...prev, city: e.target.value }))}
                    placeholder="Venâncio Aires"
                    className="w-full bg-black/50 border border-white/10 focus:border-[#d4af37] rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-gray-600 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-mono uppercase text-gray-400 mb-1">
                    Segmento
                  </label>
                  <input
                    type="text"
                    value={newLead.segment}
                    onChange={(e) => setNewLead(prev => ({ ...prev, segment: e.target.value }))}
                    placeholder="Ex: Indústria, Serviços..."
                    className="w-full bg-black/50 border border-white/10 focus:border-[#d4af37] rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-gray-600 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-mono uppercase text-gray-400 mb-1">
                    Status Inicial
                  </label>
                  <select
                    value={newLead.status}
                    onChange={(e) => setNewLead(prev => ({ ...prev, status: e.target.value as any }))}
                    className="w-full bg-black/50 border border-white/10 focus:border-[#d4af37] rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none"
                  >
                    <option value="confirmado">Confirmado (Garantida)</option>
                    <option value="pendente">Pendente</option>
                    <option value="contatado">Contatado</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-mono uppercase text-gray-400 mb-1">
                    Origem / Canal
                  </label>
                  <input
                    type="text"
                    value={newLead.referral_source}
                    onChange={(e) => setNewLead(prev => ({ ...prev, referral_source: e.target.value }))}
                    placeholder="Ex: Convite direto, Indicação..."
                    className="w-full bg-black/50 border border-white/10 focus:border-[#d4af37] rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-gray-600 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-mono uppercase text-gray-400 mb-1">
                  Observações Iniciais
                </label>
                <textarea
                  rows={2}
                  value={newLead.notes}
                  onChange={(e) => setNewLead(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder="Anotações opcionais..."
                  className="w-full bg-black/50 border border-white/10 focus:border-[#d4af37] rounded-xl p-2.5 text-xs text-white placeholder-gray-600 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 text-xs font-mono transition-all"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isCreatingLead}
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-[#d4af37] to-[#b88f28] text-black text-xs font-display font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all"
                >
                  {isCreatingLead ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
                      <span>Salvando...</span>
                    </>
                  ) : (
                    <span>Cadastrar Reserva</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Modelos de Mensagem WhatsApp */}
      {showTemplatesModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0e121a] border border-[#d4af37]/40 rounded-3xl p-6 max-w-xl w-full shadow-[0_0_50px_rgba(0,0,0,0.9)] animate-in fade-in zoom-in-95 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <span className="material-icons-outlined text-emerald-400">chat</span>
                <h3 className="font-display font-bold text-base text-white uppercase tracking-wider">
                  Modelos de Resposta WhatsApp
                </h3>
              </div>
              <button
                onClick={() => setShowTemplatesModal(false)}
                className="text-gray-400 hover:text-white"
              >
                <span className="material-icons-outlined">close</span>
              </button>
            </div>

            <p className="text-xs text-gray-400 font-mono mb-4">
              Clique em "Copiar" para colar diretamente na conversa com o empresário / participante:
            </p>

            <div className="space-y-4">
              {/* Template 1 */}
              <div className="p-4 rounded-2xl bg-black/40 border border-white/10 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-bold text-emerald-400">
                    1. Primeiro Contato e Confirmação de Interesse
                  </span>
                  <button
                    onClick={() => {
                      const text = `Olá! Tudo bem? Sou da organização do 1º POKER BUSINESS da CHIP RACE.\n\nRecebemos sua solicitação de participação para o nosso encontro exclusivo no dia 21 de Outubro, no Varanda em Venâncio Aires.\n\nO evento será restrito a 50 convidados, reunindo empresários e líderes da região em uma noite all-inclusive com poker recreativo, jantar e excelente networking.\n\nPodemos confirmar a sua reserva na lista oficial?`;
                      navigator.clipboard.writeText(text);
                      showNotification('Template 1 copiado!');
                    }}
                    className="text-[10px] font-mono px-2.5 py-1 rounded bg-white/10 hover:bg-white/20 text-white flex items-center gap-1 transition-all"
                  >
                    <span className="material-icons-outlined text-xs">content_copy</span> Copiar
                  </button>
                </div>
                <p className="text-xs text-gray-300 leading-relaxed font-mono whitespace-pre-line">
                  {`Olá! Tudo bem? Sou da organização do 1º POKER BUSINESS da CHIP RACE.\n\nRecebemos sua solicitação de participação para o nosso encontro exclusivo no dia 21 de Outubro, no Varanda em Venâncio Aires.\n\nO evento será restrito a 50 convidados, reunindo empresários e líderes da região em uma noite all-inclusive com poker recreativo, jantar e excelente networking.\n\nPodemos confirmar a sua reserva na lista oficial?`}
                </p>
              </div>

              {/* Template 2 */}
              <div className="p-4 rounded-2xl bg-black/40 border border-white/10 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-bold text-amber-400">
                    2. Dados de Pagamento (R$ 300)
                  </span>
                  <button
                    onClick={() => {
                      const text = `Perfeito! Sua vaga no 1º POKER BUSINESS foi pré-reservada.\n\nDetalhes da Experiência:\n• Data: 21 de Outubro de 2026\n• Local: Varanda • Venâncio Aires — RS\n• Valor: R$ 300 (All-Inclusive: Jantar + Bebidas + Torneio e Fichas de Poker)\n\nPara garantir definitivamente seu nome entre os 50 convidados, favor efetuar o pagamento via PIX:\nChave PIX: [CHAVE AQUI]\n\nAssim que realizar, nos envie o comprovante por aqui. Seja muito bem-vindo!`;
                      navigator.clipboard.writeText(text);
                      showNotification('Template 2 copiado!');
                    }}
                    className="text-[10px] font-mono px-2.5 py-1 rounded bg-white/10 hover:bg-white/20 text-white flex items-center gap-1 transition-all"
                  >
                    <span className="material-icons-outlined text-xs">content_copy</span> Copiar
                  </button>
                </div>
                <p className="text-xs text-gray-300 leading-relaxed font-mono whitespace-pre-line">
                  {`Perfeito! Sua vaga no 1º POKER BUSINESS foi pré-reservada.\n\nDetalhes da Experiência:\n• Data: 21 de Outubro de 2026\n• Local: Varanda • Venâncio Aires — RS\n• Valor: R$ 300 (All-Inclusive: Jantar + Bebidas + Torneio e Fichas de Poker)\n\nPara garantir definitivamente seu nome entre os 50 convidados, favor efetuar o pagamento via PIX:\nChave PIX: [CHAVE AQUI]\n\nAssim que realizar, nos envie o comprovante por aqui. Seja muito bem-vindo!`}
                </p>
              </div>

              {/* Template 3 */}
              <div className="p-4 rounded-2xl bg-black/40 border border-white/10 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-bold text-blue-400">
                    3. Lembrete & Instruções para Iniciantes
                  </span>
                  <button
                    onClick={() => {
                      const text = `Olá! Lembrando que o 1º POKER BUSINESS está chegando!\n\nLembramos que não é necessário ter experiência prévia com poker. Teremos uma breve introdução descontraída às regras no início da noite para que todos se divirtam ao máximo.\n\nQualquer dúvida, estamos à disposição pelo WhatsApp (51) 99242-5186. Nos vemos à mesa!`;
                      navigator.clipboard.writeText(text);
                      showNotification('Template 3 copiado!');
                    }}
                    className="text-[10px] font-mono px-2.5 py-1 rounded bg-white/10 hover:bg-white/20 text-white flex items-center gap-1 transition-all"
                  >
                    <span className="material-icons-outlined text-xs">content_copy</span> Copiar
                  </button>
                </div>
                <p className="text-xs text-gray-300 leading-relaxed font-mono whitespace-pre-line">
                  {`Olá! Lembrando que o 1º POKER BUSINESS está chegando!\n\nLembramos que não é necessário ter experiência prévia com poker. Teremos uma breve introdução descontraída às regras no início da noite para que todos se divirtam ao máximo.\n\nQualquer dúvida, estamos à disposição pelo WhatsApp (51) 99242-5186. Nos vemos à mesa!`}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
