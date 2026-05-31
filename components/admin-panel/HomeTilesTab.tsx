import React, { useState } from 'react';
import { useApp } from '../../contexts/AppContext';
import { TournamentCategory } from '../../types';
import { supabase } from '../../src/lib/supabase';

export const HomeTilesTab: React.FC = () => {
  const { contentDB, updateCategory, addCategory, deleteCategory } = useApp();
  const categories = contentDB?.categories || [];

  // Estados locais para formulário
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<TournamentCategory | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  // Form state
  const [form, setForm] = useState({
    id: '',
    title: '',
    description: '',
    icon: 'star',
    color: 'primary',
    slots: 0,
    order: 0,
    col_span: 1,
    row_span: 1,
    target_view: 'home',
    button_text: 'VER MAIS',
    is_mystery: false,
    is_hidden: false,
    background_url: '',
    icon_url: ''
  });

  const [isUploadingBg, setIsUploadingBg] = useState(false);
  const [isUploadingIcon, setIsUploadingIcon] = useState(false);

  const handleUploadFile = async (e: React.ChangeEvent<HTMLInputElement>, type: 'bg' | 'icon') => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (type === 'icon' && file.type !== 'image/png') {
      alert('Por favor, envie apenas arquivos PNG para o ícone.');
      return;
    }

    const setUploading = type === 'bg' ? setIsUploadingBg : setIsUploadingIcon;
    setUploading(true);

    try {
      const fileExt = file.name.split('.').pop() || 'png';
      const fileName = `categories/${type}_${Date.now()}_${Math.random().toString(36).substring(2, 8)}.${fileExt}`;

      const { data, error } = await supabase.storage
        .from('avatars')
        .upload(fileName, file, { upsert: true });

      if (error) throw error;

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(data.path);

      if (type === 'bg') {
        setForm(prev => ({ ...prev, background_url: publicUrl }));
      } else {
        setForm(prev => ({ ...prev, icon_url: publicUrl }));
      }
      alert('Arquivo enviado com sucesso!');
    } catch (err: any) {
      console.error(err);
      alert('Erro ao enviar arquivo: ' + err.message);
    } finally {
      setUploading(false);
    }
  };

  // Ícones sugeridos para seleção rápida
  const PRESET_ICONS = [
    { name: 'diamond', label: 'VIP/Brilhante' },
    { name: 'leaderboard', label: 'Ranking/Troféu' },
    { name: 'local_bar', label: 'Bar/Bebidas' },
    { name: 'sports_esports', label: 'Controle/Gaming' },
    { name: 'local_fire_department', label: 'Fogo/Bet' },
    { name: 'local_activity', label: 'Ticket/Jackpot' },
    { name: 'groups', label: 'Grupos/Social' },
    { name: 'auto_awesome', label: 'Estrela/Especial' },
    { name: 'account_balance_wallet', label: 'Carteira/Fichas' },
    { name: 'confirmation_number', label: 'Cupom/Satélite' },
    { name: 'redeem', label: 'Presente/Missão' },
    { name: 'bar_chart', label: 'Gráfico/Estatística' },
    { name: 'apps', label: 'Menu/Diversos' },
    { name: 'help_outline', label: 'Ajuda/FAQ' },
    { name: 'calendar_today', label: 'Calendário' },
    { name: 'person', label: 'Usuário/Perfil' },
    { name: 'payment', label: 'Pagamento/PIX' }
  ];

  // Cores sugeridas
  const COLOR_OPTIONS = [
    { value: 'primary', label: 'Rosa Cyber (Pink)' },
    { value: 'secondary', label: 'Azul Choque' },
    { value: 'cyan', label: 'Ciano Claro' },
    { value: 'pink', label: 'Hot Pink' },
    { value: 'amber', label: 'Neon Ouro/Amarelo' },
    { value: 'emerald', label: 'Verde Esmeralda' },
    { value: 'blue', label: 'Azul Real' },
    { value: 'orange', label: 'Laranja Cyber' },
    { value: 'purple', label: 'Roxo Pulsante' },
    { value: 'red', label: 'Vermelho Laser' }
  ];

  // Views sugeridas
  const VIEW_OPTIONS = [
    { value: 'home', label: 'Home (Início)' },
    { value: 'vip', label: 'Área VIP' },
    { value: 'bet', label: 'Página de Bets' },
    { value: 'online-credits', label: 'Créditos Online Suprema' },
    { value: 'calendar', label: 'Calendário de Eventos' },
    { value: 'ranking', label: 'Tabela de Rankings' },
    { value: 'profile', label: 'Perfil do Jogador' },
    { value: 'recarga', label: 'Recargas & Depósitos' },
    { value: 'faq', label: 'Sessão de FAQ (Scroll suave)' }
  ];

  const handleOpenAdd = () => {
    setIsEditing(false);
    setEditingCategory(null);
    setForm({
      id: '',
      title: '',
      description: '',
      icon: 'star',
      color: 'primary',
      slots: 0,
      order: categories.length + 1,
      col_span: 1,
      row_span: 1,
      target_view: 'home',
      button_text: 'VER MAIS',
      is_mystery: false,
      is_hidden: false,
      background_url: '',
      icon_url: ''
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (cat: TournamentCategory) => {
    setIsEditing(true);
    setEditingCategory(cat);
    setForm({
      id: cat.id,
      title: cat.title,
      description: cat.description,
      icon: cat.icon || 'star',
      color: cat.color || 'primary',
      slots: cat.slots || 0,
      order: cat.order || 0,
      col_span: cat.col_span || 1,
      row_span: cat.row_span || 1,
      target_view: cat.target_view || 'home',
      button_text: cat.button_text || 'VER MAIS',
      is_mystery: cat.is_mystery || false,
      is_hidden: cat.is_hidden || false,
      background_url: cat.background_url || '',
      icon_url: cat.icon_url || ''
    });
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.id || !form.title) {
      alert('Preencha os campos obrigatórios (ID e Título).');
      return;
    }

    try {
      const categoryData: TournamentCategory = {
        id: form.id.trim(),
        title: form.title.trim(),
        description: form.description.trim(),
        icon: form.icon,
        color: form.color as any,
        slots: Number(form.slots),
        order: Number(form.order),
        col_span: Number(form.col_span),
        row_span: Number(form.row_span),
        target_view: form.target_view,
        button_text: form.button_text.trim(),
        is_mystery: form.is_mystery,
        is_hidden: form.is_hidden,
        background_url: form.background_url.trim() || undefined,
        icon_url: form.icon_url.trim() || undefined
      };

      if (isEditing && editingCategory) {
        // Encontra o index correspondente
        const index = categories.findIndex(c => c.id === editingCategory.id);
        if (index !== -1) {
          await updateCategory(index, categoryData);
          alert('Caixa da Home atualizada com sucesso!');
        }
      } else {
        // Validação se o ID já existe
        if (categories.some(c => c.id === categoryData.id)) {
          alert('Já existe uma caixa com este ID!');
          return;
        }
        if (addCategory) {
          await addCategory(categoryData);
          alert('Nova caixa inserida com sucesso!');
        }
      }

      setIsModalOpen(false);
    } catch (err: any) {
      console.error(err);
      alert('Erro ao salvar caixa: ' + err.message);
    }
  };

  const handleDelete = async (cat: TournamentCategory) => {
    if (!window.confirm(`Tem certeza de que deseja remover permanentemente a caixa "${cat.title}"? Esta ação não pode ser desfeita e afetará o mosaico da home page.`)) return;

    try {
      if (deleteCategory) {
        await deleteCategory(cat.id);
        alert('Caixa removida com sucesso!');
      }
    } catch (err: any) {
      console.error(err);
      alert('Erro ao remover caixa: ' + err.message);
    }
  };

  // Cores de texto rápidas para exibição na tabela
  const getTextGlowColor = (colorName: string) => {
    switch (colorName) {
      case 'primary': return 'text-[#ff0055] drop-shadow-[0_0_4px_#ff0055]';
      case 'secondary': return 'text-[#00e0ff] drop-shadow-[0_0_4px_#00e0ff]';
      case 'cyan': return 'text-[#00f0ff] drop-shadow-[0_0_4px_#00f0ff]';
      case 'pink': return 'text-[#ff007f] drop-shadow-[0_0_4px_#ff007f]';
      case 'amber': return 'text-[#ffb700] drop-shadow-[0_0_4px_#ffb700]';
      case 'emerald': return 'text-[#00ff66] drop-shadow-[0_0_4px_#00ff66]';
      case 'blue': return 'text-[#0055ff] drop-shadow-[0_0_4px_#0055ff]';
      case 'orange': return 'text-[#ff6600] drop-shadow-[0_0_4px_#ff6600]';
      case 'purple': return 'text-[#aa00ff] drop-shadow-[0_0_4px_#aa00ff]';
      case 'red': return 'text-[#ff0033] drop-shadow-[0_0_4px_#ff0033]';
      default: return 'text-white';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-surface-dark border border-white/5 rounded-2xl p-6 backdrop-blur">
        <div>
          <h2 className="text-xl font-black uppercase text-white tracking-wider">
            Gerenciamento das Caixas da Home Page
          </h2>
          <p className="text-xs text-gray-400 mt-1">
            Adicione, edite, reordene e mude o tamanho neon dos botões em mosaico na página principal.
          </p>
        </div>
        <button
          onClick={handleOpenAdd}
          className="bg-gradient-to-r from-primary to-[#00e0ff] hover:opacity-90 text-white text-xs font-black uppercase tracking-widest px-6 py-3 rounded-xl transition-all shadow-lg flex items-center gap-2"
        >
          <span className="material-icons-outlined text-sm">add</span>
          <span>Nova Caixa</span>
        </button>
      </div>

      {/* LISTA DAS CAIXAS CADASTRADAS */}
      <div className="bg-surface-dark border border-white/5 rounded-2xl overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-black/40 text-gray-400 font-black uppercase tracking-wider border-b border-white/5">
                <th className="px-6 py-4">Prioridade / ID</th>
                <th className="px-6 py-4">Título</th>
                <th className="px-6 py-4 text-center">Ícone & Cor</th>
                <th className="px-6 py-4">Tamanho (Col x Row)</th>
                <th className="px-6 py-4">Destino da Ação</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {categories.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                    Nenhuma caixa encontrada no banco de dados.
                  </td>
                </tr>
              ) : (
                categories
                  .sort((a, b) => (a.order || 0) - (b.order || 0))
                  .map((cat, idx) => (
                    <tr key={cat.id || idx} className="hover:bg-white/[0.02] transition-colors text-gray-300">
                      <td className="px-6 py-4 font-mono font-bold">
                        <span className="text-[#00e0ff] mr-2">#{cat.order || 0}</span>
                        <span className="text-gray-500 font-light">{cat.id}</span>
                      </td>
                      <td className="px-6 py-4 font-bold text-white max-w-[200px]">
                        <div className="flex items-center gap-1.5 truncate">
                          {cat.background_url && (
                            <span className="flex-shrink-0 w-4.5 h-4.5 bg-emerald-500/20 text-emerald-400 rounded flex items-center justify-center text-[9px] font-black border border-emerald-500/30" title="Possui Imagem de Fundo">
                              BG
                            </span>
                          )}
                          <span className="truncate">{cat.title}</span>
                        </div>
                        <div className="text-[10px] text-gray-500 font-light truncate mt-0.5">{cat.description}</div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-black border border-white/5 overflow-hidden">
                          {cat.icon_url ? (
                            <img src={cat.icon_url} className="w-6 h-6 object-contain" alt="icon" />
                          ) : (
                            <span className={`material-icons-outlined text-base ${getTextGlowColor(cat.color)}`}>
                              {cat.icon || 'star'}
                            </span>
                          )}
                        </div>
                        <div className="text-[9px] text-gray-500 font-mono mt-1 lowercase">
                          {cat.icon_url ? 'PNG Personalizado' : cat.color}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="bg-white/5 border border-white/10 px-2.5 py-1 rounded font-mono text-[10px] text-gray-400 font-black">
                          {cat.col_span || 1} x {cat.row_span || 1}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="bg-[#00e0ff]/10 text-[#00e0ff] border border-[#00e0ff]/20 px-2 py-0.5 rounded text-[10px] font-bold">
                          {cat.target_view || 'home'}
                        </span>
                        <div className="text-[9px] text-gray-500 mt-1 uppercase tracking-widest">{cat.button_text || 'VER MAIS'}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col gap-1">
                          {cat.is_hidden && (
                            <span className="text-[9px] font-black uppercase bg-red-950/40 text-red-400 border border-red-500/20 px-2 py-0.5 rounded text-center max-w-[70px]">
                              Oculto
                            </span>
                          )}
                          {cat.is_mystery && (
                            <span className="text-[9px] font-black uppercase bg-amber-950/40 text-amber-400 border border-amber-500/20 px-2 py-0.5 rounded text-center max-w-[70px]">
                              Mistério
                            </span>
                          )}
                          {!cat.is_hidden && !cat.is_mystery && (
                            <span className="text-[9px] font-black uppercase bg-emerald-950/40 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded text-center max-w-[70px]">
                              Ativo
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => handleOpenEdit(cat)}
                            className="p-2 bg-white/5 border border-white/10 hover:border-[#00e0ff]/50 hover:bg-[#00e0ff]/10 rounded-lg text-gray-400 hover:text-[#00e0ff] transition-all cursor-pointer"
                            title="Editar Caixa"
                          >
                            <span className="material-icons-outlined text-sm">edit</span>
                          </button>
                          <button
                            onClick={() => handleDelete(cat)}
                            className="p-2 bg-white/5 border border-white/10 hover:border-red-500/50 hover:bg-red-500/10 rounded-lg text-gray-400 hover:text-red-500 transition-all cursor-pointer"
                            title="Excluir Caixa"
                          >
                            <span className="material-icons-outlined text-sm">delete</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL PARA INSERÇÃO / EDIÇÃO */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-[#120e29] border border-white/10 rounded-2xl w-full max-w-xl shadow-2xl relative overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 bg-black/40 border-b border-white/5 flex justify-between items-center">
              <h3 className="text-sm font-black uppercase text-white tracking-widest">
                {isEditing ? 'Editar Caixa da Home' : 'Cadastrar Nova Caixa'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <span className="material-icons-outlined text-lg">close</span>
              </button>
            </div>

            <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
              {/* ID & Ordem */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">
                    ID único da Caixa *
                  </label>
                  <input
                    type="text"
                    disabled={isEditing}
                    placeholder="ex: vip, calendar, jackpot"
                    value={form.id}
                    onChange={(e) => setForm({ ...form, id: e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, '') })}
                    className="w-full px-4 py-2.5 bg-black border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-[#00e0ff] disabled:opacity-50"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">
                    Prioridade de Exibição (Ordem)
                  </label>
                  <input
                    type="number"
                    value={form.order}
                    onChange={(e) => setForm({ ...form, order: parseInt(e.target.value) || 0 })}
                    className="w-full px-4 py-2.5 bg-black border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-[#00e0ff]"
                    required
                  />
                </div>
              </div>

              {/* Título & Texto Botão */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">
                    Título da Caixa *
                  </label>
                  <input
                    type="text"
                    placeholder="ex: Mystery Jackpot"
                    value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                    className="w-full px-4 py-2.5 bg-black border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-[#00e0ff]"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">
                    Texto do Botão
                  </label>
                  <input
                    type="text"
                    placeholder="VER MAIS"
                    value={form.button_text}
                    onChange={(e) => setForm({ ...form, button_text: e.target.value })}
                    className="w-full px-4 py-2.5 bg-black border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-[#00e0ff]"
                  />
                </div>
              </div>

              {/* Descrição */}
              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">
                  Descrição (Subtítulo da Caixa)
                </label>
                <textarea
                  rows={2}
                  placeholder="Descreva brevemente o produto ou serviço..."
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="w-full px-4 py-2.5 bg-black border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-[#00e0ff] resize-none"
                />
              </div>

              {/* Grid Layout Dimensões (Col Span & Row Span) */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">
                    Largura Grid (Col Span)
                  </label>
                  <select
                    value={form.col_span}
                    onChange={(e) => setForm({ ...form, col_span: parseInt(e.target.value) })}
                    className="w-full px-4 py-2.5 bg-black border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-[#00e0ff] cursor-pointer"
                  >
                    <option value={1}>1 Coluna (Padrão)</option>
                    <option value={2}>2 Colunas (Largo)</option>
                    <option value={3}>3 Colunas (Largura Máxima)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">
                    Altura Grid (Row Span)
                  </label>
                  <select
                    value={form.row_span}
                    onChange={(e) => setForm({ ...form, row_span: parseInt(e.target.value) })}
                    className="w-full px-4 py-2.5 bg-black border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-[#00e0ff] cursor-pointer"
                  >
                    <option value={1}>1 Linha (Padrão)</option>
                    <option value={2}>2 Linhas (Alto - Ex: VIP)</option>
                    <option value={3}>3 Linhas (Super Alto - Mosaico Irregular)</option>
                  </select>
                </div>
              </div>

              {/* Cor Neon & Slots */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">
                    Cor do Neon & Glow
                  </label>
                  <select
                    value={form.color}
                    onChange={(e) => setForm({ ...form, color: e.target.value })}
                    className="w-full px-4 py-2.5 bg-black border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-[#00e0ff] cursor-pointer"
                  >
                    {COLOR_OPTIONS.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">
                    Número de Vagas (Slots)
                  </label>
                  <input
                    type="number"
                    value={form.slots}
                    onChange={(e) => setForm({ ...form, slots: parseInt(e.target.value) || 0 })}
                    className="w-full px-4 py-2.5 bg-black border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-[#00e0ff]"
                  />
                </div>
              </div>

              {/* Ícone (Input Text & Seleção Direta) */}
              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">
                  Ícone Material (Digite o código ou clique em um preset abaixo)
                </label>
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    placeholder="star"
                    value={form.icon}
                    onChange={(e) => setForm({ ...form, icon: e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, '') })}
                    className="flex-1 px-4 py-2.5 bg-black border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-[#00e0ff]"
                  />
                  <div className="w-11 h-11 bg-black border border-white/10 rounded-xl flex items-center justify-center text-white">
                    <span className="material-icons-outlined text-lg">{form.icon}</span>
                  </div>
                </div>
                {/* Seleção rápida de ícones */}
                <div className="bg-black/30 border border-white/5 rounded-xl p-2.5 max-h-24 overflow-y-auto custom-scrollbar grid grid-cols-6 sm:grid-cols-8 gap-2 mb-4">
                  {PRESET_ICONS.map(ico => (
                    <button
                      key={ico.name}
                      type="button"
                      onClick={() => setForm({ ...form, icon: ico.name })}
                      className={`p-1.5 bg-white/5 border rounded-lg flex items-center justify-center hover:border-[#00e0ff]/50 hover:bg-white/10 text-gray-300 hover:text-white transition-all cursor-pointer ${form.icon === ico.name ? 'border-[#00e0ff] bg-[#00e0ff]/10 text-white' : 'border-transparent'}`}
                      title={ico.label}
                    >
                      <span className="material-icons-outlined text-base">{ico.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* ÍCONE CUSTOMIZADO (UPLOAD PNG) */}
              <div className="border-t border-white/5 pt-4">
                <label className="block text-[10px] font-black text-[#00e0ff] uppercase tracking-widest mb-1.5">
                  Ou Subir Ícone Personalizado (PNG)
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <input
                      type="text"
                      placeholder="Cole a URL do ícone PNG..."
                      value={form.icon_url}
                      onChange={(e) => setForm({ ...form, icon_url: e.target.value })}
                      className="w-full px-4 py-2.5 bg-black border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-[#00e0ff]"
                    />
                  </div>
                  <div className="flex gap-2 items-center">
                    <label className="flex-1 flex flex-col items-center justify-center border border-dashed border-white/10 rounded-xl p-2 bg-black/40 hover:bg-black/60 hover:border-[#00e0ff]/50 transition-all cursor-pointer text-[10px] text-gray-400 font-bold">
                      {isUploadingIcon ? (
                        <span className="animate-pulse">Enviando...</span>
                      ) : (
                        <>
                          <span className="material-icons-outlined text-base mb-0.5">upload_file</span>
                          <span>Subir PNG</span>
                        </>
                      )}
                      <input
                        type="file"
                        accept="image/png"
                        onChange={(e) => handleUploadFile(e, 'icon')}
                        className="hidden"
                        disabled={isUploadingIcon}
                      />
                    </label>
                    {form.icon_url && (
                      <div className="relative w-11 h-11 bg-black border border-white/10 rounded-xl flex items-center justify-center group overflow-hidden">
                        <img src={form.icon_url} className="w-8 h-8 object-contain" alt="Icon Preview" />
                        <button
                          type="button"
                          onClick={() => setForm({ ...form, icon_url: '' })}
                          className="absolute inset-0 bg-red-950/80 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-red-400 cursor-pointer"
                        >
                          <span className="material-icons-outlined text-sm">delete</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
                <p className="text-[9px] text-gray-500 mt-1">
                  Recomendado: imagem PNG com fundo transparente (quadrada, ex: 128x128). Se preenchido, substituirá o ícone material acima.
                </p>
              </div>

              {/* BACKGROUND DA CAIXA */}
              <div className="border-t border-white/5 pt-4">
                <label className="block text-[10px] font-black text-[#ff0055] uppercase tracking-widest mb-1.5">
                  Imagem de Fundo (Background) da Caixa
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <input
                      type="text"
                      placeholder="Cole a URL da imagem de fundo..."
                      value={form.background_url}
                      onChange={(e) => setForm({ ...form, background_url: e.target.value })}
                      className="w-full px-4 py-2.5 bg-black border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-[#ff0055]"
                    />
                  </div>
                  <div className="flex gap-2 items-center">
                    <label className="flex-1 flex flex-col items-center justify-center border border-dashed border-white/10 rounded-xl p-2 bg-black/40 hover:bg-black/60 hover:border-[#ff0055]/50 transition-all cursor-pointer text-[10px] text-gray-400 font-bold">
                      {isUploadingBg ? (
                        <span className="animate-pulse">Enviando...</span>
                      ) : (
                        <>
                          <span className="material-icons-outlined text-base mb-0.5">image</span>
                          <span>Subir Imagem</span>
                        </>
                      )}
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleUploadFile(e, 'bg')}
                        className="hidden"
                        disabled={isUploadingBg}
                      />
                    </label>
                    {form.background_url && (
                      <div className="relative w-16 h-11 bg-black border border-white/10 rounded-xl flex items-center justify-center group overflow-hidden">
                        <img src={form.background_url} className="w-full h-full object-cover" alt="BG Preview" />
                        <button
                          type="button"
                          onClick={() => setForm({ ...form, background_url: '' })}
                          className="absolute inset-0 bg-red-950/80 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-red-400 cursor-pointer"
                        >
                          <span className="material-icons-outlined text-sm">delete</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
                <p className="text-[9px] text-gray-500 mt-1">
                  Suba uma imagem para servir de fundo para esta caixa. A imagem cobrirá toda a caixa e terá uma máscara escura automática para legibilidade do texto.
                </p>
              </div>

              {/* View / Redirecionamento da Ação */}
              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">
                  Destino da Ação (View do Front-end)
                </label>
                <select
                  value={form.target_view}
                  onChange={(e) => setForm({ ...form, target_view: e.target.value })}
                  className="w-full px-4 py-2.5 bg-black border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-[#00e0ff] cursor-pointer mb-2"
                >
                  {VIEW_OPTIONS.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                  <option value="custom">-- Link Externo ou Rota Customizada --</option>
                </select>
                {/* Se for customizado ou se preferir digitar */}
                {(!VIEW_OPTIONS.some(opt => opt.value === form.target_view) || form.target_view === 'custom') && (
                  <input
                    type="text"
                    placeholder="Digite a rota (ex: category-bar) ou URL"
                    value={form.target_view === 'custom' ? '' : form.target_view}
                    onChange={(e) => setForm({ ...form, target_view: e.target.value.trim() })}
                    className="w-full px-4 py-2.5 bg-black border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-[#00e0ff]"
                  />
                )}
              </div>

              {/* Modo mistério & Ocultar */}
              <div className="grid grid-cols-2 gap-4 pt-2">
                <div className="flex items-center justify-between bg-black/40 border border-white/5 rounded-xl p-3.5">
                  <div className="flex-1">
                    <h4 className="text-[10px] font-bold text-white uppercase tracking-wider">Modo Mistério</h4>
                    <p className="text-[9px] text-gray-500 mt-0.5">Mostra como '???' para jogadores.</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={form.is_mystery}
                    onChange={(e) => setForm({ ...form, is_mystery: e.target.checked })}
                    className="w-4 h-4 text-primary bg-black border-white/10 rounded focus:ring-0 focus:ring-offset-0 cursor-pointer"
                  />
                </div>
                <div className="flex items-center justify-between bg-black/40 border border-white/5 rounded-xl p-3.5">
                  <div className="flex-1">
                    <h4 className="text-[10px] font-bold text-white uppercase tracking-wider">Ocultar Caixa</h4>
                    <p className="text-[9px] text-gray-500 mt-0.5">Esconder temporariamente.</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={form.is_hidden}
                    onChange={(e) => setForm({ ...form, is_hidden: e.target.checked })}
                    className="w-4 h-4 text-primary bg-black border-white/10 rounded focus:ring-0 focus:ring-offset-0 cursor-pointer"
                  />
                </div>
              </div>

              {/* Botões do Formulário */}
              <div className="flex gap-3 pt-4 border-t border-white/5">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-3 bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white rounded-xl text-xs font-black uppercase tracking-widest transition-all cursor-pointer text-center"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 bg-gradient-to-r from-primary to-[#00e0ff] hover:opacity-90 text-white rounded-xl text-xs font-black uppercase tracking-widest transition-all shadow-lg text-center"
                >
                  {isEditing ? 'Salvar Alterações' : 'Criar Caixa'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
