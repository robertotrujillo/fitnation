import React, { createContext, useState, useEffect, useContext } from 'react';
import { useAuth } from './AuthContext';
import { servicioPerfil } from '../services/profileService';
import i18n from '../i18n';

const LanguageContext = createContext();

export const useLanguage = () => useContext(LanguageContext);

export const LanguageProvider = ({ children }) => {
    const { usuario } = useAuth();

    // Leer idioma inicial desde localStorage (evita flash al recargar)
    const [language, setLanguage] = useState(() => {
        const guardado = localStorage.getItem('fitnation_language');
        if (guardado === 'es' || guardado === 'en') return guardado;
        return 'es'; // Por defecto: Español
    });

    // Aplicar idioma al cargar y cuando cambie
    useEffect(() => {
        i18n.changeLanguage(language);
        localStorage.setItem('fitnation_language', language);
    }, [language]);

    // Cuando el usuario inicia sesión, cargar su idioma guardado en BD
    useEffect(() => {
        if (!usuario?.id) return;

        servicioPerfil.obtenerPerfil(usuario.id).then(perfil => {
            const idiomaGuardado = perfil?.language;
            if (idiomaGuardado && (idiomaGuardado === 'es' || idiomaGuardado === 'en') && idiomaGuardado !== language) {
                setLanguage(idiomaGuardado);
            }
        });
        // Solo ejecutar cuando cambia el usuario (login/logout)
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [usuario?.id]);

    /**
     * Cambia el idioma activo, lo guarda en localStorage y persiste en BD.
     * @param {string} code - 'es' o 'en'
     */
    const changeLanguage = (code) => {
        if (code !== 'es' && code !== 'en') return;
        setLanguage(code);

        // Persistir en BD si hay sesión activa
        if (usuario?.id) {
            servicioPerfil.guardarIdioma(usuario.id, code);
        }
    };

    return (
        <LanguageContext.Provider value={{ language, changeLanguage }}>
            {children}
        </LanguageContext.Provider>
    );
};
