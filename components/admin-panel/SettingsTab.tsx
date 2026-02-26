import React, { useState, useEffect } from 'react';
import { supabase } from '../../src/lib/supabase';

interface RoadmapMilestone {
    id?: string;
    version: string;
    title: string;
    date: string;
    status: 'completed' | 'current' | 'upcoming';
    topics: string[];
    display_order: number;
}

export const SettingsTab: React.FC = () => {
    const [milestones, setMilestones] = useState<RoadmapMilestone[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [formData, setFormData] = useState<RoadmapMilestone>({
        version: '',
        title: '',
        date: '',
        status: 'upcoming',
        topics: [],
        display_order: 0
    });
    const [topicInput, setTopicInput] = useState('');

    useEffect(() => {
        fetchRoadmap();
    }, []);

    const fetchRoadmap = async () => {
        setIsLoading(true);
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
            setIsLoading(false);
        }
    };

    const handleEdit = (m: RoadmapMilestone) => {
        setEditingId(m.id || null);
        setFormData({ ...m });
    };

    const handleSave = async () => {
        setIsLoading(true);
        try {
            if (editingId) {
                const { error } = await supabase
                    .from('roadmap_milestones')
                    .update({
                        version: formData.version,
                        title: formData.title,
                        date: formData.date,
                        status: formData.status,
                        topics: formData.topics,
                        display_order: formData.display_order
                    })
                    .eq('id', editingId);
                if (error) throw error;
            } else {
                const { error } = await supabase
                    .from('roadmap_milestones')
                    .insert([formData]);
                if (error) throw error;
            }
            fetchRoadmap();
            setEditingId(null);
            setFormData({ version: '', title: '', date: '', status: 'upcoming', topics: [], display_order: 0 });
        } catch (err: any) {
            alert('Erro ao salvar milestone: ' + err.message);
        } finally {
            setIsLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm('Excluir este milestone do roadmap?')) return;
        setIsLoading(true);
        try {
            const { error } = await supabase.from('roadmap_milestones').delete().eq('id', id);
            if (error) throw error;
            fetchRoadmap();
        } catch (err: any) {
            alert('Erro ao excluir: ' + err.message);
        } finally {
            setIsLoading(false);
        }
    };

    const addTopic = () => {
        if (!topicInput.trim()) return;
        setFormData(prev => ({ ...prev, topics: [...prev.topics, topicInput.trim()] }));
        setTopicInput('');
    };

    const removeTopic = (index: number) => {
        setFormData(prev => ({ ...prev, topics: prev.topics.filter((_, i) => i !== index) }));
    };

    return (
        <div className="p-6 max-w-4xl mx-auto">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h3 className="text-xl font-display font-black text-white uppercase">Roadmap do Ecossistema</h3>
                    <p className="text-xs text-gray-500 uppercase font-black mt-1">Gerencie a evolução pública do Chip Race</p>
                </div>
                {!editingId && (
                    <button
                        onClick={() => { setEditingId('new'); setFormData({ version: '', title: '', date: '', status: 'upcoming', topics: [], display_order: milestones.length + 1 }); }}
                        className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-neon-pink hover:bg-primary/80 transition-all"
                    >
                        <span className="material-icons-outlined text-sm">add</span>
                        Novo Milestone
                    </button>
                )}
            </div>

            {editingId && (
                <div className="bg-white/5 border border-white/10 rounded-3xl p-6 mb-8 animate-in slide-in-from-top duration-300">
                    <h4 className="text-sm font-black text-primary uppercase mb-6 flex items-center gap-2">
                        <span className="material-icons-outlined text-sm">{editingId === 'new' ? 'add_circle' : 'edit'}</span>
                        {editingId === 'new' ? 'Adicionar Novo Marco' : 'Editar Marco'}
                    </h4>

                    <div className="grid grid-cols-2 gap-4 mb-4">
                        <div>
                            <label className="text-[10px] text-gray-500 uppercase font-black block mb-1.5 ml-2">Versão (ex: V 1.1)</label>
                            <input
                                type="text" value={formData.version} onChange={e => setFormData({ ...formData, version: e.target.value })}
                                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-primary transition-all"
                                placeholder="V 1.0"
                            />
                        </div>
                        <div>
                            <label className="text-[10px] text-gray-500 uppercase font-black block mb-1.5 ml-2">Título do Marco</label>
                            <input
                                type="text" value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })}
                                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-primary transition-all"
                                placeholder="Interatividade & Social"
                            />
                        </div>
                        <div>
                            <label className="text-[10px] text-gray-500 uppercase font-black block mb-1.5 ml-2">Data / Previsão</label>
                            <input
                                type="text" value={formData.date} onChange={e => setFormData({ ...formData, date: e.target.value })}
                                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-primary transition-all"
                                placeholder="Abril 2026"
                            />
                        </div>
                        <div>
                            <label className="text-[10px] text-gray-500 uppercase font-black block mb-1.5 ml-2">Status</label>
                            <select
                                value={formData.status} onChange={e => setFormData({ ...formData, status: e.target.value as any })}
                                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-primary transition-all appearance-none"
                            >
                                <option value="completed">Concluído</option>
                                <option value="current">Versão Atual</option>
                                <option value="upcoming">Próximo</option>
                            </select>
                        </div>
                    </div>

                    <div className="mb-6">
                        <label className="text-[10px] text-gray-500 uppercase font-black block mb-1.5 ml-2">Tópicos / Novidades</label>
                        <div className="flex gap-2 mb-3">
                            <input
                                type="text" value={topicInput} onChange={e => setTopicInput(e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && addTopic()}
                                className="flex-1 bg-black/40 border border-white/10 rounded-xl px-4 py-2 text-white text-xs outline-none focus:border-primary"
                                placeholder="Adicione um ponto relevante..."
                            />
                            <button onClick={addTopic} className="px-4 bg-white/5 border border-white/10 rounded-xl text-white hover:bg-white/10 transition-colors">
                                <span className="material-icons-outlined">add</span>
                            </button>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {formData.topics.map((t, i) => (
                                <span key={i} className="inline-flex items-center gap-2 px-3 py-1.5 bg-primary/10 border border-primary/20 rounded-lg text-[10px] text-primary font-bold">
                                    {t}
                                    <button onClick={() => removeTopic(i)} className="hover:text-white transition-colors">
                                        <span className="material-icons-outlined text-[12px]">close</span>
                                    </button>
                                </span>
                            ))}
                        </div>
                    </div>

                    <div className="flex justify-end gap-3">
                        <button onClick={() => setEditingId(null)} className="px-6 py-2.5 text-gray-400 font-black uppercase text-[10px] tracking-widest hover:text-white transition-colors">Cancelar</button>
                        <button
                            onClick={handleSave}
                            disabled={isLoading}
                            className="px-8 py-2.5 bg-primary text-white font-black uppercase text-[10px] tracking-widest rounded-xl shadow-neon-pink hover:bg-primary/80 disabled:opacity-50 transition-all"
                        >
                            {isLoading ? 'Salvando...' : 'Salvar Milestone'}
                        </button>
                    </div>
                </div>
            )}

            <div className="space-y-4">
                {milestones.length === 0 ? (
                    <div className="text-center py-20 border-2 border-dashed border-white/5 rounded-[2.5rem]">
                        <span className="material-icons-outlined text-4xl text-gray-700 block mb-2">map</span>
                        <p className="text-gray-500 text-sm italic italic">Nenhum marco cadastrado.</p>
                    </div>
                ) : milestones.map(m => (
                    <div key={m.id} className="group flex items-center gap-6 p-6 bg-white/5 border border-white/10 rounded-[2rem] hover:bg-white/10 transition-all duration-500">
                        <div className={`w-16 h-16 rounded-2xl flex items-center justify-center flex-shrink-0 ${m.status === 'current' ? 'bg-primary/20 border border-primary/40' : 'bg-black/40 border border-white/5'}`}>
                            <span className={`text-xl font-display font-black ${m.status === 'current' ? 'text-primary' : 'text-gray-500'}`}>{m.version}</span>
                        </div>
                        <div className="flex-1">
                            <div className="flex items-center gap-3 mb-1">
                                <h4 className="text-white font-bold">{m.title}</h4>
                                <span className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest ${m.status === 'completed' ? 'bg-green-500/10 text-green-400 border border-green-500/20' :
                                        m.status === 'current' ? 'bg-primary/10 text-primary border border-primary/20' :
                                            'bg-white/5 text-gray-500 border border-white/10'
                                    }`}>
                                    {m.status === 'completed' ? 'Concluído' : m.status === 'current' ? 'Atual' : 'Próximo'}
                                </span>
                            </div>
                            <p className="text-[10px] text-gray-500 font-black uppercase tracking-widest mb-2">{m.date}</p>
                            <div className="flex flex-wrap gap-2 mt-2">
                                {m.topics.slice(0, 3).map((t, i) => (
                                    <span key={i} className="text-[9px] text-gray-400 bg-white/5 px-2 py-1 rounded border border-white/5">{t}</span>
                                ))}
                                {m.topics.length > 3 && <span className="text-[9px] text-gray-600">+{m.topics.length - 3} mais</span>}
                            </div>
                        </div>
                        <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={() => handleEdit(m)} className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center text-gray-400 hover:text-white hover:bg-primary/20 transition-all border border-white/10">
                                <span className="material-icons-outlined text-sm">edit</span>
                            </button>
                            <button onClick={() => handleDelete(m.id!)} className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center text-gray-600 hover:text-red-500 hover:bg-red-500/10 transition-all border border-white/10">
                                <span className="material-icons-outlined text-sm">delete</span>
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};
