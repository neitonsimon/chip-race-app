import React, { useState, useEffect } from 'react';
import { supabase } from '../src/lib/supabase';

interface ResetPasswordProps {
    onComplete: () => void;
    onCancel: () => void;
}

export const ResetPassword: React.FC<ResetPasswordProps> = ({ onComplete, onCancel }) => {
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [message, setMessage] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (password !== confirmPassword) {
            setError('As senhas não coincidem.');
            return;
        }
        if (password.length < 6) {
            setError('A senha deve ter pelo menos 6 caracteres.');
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const { error } = await supabase.auth.updateUser({
                password: password
            });
            if (error) throw error;

            setMessage('Sua senha foi atualizada com sucesso! Redirecionando...');
            setTimeout(() => {
                onComplete();
            }, 2000);
        } catch (err: any) {
            setError(err.message || 'Erro ao atualizar senha.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-[100dvh] py-12 sm:py-24 flex items-center justify-center bg-[#050821] px-4 overflow-y-auto">
            <div className="w-full max-w-md bg-white dark:bg-surface-dark border border-gray-200 dark:border-white/10 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden my-auto">
                
                {/* Glow Effect */}
                <div className="absolute -top-20 -right-20 w-64 h-64 bg-primary/20 rounded-full blur-[80px] pointer-events-none"></div>

                <div className="relative z-10 text-center mb-8">
                    <div className="flex items-center justify-center mb-4 sm:mb-6">
                        <img src="/cr-logo.png" alt="Chip Race" className="h-16 sm:h-20 w-auto drop-shadow-2xl" />
                    </div>
                    <h2 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white uppercase tracking-wider">
                        Nova Senha
                    </h2>
                    <p className="text-xs sm:text-sm text-gray-500 mt-2">
                        Digite sua nova senha abaixo para recuperar o acesso.
                    </p>
                </div>

                {error && (
                    <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded text-xs sm:text-sm text-center">
                        {error}
                    </div>
                )}

                {message && (
                    <div className="mb-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded text-xs sm:text-sm text-center">
                        {message}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Nova Senha</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full bg-gray-50 dark:bg-black/20 border border-gray-300 dark:border-white/10 rounded-lg px-4 py-2.5 sm:py-3 text-sm sm:text-base text-gray-900 dark:text-white focus:outline-none focus:border-primary"
                            placeholder="Mínimo 6 caracteres"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Confirmar Nova Senha</label>
                        <input
                            type="password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            className="w-full bg-gray-50 dark:bg-black/20 border border-gray-300 dark:border-white/10 rounded-lg px-4 py-2.5 sm:py-3 text-sm sm:text-base text-gray-900 dark:text-white focus:outline-none focus:border-primary"
                            placeholder="Repita a senha"
                            required
                        />
                    </div>

                    <button 
                        disabled={loading || !!message} 
                        type="submit" 
                        className="w-full bg-gradient-to-r from-primary to-accent hover:from-accent hover:to-primary text-white font-bold py-3 sm:py-3.5 rounded-full shadow-lg hover:shadow-neon-pink transition-all duration-300 mt-4 disabled:opacity-50 text-sm sm:text-base uppercase tracking-widest"
                    >
                        {loading ? 'Processando...' : 'Atualizar Senha'}
                    </button>
                </form>

                <button onClick={onCancel} className="absolute top-4 right-4 text-gray-400 hover:text-white">
                    <span className="material-icons-outlined text-xl">close</span>
                </button>
            </div>
        </div>
    );
};
