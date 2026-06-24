// api/chat.js
//
// This function runs on Vercel's servers, not in the browser.
// It holds the Gemini API key privately (as an environment variable)
// and forwards requests from Hamyon's frontend to Google's Gemini API.
//
// It also translates between formats: the frontend sends/expects an
// Anthropic-style shape ({system, messages}), and this function converts
// that to Gemini's shape, then converts Gemini's response back, so the
// frontend code didn't need to change when switching providers.
//
// SETUP:
// 1. Get a free API key at https://aistudio.google.com/apikey (Google AI Studio).
//    No credit card required for the free tier.
// 2. In the Vercel dashboard for this project, go to:
//    Settings > Environment Variables > Add New
//    Key:   GEMINI_API_KEY
//    Value: your key from AI Studio
// 3. Deploy. Vercel auto-detects any file in /api as a serverless function.
// 4. This function will be live at: https://YOUR-PROJECT.vercel.app/api/chat

const GEMINI_MODEL = "gemini-2.5-flash"; // free-tier eligible as of mid-2026; check
// https://ai.google.dev/gemini-api/docs/pricing if this ever stops being free-capable.

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    res.status(500).json({ error: "GEMINI_API_KEY is not set on the server." });
    return;
  }

  const payload = req.body || {};
  const messages = Array.isArray(payload.messages) ? payload.messages : [];
  const systemPrompt = payload.system || "";

  // Anthropic-style {role:'user'|'assistant', content:'...'} -> Gemini's {role:'user'|'model', parts:[{text}]}
  const contents = messages.map((m) => ({
    role: m.role === "assistant" ? "model" : "user",
    parts: [{ text: typeof m.content === "string" ? m.content : JSON.stringify(m.content) }],
  }));

  const geminiBody = {
    contents,
    generationConfig: {
      maxOutputTokens: Math.min(payload.max_tokens || 1000, 1000),
    },
  };
  if (systemPrompt) {
    geminiBody.system_instruction = { parts: [{ text: systemPrompt }] };
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": apiKey,
      },
      body: JSON.stringify(geminiBody),
    });

    const data = await response.json();

    if (!response.ok) {
      res.status(response.status).json({
        error: data?.error?.message || "Gemini API error",
        raw: data,
      });
      return;
    }

    const text =
      data?.candidates?.[0]?.content?.parts?.map((p) => p.text || "").join("") || "";

    // Reshape into the Anthropic-style response the frontend already expects
    res.status(200).json({ content: [{ type: "text", text }] });
  } catch (err) {
    res.status(502).json({ error: "Failed to reach Gemini API", details: String(err) });
  }
}
