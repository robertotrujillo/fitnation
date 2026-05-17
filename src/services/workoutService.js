import { supabase } from '../supabaseClient';

export const servicioEntrenamientos = {
    /**
     * Registra un nuevo entrenamiento para el usuario.
     * @param {string} userId - ID del usuario
     * @param {string[]} musculos - Array de músculos entrenados (ej. ['pecho', 'hombros'])
     */
    registrarEntrenamiento: async (userId, musculos) => {
        try {
            const { data, error } = await supabase
                .from('workouts')
                .insert([{ user_id: userId, muscles: musculos }])
                .select();

            if (error) throw error;
            return { data: data[0], error: null };
        } catch (error) {
            console.error("Error al registrar entrenamiento:", error);
            return { data: null, error };
        }
    },

    /**
     * Obtiene el historial de entrenamientos de un usuario en los últimos X días.
     * @param {string} userId - ID del usuario
     * @param {number} dias - Rango de días a buscar (por defecto 30)
     */
    obtenerHistorial: async (userId, dias = 30) => {
        try {
            const fechaLimite = new Date();
            fechaLimite.setDate(fechaLimite.getDate() - dias);
            const isoDate = fechaLimite.toISOString();

            const { data, error } = await supabase
                .from('workouts')
                .select('muscles, created_at')
                .eq('user_id', userId)
                .gte('created_at', isoDate)
                .order('created_at', { ascending: false });

            if (error) throw error;
            return data || [];
        } catch (error) {
            console.error("Error al obtener historial de entrenamientos:", error);
            return [];
        }
    },

    /**
     * Procesa el historial de entrenamientos y devuelve un mapa de "calor" por músculo.
     * Devuelve un objeto donde la clave es el músculo y el valor es la intensidad (0 a 1).
     * @param {Array} historial - Datos obtenidos de obtenerHistorial
     */
    calcularHeatmap: (historial) => {
        const conteo = {
            pecho: 0,
            espalda: 0,
            hombros: 0,
            brazos: 0,
            piernas: 0,
            core: 0
        };

        if (!historial || historial.length === 0) return conteo;

        historial.forEach(entreno => {
            if (entreno.muscles && Array.isArray(entreno.muscles)) {
                entreno.muscles.forEach(musculo => {
                    coincidenciaMapeo(musculo, conteo);
                });
            }
        });

        // Hacemos que la progresión sea más rápida y gratificante.
        // Si alguien entrena un músculo 4 veces al mes (1 vez por semana), ya alcanza la máxima intensidad.
        const maxEntrenosEsperados = 4; 
        
        const intensidades = {};
        Object.keys(conteo).forEach(musculo => {
            let intensidad = conteo[musculo] / maxEntrenosEsperados;
            if (intensidad > 1) intensidad = 1; // Topear en 1 (100%)
            intensidades[musculo] = intensidad;
        });

        return intensidades;
    }
};

/**
 * Función auxiliar para asegurar que cualquier variante de nombre se mapee a los grupos principales.
 */
function coincidenciaMapeo(musculo, objetoConteo) {
    const normalizeStr = musculo.toLowerCase().trim();
    
    // Mapeo simple
    if (normalizeStr.includes('pecho')) objetoConteo.pecho++;
    else if (normalizeStr.includes('espalda')) objetoConteo.espalda++;
    else if (normalizeStr.includes('hombro')) objetoConteo.hombros++;
    else if (normalizeStr.includes('brazo') || normalizeStr.includes('bicep') || normalizeStr.includes('tricep')) objetoConteo.brazos++;
    else if (normalizeStr.includes('pierna') || normalizeStr.includes('cuad') || normalizeStr.includes('isquio') || normalizeStr.includes('gluteo') || normalizeStr.includes('gemelo')) objetoConteo.piernas++;
    else if (normalizeStr.includes('core') || normalizeStr.includes('abs') || normalizeStr.includes('abdomen')) objetoConteo.core++;
    // Si no coincide con nada o se añade un grupo nuevo, se ignora o se podría mapear a 'otros'
}
