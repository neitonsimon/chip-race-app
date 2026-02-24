import React from 'react';

const VIP_ICONS: Record<string, string> = { vip_master: '👑', vip_anual: '💎', vip_trimestral: '⭐' };
const VIP_COLORS: Record<string, string> = {
    vip_master: 'text-yellow-400 bg-yellow-500/20 border-yellow-500/40',
    vip_anual: 'text-cyan-400 bg-cyan-500/20 border-cyan-500/40',
    vip_trimestral: 'text-purple-400 bg-purple-500/20 border-purple-500/40',
};

interface PlayerNameProps {
    p: any;
}

export const PlayerName: React.FC<PlayerNameProps> = ({ p }) => (
    <div className="flex items-center gap-1.5">
        <span className={`font-bold text-sm ${p?.vip_status ? 'text-white' : 'text-gray-200'}`}>{p?.name}</span>
        {p?.vip_status && <span title={p.vip_status}>{VIP_ICONS[p.vip_status]}</span>}
        {p?.vip_status && <span className={`text-[8px] font-black px-1.5 py-0.5 rounded border ${VIP_COLORS[p.vip_status] || ''}`}>{p.vip_status === 'vip_master' ? 'MASTER' : p.vip_status === 'vip_anual' ? 'ANUAL' : 'TRIM.'}</span>}
    </div>
);
