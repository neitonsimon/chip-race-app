import React, { useState } from 'react';
import { useApp } from '../../contexts/AppContext';

interface CommunicationsTabProps {
    adminSubject: string;
    setAdminSubject: (s: string) => void;
    adminMsgContent: string;
    setAdminMsgContent: (c: string) => void;
    adminMsgCategory: 'admin' | 'system' | 'tournament';
    setAdminMsgCategory: (c: 'admin' | 'system' | 'tournament') => void;
    pollQuestion: string;
    setPollQuestion: (q: string) => void;
    pollOptions: string[];
    setPollOptions: (opts: string[]) => void;
    handleSendAdminMessage: () => Promise<void>;
    handleCreatePollSubmit: () => void;
}

export const CommunicationsTab: React.FC<CommunicationsTabProps> = ({
    adminSubject, setAdminSubject, adminMsgContent, setAdminMsgContent,
    adminMsgCategory, setAdminMsgCategory, pollQuestion, setPollQuestion,
    pollOptions, setPollOptions, handleSendAdminMessage, handleCreatePollSubmit
}) => {
    const { systemMessageTemplates, handleUpdateSystemMessageTemplate } = useApp();
    const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');
    const [editingTemplate, setEditingTemplate] = useState<any>(null);

    const handleTemplateSelect = (id: string) => {
        setSelectedTemplateId(id);
        const template = systemMessageTemplates.find(t => t.id === id);
        if (template) {
            setEditingTemplate({ ...template });
        } else {
            setEditingTemplate(null);
        }
    };

    const handleSaveTemplate = async () => {
        if (!editingTemplate) return;
        await handleUpdateSystemMessageTemplate(editingTemplate);
        alert('Template atualizado com sucesso!');
    };

    return (
        <div className="p-4 sm:p-8 max-w-4xl mx-auto space-y-8 sm:space-y-12">
            {/* System Templates Manager */}
            <div className="space-y-4 sm:space-y-6">
                <div className="flex items-center gap-4">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-amber-500/20 flex items-center justify-center text-amber-500 shadow-neon-amber shrink-0">
                        <span className="material-icons-outlined text-xl sm:text-2xl">auto_fix_high</span>
                    </div>
                    <div>
                        <h3 className="text-lg sm:text-xl font-display font-black text-white uppercase tracking-widest leading-tight">Mensagens Automáticas</h3>
                        <p className="text-gray-500 text-[10px] sm:text-xs">Edite as mensagens enviadas automaticamente pelo sistema.</p>
                    </div>
                </div>

                <div className="bg-black/40 border border-white/10 rounded-[2rem] p-4 sm:p-6 space-y-6">
                    <div>
                        <label className="block text-[10px] font-bold text-gray-500 uppercase mb-2 ml-1">Selecionar Gatilho / Evento</label>
                        <select
                            value={selectedTemplateId}
                            onChange={(e) => handleTemplateSelect(e.target.value)}
                            className="w-full bg-[#050214] border border-white/10 rounded-xl px-4 py-3 text-white text-sm font-bold focus:border-amber-500 outline-none"
                        >
                            <option value="">Selecione um template para editar...</option>
                            {systemMessageTemplates.map(t => (
                                <option key={t.id} value={t.id}>{t.id} - {t.subject}</option>
                            ))}
                        </select>
                    </div>

                    {editingTemplate && (
                        <div className="animate-in fade-in slide-in-from-top-2 duration-300 space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-[10px] font-bold text-gray-500 uppercase mb-2 ml-1">Assunto / Título</label>
                                    <input
                                        type="text"
                                        value={editingTemplate.subject}
                                        onChange={e => setEditingTemplate({ ...editingTemplate, subject: e.target.value })}
                                        className="w-full bg-[#050214] border border-white/10 rounded-xl px-4 py-3 text-white text-sm font-bold focus:border-amber-500 outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-bold text-gray-500 uppercase mb-2 ml-1">Remetente</label>
                                    <input
                                        type="text"
                                        value={editingTemplate.sender}
                                        onChange={e => setEditingTemplate({ ...editingTemplate, sender: e.target.value })}
                                        className="w-full bg-[#050214] border border-white/10 rounded-xl px-4 py-3 text-white text-sm font-bold focus:border-amber-500 outline-none"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-[10px] font-bold text-gray-500 uppercase mb-2 ml-1">Conteúdo (Use {"{{var}}"} para variáveis)</label>
                                <textarea
                                    value={editingTemplate.content}
                                    onChange={e => setEditingTemplate({ ...editingTemplate, content: e.target.value })}
                                    className="w-full bg-[#050214] border border-white/10 rounded-2xl px-4 py-3 text-white text-sm focus:border-amber-500 outline-none min-h-[100px] resize-none"
                                />
                                <p className="text-[9px] text-gray-500 mt-1 italic leading-relaxed">Variáveis comuns: {"{{name}}"}, {"{{amount}}"}, {"{{event_name}}"}, {"{{position}}"}, {"{{tournament_name}}"}</p>
                            </div>
                            <div>
                                <label className="block text-[10px] font-bold text-gray-500 uppercase mb-2 ml-1">Lógica de Distribuição (Automática)</label>
                                <textarea
                                    value={editingTemplate.distribution_logic || ''}
                                    onChange={e => setEditingTemplate({ ...editingTemplate, distribution_logic: e.target.value })}
                                    className="w-full bg-[#050214] border border-white/10 rounded-xl px-4 py-3 text-gray-400 text-[10px] sm:text-xs italic focus:border-amber-500 outline-none min-h-[40px] resize-none"
                                    placeholder="Descreva quando esta mensagem é disparada..."
                                />
                            </div>
                            <div className="flex items-center gap-4">
                                <label className="flex items-center gap-2 cursor-pointer group">
                                    <input
                                        type="checkbox"
                                        checked={editingTemplate.is_active}
                                        onChange={e => setEditingTemplate({ ...editingTemplate, is_active: e.target.checked })}
                                        className="hidden"
                                    />
                                    <div className={`w-10 h-5 rounded-full transition-all relative ${editingTemplate.is_active ? 'bg-amber-500' : 'bg-white/10 border border-white/10'}`}>
                                        <div className={`absolute top-1 w-3 h-3 rounded-full bg-white transition-all ${editingTemplate.is_active ? 'left-6' : 'left-1'}`}></div>
                                    </div>
                                    <span className="text-[10px] font-black uppercase text-gray-400 group-hover:text-white">Template Ativo</span>
                                </label>
                            </div>
                            <button
                                onClick={handleSaveTemplate}
                                className="w-full bg-amber-500 hover:bg-white hover:text-amber-500 text-white font-black py-4 rounded-2xl transition-all shadow-neon-amber uppercase tracking-widest text-xs flex items-center justify-center gap-2"
                            >
                                <span className="material-icons-outlined text-sm">save</span> Salvar Alterações no Template
                            </button>
                        </div>
                    )}
                </div>
            </div>

            <div className="h-px bg-white/5 w-full"></div>

            {/* System Notification */}
            <div className="space-y-4 sm:space-y-6">
                <div className="flex items-center gap-4">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-primary/20 flex items-center justify-center text-primary shadow-neon-pink shrink-0">
                        <span className="material-icons-outlined text-xl sm:text-2xl">campaign</span>
                    </div>
                    <div>
                        <h3 className="text-lg sm:text-xl font-display font-black text-white uppercase tracking-widest leading-tight">Comunicado Geral</h3>
                        <p className="text-gray-500 text-[10px] sm:text-xs">Enviar mensagem direta para TODOS os usuários do app.</p>
                    </div>
                </div>

                <div className="bg-black/40 border border-white/10 rounded-[2rem] p-4 sm:p-6 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-[10px] font-bold text-gray-500 uppercase mb-2 ml-1">Assunto / Título</label>
                            <input
                                type="text"
                                value={adminSubject}
                                onChange={e => setAdminSubject(e.target.value)}
                                placeholder="Ex: Novo Calendário Disponível"
                                className="w-full bg-[#050214] border border-white/10 rounded-xl px-4 py-3 text-white text-sm font-bold focus:border-primary outline-none shadow-sm"
                            />
                        </div>
                        <div>
                            <label className="block text-[10px] font-bold text-gray-500 uppercase mb-2 ml-1">Categoria</label>
                            <div className="flex gap-2">
                                {(['admin', 'system', 'tournament'] as const).map(cat => (
                                    <button
                                        key={cat}
                                        onClick={() => setAdminMsgCategory(cat)}
                                        className={`flex-1 py-3 rounded-xl border text-[9px] sm:text-[10px] font-black uppercase transition-all ${adminMsgCategory === cat ? 'bg-primary border-primary text-white shadow-neon-pink' : 'bg-white/5 border-white/10 text-gray-500'}`}
                                    >
                                        {cat === 'admin' ? 'Admin' : cat === 'system' ? 'Sistema' : 'Torneio'}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                    <div>
                        <label className="block text-[10px] font-bold text-gray-500 uppercase mb-2 ml-1">Conteúdo da Mensagem</label>
                        <textarea
                            value={adminMsgContent}
                            onChange={e => setAdminMsgContent(e.target.value)}
                            placeholder="Escreva aqui os detalhes do comunicado..."
                            className="w-full bg-[#050214] border border-white/10 rounded-2xl px-4 py-3 text-white text-sm focus:border-primary outline-none min-h-[120px] resize-none"
                        />
                    </div>
                    <button
                        onClick={handleSendAdminMessage}
                        disabled={!adminSubject || !adminMsgContent}
                        className="w-full bg-primary hover:bg-white hover:text-black text-white font-black py-4 rounded-2xl transition-all shadow-neon-pink uppercase tracking-widest text-xs flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                        <span className="material-icons-outlined text-sm">send</span> Disparar Comunicado
                    </button>
                </div>
            </div>

            {/* Poll Creation */}
            <div className="space-y-4 sm:space-y-6">
                <div className="flex items-center gap-4">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-cyan-500/20 flex items-center justify-center text-cyan-500 shadow-neon-cyan shrink-0">
                        <span className="material-icons-outlined text-xl sm:text-2xl">poll</span>
                    </div>
                    <div>
                        <h3 className="text-lg sm:text-xl font-display font-black text-white uppercase tracking-widest leading-tight">Nova Enquete</h3>
                        <p className="text-gray-500 text-[10px] sm:text-xs">Engaje a comunidade com perguntas em tempo real.</p>
                    </div>
                </div>

                <div className="bg-black/40 border border-white/10 rounded-[2rem] p-4 sm:p-6 space-y-4">
                    <div>
                        <label className="block text-[10px] font-bold text-gray-500 uppercase mb-2 ml-1">Pergunta da Enquete</label>
                        <input
                            type="text"
                            value={pollQuestion}
                            onChange={e => setPollQuestion(e.target.value)}
                            placeholder="Qual torneio você prefere no Domingo?"
                            className="w-full bg-[#050214] border border-white/10 rounded-xl px-4 py-3 text-white text-sm font-bold focus:border-cyan-500 outline-none"
                        />
                    </div>
                    <div className="space-y-3">
                        <label className="block text-[10px] font-bold text-gray-500 uppercase mb-2 ml-1">Opções de Resposta</label>
                        {pollOptions.map((opt, idx) => (
                            <div key={idx} className="flex gap-2">
                                <input
                                    type="text"
                                    value={opt}
                                    onChange={e => {
                                        const newOpts = [...pollOptions];
                                        newOpts[idx] = e.target.value;
                                        setPollOptions(newOpts);
                                    }}
                                    placeholder={`Opção ${idx + 1}`}
                                    className="flex-1 bg-[#050214] border border-white/5 rounded-xl px-4 py-2.5 text-white text-xs outline-none focus:border-cyan-500"
                                />
                                {pollOptions.length > 2 && (
                                    <button onClick={() => setPollOptions(pollOptions.filter((_, i) => i !== idx))} className="p-2 text-gray-600 hover:text-red-500 transition-colors"><span className="material-icons-outlined text-sm">remove_circle_outline</span></button>
                                )}
                            </div>
                        ))}
                        <button onClick={() => setPollOptions([...pollOptions, ''])} className="text-[10px] font-black text-cyan-500 uppercase flex items-center gap-1 hover:text-white transition-colors ml-1">
                            <span className="material-icons-outlined text-xs">add</span> Adicionar Opção
                        </button>
                    </div>
                    <button
                        onClick={handleCreatePollSubmit}
                        disabled={!pollQuestion || pollOptions.filter(o => o.trim()).length < 2}
                        className="w-full bg-cyan-500 hover:bg-white hover:text-cyan-500 text-white font-black py-4 rounded-2xl transition-all shadow-neon-cyan uppercase tracking-widest text-xs flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                        <span className="material-icons-outlined text-sm">publish</span> Publicar Enquete
                    </button>
                </div>
            </div>
        </div>
    );
};
