import React from 'react';

export const MaintenancePage: React.FC = () => {
    return (
        <div className="min-h-screen bg-[#050310] flex flex-col items-center justify-center relative overflow-hidden px-4">
            {/* Animated Background Elements */}
            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-purple-600/20 rounded-full blur-[120px] animate-pulse" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-600/20 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '1s' }} />
            
            <div className="z-10 flex flex-col items-center text-center max-w-2xl">
                {/* Logo/Icon Area */}
                <div className="relative mb-8 group">
                    <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-blue-600 rounded-full blur-xl opacity-50 group-hover:opacity-100 transition-opacity duration-500 animate-spin-slow" />
                    <div className="relative w-24 h-24 bg-background-dark border border-white/10 rounded-full flex items-center justify-center backdrop-blur-xl">
                        <span className="material-icons-outlined text-5xl text-white animate-bounce">engineering</span>
                    </div>
                </div>

                {/* Main Text */}
                <h1 className="text-4xl md:text-6xl font-black text-white mb-6 tracking-tighter uppercase">
                    Manutenção em <span className="bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">Progresso</span>
                </h1>
                
                <p className="text-gray-400 text-lg md:text-xl leading-relaxed mb-12 font-medium max-w-lg">
                    Estamos refinando a experiência do <span className="text-white font-bold">CHIP RACE</span> para trazer novidades incríveis. Voltaremos em breve!
                </p>

                {/* Status Card */}
                <div className="w-full grid grid-cols-1 md:grid-cols-3 gap-4 mb-12">
                    {[
                        { label: 'Servidores', status: 'Otimizando', color: 'text-purple-400' },
                        { label: 'Base de Dados', status: 'Sincronizando', color: 'text-blue-400' },
                        { label: 'Segurança', status: 'Verificando', color: 'text-emerald-400' }
                    ].map((item, i) => (
                        <div key={i} className="bg-white/5 border border-white/10 backdrop-blur-md rounded-2xl p-4 flex flex-col items-center">
                            <span className="text-[10px] uppercase tracking-widest text-gray-500 mb-1 font-bold">{item.label}</span>
                            <span className={`text-sm font-black uppercase ${item.color}`}>{item.status}</span>
                        </div>
                    ))}
                </div>

                {/* Progress Bar */}
                <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden mb-12">
                    <div className="h-full bg-gradient-to-r from-purple-600 via-blue-500 to-purple-600 w-[65%] animate-shimmer" style={{ backgroundSize: '200% 100%' }} />
                </div>

                {/* Social/Support Links */}
                <div className="flex gap-6 items-center">
                    <div className="flex flex-col items-center gap-2">
                        <p className="text-[10px] text-gray-600 uppercase tracking-[0.2em] font-bold">Fique conectado</p>
                        <div className="flex gap-4">
                            <a href="#" className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 transition-colors">
                                <i className="fab fa-instagram text-white text-lg"></i>
                            </a>
                            <a href="#" className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 transition-colors">
                                <i className="fab fa-whatsapp text-white text-lg"></i>
                            </a>
                        </div>
                    </div>
                </div>
            </div>

            {/* Bottom Branding */}
            <div className="absolute bottom-8 text-center">
                <p className="text-[10px] text-gray-700 uppercase tracking-widest font-bold">© 2026 CHIP RACE • SISTEMA EM ATUALIZAÇÃO</p>
            </div>

            <style>{`
                @keyframes spin-slow {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
                .animate-spin-slow {
                    animation: spin-slow 8s linear infinite;
                }
                @keyframes shimmer {
                    0% { background-position: 100% 0; }
                    100% { background-position: -100% 0; }
                }
                .animate-shimmer {
                    animation: shimmer 2s linear infinite;
                }
            `}</style>
        </div>
    );
};
