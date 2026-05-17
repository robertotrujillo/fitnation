import { supabase } from '../supabaseClient';
import { v4 as uuidv4 } from 'uuid'; // Necesitas instalar uuid o usar crypto para nombres únicos
import imageCompression from 'browser-image-compression';

export const servicioPublicaciones = {
  obtenerPublicaciones: async () => {
    const { data, error } = await supabase
      .from('posts')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error al obtener publicaciones:', error);
      return [];
    }
    return data;
  },

  obtenerPublicacionesUsuario: async (userId) => {
    const { data, error } = await supabase
      .from('posts')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error al obtener publicaciones del usuario:', error);
      return [];
    }
    return data;
  },

  subirMediaPublicacion: async (archivo, userId) => {
    if (!archivo || !userId) return null;

    const fileExt = archivo.name.split('.').pop();
    const fileName = `${userId}/${uuidv4()}.${fileExt}`;
    const filePath = `${fileName}`;

    try {
      let archivoSubir = archivo;

      // Si el archivo es una imagen, lo comprimimos
      if (archivo.type.startsWith('image/')) {
        const opcionesCompresion = {
          maxSizeMB: 1, // Max 1MB para mantener gran calidad
          maxWidthOrHeight: 1920, // Resolución Full HD máxima
          useWebWorker: true
        };
        archivoSubir = await imageCompression(archivo, opcionesCompresion);
      }
      // Si es video, no hacemos compresión en el cliente (podría colgar el navegador)

      const { error: uploadError } = await supabase.storage
        .from('posts')
        .upload(filePath, archivoSubir, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        console.error('Error subiendo media de publicación:', uploadError);
        return null;
      }

      const { data: publicUrlData } = supabase.storage
        .from('posts')
        .getPublicUrl(filePath);

      return {
        publicUrl: publicUrlData.publicUrl,
        filePath: filePath
      };
    } catch (error) {
      console.error('Error comprimiendo o subiendo imagen de publicación:', error);
      return null;
    }
  },

  crearPublicacion: async (userId, nombreAutor, texto, imageUrl = null) => {
    // Verificar si el usuario está suspendido o baneado temporalmente
    const { data: profile } = await supabase
      .from('profiles')
      .select('is_suspended, banned_until')
      .eq('id', userId)
      .maybeSingle();

    if (profile) {
      if (profile.is_suspended) {
        throw new Error('STATUS_SUSPENDED');
      }
      if (profile.banned_until && new Date(profile.banned_until) > new Date()) {
        throw new Error('STATUS_BANNED_TEMPORARY');
      }
    }

    const publicacion = {
      user_id: userId,
      nombre_autor: nombreAutor,
    };

    // Evitar enviar strings vacíos
    if (texto && texto.trim() !== '') {
      publicacion.texto = texto.trim();
    }

    if (imageUrl) {
      publicacion.image_url = imageUrl;
    }

    const { data, error } = await supabase
      .from('posts')
      .insert([publicacion])
      .select();

    if (error) {
      console.error('Error al crear publicación:', error);
      throw error;
    }
    return data[0];
  },

  eliminarPublicacion: async (postId, userId, imageUrl = null) => {
    try {
      // 0. Eliminar registros relacionados (cascada manual por si la BD no lo tiene configurado)
      await Promise.all([
        supabase.from('likes').delete().eq('post_id', postId),
        supabase.from('comments').delete().eq('post_id', postId),
        supabase.from('guardados').delete().eq('post_id', postId),
        supabase.from('reports').delete().eq('post_id', postId)
      ]);

      // 1. Eliminar de la base de datos (verificando que pertenece al usuario)
      const { error: dbError } = await supabase
        .from('posts')
        .delete()
        .eq('id', postId)
        .eq('user_id', userId); // Doble validación de seguridad

      if (dbError) {
        console.error('Error al eliminar publicación en BD:', dbError);
        return false;
      }

      // 2. Si tenía imagen, intentar eliminarla de supabase storage
      if (imageUrl && imageUrl.includes('supabase.co')) {
        try {
          // Extraer el path de la URL pública.
          // La URL típica: https://[project].supabase.co/storage/v1/object/public/posts/[userId]/[uuid].jpg
          const parts = imageUrl.split('/posts/');
          if (parts.length === 2) {
            const filePath = parts[1];
            await servicioPublicaciones.eliminarImagenPublicacion(filePath);
          }
        } catch (storageErr) {
          console.error('Error al intentar extraer el path de la URL para borrar la imagen:', storageErr);
        }
      }

      return true;
    } catch (err) {
      console.error('Error general eliminando publicación:', err);
      return false;
    }
  },

  eliminarImagenPublicacion: async (filePath) => {
    if (!filePath) return;

    const { error } = await supabase.storage
      .from('posts')
      .remove([filePath]);

    if (error) {
      console.error('Error eliminando la imagen huérfana de la publicación:', error);
    }
  },

  obtenerLikesDePublicacion: async (postId) => {
    const { data, error, count } = await supabase
      .from('likes')
      .select('*', { count: 'exact' })
      .eq('post_id', postId);

    if (error) {
      console.error('Error al obtener likes:', error);
      return { data: [], count: 0 };
    }
    return { data, count };
  },

  verificarSiDiLike: async (postId, userId) => {
    if (!postId || !userId) return false;

    const { data, error } = await supabase
      .from('likes')
      .select('id')
      .eq('post_id', postId)
      .eq('user_id', userId)
      .maybeSingle();

    if (error && error.code !== 'PGRST116') { // PGRST116 = not found
      console.error('Error al verificar like:', error);
    }

    return !!data;
  },

  darLike: async (postId, userId) => {
    const { data, error } = await supabase
      .from('likes')
      .insert([{ post_id: postId, user_id: userId }])
      .select();

    if (error) {
      console.error('Error al dar like:', error);
      throw error;
    }
    return data[0];
  },

  quitarLike: async (postId, userId) => {
    const { error } = await supabase
      .from('likes')
      .delete()
      .eq('post_id', postId)
      .eq('user_id', userId);

    if (error) {
      console.error('Error al quitar like:', error);
      throw error;
    }
    return true;
  },

  obtenerCantidadComentariosDePublicacion: async (postId) => {
    const { count, error } = await supabase
      .from('comments')
      .select('*', { count: 'exact', head: true })
      .eq('post_id', postId);

    if (error) {
      console.error('Error al obtener cantidad de comentarios:', error);
      return 0;
    }
    return count || 0;
  },

  obtenerComentariosDePublicacion: async (postId) => {
    const { data, error } = await supabase
      .from('comments')
      .select(`
        id,
        text,
        created_at,
        user_id,
        profiles (
          username,
          avatar_url
        )
      `)
      .eq('post_id', postId)
      .order('created_at', { ascending: true }); // Los más antiguos arriba

    if (error) {
      console.error('Error al obtener comentarios:', error);
      return [];
    }
    return data;
  },

  agregarComentario: async (postId, userId, text) => {
    if (!text || text.trim() === '') return null;

    const { data, error } = await supabase
      .from('comments')
      .insert([{ post_id: postId, user_id: userId, text: text.trim() }])
      .select(`
        id,
        text,
        created_at,
        user_id,
        profiles (
          username,
          avatar_url
        )
      `); // Seleccionamos también el perfil para la UI inmediata

    if (error) {
      console.error('Error al agregar comentario:', error);
      throw error;
    }
    return data[0];
  },

  verificarSiGuardado: async (postId, userId) => {
    if (!postId || !userId) return false;

    const { data, error } = await supabase
      .from('guardados')
      .select('id')
      .eq('post_id', postId)
      .eq('user_id', userId)
      .maybeSingle();

    if (error && error.code !== 'PGRST116') {
      console.error('Error al verificar guardado:', error);
    }
    return !!data;
  },

  guardarPublicacion: async (postId, userId) => {
    const { data, error } = await supabase
      .from('guardados')
      .insert([{ post_id: postId, user_id: userId }])
      .select();

    if (error) {
      console.error('Error al guardar publicacion:', error);
      throw error;
    }
    return data[0];
  },

  quitarGuardado: async (postId, userId) => {
    const { error } = await supabase
      .from('guardados')
      .delete()
      .eq('post_id', postId)
      .eq('user_id', userId);

    if (error) {
      console.error('Error al quitar guardado:', error);
      throw error;
    }
    return true;
  },

  obtenerPublicacionesGuardadas: async (userId) => {
    const { data, error } = await supabase
      .from('guardados')
      .select(`
        post_id,
        posts (*)
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error al obtener publicaciones guardadas:', error);
      return [];
    }
    return data.map(d => d.posts);
  },

  // === SISTEMA DE REPORTES ===
  reportarPublicacion: async (postId, reporterId, reason) => {
    try {
      const { data, error } = await supabase
        .from('reports')
        .insert([{ post_id: postId, reporter_id: reporterId, reason: reason }])
        .select();

      if (error) throw error;
      return data[0];
    } catch (error) {
      console.error('Error al reportar publicacion:', error);
      throw error;
    }
  },

  obtenerReportesPendientes: async () => {
    try {
      // Obtenemos los reportes junto con la información de la publicación reportada
      const { data, error } = await supabase
        .from('reports')
        .select(`
          id,
          reason,
          status,
          created_at,
          post_id,
          posts (
            id,
            texto,
            image_url,
            nombre_autor,
            user_id
          ),
          reporter:profiles!reporter_id (
            username
          )
        `)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error al obtener reportes pendientes:', error);
      return [];
    }
  },

  resolverReporte: async (reportId) => {
    try {
      const { error } = await supabase
        .from('reports')
        .update({ status: 'resolved' })
        .eq('id', reportId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error al resolver reporte:', error);
      return false;
    }
  },

  resolverReporteYPenalizar: async (reportId, userIdPost) => {
    try {
      // 1. Resolver reporte
      const { error: err1 } = await supabase
        .from('reports')
        .update({ status: 'resolved' })
        .eq('id', reportId);

      if (err1) throw err1;

      // 2. Incrementar warnings del usuario
      const { data, error: err2 } = await supabase
        .from('profiles')
        .select('warnings_count, is_suspended, banned_until')
        .eq('id', userIdPost)
        .maybeSingle();

      if (!err2 && data) {
        const nuevosWarnings = (data.warnings_count || 0) + 1;
        let isSuspended = data.is_suspended;
        let bannedUntil = data.banned_until;

        // Castigo a los 6 strikes: cuenta suspendida
        if (nuevosWarnings >= 6) {
          isSuspended = true;
        }
        // Castigo a los 3 strikes: 1 semana sin poder publicar
        else if (nuevosWarnings >= 3 && nuevosWarnings < 6) {
          const fechaBan = new Date();
          fechaBan.setDate(fechaBan.getDate() + 7);
          bannedUntil = fechaBan.toISOString();
        }

        await supabase
          .from('profiles')
          .update({
            warnings_count: nuevosWarnings,
            is_suspended: isSuspended,
            banned_until: bannedUntil
          })
          .eq('id', userIdPost);
      }
      return true;
    } catch (error) {
      console.error('Error al resolver y penalizar:', error);
      return false;
    }
  },

  eliminarPublicacionAdmin: async (postId, imageUrl = null) => {
    try {
      // Cascada manual antes de llamar al RPC por si acaso
      await Promise.all([
        supabase.from('likes').delete().eq('post_id', postId),
        supabase.from('comments').delete().eq('post_id', postId),
        supabase.from('guardados').delete().eq('post_id', postId),
        supabase.from('reports').delete().eq('post_id', postId)
      ]);

      const { error } = await supabase.rpc('admin_delete_post', { p_post_id: postId });
      if (error) throw error;

      if (imageUrl && imageUrl.includes('supabase.co')) {
        try {
          const parts = imageUrl.split('/posts/');
          if (parts.length === 2) {
            const filePath = parts[1];
            await servicioPublicaciones.eliminarImagenPublicacion(filePath);
          }
        } catch (storageErr) {
          console.error('Error al borrar imagen de storage:', storageErr);
        }
      }
      return true;
    } catch (error) {
      console.error("Error admin eliminando publicacion:", error);
      return false;
    }
  },

  resolverReporteYPenalizarAdmin: async (reportId, userIdPost, postId, imageUrl = null) => {
    try {
      const { error } = await supabase.rpc('admin_resolve_report_and_penalize', {
        payload: {
          report_id: reportId,
          user_id: userIdPost,
          post_id: postId
        }
      });
      if (error) throw error;

      if (imageUrl && imageUrl.includes('supabase.co')) {
        try {
          const parts = imageUrl.split('/posts/');
          if (parts.length === 2) {
            const filePath = parts[1];
            await servicioPublicaciones.eliminarImagenPublicacion(filePath);
          }
        } catch (storageErr) {
          console.error('Error al borrar imagen de storage:', storageErr);
        }
      }
      return true;
    } catch (error) {
      console.error("Error admin resolviendo reporte y penalizando:", error);
      return false;
    }
  },

  desestimarReporteAdmin: async (reportId) => {
    try {
      const { error } = await supabase.rpc('admin_resolve_report', { p_report_id: reportId });
      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error admin desestimando reporte:', error);
      return false;
    }
  }
};
