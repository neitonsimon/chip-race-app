import React, { useState } from 'react';
import { ScoringSchema, ScoringCriterion, CriterionType } from '../types';

interface ScoringFormulaEditorProps {
    schemas: ScoringSchema[];
    onSave: (schemas: ScoringSchema[]) => void;
    onClose: () => void;
}

const CRITERIA_OPTIONS: { type: CriterionType; label: string; dataType: 'integer' | 'boolean' }[] = [
    { type: 'participants', label: 'Total de Participantes', dataType: 'integer' },
    { type: 'buyin', label: 'Valor do Buy-in', dataType: 'integer' },
    { type: 'itm', label: 'Valor do ITM', dataType: 'integer' },
    { type: 'spent', label: 'Valor Gasto (Rebuy/Addon)', dataType: 'integer' },
    { type: 'rake', label: 'Rake Gerado', dataType: 'integer' },
    { type: 'isFt', label: 'Mesa Final (Sim/Não)', dataType: 'boolean' },
    { type: 'isVip', label: 'É VIP (Sim/Não)', dataType: 'boolean' },
];

export const ScoringFormulaEditor: React.FC<ScoringFormulaEditorProps> = ({ schemas, onSave, onClose }) => {
    const [localSchemas, setLocalSchemas] = useState<ScoringSchema[]>(schemas.length > 0 ? schemas : []);
    const [activeSchemaIndex, setActiveSchemaIndex] = useState<number>(0);

    // If no schemas exist, create a default one
    if (localSchemas.length === 0) {
        setLocalSchemas([{
            id: 'default',
            name: 'Nova Fórmula',
            criteria: []
        }]);
    }

    const activeSchema = localSchemas[activeSchemaIndex];

    const handleAddSchema = () => {
        const newSchema: ScoringSchema = {
            id: `schema-${Date.now()}`,
            name: 'Nova Fórmula',
            criteria: []
        };
        setLocalSchemas([...localSchemas, newSchema]);
        setActiveSchemaIndex(localSchemas.length);
    };

    const handleDeleteSchema = (index: number) => {
        if (localSchemas.length === 1) return; // Prevent deleting last schema
        const newSchemas = localSchemas.filter((_, i) => i !== index);
        setLocalSchemas(newSchemas);
        setActiveSchemaIndex(0);
    };

    const handleUpdateSchemaName = (name: string) => {
        const newSchemas = [...localSchemas];
        newSchemas[activeSchemaIndex] = { ...newSchemas[activeSchemaIndex], name };
        setLocalSchemas(newSchemas);
    };

    const handleAddCriterion = () => {
        const newCriterion: ScoringCriterion = {
            id: `crit-${Date.now()}`,
            type: 'participants',
            label: 'Total de Participantes',
            dataType: 'integer',
            operation: 'divide',
            value: 1
        };
        const newSchemas = [...localSchemas];
        newSchemas[activeSchemaIndex].criteria.push(newCriterion);
        setLocalSchemas(newSchemas);
    };

    const handleRemoveCriterion = (cIndex: number) => {
        const newSchemas = [...localSchemas];
        newSchemas[activeSchemaIndex].criteria = newSchemas[activeSchemaIndex].criteria.filter((_, i) => i !== cIndex);
        setLocalSchemas(newSchemas);
    };

    const handleUpdateCriterion = (cIndex: number, field: keyof ScoringCriterion, value: any) => {
        const newSchemas = [...localSchemas];
        const criterion = newSchemas[activeSchemaIndex].criteria[cIndex];

        if (field === 'type') {
            const option = CRITERIA_OPTIONS.find(o => o.type === value);
            if (option) {
                criterion.type = option.type;
                criterion.label = option.label;
                criterion.dataType = option.dataType;
                // Reset operation based on type
                if (option.dataType === 'boolean') {
                    criterion.operation = 'sum';
                } else {
                    criterion.operation = 'divide';
                }
            }
        } else {
            (criterion as any)[field] = value;
        }

        setLocalSchemas(newSchemas);
    };

    const handleUpdatePositionPoint = (pos: number, points: number) => {
        const newSchemas = [...localSchemas];
        const schema = newSchemas[activeSchemaIndex];
        if (!schema.positionPoints) schema.positionPoints = {};

        if (points === 0 || isNaN(points)) {
            delete schema.positionPoints[pos];
        } else {
            schema.positionPoints[pos] = points;
        }
        setLocalSchemas(newSchemas);
    };

    const handleAddPositionRow = () => {
        const newSchemas = [...localSchemas];
        const schema = newSchemas[activeSchemaIndex];
        if (!schema.positionPoints) schema.positionPoints = {};

        // Find next position
        const maxPos = Object.keys(schema.positionPoints).length > 0
            ? Math.max(...Object.keys(schema.positionPoints).map(Number))
            : 0;
        schema.positionPoints[maxPos + 1] = 0;
        setLocalSchemas(newSchemas);
    };

    return (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-in fade-in">
            <div className="bg-surface-dark border border-white/10 rounded-2xl w-full max-w-5xl shadow-2xl relative flex flex-col max-h-[90vh]">

                {/* Header */}
                <div className="p-6 border-b border-white/10 flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <span className="material-icons-outlined text-primary text-3xl">functions</span>
                        <div>
                            <h3 className="text-xl font-bold text-white">Editor de Fórmulas Globais</h3>
                            <p className="text-xs text-gray-400">Crie regras que podem ser aplicadas a qualquer evento do calendário.</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-white">
                        <span className="material-icons-outlined">close</span>
                    </button>
                </div>

                <div className="flex flex-grow overflow-hidden">
                    {/* Sidebar (List of Schemas) */}
                    <div className="w-64 border-r border-white/10 p-4 bg-black/20 overflow-y-auto">
                        <div className="flex justify-between items-center mb-4">
                            <h4 className="text-xs font-bold text-gray-500 uppercase">Fórmulas Disponíveis</h4>
                            <button onClick={handleAddSchema} className="text-primary hover:text-white">
                                <span className="material-icons-outlined text-sm">add_circle</span>
                            </button>
                        </div>
                        <ul className="space-y-2">
                            {localSchemas.map((schema, index) => (
                                <li key={schema.id} className="group flex items-center justify-between">
                                    <button
                                        onClick={() => setActiveSchemaIndex(index)}
                                        className={`flex-grow text-left px-3 py-2 rounded text-sm font-medium transition-colors ${activeSchemaIndex === index ? 'bg-primary/20 text-white border border-primary/50' : 'text-gray-400 hover:bg-white/5'}`}
                                    >
                                        {schema.name}
                                    </button>
                                    {localSchemas.length > 1 && (
                                        <button onClick={() => handleDeleteSchema(index)} className="hidden group-hover:block text-red-500 ml-2">
                                            <span className="material-icons-outlined text-xs">delete</span>
                                        </button>
                                    )}
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Main Content (Editor) */}
                    <div className="flex-grow p-6 overflow-y-auto custom-scrollbar">
                        {activeSchema && (
                            <div className="space-y-8">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Nome da Fórmula</label>
                                        <input
                                            type="text"
                                            value={activeSchema.name}
                                            onChange={(e) => handleUpdateSchemaName(e.target.value)}
                                            className="w-full bg-black/30 border border-white/10 rounded p-3 text-white focus:border-primary outline-none"
                                            placeholder="Ex: Torneio Semanal (Live)"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
                                    {/* Left: Calculation Criteria */}
                                    <div className="lg:col-span-3 space-y-4">
                                        <div className="flex justify-between items-center mb-2">
                                            <h4 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                                                <span className="material-icons-outlined text-secondary">calculate</span>
                                                Critérios de Cálculo
                                            </h4>
                                            <button
                                                onClick={handleAddCriterion}
                                                className="flex items-center gap-1 text-xs font-bold text-primary hover:text-white bg-primary/10 hover:bg-primary/20 px-3 py-1 rounded transition-colors"
                                            >
                                                <span className="material-icons-outlined text-sm">add</span>
                                                Adicionar Regra
                                            </button>
                                        </div>

                                        {activeSchema.criteria.length === 0 ? (
                                            <div className="text-center py-8 border border-white/5 border-dashed rounded-lg bg-black/10">
                                                <p className="text-gray-500 text-sm">Nenhuma regra de cálculo.</p>
                                            </div>
                                        ) : (
                                            <div className="bg-white/5 rounded-xl overflow-hidden border border-white/5">
                                                <table className="w-full text-left text-sm">
                                                    <thead className="bg-black/30 text-gray-400 font-bold uppercase text-[10px]">
                                                        <tr>
                                                            <th className="px-4 py-3">Elemento</th>
                                                            <th className="px-4 py-3">Lógica</th>
                                                            <th className="px-4 py-3 text-center">Valor</th>
                                                            <th className="px-4 py-3 w-10"></th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="divide-y divide-white/5">
                                                        {activeSchema.criteria.map((crit, idx) => (
                                                            <tr key={crit.id} className="hover:bg-white/5 transition-colors">
                                                                <td className="px-4 py-2">
                                                                    <select
                                                                        value={crit.type}
                                                                        onChange={(e) => handleUpdateCriterion(idx, 'type', e.target.value)}
                                                                        className="w-full bg-black/40 text-white border border-white/5 rounded px-2 py-1 focus:ring-1 focus:ring-primary outline-none cursor-pointer"
                                                                    >
                                                                        {CRITERIA_OPTIONS.map(opt => (
                                                                            <option key={opt.type} value={opt.type} className="bg-[#12141a] text-white">
                                                                                {opt.label}
                                                                            </option>
                                                                        ))}
                                                                    </select>
                                                                </td>
                                                                <td className="px-4 py-2">
                                                                    {crit.dataType === 'integer' ? (
                                                                        <select
                                                                            value={crit.operation}
                                                                            onChange={(e) => handleUpdateCriterion(idx, 'operation', e.target.value)}
                                                                            className="bg-black/50 border border-white/10 rounded px-2 py-1 text-xs text-secondary font-bold outline-none"
                                                                        >
                                                                            <option value="divide" className="bg-[#12141a] text-white">Dividido por ( / )</option>
                                                                            <option value="multiply" className="bg-[#12141a] text-white">Multiplicado por ( * )</option>
                                                                            <option value="sum" className="bg-[#12141a] text-white">Soma fixa ( + )</option>
                                                                        </select>
                                                                    ) : (
                                                                        <span className="text-xs text-gray-500 font-bold flex items-center gap-1">
                                                                            <span className="material-icons-outlined text-[10px]">check_circle</span>
                                                                            Se VERDADEIRO ganha:
                                                                        </span>
                                                                    )}
                                                                </td>
                                                                <td className="px-4 py-2 text-center">
                                                                    <input
                                                                        type="number"
                                                                        value={crit.value}
                                                                        onChange={(e) => handleUpdateCriterion(idx, 'value', parseFloat(e.target.value) || 0)}
                                                                        className="w-20 bg-black/30 border border-white/10 rounded px-2 py-1 text-center text-white font-bold outline-none focus:border-primary"
                                                                    />
                                                                </td>
                                                                <td className="px-4 py-2 text-center">
                                                                    <button onClick={() => handleRemoveCriterion(idx)} className="text-red-500/50 hover:text-red-500 transition-colors">
                                                                        <span className="material-icons-outlined text-sm">remove_circle_outline</span>
                                                                    </button>
                                                                </td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        )}
                                    </div>

                                    {/* Right: Position Points */}
                                    <div className="lg:col-span-2 space-y-4">
                                        <div className="flex justify-between items-center mb-2">
                                            <h4 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                                                <span className="material-icons-outlined text-primary">emoji_events</span>
                                                Pontos por Posição
                                            </h4>
                                            <button
                                                onClick={handleAddPositionRow}
                                                className="text-[10px] font-bold text-gray-400 hover:text-white uppercase tracking-wider"
                                            >
                                                + Adicionar Rank
                                            </button>
                                        </div>

                                        <div className="bg-white/5 rounded-xl border border-white/5 overflow-hidden">
                                            <div className="max-h-[300px] overflow-y-auto custom-scrollbar">
                                                <table className="w-full text-left text-sm">
                                                    <thead className="bg-black/30 text-gray-400 font-bold uppercase text-[10px] sticky top-0 z-10">
                                                        <tr>
                                                            <th className="px-4 py-3">Posição</th>
                                                            <th className="px-4 py-3 text-right">Pontos Fixos</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="divide-y divide-white/5">
                                                        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(pos => (
                                                            <tr key={pos} className="hover:bg-white/5">
                                                                <td className="px-4 py-2 font-bold text-gray-300">{pos}º Lugar</td>
                                                                <td className="px-4 py-2 text-right">
                                                                    <input
                                                                        type="number"
                                                                        value={activeSchema.positionPoints?.[pos] ?? 0}
                                                                        onChange={(e) => handleUpdatePositionPoint(pos, parseInt(e.target.value) || 0)}
                                                                        className="w-20 bg-black/30 border border-white/10 rounded px-2 py-1 text-right text-primary font-black outline-none focus:border-primary"
                                                                    />
                                                                </td>
                                                            </tr>
                                                        ))}
                                                        {/* Custom added positions or dynamic list */}
                                                        {Object.keys(activeSchema.positionPoints || {})
                                                            .map(Number)
                                                            .filter(pos => pos > 9)
                                                            .sort((a, b) => a - b)
                                                            .map(pos => (
                                                                <tr key={pos} className="hover:bg-white/5">
                                                                    <td className="px-4 py-2 font-bold text-gray-300">{pos}º Lugar</td>
                                                                    <td className="px-4 py-2 text-right">
                                                                        <input
                                                                            type="number"
                                                                            value={activeSchema.positionPoints?.[pos] ?? 0}
                                                                            onChange={(e) => handleUpdatePositionPoint(pos, parseInt(e.target.value) || 0)}
                                                                            className="w-20 bg-black/30 border border-white/10 rounded px-2 py-1 text-right text-primary font-black outline-none focus:border-primary"
                                                                        />
                                                                    </td>
                                                                </tr>
                                                            ))
                                                        }
                                                    </tbody>
                                                </table>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-white/10 flex justify-end gap-3">
                    <button onClick={onClose} className="px-6 py-2 text-gray-400 hover:text-white transition-colors font-bold">Cancelar</button>
                    <button
                        onClick={() => onSave(localSchemas)}
                        className="px-8 py-2 bg-gradient-to-r from-primary to-secondary text-white font-bold rounded-full shadow-lg hover:shadow-neon-pink transition-all"
                    >
                        Salvar Fórmulas
                    </button>
                </div>
            </div>
        </div>
    );
};
