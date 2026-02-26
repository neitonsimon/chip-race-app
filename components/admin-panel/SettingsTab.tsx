import React, { useState, useEffect } from 'react';
import { supabase } from '../../src/lib/supabase';
import { TournamentCategory } from '../../types';

interface RoadmapMilestone {
    id?: string;
    version: string;
    title: string;
    date: string;
    status: 'completed' | 'current' | 'upcoming';
    topics: string[];
    display_order: number;
}

interface ContentDB {
    hero: {
        title_line1: string;
        title_line2_prefix: string;
        subtitle: string;
        btn_details: string;
    };
    details: {
        header_title: string;
        header_subtitle: string;
        concept_title: string;
        concept_desc: string;
        plus_title: string;
        plus_desc: string;
        ways_title: string;
    };
    faq: { question: string; answer: string }[];
}

interface Month {
    name: string;
    qualifiers: number | string;
    prize: string;
    status: 'active' | 'completed' | 'locked';
}

export const SettingsTab: React.FC = () => {
    // Roadmap State
    const [milestones, setMilestones] = useState<RoadmapMilestone[]>([]);
    const [isLoadingRoadmap, setIsLoadingRoadmap] = useState(false);
    const [editingRoadmapId, setEditingRoadmapId] = useState<string | null>(null);
    const [roadmapFormData, setRoadmapFormData] = useState<RoadmapMilestone>({
        version: '',
        title: '',
        date: '',
        status: 'upcoming',
        topics: [],
        display_order: 0
    });
    const [topicInput, setTopicInput] = useState('');

    // Content DB State
    const [content, setContent] = useState<ContentDB | null>(null);
    const [months, setMonths] = useState<Month[]>([]);
    const [categories, setCategories] = useState<TournamentCategory[]>([]);
    const [totalQualifiers, setTotalQualifiers] = useState<number | null>(null);
    const [isLoadingContent, setIsLoadingContent] = useState(false);
    const [isSavingContent, setIsSavingContent] = useState(false);

    // Sidebar active section
    const [activeSection, setActiveSection] = useState<'roadmap' | 'hero' | 'details' | 'faq' | 'months' | 'ecosystem' | 'defaults'>('roadmap');

    useEffect(() => {
        fetchRoadmap();
        fetchContent();
    }, []);

    const fetchRoadmap = async () => {
        setIsLoadingRoadmap(true);
        try {
            const { data, error } = await supabase
                .from('roadmap_milestones')
                .select('*')
                .order('display_order', { ascending: true });

            if (error) throw error;
            setMilestones(data || []);
        } catch (err: any) {
            console.error('Error fetching roadmap:', err.message);
        } finally {
            setIsLoadingRoadmap(false);
        }
    };

    const fetchContent = async () => {
        setIsLoadingContent(true);
        try {
            const { data, error } = await supabase.from('content_db').select('*');
            if (error) throw error;

            const newContent: any = { hero: {}, details: {}, faq: [] };
            const { data: catData } = await supabase.from('ecosystem_categories').select('*').order('order', { ascending: true });
            if (catData) setCategories(catData);

            data?.forEach(item => {
                if (item.key === 'hero' || item.key === 'details' || item.key === 'faq') {
                    newContent[item.key] = item.value;
                } else if (item.key === 'months') {
                    setMonths(item.value);
                } else if (item.key === 'total_qualifiers') {
                    setTotalQualifiers(item.value);
                }
            });
            setContent(newContent);
        } catch (err: any) {
            console.error('Error fetching content:', err.message);
        } finally {
            setIsLoadingContent(false);
        }
    };

    const handleSaveContent = async (key: string, value: any) => {
        setIsSavingContent(true);
        try {
            const { error } = await supabase
                .from('content_db')
                .upsert({ key, value }, { onConflict: 'key' });

            if (error) throw error;
            alert(`Configuração "${key.toUpperCase()}" salva com sucesso!`);
        } catch (err: any) {
            alert('Erro ao salvar conteúdo: ' + err.message);
        } finally {
            setIsSavingContent(false);
        }
    };

    const handleEditRoadmap = (m: RoadmapMilestone) => {
        setEditingRoadmapId(m.id || null);
        setRoadmapFormData({ ...m });
    };

    const handleSaveRoadmap = async () => {
        setIsLoadingRoadmap(true);
        try {
            if (editingRoadmapId && editingRoadmapId !== 'new') {
                const { error } = await supabase
                    .from('roadmap_milestones')
                    .update({
                        version: roadmapFormData.version,
                        title: roadmapFormData.title,
                        date: roadmapFormData.date,
                        status: roadmapFormData.status,
                        topics: roadmapFormData.topics,
                        display_order: roadmapFormData.display_order
                    })
                    .eq('id', editingRoadmapId);
                if (error) throw error;
            } else {
                const { error } = await supabase
                    .from('roadmap_milestones')
                    .insert([roadmapFormData]);
                if (error) throw error;
            }
            fetchRoadmap();
            setEditingRoadmapId(null);
            setRoadmapFormData({ version: '', title: '', date: '', status: 'upcoming', topics: [], display_order: 0 });
        } catch (err: any) {
            alert('Erro ao salvar milestone: ' + err.message);
        } finally {
            setIsLoadingRoadmap(false);
        }
    };

    const handleDeleteRoadmap = async (id: string) => {
        if (!window.confirm('Excluir este milestone do roadmap?')) return;
        setIsLoadingRoadmap(true);
        try {
            const { error } = await supabase.from('roadmap_milestones').delete().eq('id', id);
            if (error) throw error;
            fetchRoadmap();
        } catch (err: any) {
            alert('Erro ao excluir: ' + err.message);
        } finally {
            setIsLoadingRoadmap(false);
        }
    };

    const addTopic = () => {
        if (!topicInput.trim()) return;
        setRoadmapFormData(prev => ({ ...prev, topics: [...prev.topics, topicInput.trim()] }));
        setTopicInput('');
    };

    const removeTopic = (index: number) => {
        setRoadmapFormData(prev => ({ ...prev, topics: prev.topics.filter((_, i) => i !== index) }));
    };

    const handleUpdateFAQ = (index: number, field: 'question' | 'answer', value: string) => {
        if (!content) return;
        const newFaq = [...content.faq];
        newFaq[index] = { ...newFaq[index], [field]: value };
        setContent({ ...content, faq: newFaq });
    };

    const handleAddFAQ = () => {
        if (!content) return;
        setContent({ ...content, faq: [...content.faq, { question: '', answer: '' }] });
    };

    const handleRemoveFAQ = (index: number) => {
        if (!content) return;
        setContent({ ...content, faq: content.faq.filter((_, i) => i !== index) });
    };

    const handleUpdateMonth = (index: number, field: keyof Month, value: any) => {
        const newMonths = [...months];
        newMonths[index] = { ...newMonths[index], [field]: value };
        setMonths(newMonths);
    };

    const handleUpdateCategory = (index: number, field: keyof TournamentCategory, value: any) => {
        const newCats = [...categories];
        newCats[index] = { ...newCats[index], [field]: value };
        setCategories(newCats);
    };

    const handleSaveCategory = async (index: number) => {
        setIsSavingContent(true);
        try {
            const cat = categories[index];
            const { error } = await supabase.from('ecosystem_categories').upsert(cat, { onConflict: 'id' });
            if (error) throw error;
            alert('Categoria salva com sucesso!');
        } catch (err: any) {
            alert('Erro ao salvar categoria: ' + err.message);
        } finally {
            setIsSavingContent(false);
        }
    };

    const handleAddCategory = () => {
        const newCat: any = {
            id: crypto.randomUUID(),
            title: 'Nova Categoria',
            description: 'Descrição aqui...',
            icon: 'info',
            color: 'primary',
            slots: 0,
            is_mystery: false,
            order: categories.length
        };
        setCategories([...categories, newCat]);
    };

    const handleDeleteCategory = async (id: string) => {
        if (!window.confirm('Excluir esta categoria?')) return;
        setIsSavingContent(true);
        try {
            const { error } = await supabase.from('ecosystem_categories').delete().eq('id', id);
            if (error) throw error;
            setCategories(categories.filter(c => c.id !== id));
        } catch (err: any) {
            alert('Erro ao excluir categoria: ' + err.message);
        } finally {
            setIsSavingContent(false);
        }
    };

    return (
        <div className="flex min-h-[600px] bg-black/20 rounded-[2.5rem] overflow-hidden border border-white/5">
            {/* Sub-Sidebar */}
            <aside className="w-64 bg-white/5 border-r border-white/10 p-6 flex flex-col gap-2 shrink-0">
                <div className="mb-4">
                    <h4 className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-2 mb-4">Gestão de Conteúdo</h4>
                </div>

                <SidebarButton
                    active={activeSection === 'roadmap'}
                    onClick={() => setActiveSection('roadmap')}
                    icon="map"
                    label="Roadmap"
                />
                <SidebarButton
                    active={activeSection === 'hero'}
                    onClick={() => setActiveSection('hero')}
                    icon="home"
                    label="Hero Principal"
                />
                <SidebarButton
                    active={activeSection === 'details'}
                    onClick={() => setActiveSection('details')}
                    icon="info"
                    label="Conceito The Chosen"
                />
                <SidebarButton
                    active={activeSection === 'faq'}
                    onClick={() => setActiveSection('faq')}
                    icon="quiz"
                    label="FAQ / Dúvidas"
                />
                <SidebarButton
                    active={activeSection === 'months'}
                    onClick={() => setActiveSection('months')}
                    icon="calendar_month"
                    label="Cronograma Mensal"
                />
                <SidebarButton
                    active={activeSection === 'ecosystem'}
                    onClick={() => setActiveSection('ecosystem')}
                    icon="category"
                    label="Ecossistema"
                />
                <SidebarButton
                    active={activeSection === 'defaults'}
                    onClick={() => setActiveSection('defaults')}
                    icon="settings"
                    label="Padrões do App"
                />
            </aside>

            {/* Content Area */}
            <main className="flex-1 p-8 overflow-y-auto max-h-[800px] custom-scrollbar">
                {activeSection === 'roadmap' && (
                    <div className="animate-in fade-in slide-in-from-right duration-500">
                        <SectionHeader title="Timeline do Roadmap" subtitle="Gerencie a evolução pública do ecossistema" />
                        <div className="flex justify-end mb-6">
                            {!editingRoadmapId && (
                                <button
                                    onClick={() => { setEditingRoadmapId('new'); setRoadmapFormData({ version: '', title: '', date: '', status: 'upcoming', topics: [], display_order: milestones.length + 1 }); }}
                                    className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-neon-pink hover:bg-primary/80 transition-all font-display italic"
                                >
                                    <span className="material-icons-outlined text-sm">add</span>
                                    Novo Milestone
                                </button>
                            )}
                        </div>

                        {editingRoadmapId && (
                            <div className="bg-white/5 border border-white/10 rounded-3xl p-6 mb-8 border-l-4 border-l-primary">
                                <h4 className="text-sm font-black text-primary uppercase mb-6 flex items-center gap-2">
                                    <span className="material-icons-outlined text-sm">{editingRoadmapId === 'new' ? 'add_circle' : 'edit'}</span>
                                    {editingRoadmapId === 'new' ? 'Novo Marco' : 'Editar Marco'}
                                </h4>

                                <div className="grid grid-cols-2 gap-4 mb-4">
                                    <FormGroup label="Versão (ex: V 1.1)">
                                        <input type="text" value={roadmapFormData.version} onChange={e => setRoadmapFormData({ ...roadmapFormData, version: e.target.value })} className="form-input" />
                                    </FormGroup>
                                    <FormGroup label="Título">
                                        <input type="text" value={roadmapFormData.title} onChange={e => setRoadmapFormData({ ...roadmapFormData, title: e.target.value })} className="form-input" />
                                    </FormGroup>
                                    <FormGroup label="Data/Previsão">
                                        <input type="text" value={roadmapFormData.date} onChange={e => setRoadmapFormData({ ...roadmapFormData, date: e.target.value })} className="form-input" />
                                    </FormGroup>
                                    <FormGroup label="Status">
                                        <select value={roadmapFormData.status} onChange={e => setRoadmapFormData({ ...roadmapFormData, status: e.target.value as any })} className="form-input appearance-none">
                                            <option value="completed">Concluído</option>
                                            <option value="current">Versão Atual</option>
                                            <option value="upcoming">Próximo</option>
                                        </select>
                                    </FormGroup>
                                </div>

                                <div className="mb-6 px-2">
                                    <label className="text-[10px] text-gray-500 uppercase font-black block mb-2 tracking-widest">Tópicos / Novidades</label>
                                    <div className="flex gap-2 mb-3">
                                        <input type="text" value={topicInput} onChange={e => setTopicInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && addTopic()} className="flex-1 bg-black/40 border border-white/10 rounded-xl px-4 py-2 text-white text-xs outline-none focus:border-primary" placeholder="Adicione um ponto..." />
                                        <button onClick={addTopic} className="px-4 bg-primary/20 text-primary border border-primary/20 rounded-xl hover:bg-primary/30 transition-colors"><span className="material-icons-outlined">add</span></button>
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                        {roadmapFormData.topics.map((t, i) => (
                                            <span key={i} className="inline-flex items-center gap-2 px-3 py-1.5 bg-primary/10 border border-primary/20 rounded-lg text-[10px] text-primary font-bold">
                                                {t}<button onClick={() => removeTopic(i)} className="hover:text-white transition-colors"><span className="material-icons-outlined text-[12px]">close</span></button>
                                            </span>
                                        ))}
                                    </div>
                                </div>

                                <div className="flex justify-end gap-3 pt-4 border-t border-white/5">
                                    <button onClick={() => setEditingRoadmapId(null)} className="px-6 py-2.5 text-gray-400 font-black uppercase text-[10px] tracking-widest hover:text-white transition-colors">Cancelar</button>
                                    <button onClick={handleSaveRoadmap} disabled={isLoadingRoadmap} className="px-8 py-2.5 bg-primary text-white font-black uppercase text-[10px] tracking-widest rounded-xl shadow-neon-pink hover:bg-primary/80 disabled:opacity-50 transition-all font-display italic">
                                        {isLoadingRoadmap ? 'Salvando...' : 'Confirmar Milestone'}
                                    </button>
                                </div>
                            </div>
                        )}

                        <div className="space-y-3">
                            {milestones.length === 0 ? (
                                <EmptyState icon="map" text="Nenhum marco encontrado" />
                            ) : milestones.map(m => (
                                <RoadmapCard key={m.id} m={m} onEdit={() => handleEditRoadmap(m)} onDelete={() => handleDeleteRoadmap(m.id!)} />
                            ))}
                        </div>
                    </div>
                )}

                {activeSection === 'hero' && content && (
                    <div className="animate-in fade-in slide-in-from-right duration-500">
                        <SectionHeader title="Hero Principal" subtitle="Primeira impressão dos usuários na Homepage" />
                        <div className="space-y-6 bg-white/5 border border-white/10 rounded-[2.5rem] p-8">
                            <div className="grid grid-cols-2 gap-6">
                                <FormGroup label="Título Linha 1">
                                    <input type="text" value={content.hero.title_line1} onChange={e => setContent({ ...content, hero: { ...content.hero, title_line1: e.target.value } })} className="form-input font-bold" />
                                </FormGroup>
                                <FormGroup label="Sufixo Título 2">
                                    <input type="text" value={content.hero.title_line2_prefix} onChange={e => setContent({ ...content, hero: { ...content.hero, title_line2_prefix: e.target.value } })} className="form-input font-bold" />
                                </FormGroup>
                                <FormGroup label="Subtítulo / Chamada" fullWidth>
                                    <textarea rows={3} value={content.hero.subtitle} onChange={e => setContent({ ...content, hero: { ...content.hero, subtitle: e.target.value } })} className="form-input resize-none" />
                                </FormGroup>
                                <FormGroup label="Texto Botão Ação">
                                    <input type="text" value={content.hero.btn_details} onChange={e => setContent({ ...content, hero: { ...content.hero, btn_details: e.target.value } })} className="form-input font-bold" />
                                </FormGroup>
                            </div>
                            <div className="pt-6 border-t border-white/5 flex justify-end">
                                <button onClick={() => handleSaveContent('hero', content.hero)} disabled={isSavingContent} className="btn-save shadow-neon-pink">
                                    <span className="material-icons-outlined text-sm">cloud_upload</span>
                                    {isSavingContent ? 'Publicando...' : 'Publicar Alterações'}
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {activeSection === 'details' && content && (
                    <div className="animate-in fade-in slide-in-from-right duration-500">
                        <SectionHeader title="Seção: The Chosen" subtitle="Conteúdo explicativo e dinâmica do evento final" />
                        <div className="space-y-8">
                            <ContentBlock title="Cabeçalho (Header)" color="bg-primary">
                                <div className="grid grid-cols-2 gap-6">
                                    <FormGroup label="Título Grande">
                                        <input type="text" value={content.details.header_title} onChange={e => setContent({ ...content, details: { ...content.details, header_title: e.target.value } })} className="form-input font-bold" />
                                    </FormGroup>
                                    <FormGroup label="Subtítulo de Apoio">
                                        <input type="text" value={content.details.header_subtitle} onChange={e => setContent({ ...content, details: { ...content.details, header_subtitle: e.target.value } })} className="form-input" />
                                    </FormGroup>
                                </div>
                            </ContentBlock>

                            <ContentBlock title="O Conceito" color="bg-secondary">
                                <div className="space-y-4">
                                    <input type="text" value={content.details.concept_title} onChange={e => setContent({ ...content, details: { ...content.details, concept_title: e.target.value } })} className="form-input font-bold" />
                                    <textarea rows={4} value={content.details.concept_desc} onChange={e => setContent({ ...content, details: { ...content.details, concept_desc: e.target.value } })} className="form-input text-sm resize-none" />
                                </div>
                            </ContentBlock>

                            <ContentBlock title="Dinâmica Plus" color="bg-cyan-500">
                                <div className="space-y-4">
                                    <input type="text" value={content.details.plus_title} onChange={e => setContent({ ...content, details: { ...content.details, plus_title: e.target.value } })} className="form-input font-bold" />
                                    <textarea rows={4} value={content.details.plus_desc} onChange={e => setContent({ ...content, details: { ...content.details, plus_desc: e.target.value } })} className="form-input text-sm resize-none" />
                                </div>
                            </ContentBlock>

                            <div className="flex justify-center pb-10 pt-4">
                                <button onClick={() => handleSaveContent('details', content.details)} disabled={isSavingContent} className="btn-save-gradient">
                                    <span className="material-icons-outlined text-sm">save_alt</span>
                                    {isSavingContent ? 'Salvando...' : 'Salvar Alterações de Texto'}
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {activeSection === 'faq' && content && (
                    <div className="animate-in fade-in slide-in-from-right duration-500">
                        <SectionHeader title="FAQ - Perguntas Frequentes" subtitle="Gerencie as dúvidas mais comuns dos jogadores" />
                        <div className="space-y-4 mb-8">
                            {content.faq.map((item, idx) => (
                                <div key={idx} className="bg-white/5 border border-white/10 rounded-2xl p-6 relative group border-l-4 border-l-gray-600 focus-within:border-l-primary transition-all">
                                    <button onClick={() => handleRemoveFAQ(idx)} className="absolute top-4 right-4 text-gray-600 hover:text-red-500 p-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <span className="material-icons-outlined text-sm">delete</span>
                                    </button>
                                    <div className="space-y-3">
                                        <input type="text" placeholder="Pergunta" value={item.question} onChange={e => handleUpdateFAQ(idx, 'question', e.target.value)} className="w-full bg-transparent border-none text-white font-bold outline-none placeholder:text-gray-700" />
                                        <textarea rows={2} placeholder="Resposta" value={item.answer} onChange={e => handleUpdateFAQ(idx, 'answer', e.target.value)} className="w-full bg-transparent border-none text-gray-400 text-sm outline-none resize-none placeholder:text-gray-800" />
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div className="flex flex-col items-center gap-6">
                            <button onClick={handleAddFAQ} className="px-6 py-3 border border-dashed border-white/10 rounded-2xl text-gray-500 hover:text-white hover:border-white/20 transition-all text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
                                <span className="material-icons-outlined text-sm">add_circle</span> Adicionar Nova Pergunta
                            </button>
                            <button onClick={() => handleSaveContent('faq', content.faq)} disabled={isSavingContent} className="btn-save shadow-neon-blue w-full max-w-md">
                                <span className="material-icons-outlined text-sm">sync</span> {isSavingContent ? 'Atualizando...' : 'Atualizar FAQ'}
                            </button>
                        </div>
                    </div>
                )}

                {activeSection === 'months' && (
                    <div className="animate-in fade-in slide-in-from-right duration-500">
                        <SectionHeader title="Cronograma THE CHOSEN" subtitle="Controle as metas e garantidos mensais" />
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-8">
                            {months.map((month, idx) => (
                                <div key={idx} className={`p-5 rounded-3xl border transition-all ${month.status === 'active' ? 'bg-primary/20 border-primary' : month.status === 'completed' ? 'bg-secondary/10 border-secondary/40' : 'bg-white/5 border-white/10 opacity-70'}`}>
                                    <div className="flex justify-between items-center mb-4">
                                        <span className="text-xs font-black text-white">{month.name}</span>
                                        <select value={month.status} onChange={e => handleUpdateMonth(idx, 'status', e.target.value as any)} className="bg-black/50 border-none text-[8px] font-black uppercase px-2 py-1 rounded-full outline-none cursor-pointer">
                                            <option value="locked">Bloqueado</option>
                                            <option value="active">Ativo</option>
                                            <option value="completed">Atingido</option>
                                        </select>
                                    </div>
                                    <div className="space-y-3">
                                        <div className="bg-black/20 p-2 rounded-xl">
                                            <label className="text-[7px] text-gray-500 uppercase font-black block mb-1">Garantido</label>
                                            <input type="text" value={month.prize} onChange={e => handleUpdateMonth(idx, 'prize', e.target.value)} className="w-full bg-transparent border-none text-white font-bold text-xs outline-none" />
                                        </div>
                                        <div className="bg-black/20 p-2 rounded-xl">
                                            <label className="text-[7px] text-gray-500 uppercase font-black block mb-1">Qtd Classificados</label>
                                            <input type="text" value={month.qualifiers} onChange={e => handleUpdateMonth(idx, 'qualifiers', e.target.value)} className="w-full bg-transparent border-none text-white font-bold text-xs outline-none" />
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div className="flex justify-center">
                            <button onClick={() => handleSaveContent('months', months)} disabled={isSavingContent} className="btn-save shadow-neon-pink w-full max-w-xs uppercase">
                                <span className="material-icons-outlined text-sm">save</span> {isSavingContent ? 'Salvando...' : 'Salvar Cronograma'}
                            </button>
                        </div>
                    </div>
                )}

                {activeSection === 'ecosystem' && (
                    <div className="animate-in fade-in slide-in-from-right duration-500">
                        <SectionHeader title="Gestão do Ecossistema" subtitle="Adicione ou remova categorias e configure slots" />
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                            {categories.map((cat, idx) => (
                                <div key={cat.id || idx} className="bg-white/5 border border-white/10 rounded-[2rem] p-6 relative group">
                                    <button onClick={() => handleDeleteCategory(cat.id || '')} className="absolute top-4 right-4 text-gray-600 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100">
                                        <span className="material-icons-outlined text-sm">delete</span>
                                    </button>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="col-span-2 flex items-center gap-4 mb-2">
                                            <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center text-primary">
                                                <span className="material-icons-outlined text-lg">{cat.icon}</span>
                                            </div>
                                            <input type="text" value={cat.title} onChange={e => handleUpdateCategory(idx, 'title', e.target.value)} className="flex-1 bg-transparent border-none text-white font-black uppercase text-sm outline-none" placeholder="Nome da Categoria" />
                                        </div>
                                        <FormGroup label="Ícone (Material Icon)">
                                            <input type="text" value={cat.icon} onChange={e => handleUpdateCategory(idx, 'icon', e.target.value)} className="form-input text-xs" />
                                        </FormGroup>
                                        <FormGroup label="Slots / Vagas">
                                            <input type="number" value={cat.slots} onChange={e => handleUpdateCategory(idx, 'slots', parseInt(e.target.value))} className="form-input text-xs" />
                                        </FormGroup>
                                        <FormGroup label="Cor">
                                            <select value={cat.color} onChange={e => handleUpdateCategory(idx, 'color', e.target.value)} className="form-input text-xs appearance-none">
                                                <option value="primary">Primário (Pink)</option>
                                                <option value="secondary">Secundário (Blue)</option>
                                                <option value="cyan">Ciano</option>
                                                <option value="pink">Rosa</option>
                                            </select>
                                        </FormGroup>
                                        <FormGroup label="Status Mystery">
                                            <div className="flex items-center gap-2 mt-2">
                                                <input type="checkbox" checked={cat.is_mystery} onChange={e => handleUpdateCategory(idx, 'is_mystery', e.target.checked)} className="w-4 h-4 rounded bg-white/5 border-white/10" />
                                                <span className="text-[9px] font-bold text-gray-500 uppercase">Habilitar Mistério</span>
                                            </div>
                                        </FormGroup>
                                        <div className="col-span-2">
                                            <FormGroup label="Descrição" fullWidth>
                                                <textarea rows={2} value={cat.description} onChange={e => handleUpdateCategory(idx, 'description', e.target.value)} className="form-input text-xs resize-none" />
                                            </FormGroup>
                                        </div>
                                    </div>
                                    <div className="mt-4 pt-4 border-t border-white/5 flex justify-end">
                                        <button onClick={() => handleSaveCategory(idx)} className="text-[9px] font-black uppercase text-primary hover:text-white transition-colors flex items-center gap-1">
                                            <span className="material-icons-outlined text-xs">check_circle</span> Salvar Categoria
                                        </button>
                                    </div>
                                </div>
                            ))}
                            <button onClick={handleAddCategory} className="border-2 border-dashed border-white/5 rounded-[2rem] p-10 flex flex-col items-center justify-center text-gray-600 hover:text-white hover:bg-white/5 transition-all group">
                                <span className="material-icons-outlined text-4xl mb-4 group-hover:scale-110 transition-transform">add_box</span>
                                <span className="text-[10px] font-black uppercase tracking-[0.2em]">Adicionar Categoria</span>
                            </button>
                        </div>
                    </div>
                )}

                {activeSection === 'defaults' && (
                    <div className="animate-in fade-in slide-in-from-right duration-500">
                        <SectionHeader title="Application Defaults" subtitle="Variáveis globais do sistema e contadores" />
                        <div className="max-w-md mx-auto space-y-8 mt-10">
                            <div className="bg-white/5 border border-white/10 rounded-[2.5rem] p-8">
                                <FormGroup label="Contador Logado (Total de Classificados)" fullWidth>
                                    <div className="flex gap-4 items-center">
                                        <input
                                            type="number"
                                            value={totalQualifiers === null ? '' : totalQualifiers}
                                            onChange={e => setTotalQualifiers(e.target.value === '' ? null : parseInt(e.target.value))}
                                            placeholder="Automático (Calculado)"
                                            className="flex-1 form-input text-center text-xl font-display italic text-primary"
                                        />
                                        <button onClick={() => setTotalQualifiers(null)} className="text-gray-500 hover:text-white" title="Resetar para automático"><span className="material-icons-outlined">restart_alt</span></button>
                                    </div>
                                    <p className="text-[8px] text-gray-600 mt-2 px-2 uppercase font-black tracking-widest italic">* Deixe em branco (null) para o sistema calcular automaticamente a partir do cronograma.</p>
                                </FormGroup>

                                <div className="pt-8 flex justify-center">
                                    <button onClick={() => handleSaveContent('total_qualifiers', totalQualifiers)} disabled={isSavingContent} className="btn-save shadow-neon-pink w-full">
                                        <span className="material-icons-outlined text-sm">webhook</span> {isSavingContent ? 'Sincronizando...' : 'Publicar Variável Global'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
};

// Helper Components
const SidebarButton = ({ active, onClick, icon, label }: { active: boolean, onClick: () => void, icon: string, label: string }) => (
    <button onClick={onClick} className={`flex items-center gap-3 px-4 py-3 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all ${active ? 'bg-primary text-white shadow-neon-pink scale-105' : 'text-gray-500 hover:bg-white/5 hover:text-white'}`}>
        <span className="material-icons-outlined text-lg">{icon}</span> {label}
    </button>
);

const SectionHeader = ({ title, subtitle }: { title: string, subtitle: string }) => (
    <div className="mb-10">
        <h3 className="text-2xl font-display font-black text-white uppercase tracking-tighter italic lg:text-3xl">{title}</h3>
        <p className="text-[10px] text-gray-500 uppercase font-black mt-1 tracking-[0.2em]">{subtitle}</p>
    </div>
);

const FormGroup = ({ label, children, fullWidth }: { label: string, children: React.ReactNode, fullWidth?: boolean }) => (
    <div className={fullWidth ? 'col-span-2' : 'col-span-1'}>
        <label className="text-[10px] text-primary uppercase font-black block mb-2 ml-4 tracking-[0.15em] opacity-80">{label}</label>
        {children}
    </div>
);

const ContentBlock = ({ title, color, children }: { title: string, color: string, children: React.ReactNode }) => (
    <div className="bg-white/5 border border-white/10 rounded-[3rem] p-8 relative overflow-hidden">
        <div className="mb-8 flex items-center gap-4">
            <div className={`w-2.5 h-10 ${color} rounded-full shadow-[0_0_15px_rgba(0,0,0,0.5)]`}></div>
            <h4 className="text-xs font-black text-white uppercase tracking-[0.25em]">{title}</h4>
        </div>
        {children}
    </div>
);

const RoadmapCard: React.FC<{ m: RoadmapMilestone, onEdit: () => void, onDelete: () => any }> = ({ m, onEdit, onDelete }) => (
    <div className="group flex items-center gap-5 p-5 bg-white/5 border border-white/10 rounded-[2rem] hover:bg-white/10 hover:border-white/20 transition-all duration-300">
        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0 ${m.status === 'current' ? 'bg-primary/20 border border-primary/40 shadow-neon-pink/20' : 'bg-black/40 border border-white/5'}`}>
            <span className={`text-lg font-display font-black ${m.status === 'current' ? 'text-primary' : 'text-gray-500'}`}>{m.version}</span>
        </div>
        <div className="flex-1">
            <div className="flex items-center gap-3 mb-0.5">
                <h4 className="text-white font-bold text-sm tracking-tight">{m.title}</h4>
                <span className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-tighter ${m.status === 'completed' ? 'bg-green-500/10 text-green-400 border border-green-500/20' : m.status === 'current' ? 'bg-primary/10 text-primary border border-primary/20' : 'bg-white/5 text-gray-500 border border-white/10'}`}>
                    {m.status === 'completed' ? 'Concluído' : m.status === 'current' ? 'Atual' : 'Próximo'}
                </span>
            </div>
            <p className="text-[9px] text-gray-500 font-black uppercase tracking-widest">{m.date}</p>
        </div>
        <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <button onClick={onEdit} className="w-9 h-9 bg-white/5 rounded-xl flex items-center justify-center text-gray-400 hover:text-white hover:bg-primary/20 transition-all border border-white/10"><span className="material-icons-outlined text-sm">edit</span></button>
            <button onClick={onDelete} className="w-9 h-9 bg-white/5 rounded-xl flex items-center justify-center text-gray-600 hover:text-red-500 hover:bg-red-500/10 transition-all border border-white/10"><span className="material-icons-outlined text-sm">delete</span></button>
        </div>
    </div>
);

const EmptyState = ({ icon, text }: { icon: string, text: string }) => (
    <div className="text-center py-20 border-2 border-dashed border-white/5 rounded-[2.5rem] bg-white/[0.02]">
        <span className="material-icons-outlined text-4xl text-gray-800 block mb-4">{icon}</span>
        <p className="text-gray-600 text-[10px] font-black uppercase tracking-[0.3em] italic">{text}</p>
    </div>
);
