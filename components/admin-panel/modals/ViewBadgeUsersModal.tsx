import React, { useEffect, useState } from 'react';
import { supabase } from '../../../src/lib/supabase';
import { BadgePreview } from '../BadgePreview';

interface ViewBadgeUsersModalProps {
    badge: any;
    onClose: () => void;
}

export const ViewBadgeUsersModal: React.FC<ViewBadgeUsersModalProps> = ({ badge, onClose }) => {
    const [users, setUsers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchUsers = async () => {
            const { data, error } = await supabase
                .from('user_badges')
                .select('created_at, awarded_at, profiles(id, name, numeric_id, avatar_url)')
                .eq('badge_template_id', badge.id);

            if (data) {
                const uniqueUsers = data.filter(d => d.profiles).map(d => ({
                    ...(d.profiles as any),
                    awarded_at: d.awarded_at || d.created_at
                })).sort((a, b) => new Date(b.awarded_at).getTime() - new Date(a.awarded_at).getTime());
                setUsers(uniqueUsers);
            }
            setLoading(false);
        };
        fetchUsers();
    }, [badge.id]);

    return (
        <div className="fixed inset-0 z-[200] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-[#0a0720] border border-white/10 rounded-3xl w-full max-w-md overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300">
                <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between">
                    <h3 className="text-white font-black uppercase tracking-widest text-sm flex items-center gap-2">
                        <span className="material-icons-outlined text-primary">group</span>
                        Usuários com a Medalha
                    </h3>
                    <button onClick={onClose} className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center hover:bg-red-500/20 hover:text-red-500 text-gray-400 transition-colors">
                        <span className="material-icons-outlined text-sm">close</span>
                    </button>
                </div>
                
                <div className="p-6">
                    <div className="flex items-center gap-4 mb-6 pb-6 border-b border-white/5">
                        <BadgePreview icon={badge.icon} color={badge.color} size="md" active />
                        <div>
                            <p className="text-white font-black">{badge.title}</p>
                            <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">{users.length} Possuidores</p>
                        </div>
                    </div>

                    <div className="space-y-2 max-h-[300px] overflow-y-auto custom-scrollbar pr-2">
                        {loading ? (
                            <div className="flex justify-center py-8">
                                <div className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                            </div>
                        ) : users.length === 0 ? (
                            <div className="text-center py-8 text-gray-500">
                                <span className="material-icons-outlined text-4xl block mb-2 opacity-30">person_off</span>
                                <p className="text-xs uppercase font-black tracking-widest">Nenhum jogador</p>
                            </div>
                        ) : (
                            users.map((u, idx) => (
                                <div key={idx} className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/10">
                                    <div className="flex items-center gap-3 min-w-0">
                                        <img src={u.avatar_url || `https://ui-avatars.com/api/?name=${u.name}&background=random`} alt="" className="w-8 h-8 rounded-full object-cover shrink-0" />
                                        <div className="min-w-0">
                                            <p className="text-xs font-bold text-white truncate">{u.name}</p>
                                            <p className="text-[10px] text-primary font-black tracking-widest">CR#{String(u.numeric_id).padStart(3, '0')}</p>
                                        </div>
                                    </div>
                                    <div className="text-[9px] text-gray-500 uppercase font-bold text-right shrink-0">
                                        {new Date(u.awarded_at).toLocaleDateString('pt-BR')}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};
