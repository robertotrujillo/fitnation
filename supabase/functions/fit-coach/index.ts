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

    const { prompt, userData } = body;

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

    // Configuramos la personalidad de la IA
    const systemInstruction = `Eres FitCoach, el asistente experto de FitNation. 
    El usuario se llama ${userData.username || 'Atleta'} y su objetivo es ${userData.objetivo || 'mejorar su salud'}.
    Responde de forma profesional, motivadora y basada en datos científicos. Sé breve y directo.`

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${apiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{
          parts: [{ text: `${systemInstruction}\n\nPregunta del usuario: ${prompt}` }]
        }]
      })
    })

    const data = await response.json()

    if (!response.ok) {
      // Devolvemos el error de Google pero con status 200 para que el chat lo muestre
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