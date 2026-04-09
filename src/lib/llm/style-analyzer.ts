const GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent";

interface StyleAnalysis {
  tone_description: string;
  avg_sentence_length: number;
  emoji_frequency: number;
  common_expressions: string[];
}

export async function analyzeWritingStyle(posts: string[]): Promise<StyleAnalysis> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY is not set");

  const samplePosts = posts.slice(0, 10).map((p, i) => `Post ${i + 1}: ${p}`).join("\n\n");

  const prompt = `Analyze the writing style of these social media posts. Return a JSON object with:
- tone_description: A brief description of the overall tone (e.g., "casual and witty", "professional and insightful")
- avg_sentence_length: Average number of words per sentence (number)
- emoji_frequency: How often emojis are used from 0 (never) to 1 (every post) (number)
- common_expressions: Array of 3-5 phrases or patterns this writer frequently uses

Return ONLY valid JSON, no markdown or explanation.

Posts:
${samplePosts}`;

  const res = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.3,
        maxOutputTokens: 500,
      },
    }),
  });

  if (!res.ok) throw new Error(`Gemini API failed (${res.status})`);

  const data = await res.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();

  if (!text) throw new Error("Gemini returned empty response");

  // Parse JSON, strip markdown code fences if present
  const cleaned = text.replace(/^```json?\n?/i, "").replace(/\n?```$/i, "").trim();
  return JSON.parse(cleaned);
}
