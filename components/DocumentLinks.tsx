import React from 'react';
import { useApp } from '../contexts/AppContext';

export const DocumentLinks: React.FC = () => {
    const { contentDB } = useApp();
    
    const defaultDocuments = [
        {
            title: "ADTP 2025",
            subtitle: "Regulamento dos torneios de poker da américa latina",
            icon: "menu_book",
            url: "#",
            color: "from-amber-500 to-orange-600"
        },
        {
            title: "Anexos Exemplos ADTP",
            subtitle: "Modelos e exemplificações das regras ADTP",
            icon: "description",
            url: "#",
            color: "from-blue-500 to-indigo-600"
        },
        {
            title: "TDA 2022",
            subtitle: "POKER TOURNAMENT DIRECTORS ASSOCIATION",
            icon: "gavel",
            url: "#",
            color: "from-emerald-500 to-teal-600"
        }
    ];

    const documents = contentDB.documents || defaultDocuments;

    return (
        <section className="py-16 px-4 bg-surface-light dark:bg-surface-dark/30">
            <div className="max-w-7xl mx-auto">
                <div className="text-center mb-12">
                    <h2 className="text-3xl md:text-4xl font-black text-white mb-4 tracking-tight">
                        DOCUMENTOS DE <span className="text-primary">REGULAMENTO</span>
                    </h2>
                    <p className="text-gray-400 max-w-2xl mx-auto">
                        Acesse as normas e regulamentos oficiais que regem nossas competições e eventos.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {documents.map((doc, index) => (
                        <a
                            key={index}
                            href={doc.url && doc.url !== '#' && doc.url.trim() !== '' ? (doc.url.startsWith('http') ? doc.url : `https://${doc.url.trim()}`) : '#'}
                            onClick={(e) => {
                                if (!doc.url || doc.url === '#' || doc.url.trim() === '') {
                                    e.preventDefault();
                                    alert('Este documento ainda não foi configurado. Solicite a atualização à administração.');
                                }
                            }}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="group relative overflow-hidden rounded-2xl p-px bg-gradient-to-b from-white/10 to-transparent hover:from-primary/50 transition-all duration-500 shadow-2xl"
                        >
                            <div className="relative bg-surface-dark h-full p-8 rounded-[15px] flex flex-col items-center text-center">
                                {/* Icon Background Glow */}
                                <div className={`absolute top-0 left-1/2 -translate-x-1/2 w-24 h-24 bg-gradient-to-br ${doc.color} opacity-0 group-hover:opacity-20 blur-3xl transition-opacity duration-500`}></div>
                                
                                <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${doc.color} flex items-center justify-center mb-6 shadow-lg group-hover:scale-110 transition-transform duration-500`}>
                                    <span className="material-icons-outlined text-white text-3xl">{doc.icon}</span>
                                </div>

                                <h3 className="text-xl font-bold text-white mb-2 group-hover:text-primary transition-colors">
                                    {doc.title}
                                </h3>
                                <p className="text-sm text-gray-400 leading-relaxed">
                                    {doc.subtitle}
                                </p>

                                <div className="mt-8 flex items-center gap-2 text-primary font-bold text-sm uppercase tracking-widest group-hover:gap-4 transition-all">
                                    <span>Visualizar PDF</span>
                                    <span className="material-icons-outlined text-sm">arrow_forward</span>
                                </div>
                            </div>
                        </a>
                    ))}
                </div>
            </div>
        </section>
    );
};
