import React from 'react';
import { Command } from '../../../types';

interface EditClosedCommandModalProps {
    editingClosedCommand: Command | null;
    setEditingClosedCommand: (c: Command | null) => void;
    handleUpdateCommandTotal: (id: string, newTotal: number) => Promise<void>;
}

export const EditClosedCommandModal: React.FC<EditClosedCommandModalProps> = ({
    editingClosedCommand, setEditingClosedCommand, handleUpdateCommandTotal
}) => {
    if (!editingClosedCommand) return null;

    const handleSave = async () => {
        const input = document.getElementById('edit-cmd-total') as HTMLInputElement;
        const newTotal = parseFloat(input.value);
        if (isNaN(newTotal) || newTotal < 0) return;
        await handleUpdateCommandTotal(editingClosedCommand.id, newTotal);
        setEditingClosedCommand(null);
    };

    return (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
            <div className="bg-[#0f0a28] border border-white/10 rounded-3xl w-full max-w-sm shadow-2xl p-6">
                <div className="flex items-center gap-3 mb-5">
                    <div className="w-12 h-12 rounded-2xl bg-yellow-500/20 border border-yellow-500/40 flex items-center justify-center">
                        <span className="material-icons-outlined text-yellow-400 text-2xl">edit_note</span>
                    </div>
                    <div>
                        <h4 className="text-base font-display font-black text-white uppercase">Editar Comanda</h4>
                        <p className="text-gray-400 text-xs">{editingClosedCommand.profiles?.name}</p>
                    </div>
                </div>
                <label className="text-xs text-gray-500 uppercase font-bold block mb-2">Ajustar Total (R$)</label>
                <input
                    type="number"
                    step="0.01"
                    min="0"
                    id="edit-cmd-total"
                    defaultValue={Number(editingClosedCommand.total_brl).toFixed(2)}
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white text-lg font-black outline-none focus:border-yellow-400 transition-all mb-4"
                />
                <div className="space-y-2">
                    <button onClick={handleSave} className="w-full bg-yellow-600 hover:bg-yellow-500 text-white font-black py-3 rounded-2xl uppercase tracking-widest text-sm flex items-center justify-center gap-2">
                        <span className="material-icons-outlined text-sm">save</span>Salvar
                    </button>
                    <button onClick={() => setEditingClosedCommand(null)} className="w-full bg-white/5 hover:bg-white/10 text-gray-400 font-bold py-2.5 rounded-2xl uppercase text-xs tracking-widest">Cancelar</button>
                </div>
            </div>
        </div>
    );
};
