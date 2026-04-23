import React from 'react';
import { ContentDB } from '../types';

interface FenachimPageProps {
    isAdmin?: boolean;
    content?: ContentDB['fenachim'];
    onNavigate?: (view: string) => void;
}

export const FenachimPage: React.FC<FenachimPageProps> = ({
    isAdmin,
    content,
    onNavigate
}) => {
    // Definimos cores temáticas inspiradas na Festa do Chimarrão (Verde/Erva-mate e Vermelho/Fogo)
    // Usaremos as classes Tailwind para gerar um gradiente de fundo especial

    return (
        <div className="min-h-screen bg-background-dark text-gray-200 font-body">
            {/* Header Section */}
            <div className="relative py-24 overflow-hidden bg-background-dark">
                {/* Overlay Especial Fenachim */}
                <div className="absolute top-0 left-0 w-full h-[600px] bg-gradient-to-b from-green-900/20 via-background-dark/80 to-transparent pointer-events-none"></div>

                <div className="relative z-10 max-w-4xl mx-auto px-4 text-center mt-12 md:mt-16">
                    <div className="flex flex-col items-center justify-center space-y-4 md:space-y-6 mb-8 group">
                        {/* Brilho animado atrás do título */}
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 bg-green-500/20 rounded-full blur-[100px] group-hover:bg-primary/30 transition-all duration-700"></div>

                        <div className="flex items-center gap-4 mb-2">
                             <span className="material-icons-outlined text-4xl sm:text-5xl text-green-500/80 drop-shadow-[0_0_15px_rgba(34,197,94,0.5)]">celebration</span>
                        </div>

                        <span className="text-4xl sm:text-5xl md:text-8xl font-display font-black text-transparent bg-clip-text bg-gradient-to-r from-green-400 via-primary to-green-600 tracking-[0.2em] transform drop-shadow-[0_0_20px_rgba(34,197,94,0.3)]">
                            {content?.header_title || 'FENACHIM'}
                        </span>
                    </div>

                    <p className="text-xl md:text-3xl font-display font-bold text-white max-w-2xl mx-auto drop-shadow-md">
                        {content?.header_subtitle || 'Festa Nacional do Chimarrão'}
                    </p>
                </div>
            </div>

            <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pb-20 -mt-8 relative z-20">
                {/* Box de Informações Principais */}
                <div className="mb-16 bg-white/[0.03] backdrop-blur-md border border-white/5 border-l-4 border-l-green-500 p-8 sm:p-12 rounded-3xl relative overflow-hidden group hover:bg-white/[0.05] transition-all hover:shadow-[0_0_40px_rgba(34,197,94,0.1)] text-center">
                    
                    <h2 className="text-2xl sm:text-3xl font-display font-bold text-green-400 mb-6 flex justify-center items-center gap-3">
                        <span className="material-icons-outlined">info</span>
                        Informações do Evento
                    </h2>

                    <div className="space-y-4 text-lg md:text-xl text-gray-300 font-light leading-relaxed">
                        <p>{content?.description_line1 || 'Torneios oficiais na FENACHIM'}</p>
                        <p className="text-white font-bold">{content?.description_line2 || 'Dias 7, 8 e 10 de maio: Canastra'}</p>
                        <p className="text-white font-bold">{content?.description_line3 || 'Dia 9 de maio: Poker'}</p>
                    </div>

                </div>

                {/* Cards de Competições */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12 mb-16">
                    
                    {/* CANASTRA */}
                    <div className="relative bg-[#0f0a20] border border-white/10 p-8 sm:p-10 rounded-[2rem] hover:border-green-500/40 transition-all duration-500 group overflow-hidden shadow-2xl flex flex-col text-center items-center">
                        <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

                        <div className="w-20 h-20 rounded-full bg-black border border-white/10 flex items-center justify-center relative z-10 mb-6 group-hover:border-green-500/50 transition-colors">
                            <span className="material-icons-outlined text-4xl text-gray-400 group-hover:text-green-400 drop-shadow-[0_0_10px_rgba(34,197,94,0)] group-hover:drop-shadow-[0_0_15px_rgba(34,197,94,0.5)]">style</span>
                        </div>

                        <h3 className="text-2xl md:text-3xl font-display font-black text-white mb-2 uppercase tracking-widest">Canastra</h3>
                        <div className="h-1 w-12 bg-green-500 rounded-full mb-6"></div>

                        <p className="text-gray-400 flex-1 leading-relaxed text-sm md:text-base">
                            O torneio tradicional de Canastra no pavilhão de eventos. Venha testar suas habilidades em duplas!
                        </p>

                        <div className="mt-8 bg-white/5 px-6 py-3 rounded-xl border border-white/5 w-full">
                            <span className="text-xs uppercase text-gray-500 font-bold tracking-widest block mb-1">Datas</span>
                            <span className="text-white font-black text-lg">7, 8 e 10 de maio</span>
                        </div>
                    </div>

                    {/* POKER */}
                    <div className="relative bg-[#0f0a20] border border-white/10 p-8 sm:p-10 rounded-[2rem] hover:border-primary/40 transition-all duration-500 group overflow-hidden shadow-2xl flex flex-col text-center items-center">
                        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

                        <div className="w-20 h-20 rounded-full bg-black border border-white/10 flex items-center justify-center relative z-10 mb-6 group-hover:border-primary/50 transition-colors">
                            <span className="material-icons-outlined text-4xl text-gray-400 group-hover:text-primary drop-shadow-[0_0_10px_rgba(var(--primary-rgb),0)] group-hover:drop-shadow-[0_0_15px_rgba(var(--primary-rgb),0.5)]">playing_cards</span>
                        </div>

                        <h3 className="text-2xl md:text-3xl font-display font-black text-white mb-2 uppercase tracking-widest">Poker</h3>
                        <div className="h-1 w-12 bg-primary rounded-full mb-6"></div>

                        <p className="text-gray-400 flex-1 leading-relaxed text-sm md:text-base">
                            O esporte da mente em grande estilo. Organização Chip Race no coração da FENACHIM.
                        </p>

                        <div className="mt-8 bg-white/5 px-6 py-3 rounded-xl border border-white/5 w-full">
                            <span className="text-xs uppercase text-gray-500 font-bold tracking-widest block mb-1">Data Única</span>
                            <span className="text-white font-black text-lg">9 de maio</span>
                        </div>
                    </div>

                </div>

            </div>
        </div>
    );
};
