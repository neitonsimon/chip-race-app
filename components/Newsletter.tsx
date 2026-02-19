import React from 'react';

interface NewsletterProps {
    onNavigate?: (view: string) => void;
}

export const Newsletter: React.FC<NewsletterProps> = ({ onNavigate }) => {
  return (
    <>
        <div className="py-20 bg-gray-50 dark:bg-[#080418] border-t border-gray-200/50 dark:border-white/5">
        <div className="max-w-4xl mx-auto px-4 text-center">
            <h2 className="text-3xl font-display font-bold text-gray-900 dark:text-white mb-4">
            Seja Vip
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-8">
            Receba convites exclusivos, códigos de bônus e atualizações de torneios diretamente na sua caixa de entrada.
            </p>
            
            <button
                onClick={() => onNavigate && onNavigate('vip')}
                className="bg-gradient-to-r from-primary to-accent hover:from-accent hover:to-primary text-white font-bold py-4 px-12 rounded-full shadow-lg hover:shadow-neon-pink transition-all duration-300 transform hover:scale-105"
            >
                QUERO SER VIP
            </button>
        </div>
        </div>
    </>
  );
};