import React from 'react';
import { Message } from '../../types';

interface InboxTabProps {
    messages: Message[];
    inboxFilter: 'all' | 'system' | 'gift' | 'admin' | 'private' | 'tournament' | 'poll';
    setInboxFilter: (filter: any) => void;
    setViewedMessage: (msg: Message) => void;
    onMarkAsRead?: (id: string) => void;
    onDeleteMessage?: (id: string) => void;
}

export const InboxTab: React.FC<InboxTabProps> = ({
    messages,
    inboxFilter,
    setInboxFilter,
    setViewedMessage,
    onMarkAsRead,
    onDeleteMessage
}) => {
    const mList = messages || [];
    const filtered = inboxFilter === 'all' ? mList : mList.filter(m => m.category === inboxFilter);

    return (
        <div className="space-y-6 md:space-y-8 animate-in fade-in duration-500 p-4 md:p-8">


            {/* FILTROS */}
            <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
                {['all', 'system', 'gift', 'admin', 'private', 'tournament', 'poll'].map(cat => (
                    <button
                        key={cat}
                        onClick={() => setInboxFilter(cat as any)}
                        className={`px-5 py-2.5 rounded-full text-xs font-bold uppercase tracking-wider transition-all whitespace-nowrap ${inboxFilter === cat ? 'bg-primary text-white shadow-neon-pink' : 'bg-white/5 text-gray-400 hover:bg-white/10'}`}
                    >
                        {cat === 'all' ? '📬 Todas' :
                            cat === 'system' ? '⚙️ Sistema' :
                                cat === 'gift' ? '🎁 Presentes' :
                                    cat === 'admin' ? '📣 Admin' :
                                        cat === 'private' ? '💬 Privadas' :
                                            cat === 'tournament' ? '🏆 Torneio' :
                                                cat === 'poll' ? '📊 Enquetes' : cat}
                    </button>
                ))}
            </div>

            {/* LISTA DE MENSAGENS */}
            <div className="grid grid-cols-1 gap-4">
                {filtered.length === 0 ? (
                    <div className="py-24 text-center bg-white/5 rounded-3xl border border-dashed border-white/10">
                        <span className="material-icons-outlined text-6xl text-gray-700 mb-4 block">mail_outline</span>
                        <p className="text-gray-500 text-lg">Sua caixa de entrada está vazia.</p>
                    </div>
                ) : (
                    filtered.map(msg => (
                        <div
                            key={msg.id}
                            className={`p-4 md:p-6 rounded-2xl md:rounded-3xl border transition-all cursor-pointer group flex gap-4 md:gap-6 items-center flex-wrap md:flex-nowrap ${msg.read ? 'bg-black/20 border-white/5 opacity-80' : 'bg-surface-dark border-primary/30 shadow-[0_0_30px_rgba(217,0,255,0.05)] hover:border-primary/60'}`}
                        >
                            <div
                                onClick={() => {
                                    setViewedMessage(msg);
                                    if (!msg.read && onMarkAsRead) onMarkAsRead(msg.id);
                                }}
                                className={`w-12 h-12 md:w-16 md:h-16 rounded-2xl flex items-center justify-center shrink-0 shadow-lg ${msg.category === 'poll' ? 'bg-cyan-500/20 text-cyan-400' :
                                    msg.category === 'private' ? 'bg-secondary/20 text-secondary' :
                                        msg.category === 'admin' ? 'bg-red-500/20 text-red-400' :
                                            msg.category === 'gift' ? 'bg-yellow-500/20 text-yellow-400' :
                                                'bg-primary/20 text-primary'
                                    }`}>
                                <span className="material-icons-outlined text-2xl md:text-3xl">
                                    {msg.category === 'poll' ? 'poll' :
                                        msg.category === 'private' ? 'chat' :
                                            msg.category === 'gift' ? 'redeem' :
                                                msg.category === 'tournament' ? 'stars' :
                                                    'notifications'}
                                </span>
                            </div>
                            <div
                                onClick={() => {
                                    setViewedMessage(msg);
                                    if (!msg.read && onMarkAsRead) onMarkAsRead(msg.id);
                                }}
                                className="flex-grow min-w-0"
                            >
                                <div className="flex justify-between items-start mb-1">
                                    <span className="text-sm font-bold text-gray-400 flex items-center gap-2">
                                        {msg.from}
                                        {!msg.read && <span className="w-2 h-2 bg-primary rounded-full animate-pulse"></span>}
                                    </span>
                                    <span className="text-[10px] text-gray-600 font-mono tracking-tighter uppercase">{msg.date}</span>
                                </div>
                                <h4 className="text-xl font-bold text-white mb-2 group-hover:text-primary transition-colors truncate">{msg.subject}</h4>
                                <p className="text-base text-gray-500 line-clamp-1 leading-relaxed">{msg.content}</p>
                            </div>

                            {/* DELETE BUTTON */}
                            <div className="flex items-center gap-2 md:opacity-0 group-hover:opacity-100 transition-all ml-auto md:ml-0">
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        if (onDeleteMessage) onDeleteMessage(msg.id);
                                    }}
                                    className="p-3 bg-red-600/10 hover:bg-red-600/20 text-red-500 rounded-xl transition-all border border-red-500/20"
                                    title="Excluir Mensagem"
                                >
                                    <span className="material-icons-outlined text-lg">close</span>
                                </button>
                                <div className="text-gray-600 group-hover:text-primary transition-colors hidden md:block">
                                    <span className="material-icons-outlined">chevron_right</span>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};
