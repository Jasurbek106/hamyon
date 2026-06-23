// api/chat.js
//
// This function runs on Vercel's servers, not in the browser.
// It holds the Anthropic API key privately (as an environment variable)
// and forwards requests from Hamyon's frontend to Anthropic's API.
//
// SETUP:
// 1. In the Vercel dashboard for this project, go to:
//    Settings > Environment Variables > Add New
//    Key:   ANTHROPIC_API_KEY
//    Value: your real Anthropic API key (starts with sk-ant-...)
//    Apply to: Production (and Preview/Development if you want it there too)
// 2. Deploy. Vercel auto-detects any file in /api as a serverless function.
// 3. This function will be live at: https://YOUR-PROJECT.vercel.app/api/chat

export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    res.status(500).json({ error: "ANTHROPIC_API_KEY is not set on the server." });
    return;
  }

  const payload = req.body || {};

  // Basic guardrails: cap tokens and only allow expected fields through
  const body = {
    model: "claude-sonnet-4-6",
    max_tokens: Math.min(payload.max_tokens || 1000, 1000),
    system: payload.system,
    messages: payload.messages,
  };

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify(body),
    });

    const data = await response.text();
    res.status(response.status).setHeader("Content-Type", "application/json").send(data);
  } catch (err) {
    res.status(502).json({ error: "Failed to reach Anthropic API", details: String(err) });
  }
}
