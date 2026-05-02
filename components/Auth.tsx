import React, { useState } from 'react';
import { supabase } from '../src/lib/supabase';

interface AuthProps {
    onLogin: () => void; // No args needed, session handled in App
    onCancel: () => void;
    initialMode?: AuthMode;
    onModeChange?: (mode: AuthMode) => void;
}

type AuthMode = 'login' | 'signup' | 'forgot';

export const Auth: React.FC<AuthProps> = ({ onLogin, onCancel, initialMode = 'login', onModeChange }) => {
    const [mode, setMode] = useState<AuthMode>(initialMode);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [fullName, setFullName] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [message, setMessage] = useState<string | null>(null);

    // Sync internal mode if initialMode changes
    React.useEffect(() => {
        setMode(initialMode);
    }, [initialMode]);

    const handleModeChange = (newMode: AuthMode) => {
        if (onModeChange) {
            onModeChange(newMode);
        } else {
            setMode(newMode);
        }
    };

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
                handleModeChange('login');
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
        <div className="min-h-screen py-12 sm:py-24 flex items-center justify-center bg-[#050821] px-4 overflow-y-auto">
            <div className="w-full max-w-md bg-white dark:bg-surface-dark border border-gray-200 dark:border-white/10 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden my-auto">

                {/* Glow Effect */}
                <div className="absolute -top-20 -right-20 w-64 h-64 bg-primary/20 rounded-full blur-[80px] pointer-events-none"></div>

                <div className="relative z-10 text-center mb-6 sm:mb-8">
                    <div className="flex items-center justify-center mb-4 sm:mb-6">
                        <img src="/cr-logo.png" alt="Chip Race" className="h-14 sm:h-20 w-auto drop-shadow-2xl" />
                    </div>
                    <h2 className="text-xl sm:text-2xl font-black text-gray-900 dark:text-white uppercase tracking-tighter">
                        {mode === 'login' && 'Acesse sua Conta'}
                        {mode === 'signup' && 'Crie sua Conta'}
                        {mode === 'forgot' && 'Recuperar Senha'}
                    </h2>
                    <p className="text-[10px] sm:text-xs text-gray-500 mt-1 sm:mt-2 font-bold uppercase tracking-widest">
                        {mode === 'login' && 'Para se registrar em torneios e editar seu perfil.'}
                        {mode === 'signup' && 'Junte-se à elite do poker no sul do país.'}
                        {mode === 'forgot' && 'Enviaremos um link para seu e-mail.'}
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
                    {mode === 'signup' && (
                        <div>
                            <label className="block text-[10px] sm:text-xs font-bold text-gray-500 uppercase mb-1">Nome Completo</label>
                            <input
                                type="text"
                                value={fullName}
                                onChange={(e) => setFullName(e.target.value)}
                                className="w-full bg-gray-50 dark:bg-black/20 border border-gray-300 dark:border-white/10 rounded-lg px-4 py-2.5 sm:py-3 text-sm sm:text-base text-gray-900 dark:text-white focus:outline-none focus:border-primary"
                                required
                            />
                        </div>
                    )}

                    <div className="space-y-1.5 transition-all duration-300">
                        <label className={`block text-[10px] sm:text-xs font-black uppercase ml-1 transition-colors ${mode === 'forgot' ? 'text-primary' : 'text-gray-500'}`}>
                            {mode === 'forgot' ? 'Confirme seu E-mail' : 'E-mail'}
                        </label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="seu@email.com"
                            className={`w-full bg-gray-50 dark:bg-black/40 border rounded-2xl px-4 py-3.5 sm:py-4 text-sm sm:text-base text-gray-900 dark:text-white focus:outline-none focus:border-primary transition-all font-medium ${mode === 'forgot' ? 'border-primary/50 shadow-neon-blue/20' : 'border-gray-300 dark:border-white/10'}`}
                            required
                            autoFocus={mode === 'forgot'}
                        />
                    </div>

                    {mode !== 'forgot' && (
                        <div className="space-y-1.5 animate-in slide-in-from-top-2 duration-300">
                            <label className="block text-[10px] sm:text-xs font-black text-gray-500 uppercase ml-1">Senha</label>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="••••••••"
                                className="w-full bg-gray-50 dark:bg-black/40 border border-gray-300 dark:border-white/10 rounded-2xl px-4 py-3.5 sm:py-4 text-sm sm:text-base text-gray-900 dark:text-white focus:outline-none focus:border-primary transition-all font-medium"
                                required
                            />
                            {mode === 'login' && (
                                <div className="mt-4 flex justify-center">
                                    <button 
                                        type="button" 
                                        onClick={() => handleModeChange('forgot')} 
                                        className="text-[10px] sm:text-[11px] font-black text-primary hover:text-white bg-primary/10 hover:bg-primary px-5 py-2.5 rounded-full transition-all uppercase tracking-widest border border-primary/20"
                                    >
                                        Esqueceu sua senha?
                                    </button>
                                </div>
                            )}
                        </div>
                    )}

                    {mode === 'forgot' && (
                        <div className="py-6 sm:py-8 px-4 bg-gray-50 dark:bg-black/20 rounded-2xl border border-gray-200 dark:border-white/5 animate-in slide-in-from-bottom-2 duration-300">
                            <p className="text-[12px] sm:text-[13px] text-gray-600 dark:text-gray-400 text-center font-medium leading-relaxed">
                                Insira seu e-mail cadastrado acima. Enviaremos um link exclusivo para redefinir sua senha com segurança.
                            </p>
                        </div>
                    )}

                    <button disabled={loading} type="submit" className="w-full bg-gradient-to-r from-primary to-accent hover:from-accent hover:to-primary text-white font-bold py-3 sm:py-3.5 rounded-full shadow-lg hover:shadow-neon-pink transition-all duration-300 mt-4 disabled:opacity-50 text-sm sm:text-base uppercase tracking-widest">
                        {loading ? 'Processando...' : (
                            <>
                                {mode === 'login' && 'Entrar Agora'}
                                {mode === 'signup' && 'Criar minha Conta'}
                                {mode === 'forgot' && 'Enviar Link de Recuperação'}
                            </>
                        )}
                    </button>
                </form>

                <div className="mt-8 text-center text-sm sm:text-base text-gray-500">
                    {mode === 'login' && (
                        <>
                            Não tem uma conta? <button type="button" onClick={() => handleModeChange('signup')} className="text-primary font-bold hover:underline">Cadastre-se</button>
                        </>
                    )}
                    {mode === 'signup' && (
                        <>
                            Já tem conta? <button type="button" onClick={() => handleModeChange('login')} className="text-primary font-bold hover:underline">Faça Login</button>
                        </>
                    )}
                    {mode === 'forgot' && (
                        <button 
                            type="button" 
                            onClick={() => handleModeChange('login')} 
                            className="flex items-center justify-center gap-2 w-full text-primary font-bold hover:underline"
                        >
                            <span className="material-icons-outlined text-sm">arrow_back</span>
                            Voltar para o Login
                        </button>
                    )}
                </div>

                <button onClick={onCancel} className="absolute top-4 right-4 text-gray-400 hover:text-white">
                    <span className="material-icons-outlined text-xl">close</span>
                </button>

            </div>
        </div>
    );
};