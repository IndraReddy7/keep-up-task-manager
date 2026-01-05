export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { goal, timeframe, aiMode } = req.body;

    if (!goal) {
      return res.status(400).json({ error: "Goal is required" });
    }

    let systemInstruction = "";

    if (aiMode === "spoon-fed") {
      systemInstruction =
        "Break the goal into extremely small, frictionless steps.";
    } else if (aiMode === "concise") {
      systemInstruction =
        "Return only the most essential milestones.";
    } else {
      systemInstruction =
        "Provide clear, balanced, and actionable steps.";
    }

    const prompt = `
${systemInstruction}

Goal: "${goal}"
Timeframe: "${timeframe || "flexible"}"

Return ONLY valid JSON:
{
  "category": "General",
  "steps": [
    { "title": "Step title", "estimatedTime": "15m" }
  ]
}
`;

    const response = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=" +
        process.env.GEMINI_API_KEY,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            responseMimeType: "application/json"
          }
        })
      }
    );

    const data = await response.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!text) {
      return res.status(500).json({ error: "Invalid Gemini response" });
    }

    return res.status(200).json(JSON.parse(text));

  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Server error" });
  }
}
