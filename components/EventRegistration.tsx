import React, { useState } from 'react';

interface EventRegistrationProps {
  isAdmin?: boolean;
}

export const EventRegistration: React.FC<EventRegistrationProps> = ({ isAdmin }) => {
  const [formData, setFormData] = useState({
      name: '',
      email: '',
      phone: '',
      eventId: '1',
      nick: ''
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      setFormData({...formData, [e.target.name]: e.target.value});
  };

  return (
    <div className="py-20 bg-background-light dark:bg-background-dark min-h-screen flex items-center justify-center">
      <div className="w-full max-w-2xl px-4">
        
        <div className="bg-white dark:bg-surface-dark border border-gray-200 dark:border-white/10 rounded-3xl p-8 lg:p-12 shadow-2xl relative overflow-hidden">
            {/* Decorative Glow */}
            <div className="absolute -top-20 -left-20 w-64 h-64 bg-primary/20 rounded-full blur-[80px] pointer-events-none"></div>

            <div className="relative z-10 text-center mb-10">
                <h2 className="text-3xl font-display font-bold text-gray-900 dark:text-white mb-2">Registro de Torneio</h2>
                <p className="text-gray-500">Garanta sua vaga antecipada e evite filas no QG.</p>
            </div>

            <form className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Nome Completo</label>
                        <input 
                            type="text" 
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            className="w-full bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-lg px-4 py-3 text-gray-900 dark:text-white focus:outline-none focus:border-primary transition-colors"
                            placeholder="Seu nome"
                        />
                    </div>
                     <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Nick (Se online)</label>
                        <input 
                            type="text" 
                            name="nick"
                            value={formData.nick}
                            onChange={handleChange}
                            className="w-full bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-lg px-4 py-3 text-gray-900 dark:text-white focus:outline-none focus:border-primary transition-colors"
                            placeholder="Ex: PokerPlayer99"
                        />
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">E-mail</label>
                    <input 
                        type="email" 
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        className="w-full bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-lg px-4 py-3 text-gray-900 dark:text-white focus:outline-none focus:border-primary transition-colors"
                        placeholder="seu@email.com"
                    />
                </div>

                 <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Torneio Desejado</label>
                    <select 
                        name="eventId"
                        value={formData.eventId}
                        onChange={handleChange}
                        className="w-full bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-lg px-4 py-3 text-gray-900 dark:text-white focus:outline-none focus:border-primary transition-colors"
                    >
                        <option value="1">Deepstack Chip Race - 15/03</option>
                        <option value="2">High Roller QG - 20/03</option>
                        <option value="3">Omaha 5 Cartas - 22/03</option>
                    </select>
                </div>

                <div className="pt-4">
                    <button 
                        type="button" 
                        className="w-full bg-gradient-to-r from-primary to-accent hover:from-accent hover:to-primary text-white font-bold py-4 rounded-xl shadow-lg hover:shadow-neon-pink transition-all duration-300 transform hover:-translate-y-1"
                    >
                        CONFIRMAR PRÉ-REGISTRO
                    </button>
                    <p className="text-xs text-center text-gray-500 mt-4">
                        O pagamento do buy-in será realizado no local ou via PIX enviado para seu e-mail.
                    </p>
                </div>
            </form>
        </div>

      </div>
    </div>
  );
};