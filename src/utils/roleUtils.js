/**
 * Determina el rol del usuario basado en su metadata y reglas de negocio.
 * Prioridad:
 * 1. user.app_metadata.rol (asignado por admin/base de datos)
 * 2. Hardcoded email (admin@fitnation.com) - RESPALDO TEMPORAL
 * 3. Default: 'cliente'
 * 
 * @param {object} user - Objeto de usuario de Supabase
 * @returns {string} - 'admin' | 'cliente'
 */
export const getUserRole = (user) => {
    if (!user) return null;

    // Priorizar role en app_metadata (lugar seguro)
    if (user.app_metadata?.rol === 'admin_gym') {
        return 'admin';
    }

    return 'cliente';
};
