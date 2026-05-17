import React, { createContext, useState, useEffect, useContext } from 'react';
import { useAuth } from './AuthContext';
import { servicioPerfil } from '../services/profileService';

const ThemeContext = createContext();

export const useTheme = () => useContext(ThemeContext);

export const ThemeProvider = ({ children }) => {
    const { usuario } = useAuth();

    // Leer el tema inicial desde localStorage (como caché rápida, evita flash)
    const [theme, setTheme] = useState(() => {
        const guardado = localStorage.getItem('fitnation-theme');
        if (guardado) return guardado;

        if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
            return 'dark';
        }
        return 'light';
    });

    // Cuando el usuario inicia sesión, cargar su tema guardado en BD
    useEffect(() => {
        if (!usuario) return;

        servicioPerfil.obtenerPerfil(usuario.id).then(perfil => {
            if (perfil?.theme && perfil.theme !== theme) {
                setTheme(perfil.theme);
            }
        });
        // Solo ejecutar cuando el usuario cambia (login/logout)
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [usuario?.id]);

    // Aplicar el tema al DOM y guardarlo en localStorage cada vez que cambie
    useEffect(() => {
        localStorage.setItem('fitnation-theme', theme);
        document.documentElement.setAttribute('data-bs-theme', theme);
    }, [theme]);

    const toggleTheme = () => {
        setTheme(prevTheme => {
            const nuevoTema = prevTheme === 'light' ? 'dark' : 'light';

            // Si hay sesión activa, persistir en la BD en segundo plano
            if (usuario) {
                servicioPerfil.guardarTema(usuario.id, nuevoTema);
            }

            return nuevoTema;
        });
    };

    return (
        <ThemeContext.Provider value={{ theme, toggleTheme }}>
            {children}
        </ThemeContext.Provider>
    );
};
