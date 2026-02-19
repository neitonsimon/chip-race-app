import React from 'react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-white dark:bg-background-dark border-t border-gray-200 dark:border-white/5 pt-16 pb-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-12">
          
          {/* Brand Column */}
          <div>
            <a href="#" className="flex items-center gap-2 mb-6 group">
               <div className="w-10 h-10 bg-gradient-to-br from-primary to-accent rounded-lg flex items-center justify-center text-white shadow-neon-pink group-hover:scale-110 transition-transform duration-300">
                    <span className="material-icons-outlined text-2xl">token</span>
               </div>
               <span className="text-2xl font-display font-black text-gray-900 dark:text-white tracking-tighter">
                    CHIP<span className="text-primary">RACE</span>
               </span>
            </a>
            <p className="text-gray-500 dark:text-gray-400 text-base leading-relaxed mb-6">
              Organização, premiação real e diversão. O destino final para amantes do poker no sul do Brasil.
            </p>
            <div className="flex gap-4">
              {['instagram', 'whatsapp', 'facebook'].map((social) => (
                <a
                  key={social}
                  href="#"
                  className="w-10 h-10 rounded-full bg-gray-100 dark:bg-white/5 flex items-center justify-center text-gray-600 dark:text-gray-400 hover:bg-primary hover:text-white transition-all duration-300"
                >
                  <span className="material-icons-outlined text-sm">{social === 'instagram' ? 'photo_camera' : social === 'whatsapp' ? 'chat' : 'facebook'}</span>
                </a>
              ))}
            </div>
          </div>

          {/* Tournaments Column */}
          <div>
            <h4 className="font-display font-bold text-gray-900 dark:text-white mb-6 uppercase tracking-wider text-base">
              Eventos
            </h4>
            <ul className="space-y-4 text-base text-gray-500 dark:text-gray-400">
              {['The Chosen 30K+', 'Agenda Semanal QG', 'Home Game ID', 'Rankings 2026'].map((item) => (
                <li key={item}>
                  <a href="#" className="hover:text-primary transition-colors">{item}</a>
                </li>
              ))}
            </ul>
          </div>

          {/* Support Column */}
          <div>
            <h4 className="font-display font-bold text-gray-900 dark:text-white mb-6 uppercase tracking-wider text-base">
              Informações
            </h4>
            <ul className="space-y-4 text-base text-gray-500 dark:text-gray-400">
              {['Sobre a Chip Race', 'Regras do Clube', 'Política de Privacidade', 'Jogo Responsável'].map((item) => (
                <li key={item}>
                  <a href="#" className="hover:text-primary transition-colors">{item}</a>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact Column */}
          <div>
            <h4 className="font-display font-bold text-gray-900 dark:text-white mb-6 uppercase tracking-wider text-base">
              Contato
            </h4>
            <ul className="space-y-4 text-base text-gray-500 dark:text-gray-400">
              <li className="flex items-center gap-3">
                <span className="material-icons-outlined text-primary text-base">email</span>
                <span>contato@chiprace.com.br</span>
              </li>
              <li className="flex items-center gap-3">
                <span className="material-icons-outlined text-primary text-base">phone</span>
                <span>(51) 99999-9999</span>
              </li>
              <li className="flex items-center gap-3">
                <span className="material-icons-outlined text-primary text-base">location_on</span>
                <span>Centro, Venâncio Aires - RS</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-gray-200 dark:border-white/5 pt-8 flex flex-col md:flex-row justify-between items-center text-sm text-gray-400 dark:text-gray-600">
          <p>© 2026 Chip Race. Todos os direitos reservados.</p>
          <div className="flex gap-6 mt-4 md:mt-0">
            {['Privacidade', 'Termos'].map((item) => (
              <a key={item} href="#" className="hover:text-gray-500 transition-colors">{item}</a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
};