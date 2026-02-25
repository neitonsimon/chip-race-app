import React, { useState } from 'react';
import { supabase } from '../src/lib/supabase';

interface SupportModalProps {
    isOpen: boolean;
    onClose: () => void;
    currentUser: any;
}

export const SupportModal: React.FC<SupportModalProps> = ({ isOpen, onClose, currentUser }) => {
    const [subject, setSubject] = useState('');
    const [content, setContent] = useState('');
    const [isSending, setIsSending] = useState(false);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!subject.trim() || !content.trim()) return;

        setIsSending(true);
        try {
            const { error } = await supabase.from('messages').insert({
                user_id: null, // Global/To Admins
                sender: currentUser.name || 'Usuário',
                sender_id: currentUser.id,
                subject: `[SUPORTE] ${subject}`,
                content: content,
                category: 'support',
                is_read: false
            });

            if (error) throw error;

            alert('Mensagem enviada com sucesso ao time de suporte!');
            setSubject('');
            setContent('');
            onClose();
        } catch (error: any) {
            console.error('Error sending support message:', error);
            alert('Falha ao enviar mensagem: ' + error.message);
        } finally {
            setIsSending(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center px-4">
            <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose}></div>

            <div className="relative w-full max-w-lg bg-surface-dark border border-white/10 rounded-3xl p-8 shadow-2xl animate-in zoom-in-95 duration-200">
                <div className="flex justify-between items-center mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-2xl bg-primary/20 flex items-center justify-center text-primary shadow-neon-pink">
                            <span className="material-icons-outlined">headset_mic</span>
                        </div>
                        <div>
                            <h3 className="text-xl font-display font-black text-white uppercase tracking-widest">Suporte Online</h3>
                            <p className="text-gray-500 text-xs">Fale diretamente com nossa equipe.</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="text-gray-500 hover:text-white transition-colors">
                        <span className="material-icons-outlined">close</span>
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label className="block text-[10px] font-bold text-gray-500 uppercase mb-2 ml-1">Assunto</label>
                        <input
                            type="text"
                            value={subject}
                            onChange={(e) => setSubject(e.target.value)}
                            placeholder="Ex: Problema com recarga, Dúvida sobre ranking..."
                            required
                            className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white text-sm font-bold focus:border-primary outline-none transition-all"
                        />
                    </div>

                    <div>
                        <label className="block text-[10px] font-bold text-gray-500 uppercase mb-2 ml-1">Sua Mensagem</label>
                        <textarea
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                            placeholder="Descreva detalhadamente como podemos te ajudar..."
                            required
                            className="w-full bg-black/40 border border-white/10 rounded-2xl px-4 py-3 text-white text-sm focus:border-primary outline-none min-h-[150px] resize-none transition-all"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={isSending || !subject.trim() || !content.trim()}
                        className="w-full bg-primary hover:bg-white hover:text-black text-white font-black py-4 rounded-2xl transition-all shadow-neon-pink uppercase tracking-widest text-xs flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                        {isSending ? (
                            <span className="animate-spin material-icons-outlined text-sm">sync</span>
                        ) : (
                            <span className="material-icons-outlined text-sm">send</span>
                        )}
                        Enviar Mensagem
                    </button>
                </form>

                <p className="mt-6 text-[10px] text-gray-500 text-center italic">
                    Respondemos em até 24 horas úteis diretamente no seu painel de mensagens.
                </p>
            </div>
        </div>
    );
};
