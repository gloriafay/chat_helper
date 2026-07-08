export default async function handler(req: any, res: any) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS, GET");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method === "GET") {
    return res.status(405).json({ error: "Only POST is allowed" });
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Only POST is allowed" });
  }

  try {
    const apiKey = process.env.DEEPSEEK_API_KEY;

    if (!apiKey) {
      return res.status(500).json({
        error: "Missing DEEPSEEK_API_KEY",
      });
    }

    const {
      model = "deepseek-chat",
      messages,
      temperature = 0.7,
      maxTokens = 1000,
    } = req.body || {};

    if (!Array.isArray(messages)) {
      return res.status(400).json({
        error: "messages must be an array",
      });
    }

    const response = await fetch("https://api.deepseek.com/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages,
        temperature,
        max_tokens: maxTokens,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json(data);
    }

    return res.status(200).json(data);
  } catch (error: any) {
    console.error("[api/ai] crashed:", error);

    return res.status(500).json({
      error: error?.message || "AI API crashed",
    });
  }
}