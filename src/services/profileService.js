import { supabase } from '../supabaseClient';
import imageCompression from 'browser-image-compression';

export const servicioPerfil = {
    /**
     * Obtiene el perfil completo de un usuario por su ID.
     * @param {string} userId
     * @returns {object|null} Datos del perfil o null si falla.
     */
    obtenerPerfil: async (userId) => {
        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', userId)
                .maybeSingle();

            if (error) throw error;
            return data;
        } catch (error) {
            console.error("Error obteniendo perfil:", error);
            return null;
        }
    },

    /**
     * Actualiza los datos del perfil.
     * @param {string} userId
     * @param {object} actualizaciones - Objeto con los campos a actualizar (peso, altura, biografia, etc.)
     */
    actualizarPerfil: async (userId, actualizaciones) => {
        try {
            const { data, error } = await supabase
                .from('profiles')
                .update(actualizaciones)
                .eq('id', userId)
                .select(); // <= QUITAR .single() temporalmente aquí

            if (error) throw error;

            // Revisa si trajo al menos 1 fila actualizada
            if (!data || data.length === 0) {
                return { data: null, error: { message: "No se actualizó ninguna fila. ¿Falta la fila de perfil para este usuario o tu política RLS no permite el UPDATE?" } };
            }

            // Retorna la primera de la lista manualmente simulando .single()
            return { data: data[0], error: null };
        } catch (error) {
            console.error("Error actualizando perfil:", error);
            return { data: null, error };
        }
    },

    /**
     * Sube un avatar al bucket 'avatars' y retorna la URL pública.
     * @param {File} archivo - Archivo de imagen seleccionado por el usuario.
     * @param {string} userId - ID del usuario (usado para el nombre del archivo).
     * @returns {string|null} URL pública de la imagen o null si falla.
     */
    subirAvatar: async (archivo, userId) => {
        try {
            const fileExt = archivo.name.split('.').pop();
            const fileName = `${userId}-${Date.now()}.${fileExt}`;
            const filePath = `${fileName}`;

            // Opciones de compresión para el avatar
            const opcionesCompresion = {
                maxSizeMB: 0.5, // Avatares muy ligeros (max 500kb)
                maxWidthOrHeight: 800, // No necesitamos avatares 4K
                useWebWorker: true
            };

            // Comprimir la imagen antes de subirla
            const archivoComprimido = await imageCompression(archivo, opcionesCompresion);

            // 1. Subir a Supabase Storage
            const { error: uploadError } = await supabase.storage
                .from('avatars')
                .upload(filePath, archivoComprimido);

            if (uploadError) throw uploadError;

            // 2. Obtener URL pública
            const { data } = supabase.storage
                .from('avatars')
                .getPublicUrl(filePath);

            return { publicUrl: data.publicUrl, filePath: filePath };
        } catch (error) {
            console.error("Error subiendo avatar:", error);
            return null;
        }
    },

    /**
     * Elimina un archivo del bucket 'avatars'. Útil para revertir subidas si falla la BD.
     * @param {string} filePath - La ruta del archivo a eliminar.
     */
    eliminarAvatar: async (filePath) => {
        try {
            const { error } = await supabase.storage
                .from('avatars')
                .remove([filePath]);

            if (error) throw error;
            return true;
        } catch (error) {
            console.error("Error eliminando avatar huérfano:", error);
            return false;
        }
    },

    // === SISTEMA DE SEGUIDORES ===

    seguirUsuario: async (followerId, followingId) => {
        try {
            const { error } = await supabase
                .from('follows')
                .insert([{ follower_id: followerId, following_id: followingId }]);

            if (error) throw error;
            return true;
        } catch (error) {
            console.error("Error al seguir usuario:", error);
            return false;
        }
    },

    dejarDeSeguirUsuario: async (followerId, followingId) => {
        try {
            const { error } = await supabase
                .from('follows')
                .delete()
                .eq('follower_id', followerId)
                .eq('following_id', followingId);

            if (error) throw error;
            return true;
        } catch (error) {
            console.error("Error al dejar de seguir usuario:", error);
            return false;
        }
    },

    verificarSiSigue: async (followerId, followingId) => {
        if (!followerId || !followingId) return false;
        try {
            const { data, error } = await supabase
                .from('follows')
                .select('id')
                .eq('follower_id', followerId)
                .eq('following_id', followingId)
                .maybeSingle();

            if (error && error.code !== 'PGRST116') {
                console.error("Error al verificar si sigue:", error);
            }
            return !!data;
        } catch {
            return false;
        }
    },

    obtenerContadoresSeguidores: async (userId) => {
        try {
            // Contar seguidores (la gente que TE sigue)
            const { count: followersCount, error: followersError } = await supabase
                .from('follows')
                .select('*', { count: 'exact', head: true })
                .eq('following_id', userId);

            // Contar seguidos (la gente a la que TÚ sigues)
            const { count: followingCount, error: followingError } = await supabase
                .from('follows')
                .select('*', { count: 'exact', head: true })
                .eq('follower_id', userId);

            if (followersError || followingError) {
                console.error("Error al obtener contadores:", followersError || followingError);
                return { followers: 0, following: 0 };
            }

            return { followers: followersCount || 0, following: followingCount || 0 };
        } catch (error) {
            console.error("Excepción obteniendo contadores:", error);
            return { followers: 0, following: 0 };
        }
    },

    obtenerSiguiendoIds: async (userId) => {
        try {
            const { data, error } = await supabase
                .from('follows')
                .select('following_id')
                .eq('follower_id', userId);

            if (error) throw error;
            return data.map(f => f.following_id);
        } catch (error) {
            console.error("Error obteniendo a quién sigo:", error);
            return [];
        }
    },

    obtenerUsuariosAdmin: async (busqueda = '') => {
        try {
            let query = supabase
                .from('profiles')
                .select('*')
                .order('created_at', { ascending: false });

            if (busqueda && busqueda.trim() !== '') {
                // Buscamos por nombre de usuario
                query = query.ilike('username', `%${busqueda}%`);
            }

            const { data, error } = await query;

            if (error) throw error;
            return data || [];
        } catch (error) {
            console.error("Error obteniendo usuarios para admin:", error);
            return [];
        }
    },

    obtenerEstadisticasAdmin: async () => {
        try {
            // Contar todos los usuarios
            const { count: totalUsers, error: errorTotal } = await supabase
                .from('profiles')
                .select('*', { count: 'exact', head: true });

            if (errorTotal) throw errorTotal;

            // Contar usuarios registrados hoy
            const hoy = new Date();
            hoy.setHours(0, 0, 0, 0);
            const isoDate = hoy.toISOString();

            const { count: usersToday, error: errorToday } = await supabase
                .from('profiles')
                .select('*', { count: 'exact', head: true })
                .gte('created_at', isoDate);

            if (errorToday) throw errorToday;

            const { count: reportes, error: errorReportes } = await supabase
                .from('reports')
                .select('*', { count: 'exact', head: true })
                .eq('status', 'pending');

            if (errorReportes && errorReportes.code !== '42P01') {
                throw errorReportes;
            }

            return {
                usuariosActivos: totalUsers || 0,
                nuevosHoy: usersToday || 0,
                reportesPendientes: reportes || 0,
                retosActivos: 0 // Funcionalidad no implementada aún
            };

        } catch (error) {
            console.error("Error obteniendo estadísticas para admin:", error);
            return {
                usuariosActivos: 0,
                nuevosHoy: 0,
                reportesPendientes: 0,
                retosActivos: 0
            };
        }
    },

    buscarUsuarios: async (busqueda) => {
        if (!busqueda || busqueda.trim().length < 2) return [];

        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('id, username, avatar_url')
                .ilike('username', `%${busqueda}%`)
                .limit(5);

            if (error) throw error;
            return data || [];
        } catch (error) {
            console.error("Error buscando usuarios:", error);
            return [];
        }
    },

    /**
     * Guarda la preferencia de tema (light/dark) del usuario en la BD.
     * @param {string} userId
     * @param {string} tema - 'light' o 'dark'
     */
    guardarTema: async (userId, tema) => {
        try {
            const { error } = await supabase
                .from('profiles')
                .update({ theme: tema })
                .eq('id', userId);

            if (error) throw error;
            return true;
        } catch (error) {
            console.error("Error guardando tema:", error);
            return false;
        }
    }
};
