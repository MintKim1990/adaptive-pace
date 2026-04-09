import type { SocialPlatform } from "@/types/social";
import { PLATFORM_CHAR_LIMITS } from "@/types/social";

const GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent";

interface StyleProfile {
  tone_description: string | null;
  common_expressions: string[];
  sample_posts: unknown;
}

export async function rewritePost(
  originalText: string,
  platform: SocialPlatform,
  styleProfile: StyleProfile | null
): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY is not set");

  const charLimit = PLATFORM_CHAR_LIMITS[platform];

  const styleContext = styleProfile
    ? `
Writer's style:
- Tone: ${styleProfile.tone_description || "professional and conversational"}
- Common expressions: ${styleProfile.common_expressions?.join(", ") || "none specified"}
`
    : "";

  const prompt = `You are a social media content rewriter. Rewrite the following post for ${platform}.

Rules:
- Keep the EXACT same core message and insight
- Change the hook, sentence structure, and phrasing
- Stay within ${charLimit} characters
- Maintain the original author's voice and tone
- Do NOT add hashtags unless the original had them
- Do NOT add emojis unless the original had them
- Do NOT make it sound more "polished" or "corporate" than the original
- Output ONLY the rewritten post text, nothing else
${styleContext}
Original post:
${originalText}`;

  const res = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 500,
      },
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Gemini API failed (${res.status}): ${err}`);
  }

  const data = await res.json();
  const rewritten = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();

  if (!rewritten) throw new Error("Gemini returned empty response");

  // Validate length
  if (rewritten.length > charLimit) {
    return rewritten.slice(0, charLimit - 3) + "...";
  }

  return rewritten;
}

export function addAiLabel(text: string): string {
  return `${text}\n\n#AI-Assisted`;
}
