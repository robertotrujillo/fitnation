import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const rawBody = await req.text();
    if (!rawBody) {
      return new Response(
        JSON.stringify({ error: "Cuerpo de la petición vacío" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    let body;
    try {
      body = JSON.parse(rawBody);
    } catch (e) {
      return new Response(
        JSON.stringify({ error: "JSON mal formado" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    const { prompt, userData, file } = body;

    if (!prompt || !userData) {
      return new Response(
        JSON.stringify({ error: "Falta prompt o userData en el body" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    const apiKey = Deno.env.get('GEMINI_API_KEY')
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY no está configurada en los Secrets de Supabase");
    }

    // Instrucción para guiar a Gemini en el análisis y obligar a centrarse en el fitness/salud
    const systemInstruction = `Eres FitCoach, el asistente experto en nutrición, dietas y entrenamiento físico de FitNation.
    El usuario se llama ${userData.username || 'Atleta'} y su objetivo es ${userData.objetivo || 'mejorar su salud'}.
    
    CRITICAL SAFETY RULES:
    1. Si el usuario te proporciona un archivo (imagen, PDF o texto) o te pregunta algo, debes verificar rigurosamente que esté relacionado con:
       - Nutrición, alimentación, dietas, recetas saludables o suplementación deportiva.
       - Rutinas de ejercicio, entrenamientos, acondicionamiento físico, anatomía deportiva o salud física.
    2. Si el archivo o la consulta NO tiene relación con estos temas (por ejemplo: fotos de paisajes no relacionados, capturas de chats personales ajenos al deporte, documentos sobre finanzas, programación, política, tareas escolares no deportivas, etc.), debes rechazar el análisis de forma muy amable e inspiradora, indicando que como FitCoach solo estás entrenado para optimizar sus rutinas de entrenamiento y planes de alimentación.
    3. Responde de forma profesional, clara, motivadora y basada en datos científicos. Sé breve y estructurado.`

    // Estructura los contenidos para la API de Gemini
    const parts = [
      { text: `${systemInstruction}\n\nPregunta del usuario: ${prompt}` }
    ];

    if (file && file.base64 && file.mimeType) {
      parts.push({
        inlineData: {
          mimeType: file.mimeType,
          data: file.base64
        }
      });
    }

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${apiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts }]
      })
    })

    const data = await response.json()

    if (!response.ok) {
      return new Response(JSON.stringify({ error: data.error?.message || "Error en Gemini" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200
      });
    }

    const reply = data.candidates?.[0]?.content?.parts?.[0]?.text || "No pude generar una respuesta coherente.";

    return new Response(JSON.stringify({ reply }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    })

  } catch (error) {
    console.error("Error en la función:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    })
  }
})