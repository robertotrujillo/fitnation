import { createContext, useState, useEffect, useContext, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { servicioAutenticacion } from '../services/authService';
import { servicioPerfil } from '../services/profileService';
import { supabase } from '../supabaseClient';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [usuario, setUsuario] = useState(null);
    const [perfil, setPerfil] = useState(null);
    const [cargando, setCargando] = useState(true);
    const inicializado = useRef(false);
    const navigate = useNavigate();

    const cargarDatosUsuario = async (user) => {
        try {
            if (user) {
                const perfilData = await servicioPerfil.obtenerPerfil(user.id);
                setPerfil(perfilData);
                setUsuario({ ...user, ...perfilData });
            } else {
                setUsuario(null);
                setPerfil(null);
            }
        } catch (error) {
            console.error("Error cargando datos de usuario:", error);
            setUsuario(user);
        } finally {
            setCargando(false);
        }
    };

    useEffect(() => {
        let montado = true;

        // ─── 1. CARGA INICIAL: usamos getSession() para obtener la sesión ───
        // Esto es más fiable que esperar a que onAuthStateChange dispare INITIAL_SESSION
        const inicializarSesion = async () => {
            try {
                const { data: { session }, error } = await supabase.auth.getSession();
                if (error) {
                    console.error("Error obteniendo sesión inicial:", error);
                }

                // Verificar si venimos de un enlace de recuperación
                const esRecuperacion = window.location.hash.includes('type=recovery');

                // Limpia la URL de fragmentos de Google DESPUÉS de que Supabase lea el token
                if (window.location.hash.includes('access_token')) {
                    window.history.replaceState(null, '', window.location.pathname + window.location.search);
                }

                if (montado) {
                    await cargarDatosUsuario(session?.user || null);
                    inicializado.current = true;
                    
                    // Si era recuperación, forzamos redirección a /update-password
                    if (esRecuperacion) {
                        navigate('/update-password');
                    }
                }
            } catch (err) {
                console.error("Excepción en getSession:", err);
                if (montado) {
                    setCargando(false);
                    inicializado.current = true;
                }
            }
        };

        inicializarSesion();

        // ─── 2. LISTENER para cambios posteriores (login, logout, token refresh) ───
        const { data: authListener } = supabase.auth.onAuthStateChange(
            (event, session) => {
                // Ignoramos INITIAL_SESSION porque ya lo manejamos con getSession()
                if (!inicializado.current) return;

                if (event === 'PASSWORD_RECOVERY') {
                    navigate('/update-password');
                }

                if (montado) {
                    // Usamos setTimeout(0) para evitar el deadlock documentado por Supabase:
                    // no se debe llamar a supabase dentro del callback síncrono de onAuthStateChange
                    setTimeout(() => {
                        if (montado) {
                            cargarDatosUsuario(session?.user || null);
                        }
                    }, 0);
                }
            }
        );

        // ─── 3. TIMEOUT DE SEGURIDAD: si en 10s no se resuelve, quitamos spinner ───
        const timeoutId = setTimeout(() => {
            if (montado && cargando) {
                console.warn("AuthContext: timeout de seguridad alcanzado, quitando spinner.");
                setCargando(false);
            }
        }, 10000);

        return () => {
            montado = false;
            authListener.subscription.unsubscribe();
            clearTimeout(timeoutId);
        };
    }, []);

    const iniciarSesion = async (email, contrasena) => {
        const { user, error } = await servicioAutenticacion.iniciarSesion(email, contrasena);
        if (error) throw error;
        return user;
    };

    const cerrarSesion = async () => {
        setCargando(true);
        try {
            await servicioAutenticacion.cerrarSesion();
            setUsuario(null);
            setPerfil(null);
        } finally {
            setCargando(false);
        }
    };

    const recargarPerfil = async () => {
        if (usuario) {
            const perfilData = await servicioPerfil.obtenerPerfil(usuario.id);
            setPerfil(perfilData);
            setUsuario(prev => ({ ...prev, ...perfilData }));
        }
    };

    const valorCompartido = {
        usuario,
        perfil,
        iniciarSesion,
        iniciarSesionGoogle: servicioAutenticacion.iniciarSesionGoogle,
        cerrarSesion,
        recargarPerfil,
        recuperarContrasena: servicioAutenticacion.recuperarContrasena,
        actualizarContrasena: servicioAutenticacion.actualizarContrasena,
        cargando
    };

    return (
        <AuthContext.Provider value={valorCompartido}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);