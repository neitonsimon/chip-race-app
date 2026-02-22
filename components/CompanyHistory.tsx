import React, { useState, useRef } from 'react';
import { EditableContent } from './EditableContent';
import { supabase } from '../src/lib/supabase';

interface TimelineEvent {
    year: string;
    title: string;
    description: string;
    imageUrl?: string;
}

interface CompanyHistoryProps {
    isAdmin?: boolean;
    timeline?: TimelineEvent[];
    onUpdateTimeline?: (timeline: TimelineEvent[]) => void;
}

const DEFAULT_TIMELINE: TimelineEvent[] = [
    { year: "2014", title: "O Início da Jornada", description: "O primeiro clube abriu suas portas com uma pequena mas apaixonada comunidade de jogadores." },
    { year: "2016", title: "Expansão Regional", description: "Realização do primeiro grande torneio estadual com premiação recorde." },
    { year: "2019", title: "O Salto Online", description: "Lançamento da plataforma online durante a transição do mercado, conectando milhares." },
    { year: "2023", title: "Nova Sede QG Chip Race", description: "Inauguração do complexo de poker master, unindo esporte da mente e entretenimento." },
    { year: "2026", title: "The Chosen", description: "Consolidação da marca com o megaevento anual distribuindo vagas para o principal torneio." },
];

