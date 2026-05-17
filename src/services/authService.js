import { supabase } from '../supabaseClient';

export const servicioAutenticacion = {
  iniciarSesion: async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { user: data.user, error };
  },

  iniciarSesionGoogle: async () => {
    console.log("Iniciando login con Google...");
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin,
        queryParams: {
          prompt: 'select_account'
        }
      }
    });
    if (error) console.error("Error en signInWithOAuth:", error);
    if (data) console.log("Data de signInWithOAuth:", data);
    return { data, error };
  },

  recuperarContrasena: async (email) => {
    const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.origin + '/update-password',
    });
    if (error) throw error;
    return data;
  },

  actualizarContrasena: async (newPassword) => {
    const { data, error } = await supabase.auth.updateUser({
      password: newPassword
    });
    if (error) throw error;
    return data;
  },

  cerrarSesion: async () => {
    const { error } = await supabase.auth.signOut();
    if (error) console.error('Error al cerrar sesión:', error);
  },

  registrarUsuario: async ({ email, password, nombreUsuario, fechaNacimiento }) => {
    if (password.length < 8) {
      throw new Error("La contraseña debe tener al menos 8 caracteres.");
    }

    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          nombre_usuario: nombreUsuario,
          fecha_nacimiento: fechaNacimiento,
        },
        emailRedirectTo: window.location.origin
      },
    });

    if (authError) {
        if (authError.message.includes('unique') || authError.status === 422) {
             throw new Error("El correo ya está registrado.");
        }
        if (authError.message.includes('rate limit')) {
             throw new Error("Has hecho demasiados intentos. Por favor espera unos minutos o usa Google Login.");
        }
        throw authError;
    }

    return authData;
  },

  obtenerSesionActual: async () => {
    const { data } = await supabase.auth.getSession();
    return data.session?.user || null;
  },

  checkUsernameAvailability: async (username) => {
    try {
      const { data, error } = await supabase.rpc('check_username_available', {
        username_input: username
      });
      if (error) throw error;
      return data; // true = disponible, false = ocupado
    } catch (error) {
      console.error("Error verificando usuario:", error);
      return true; // En caso de error, asumimos disponible para no bloquear (o manejar diferente)
    }
  }
};
