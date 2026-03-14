import React from 'react';
import appConfig from '../../src/config/appConfig.json';

interface EditTabProps {
    player: any;
    canEdit: boolean;
    handleAvatarChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    handleDeleteAvatar: () => void;
    handleUpdate: (field: string, value: any) => void;
    handleSocialUpdate: (platform: string, value: string) => void;
    ALL_PLAY_STYLES: string[];
    togglePlayStyle: (style: string) => void;
    handleOpenUploadModal: () => void;
    handleDeleteImage: (e: React.MouseEvent, idx: number) => void;
    setActiveTab: (tab: any) => void;
    handleSaveProfile: () => void;
}

const PLAY_STYLE_DEFINITIONS: Record<string, string> = appConfig.playerProfile.playStyleDefinitions;

export const EditTab: React.FC<EditTabProps> = ({
    player,
    canEdit,
    handleAvatarChange,
    handleDeleteAvatar,
    handleUpdate,
    handleSocialUpdate,
    ALL_PLAY_STYLES,
    togglePlayStyle,
    handleOpenUploadModal,
    handleDeleteImage,
    setActiveTab,
    handleSaveProfile
}) => {
    if (!canEdit) return null;

    return (
        <div className="bg-surface-dark border border-white/10 rounded-3xl p-8 lg:p-12 shadow-2xl animate-in slide-in-from-right duration-300">
            <div className="flex flex-col md:flex-row gap-8">
                {/* EDIT COLUMN 1: Identity */}
                <div className="w-full md:w-1/3 flex flex-col items-center">
                    <div className="relative group mb-6">
                        <img
                            src={player.avatar}
                            alt={player.name}
                            className="w-48 h-48 rounded-full border-4 border-white/10 object-cover"
                        />
                        <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <label className="cursor-pointer p-3 bg-blue-600 rounded-full text-white hover:bg-blue-500 transition-colors shadow-lg" title="Trocar Foto">
                                <span className="material-icons-outlined">upload</span>
                                <input
                                    type="file"
                                    className="hidden"
                                    accept="image/*"
                                    onChange={handleAvatarChange}
                                />
                            </label>
                            <button
                                onClick={handleDeleteAvatar}
                                className="p-3 bg-red-600 rounded-full text-white hover:bg-red-500 transition-colors shadow-lg"
                                title="Remover Foto"
                            >
                                <span className="material-icons-outlined">delete_forever</span>
                            </button>
                        </div>
                    </div>
                    <div className="w-full space-y-4">
                        <div>
                            <label className="block text-sm font-bold text-gray-500 uppercase mb-1">Nome de Exibição</label>
                            <input
                                type="text"
                                value={player.name}
                                onChange={(e) => handleUpdate('name', e.target.value)}
                                className="w-full bg-black/30 border border-white/10 rounded p-3 text-white focus:border-secondary outline-none"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-gray-500 uppercase mb-1">Cidade / Estado</label>
                            <input
                                type="text"
                                value={player.city}
                                onChange={(e) => handleUpdate('city', e.target.value)}
                                className="w-full bg-black/30 border border-white/10 rounded p-3 text-white focus:border-secondary outline-none"
                            />
                        </div>
                        <div className="opacity-70">
                            <label className="block text-sm font-bold text-gray-500 uppercase mb-1">ID Chip Race (Fixo)</label>
                            <input
                                type="text"
                                value={player.numericId ? `CR#${String(player.numericId).padStart(3, '0')}` : (player.id?.length > 20 ? 'CR#GUEST (Pendente)' : `CR#INV (${player.id})`)}
                                disabled
                                className="w-full bg-black/20 border border-white/5 rounded p-3 text-primary font-bold cursor-not-allowed"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-blue-400 uppercase mb-1 flex items-center gap-2">
                                <span className="material-icons-outlined text-sm">poker</span> Nick Suprema
                            </label>
                            <input
                                type="text"
                                value={player.suprema_nickname || ''}
                                onChange={(e) => handleUpdate('suprema_nickname', e.target.value)}
                                className="w-full bg-black/30 border border-white/10 rounded p-3 text-white focus:border-secondary outline-none"
                                placeholder="Seu nickname no App Suprema"
                            />
                        </div>
                    </div>
                </div>

                {/* EDIT COLUMN 2: Details */}
                <div className="w-full md:w-2/3 space-y-6">
                    {/* Bio */}
                    <div>
                        <label className="block text-sm font-bold text-gray-500 uppercase mb-1">Biografia</label>
                        <textarea
                            value={player.bio}
                            onChange={(e) => handleUpdate('bio', e.target.value)}
                            className="w-full h-24 bg-black/30 border border-white/10 rounded p-3 text-white focus:border-secondary outline-none resize-none"
                            placeholder="Conte um pouco sobre sua trajetória no poker..."
                        ></textarea>
                    </div>

                    {/* Socials */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-bold text-pink-500 uppercase mb-1">Instagram</label>
                            <div className="flex items-center bg-black/30 border border-white/10 rounded px-3">
                                <span className="text-gray-500 select-none">@</span>
                                <input
                                    type="text"
                                    value={player.social.instagram?.replace('@', '') || ''}
                                    onChange={(e) => handleSocialUpdate('instagram', '@' + e.target.value)}
                                    className="w-full bg-transparent p-3 text-white outline-none"
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-emerald-500 uppercase mb-1">WhatsApp</label>
                            <div className="flex items-center bg-black/30 border border-white/10 rounded overflow-hidden">
                                <div className="bg-white/5 px-3 py-3 border-r border-white/10 flex items-center gap-1.5 select-none">
                                    <span className="material-icons-outlined text-emerald-500 text-sm">phone</span>
                                    <span className="text-gray-400 font-bold text-sm">+55</span>
                                </div>
                                <input
                                    type="text"
                                    value={player.social.whatsapp?.replace(/^55/, '') || ''}
                                    onChange={(e) => {
                                        const val = e.target.value.replace(/\D/g, '');
                                        handleSocialUpdate('whatsapp', val ? '55' + val : '');
                                    }}
                                    className="w-full bg-transparent p-3 text-white outline-none"
                                    placeholder="(DDD) 99999-9999"
                                />
                            </div>
                            <p className="text-[10px] text-gray-500 mt-1 uppercase font-bold tracking-tight">Insira apenas o DDD e o seu número</p>
                        </div>
                    </div>

                    {/* Play Styles */}
                    <div>
                        <label className="block text-sm font-bold text-gray-500 uppercase mb-2">Estilos de Jogo (Tags)</label>
                        <div className="bg-black/20 p-4 rounded-xl border border-white/5 flex flex-wrap gap-2 overflow-visible">
                            {ALL_PLAY_STYLES.map((style) => {
                                const isSelected = player.playStyles.includes(style);
                                return (
                                    <div key={style} className="group relative">
                                        <button
                                            type="button"
                                            onClick={() => togglePlayStyle(style)}
                                            className={`px-3 py-1 text-sm font-bold rounded-full border transition-all ${isSelected
                                                ? 'bg-secondary text-black border-secondary shadow-neon-blue'
                                                : 'bg-white/5 text-gray-400 border-white/10 hover:border-white/30 hover:text-white'
                                                }`}
                                        >
                                            {style}
                                        </button>
                                    </div>
                                );
                            })}
                        </div>
                    </div>



                    {/* Gallery Manager */}
                    <div>
                        <div className="flex justify-between items-end mb-2">
                            <label className="block text-sm font-bold text-gray-500 uppercase">Gerenciar Galeria</label>
                            <button onClick={handleOpenUploadModal} className="text-sm text-secondary hover:underline font-bold">+ Adicionar Foto Exemplo</button>
                        </div>

                        <div className="grid grid-cols-4 gap-2">
                            {player.gallery.map((img: string, idx: number) => (
                                <div key={idx} className="aspect-square rounded-lg overflow-hidden relative group border border-white/10">
                                    <img src={img} alt="Gallery" className="w-full h-full object-cover" />
                                    <button
                                        onClick={(e) => handleDeleteImage(e, idx)}
                                        className="absolute top-1 right-1 bg-red-600 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                        title="Remover"
                                    >
                                        <span className="material-icons-outlined text-xs">close</span>
                                    </button>
                                </div>
                            ))}
                            {player.gallery.length < 4 && (
                                <button
                                    onClick={handleOpenUploadModal}
                                    className="aspect-square rounded-lg border-2 border-dashed border-white/10 flex flex-col items-center justify-center text-gray-600 hover:text-white hover:border-primary/50 hover:bg-white/5 transition-all"
                                >
                                    <span className="material-icons-outlined">add_photo_alternate</span>
                                    <span className="text-xs">Slot Livre</span>
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Verification Info Section */}
            <div className="mt-8 pt-8 border-t border-white/5 bg-white/[0.02] rounded-2xl p-6">
                <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-xl bg-cyan-500/10 flex items-center justify-center shrink-0 border border-cyan-500/20">
                        <span className="material-icons text-cyan-400 text-xl">verified</span>
                    </div>
                    <div>
                        <h4 className="text-white font-bold mb-1 uppercase tracking-tight text-xs">Como verificar seu usuário</h4>
                        <p className="text-gray-400 text-xs leading-relaxed max-w-2xl">
                            A verificação de usuário é feita de forma manual. Preencha todos os seus dados com informações verdadeiras e atualize sua foto de perfil que o processo de verificação será realizado e o selo de verificado concedido ao usuário.
                        </p>
                    </div>
                </div>
            </div>
            <div className="border-t border-white/10 pt-8 mt-8 flex justify-end gap-4">
                <button onClick={() => setActiveTab('overview')} className="px-6 py-3 rounded-lg text-gray-400 font-bold hover:bg-white/5 transition-colors">Cancelar</button>
                <button onClick={handleSaveProfile} className="px-8 py-3 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-emerald-600 hover:to-green-500 text-white font-bold rounded-lg shadow-lg transform hover:scale-105 transition-all flex items-center gap-2">
                    <span className="material-icons-outlined">save</span> Salvar Alterações
                </button>
            </div>
        </div>
    );
};
