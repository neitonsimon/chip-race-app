import React from 'react';

interface BadgePreviewProps {
    icon: string;
    color?: string;
    size?: 'sm' | 'md' | 'lg';
    active?: boolean;
}

export const BadgePreview: React.FC<BadgePreviewProps> = ({ icon, color = '#00E5FF', size = 'sm', active }) => {
    const isLg = size === 'lg';
    const isMd = size === 'md';

    const normalizedColor = color.toLowerCase();
    const isCelestial = normalizedColor === '#fffff0';
    const isSupreme = normalizedColor === '#ff4d79';
    const isLegendary = normalizedColor === '#ffd700' || normalizedColor === '#eab308';
    const isCommon = normalizedColor === '#9ca3af' || normalizedColor === '#94a3b8';
    
    return (
        <div
            className={`relative flex items-center justify-center transition-all duration-300 ${
                isLg ? 'w-20 h-20 rounded-[2rem]' : isMd ? 'w-16 h-16 rounded-[1.5rem]' : 'w-12 h-12 rounded-2xl'
            } ${active ? 'border-2' : 'border border-white/10'} ${
                active && isCelestial ? 'badge-celestial-aura' :
                active && isSupreme ? 'badge-supreme-aura' :
                active && isLegendary ? 'badge-legendary-aura' :
                active && isCommon ? 'opacity-30 grayscale' : ''
            }`}
            style={{
                backgroundColor: active ? `${color}26` : 'rgba(255,255,255,0.05)',
                backgroundImage: active && isSupreme ? 'linear-gradient(135deg, rgba(236,72,153,0.3) 0%, rgba(249,115,22,0.3) 100%)' : 'none',
                borderColor: active ? color : 'rgba(255,255,255,0.1)',
                color: active ? color : '#9ca3af',
                boxShadow: active && !isLegendary && !isSupreme && !isCelestial ? `0 0 20px ${color}40` : 'none'
            }}
        >
            <span 
                className={`material-icons-outlined ${isLg ? 'text-4xl' : isMd ? 'text-3xl' : 'text-2xl'}`}
                style={isSupreme && active ? { background: 'linear-gradient(135deg, #ec4899 0%, #f97316 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' } : {}}
            >{icon}</span>
            {active && (
                <div
                    className="absolute -top-1 -right-1 w-4 h-4 rounded-full border-2 border-[#0c0920] animate-pulse"
                    style={{ 
                        backgroundColor: color,
                        backgroundImage: isSupreme ? 'linear-gradient(135deg, #ec4899 0%, #f97316 100%)' : 'none'
                    }}
                />
            )}
        </div>
    );
};
