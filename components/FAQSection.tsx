import React, { useState } from 'react';
import { EditableContent } from './EditableContent';

interface FAQItem {
    question: string;
    answer: string;
}

interface FAQSectionProps {
    isAdmin?: boolean;
    faqs?: FAQItem[];
    onUpdateFaqs?: (faqs: FAQItem[]) => void;
}

const DEFAULT_FAQS: FAQItem[] = [
    { question: "Como faço para participar do The Chosen?", answer: "Você pode participar alcançando os primeiros lugares nos Rankings, ganhando um Satélite Jackpot, ou através de um Sit & Go Satélite entre outras opções divulgadas." },
    { question: "O que é o Ecossistema Chip Race?", answer: "É uma rede de torneios, clubes e plataformas interligadas que oferecem diversas formas de qualificação e prêmios. Inclui o QG Chip Race, Poker Online, e mais." },
    { question: "Posso transferir minha vaga?", answer: "As vagas diretas para o The Chosen são nominais e intransferíveis na maioria dos casos. Verifique o regulamento específico de cada modo." },
    { question: "Como funciona o Ranking Anual?", answer: "Acumule pontos em nossos eventos semanais, mensais e especiais ao longo do ano. Os top 10 ganham vaga direta no The Chosen." }
];

export const FAQSection: React.FC<FAQSectionProps> = ({ isAdmin, faqs = [], onUpdateFaqs }) => {
    const [openIndex, setOpenIndex] = useState<number | null>(null);

    const currentFaqs = faqs.length > 0 ? faqs : DEFAULT_FAQS;

    const toggleOpen = (index: number) => {
        setOpenIndex(openIndex === index ? null : index);
    };

    const handleUpdate = (index: number, field: keyof FAQItem, value: string) => {
        if (!onUpdateFaqs) return;
        const newFaqs = [...currentFaqs];
        newFaqs[index] = { ...newFaqs[index], [field]: value };
        onUpdateFaqs(newFaqs);
    };

    const handleAddFaq = () => {
        if (!onUpdateFaqs) return;
        onUpdateFaqs([...currentFaqs, { question: "Nova Pergunta", answer: "Resposta..." }]);
    };

    const handleDeleteFaq = (index: number) => {
        if (!onUpdateFaqs) return;
        const newFaqs = currentFaqs.filter((_, i) => i !== index);
        onUpdateFaqs(newFaqs);
    };

    return (
        <div className="py-20 bg-background-dark relative border-t border-white/5">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-16">
                    <h2 className="text-3xl md:text-4xl font-display font-bold text-gray-900 dark:text-white mb-4">
                        PERGUNTAS <span className="text-primary">FREQUENTES</span>
                    </h2>
                    <div className="h-1 w-24 bg-gradient-to-r from-primary to-secondary mx-auto rounded-full"></div>
                </div>

                <div className="space-y-4">
                    {currentFaqs.map((faq, index) => (
                        <div key={index} className="bg-surface-dark border border-white/5 rounded-2xl overflow-hidden transition-all duration-300 group">
                            <div
                                className="p-6 cursor-pointer flex justify-between items-center bg-white/5 hover:bg-white/10 transition-colors"
                                onClick={() => toggleOpen(index)}
                            >
                                <div className="font-bold text-lg text-white w-full pr-4">
                                    <div onClick={(e) => isAdmin && e.stopPropagation()}>
                                        <EditableContent
                                            isAdmin={isAdmin}
                                            value={faq.question}
                                            onSave={(val) => handleUpdate(index, 'question', val)}
                                        />
                                    </div>
                                </div>
                                <div className="flex items-center gap-4">
                                    {isAdmin && (
                                        <button
                                            onClick={(e) => { e.stopPropagation(); handleDeleteFaq(index); }}
                                            className="text-red-500 hover:text-red-400 p-2"
                                            title="Remover"
                                        >
                                            <span className="material-icons-outlined">delete</span>
                                        </button>
                                    )}
                                    <span className={`material-icons-outlined text-primary transition-transform duration-300 ${openIndex === index ? 'rotate-180' : ''}`}>
                                        expand_more
                                    </span>
                                </div>
                            </div>

                            <div className={`transition-all duration-300 ease-in-out ${openIndex === index ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'}`}>
                                <div className="p-6 pt-0 text-gray-400 leading-relaxed border-t border-white/5 bg-black/20 mt-2">
                                    <EditableContent
                                        isAdmin={isAdmin}
                                        value={faq.answer}
                                        onSave={(val) => handleUpdate(index, 'answer', val)}
                                        type="textarea"
                                    />
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {isAdmin && (
                    <div className="mt-8 text-center">
                        <button
                            onClick={handleAddFaq}
                            className="inline-flex items-center gap-2 px-6 py-3 bg-white/5 hover:bg-white/10 border border-white/10 text-white font-bold rounded-lg transition-colors"
                        >
                            <span className="material-icons-outlined">add</span>
                            Adicionar Pergunta
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};