export const CompanyHistory: React.FC<CompanyHistoryProps> = ({ isAdmin, timeline = [], onUpdateTimeline }) => {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isOpen, setIsOpen] = useState(false);
    const [uploadingIndex, setUploadingIndex] = useState<number | null>(null);
    const [selectedTimelineImage, setSelectedTimelineImage] = useState<string | null>(null);

    const currentTimeline = timeline.length > 0 ? timeline : DEFAULT_TIMELINE;

    const handleUpdate = (index: number, field: keyof TimelineEvent, value: string) => {
        if (!onUpdateTimeline) return;
        const newTimeline = [...currentTimeline];
        newTimeline[index] = { ...newTimeline[index], [field]: value };
        onUpdateTimeline(newTimeline);
    };

    const handleAddEvent = () => {
        if (!onUpdateTimeline) return;
        onUpdateTimeline([...currentTimeline, { year: "Novo Ano", title: "Novo Evento", description: "Descrição..." }]);
    };

    const handleDeleteEvent = (index: number) => {
        if (!onUpdateTimeline) return;
        const newTimeline = currentTimeline.filter((_, i) => i !== index);
        onUpdateTimeline(newTimeline);
    };

    const handleImageUpload = async (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !onUpdateTimeline) return;

        try {
            setUploadingIndex(index);

            // Tenta usar storage, se falhar usa base64
            const fileExt = file.name.split('.').pop();
            const fileName = `${Math.random()}.${fileExt}`;
            const filePath = `timeline/${fileName}`;

            const { data, error } = await supabase.storage
                .from('images')
                .upload(filePath, file);

            let finalUrl = '';

            if (data) {
                const { data: { publicUrl } } = supabase.storage
                    .from('images')
                    .getPublicUrl(filePath);
                finalUrl = publicUrl;
            } else {
                // Fallback para Base64 se o storage não estiver configurado
                const reader = new FileReader();
                finalUrl = await new Promise((resolve) => {
                    reader.onloadend = () => resolve(reader.result as string);
                    reader.readAsDataURL(file);
                });
            }

            const newTimeline = [...currentTimeline];
            newTimeline[index] = { ...newTimeline[index], imageUrl: finalUrl };
            onUpdateTimeline(newTimeline);
        } catch (error) {
            console.error('Erro no upload:', error);
            alert('Erro ao subir imagem. Tente novamente.');
        } finally {
            setUploadingIndex(null);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    return (
        <div className="py-20 bg-background-light dark:bg-background-dark relative border-t border-gray-200 dark:border-white/5">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                <h2 className="text-3xl md:text-4xl font-display font-bold text-gray-900 dark:text-white mb-6">
                    NOSSA <span className="text-primary">HISTÓRIA</span>
                </h2>
                <div className="h-1 w-24 bg-gradient-to-r from-primary to-secondary mx-auto rounded-full mb-8"></div>
                <p className="text-gray-500 max-w-2xl mx-auto mb-10 leading-relaxed text-lg">
                    São mais de 12 anos transformando o cenário do poker. Uma trajetória de inovação, grandes prêmios e uma comunidade que cresce a cada desafio.
                </p>

                <button
                    onClick={() => setIsOpen(true)}
                    className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-gradient-to-r from-primary to-accent text-white font-bold rounded-full shadow-lg hover:scale-105 transition-all text-lg"
                >
                    <span className="material-icons-outlined">history</span>
                    Descobrir Nossa História
                </button>
            </div>

            {isOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-surface-dark border border-white/10 rounded-2xl w-full max-w-3xl shadow-2xl relative animate-float flex flex-col max-h-[90vh]">

                        <div className="p-6 overflow-y-auto custom-scrollbar">
                            <button
                                onClick={() => setIsOpen(false)}
                                className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors z-10 p-2"
                            >
                                <span className="material-icons-outlined text-2xl">close</span>
                            </button>

                            <div className="text-center mb-10 mt-4">
                                <span className="material-icons-outlined text-5xl text-primary mb-4 drop-shadow-[0_0_15px_rgba(236,72,153,0.5)]">auto_awesome</span>
                                <h3 className="text-3xl font-display font-black text-white uppercase tracking-wider">
                                    Timeline de 12 Anos
                                </h3>
                            </div>

                            <div className="relative pl-8 md:pl-0">
                                {/* Central line for desktop, left line for mobile */}
                                <div className="absolute left-8 md:left-1/2 top-0 bottom-0 w-1 bg-gradient-to-b from-primary via-secondary to-accent -translate-x-1/2 opacity-20"></div>

                                <div className="space-y-12">
                                    {currentTimeline.map((item, index) => (
                                        <div key={index} className={`relative flex items-center justify-center md:justify-between w-full group ${index % 2 === 0 ? 'md:flex-row-reverse' : ''}`}>

                                            {/* Timeline dot */}
                                            <div className="absolute left-8 md:left-1/2 w-8 h-8 rounded-full bg-background-dark border-4 border-primary z-10 -translate-x-1/2 flex items-center justify-center shadow-[0_0_15px_rgba(236,72,153,0.5)]">
                                                <div className="w-2 h-2 rounded-full bg-white animate-pulse"></div>
                                            </div>

                                            {/* Content Box */}
                                            <div className={`w-full pl-16 md:pl-0 md:w-[45%] ${index % 2 === 0 ? 'md:pl-8' : 'md:pr-8 text-left md:text-right'}`}>
                                                <div className="bg-white/5 border border-white/10 p-6 rounded-2xl hover:bg-white/10 transition-all duration-300 relative group-hover:-translate-y-1">

                                                    {isAdmin && (
                                                        <button
                                                            onClick={() => handleDeleteEvent(index)}
                                                            className="absolute top-2 right-2 text-red-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                                                        >
                                                            <span className="material-icons-outlined text-sm">delete</span>
                                                        </button>
                                                    )}

                                                    <span className="text-primary font-black text-2xl mb-2 block font-display tracking-widest drop-shadow-[0_0_10px_rgba(236,72,153,0.3)]">
                                                        <EditableContent
                                                            isAdmin={isAdmin}
                                                            value={item.year}
                                                            onSave={(val) => handleUpdate(index, 'year', val)}
                                                        />
                                                    </span>
                                                    <h4 className="text-white font-bold text-xl mb-3">
                                                        <EditableContent
                                                            isAdmin={isAdmin}
                                                            value={item.title}
                                                            onSave={(val) => handleUpdate(index, 'title', val)}
                                                        />
                                                    </h4>
                                                    <p className="text-gray-400 leading-relaxed text-sm">
                                                        <EditableContent
                                                            isAdmin={isAdmin}
                                                            value={item.description}
                                                            onSave={(val) => handleUpdate(index, 'description', val)}
                                                            type="textarea"
                                                        />
                                                    </p>

                                                    {/* Espaço para Imagem */}
                                                    <div className="mt-4 relative group/img">
                                                        {item.imageUrl ? (
                                                            <div className="relative rounded-xl overflow-hidden aspect-video border border-white/10 group">
                                                                <img
                                                                    src={item.imageUrl}
                                                                    alt={item.title}
                                                                    onClick={() => setSelectedTimelineImage(item.imageUrl || null)}
                                                                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110 cursor-pointer"
                                                                />
                                                                {isAdmin && (
                                                                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                                                        <button
                                                                            onClick={() => {
                                                                                setUploadingIndex(index);
                                                                                fileInputRef.current?.click();
                                                                            }}
                                                                            className="bg-white/20 hover:bg-white/40 p-2 rounded-full transition-colors"
                                                                            title="Trocar Foto"
                                                                        >
                                                                            <span className="material-icons-outlined text-white">edit</span>
                                                                        </button>
                                                                        <button
                                                                            onClick={() => handleUpdate(index, 'imageUrl' as any, '')}
                                                                            className="bg-red-500/50 hover:bg-red-500/70 p-2 rounded-full transition-colors"
                                                                            title="Remover Foto"
                                                                        >
                                                                            <span className="material-icons-outlined text-white">delete</span>
                                                                        </button>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        ) : (
                                                            isAdmin && (
                                                                <button
                                                                    onClick={() => {
                                                                        setUploadingIndex(index);
                                                                        fileInputRef.current?.click();
                                                                    }}
                                                                    className="w-full aspect-video border-2 border-dashed border-white/10 rounded-xl flex flex-col items-center justify-center gap-2 hover:border-primary/50 hover:bg-primary/5 transition-all group"
                                                                >
                                                                    {uploadingIndex === index ? (
                                                                        <div className="w-8 h-8 border-2 border-primary border-t-transparent animate-spin rounded-full"></div>
                                                                    ) : (
                                                                        <>
                                                                            <span className="material-icons-outlined text-3xl text-gray-500 group-hover:text-primary transition-colors">add_a_photo</span>
                                                                            <span className="text-xs text-gray-500 group-hover:text-primary transition-colors">Adicionar Foto</span>
                                                                        </>
                                                                    )}
                                                                </button>
                                                            )
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {isAdmin && (
                                    <div className="mt-12 text-center pb-8">
                                        <button
                                            onClick={handleAddEvent}
                                            className="inline-flex items-center gap-2 px-6 py-3 bg-white/5 hover:bg-white/10 border border-white/10 text-white font-bold rounded-lg transition-colors"
                                        >
                                            <span className="material-icons-outlined">add</span>
                                            Adicionar Evento
                                        </button>
                                    </div>
                                )}

                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    className="hidden"
                                    accept="image/*"
                                    onChange={(e) => uploadingIndex !== null && handleImageUpload(uploadingIndex, e)}
                                />
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* LIGHTBOX PARA IMAGENS DA TIMELINE */}
            {selectedTimelineImage && (
                <div
                    className="fixed inset-0 z-[200] bg-black/95 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-300 cursor-zoom-out"
                    onClick={() => setSelectedTimelineImage(null)}
                >
                    <button className="absolute top-6 right-6 text-white/50 hover:text-white transition-colors z-[210]">
                        <span className="material-icons-outlined text-4xl">close</span>
                    </button>
                    <div className="relative max-w-5xl w-full max-h-[90vh] flex items-center justify-center">
                        <img
                            src={selectedTimelineImage}
                            alt="Visualização ampliada"
                            className="max-h-[90vh] max-w-full object-contain rounded-lg shadow-2xl animate-in zoom-in duration-300"
                            onClick={(e) => e.stopPropagation()}
                        />
                    </div>
                </div>
            )}
        </div>
    );
};
