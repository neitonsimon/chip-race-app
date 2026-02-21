import React, { useState } from 'react';
import { supabase } from '../src/lib/supabase';

interface AuthProps {
    onLogin: () => void; // No args needed, session handled in App
    onCancel: () => void;
}

type AuthMode = 'login' | 'signup' | 'forgot';

export const Auth: React.FC<AuthProps> = ({ onLogin, onCancel }) => {
    const [mode, setMode] = useState<AuthMode>('login');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [fullName, setFullName] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [message, setMessage] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setMessage(null);

        try {
            if (mode === 'signup') {
                const { data, error } = await supabase.auth.signUp({
                    email,
                    password,
                    options: {
                        data: {
                            name: fullName,
                            avatar_url: `https://ui-avatars.com/api/?name=${fullName.replace(' ', '+')}&background=random`
                        }
                    }
                });
                if (error) throw error;

                // If session exists immediately, it means email confirmation is disabled
                if (data.session) {
                    onLogin();
                    return;
                }

                setMessage('Cadastro realizado com sucesso! Faça login para continuar.');
                setMode('login');
            } else if (mode === 'login') {
                const { error } = await supabase.auth.signInWithPassword({
                    email,
                    password,
                });
                if (error) throw error;
                onLogin();
            } else if (mode === 'forgot') {
                const { error } = await supabase.auth.resetPasswordForEmail(email, {
                    redirectTo: window.location.origin + '/reset-password',
                });
                if (error) throw error;
                setMessage('Link de recuperação enviado para seu e-mail.');
            }
        } catch (err: any) {
            setError(err.message || 'Ocorreu um erro.');
        } finally {
            setLoading(false);
        }
    };

    const handleSocialLogin = async (provider: 'google' | 'apple' | 'facebook') => {
        try {
            const { error } = await supabase.auth.signInWithOAuth({
                provider: provider,
                options: {
                    redirectTo: window.location.origin
                }
            });
            if (error) throw error;
        } catch (err: any) {
            setError(err.message || 'Erro no login social.');
        }
    };

    return (
        <div className="min-h-screen pt-24 pb-12 flex items-center justify-center bg-[#050821] px-4">
            <div className="w-full max-w-md bg-white dark:bg-surface-dark border border-gray-200 dark:border-white/10 rounded-3xl p-8 shadow-2xl relative overflow-hidden">

                {/* Glow Effect */}
                <div className="absolute -top-20 -right-20 w-64 h-64 bg-primary/20 rounded-full blur-[80px] pointer-events-none"></div>

                <div className="relative z-10 text-center mb-8">
                    <div className="flex items-center justify-center mb-6">
                        <img src="/cr-logo.png" alt="Chip Race" className="h-20 w-auto drop-shadow-2xl" />
                    </div>
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                        {mode === 'login' && 'Acesse sua Conta'}
                        {mode === 'signup' && 'Crie sua Conta Chip Race'}
                        {mode === 'forgot' && 'Recuperar Senha'}
                    </h2>
                    <p className="text-sm text-gray-500 mt-2">
                        {mode === 'login' && 'Para se registrar em torneios e editar seu perfil.'}
                        {mode === 'signup' && 'Junte-se à elite do poker no sul do país.'}
                        {mode === 'forgot' && 'Enviaremos um link para seu e-mail.'}
                    </p>
                </div>

                {error && (
                    <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded text-sm text-center">
                        {error}
                    </div>
                )}

                {message && (
                    <div className="mb-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded text-sm text-center">
                        {message}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    {mode === 'signup' && (
                        <div>
                            <label className="block text-sm font-bold text-gray-500 uppercase mb-1">Nome Completo</label>
                            <input
                                type="text"
                                value={fullName}
                                onChange={(e) => setFullName(e.target.value)}
                                className="w-full bg-gray-50 dark:bg-black/20 border border-gray-300 dark:border-white/10 rounded-lg px-4 py-3 text-gray-900 dark:text-white focus:outline-none focus:border-primary"
                                required
                            />
                        </div>
                    )}

                    <div>
                        <label className="block text-sm font-bold text-gray-500 uppercase mb-1">E-mail</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full bg-gray-50 dark:bg-black/20 border border-gray-300 dark:border-white/10 rounded-lg px-4 py-3 text-gray-900 dark:text-white focus:outline-none focus:border-primary"
                            required
                        />
                    </div>

                    {mode !== 'forgot' && (
                        <div>
                            <div className="flex justify-between items-center mb-1">
                                <label className="block text-sm font-bold text-gray-500 uppercase">Senha</label>
                                {mode === 'login' && (
                                    <button type="button" onClick={() => setMode('forgot')} className="text-sm text-primary hover:underline">Esqueceu?</button>
                                )}
                            </div>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full bg-gray-50 dark:bg-black/20 border border-gray-300 dark:border-white/10 rounded-lg px-4 py-3 text-gray-900 dark:text-white focus:outline-none focus:border-primary"
                                required
                            />
                        </div>
                    )}

                    <button disabled={loading} type="submit" className="w-full bg-gradient-to-r from-primary to-accent hover:from-accent hover:to-primary text-white font-bold py-3 rounded-full shadow-lg hover:shadow-neon-pink transition-all duration-300 mt-4 disabled:opacity-50">
                        {loading ? 'Processando...' : (
                            <>
                                {mode === 'login' && 'ENTRAR'}
                                {mode === 'signup' && 'CRIAR CONTA'}
                                {mode === 'forgot' && 'ENVIAR LINK'}
                            </>
                        )}
                    </button>
                </form>

                <div className="mt-6 text-center text-base text-gray-500">
                    {mode === 'login' ? (
                        <>
                            Não tem uma conta? <button type="button" onClick={() => setMode('signup')} className="text-primary font-bold hover:underline">Cadastre-se</button>
                        </>
                    ) : (
                        <>
                            Já tem conta? <button type="button" onClick={() => setMode('login')} className="text-primary font-bold hover:underline">Faça Login</button>
                        </>
                    )}
                </div>

                <button onClick={onCancel} className="absolute top-4 right-4 text-gray-400 hover:text-white">
                    <span className="material-icons-outlined">close</span>
                </button>

            </div>
        </div>
    );
};