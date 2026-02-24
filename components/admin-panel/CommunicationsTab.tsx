import React from 'react';

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
    return (
        <div className="p-8 max-w-4xl mx-auto space-y-12">
            {/* System Notification */}
            <div className="space-y-6">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-primary/20 flex items-center justify-center text-primary shadow-neon-pink">
                        <span className="material-icons-outlined text-2xl">campaign</span>
                    </div>
                    <div>
                        <h3 className="text-xl font-display font-black text-white uppercase tracking-widest">Comunicado Geral</h3>
                        <p className="text-gray-500 text-xs">Enviar mensagem direta para TODOS os usuários do app.</p>
                    </div>
                </div>

                <div className="bg-black/40 border border-white/10 rounded-3xl p-6 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-[10px] font-bold text-gray-500 uppercase mb-2 ml-1">Assunto / Título</label>
                            <input
                                type="text"
                                value={adminSubject}
                                onChange={e => setAdminSubject(e.target.value)}
                                placeholder="Ex: Novo Calendário Disponível"
                                className="w-full bg-[#050214] border border-white/10 rounded-xl px-4 py-3 text-white text-sm font-bold focus:border-primary outline-none"
                            />
                        </div>
                        <div>
                            <label className="block text-[10px] font-bold text-gray-500 uppercase mb-2 ml-1">Categoria</label>
                            <div className="flex gap-2">
                                {(['admin', 'system', 'tournament'] as const).map(cat => (
                                    <button
                                        key={cat}
                                        onClick={() => setAdminMsgCategory(cat)}
                                        className={`flex-1 py-3 rounded-xl border text-[10px] font-black uppercase transition-all ${adminMsgCategory === cat ? 'bg-primary border-primary text-white shadow-neon-pink' : 'bg-white/5 border-white/10 text-gray-500'}`}
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
            <div className="space-y-6">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-cyan-500/20 flex items-center justify-center text-cyan-500 shadow-neon-cyan">
                        <span className="material-icons-outlined text-2xl">poll</span>
                    </div>
                    <div>
                        <h3 className="text-xl font-display font-black text-white uppercase tracking-widest">Nova Enquete</h3>
                        <p className="text-gray-500 text-xs">Engaje a comunidade com perguntas e votações em tempo real.</p>
                    </div>
                </div>

                <div className="bg-black/40 border border-white/10 rounded-3xl p-6 space-y-4">
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
                                    <button onClick={() => setPollOptions(pollOptions.filter((_, i) => i !== idx))} className="p-2 text-gray-600 hover:text-red-500"><span className="material-icons-outlined text-sm">remove_circle_outline</span></button>
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
