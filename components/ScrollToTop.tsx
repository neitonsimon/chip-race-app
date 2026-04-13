import React, { useState, useEffect } from 'react';
import { useApp } from '../contexts/AppContext';

export const ScrollToTop: React.FC = () => {
    const { isFlyerOpen } = useApp();
    const [isVisible, setIsVisible] = useState(false);

    // Show button when page is scrolled down
    const toggleVisibility = () => {
        if (window.pageYOffset > 300) {
            setIsVisible(true);
        } else {
            setIsVisible(false);
        }
    };

    // Set the top coordinate to 0
    // make scrolling smooth
    const scrollToTop = () => {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    };

    useEffect(() => {
        window.addEventListener('scroll', toggleVisibility);
        return () => window.removeEventListener('scroll', toggleVisibility);
    }, []);

    return (
        <div className="fixed bottom-36 right-6 z-[100] sm:hidden">
            {isVisible && !isFlyerOpen && (
                <button
                    onClick={scrollToTop}
                    className="w-14 h-14 bg-gradient-to-br from-primary to-accent text-white rounded-full flex items-center justify-center shadow-[0_0_20px_rgba(0,224,255,0.4)] hover:shadow-neon-pink transition-all duration-300 animate-in fade-in zoom-in slide-in-from-bottom-5 border-2 border-white/20 active:scale-95"
                >
                    <span className="material-icons text-2xl">arrow_upward</span>
                </button>
            )}
        </div>
    );
};
