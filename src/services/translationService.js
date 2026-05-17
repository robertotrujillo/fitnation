// Servicio de traducción dinámica para publicaciones de usuarios
// Usa la API gratuita de MyMemory (hasta 5000 palabras/día, sin API key)

const translationCache = new Map();

/**
 * Traduce texto usando la API de MyMemory (gratuita).
 * @param {string} text - Texto a traducir
 * @param {string} sourceLang - Idioma origen ('es' o 'en')
 * @param {string} targetLang - Idioma destino ('es' o 'en')
 * @returns {Promise<string>} - Texto traducido
 */
export async function translateText(text, sourceLang, targetLang) {
    if (!text || !text.trim()) return text;
    if (sourceLang === targetLang) return text;

    // Verificar cache
    const cacheKey = `${sourceLang}_${targetLang}_${text}`;
    if (translationCache.has(cacheKey)) {
        return translationCache.get(cacheKey);
    }

    try {
        const langPair = `${sourceLang}|${targetLang}`;
        const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=${langPair}`;
        
        const response = await fetch(url);
        if (!response.ok) throw new Error('Translation API error');

        const data = await response.json();
        
        if (data.responseStatus === 200 && data.responseData?.translatedText) {
            const translated = data.responseData.translatedText;
            // Guardar en cache
            translationCache.set(cacheKey, translated);
            return translated;
        }

        throw new Error('Invalid response from translation API');
    } catch (error) {
        console.error('Translation error:', error);
        throw error;
    }
}

/**
 * Detecta si un texto está probablemente en español o inglés.
 * Heurística simple basada en palabras comunes.
 */
export function detectLanguage(text) {
    const spanishWords = /\b(el|la|los|las|de|del|en|es|por|que|con|una|para|como|más|pero|este|esta|estos|estas|ser|hoy|día|muy|también|ya|no|si|al|lo|mi|su|se|ha|me|te|le)\b/gi;
    const englishWords = /\b(the|is|are|was|were|be|been|being|have|has|had|do|does|did|will|would|could|should|may|might|shall|can|a|an|of|in|to|for|with|on|at|by|from|as|but|or|and|not|this|that|it|my|your|his|her|we|they)\b/gi;
    
    const spanishMatches = (text.match(spanishWords) || []).length;
    const englishMatches = (text.match(englishWords) || []).length;
    
    if (spanishMatches > englishMatches) return 'es';
    if (englishMatches > spanishMatches) return 'en';
    return 'es'; // Default
}
