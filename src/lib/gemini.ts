import { TranslationGenre } from '@/types/subtitle';

const GEMINI_API_BASE = 'https://generativelanguage.googleapis.com/v1beta/models';
export const DEFAULT_MODEL = 'gemini-2.5-flash';

/**
 * Validates whether the user's provided Gemini API key is active and functional
 */
export async function validateApiKey(apiKey: string): Promise<{ valid: boolean; error?: string }> {
  if (!apiKey || apiKey.trim().length < 20) {
    return { valid: false, error: 'කරුණාකර නිවැරදි Gemini API Key එකක් ඇතුළත් කරන්න.' };
  }

  try {
    const res = await fetch(`${GEMINI_API_BASE}/${DEFAULT_MODEL}:generateContent?key=${apiKey.trim()}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: 'Ping: reply with "OK"' }] }],
        generationConfig: { maxOutputTokens: 5 },
      }),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => null);
      const message = data?.error?.message || `API Error: ${res.status} ${res.statusText}`;
      if (res.status === 400 || res.status === 403) {
        return { valid: false, error: 'ඇතුළත් කළ API Key එක වැරදියි හෝ අක්‍රීයයි. කරුණාකර නැවත පරීක්ෂා කරන්න.' };
      }
      return { valid: false, error: message };
    }

    return { valid: true };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'ජාල සම්බන්ධතාවය පරීක්ෂා කරන්න.';
    return { valid: false, error: errorMsg };
  }
}

/**
 * System instruction specifically designed to solve the Sinhala Diglossia problem
 * producing natural colloquial spoken Sinhala (කථික සිංහල) for movie subtitles.
 */
function getSystemPrompt(genre: TranslationGenre): string {
  let genrePrompt = '';
  if (genre === 'comedy') {
    genrePrompt = 'This is a comedy movie. Emphasize witty Sri Lankan spoken slang, comedic timing, and natural punchy remarks.';
  } else if (genre === 'action') {
    genrePrompt = 'This is an action movie. Keep dialogue fast-paced, punchy, and urgent so lines can be read quickly on screen.';
  } else if (genre === 'drama') {
    genrePrompt = 'This is a drama movie. Preserve emotional depth, character intimacy, and natural heartfelt conversation.';
  }

  return `You are a native Sri Lankan cinema subtitle localization expert.
Your mission is to translate English film dialogue cues into natural, everyday COLLOQUIAL SPOKEN SINHALA (කථික සිංහල).

STRICT RULES:
1. NEVER USE FORMAL LITERARY SINHALA (ලිඛිත සිංහල)!
   - Do NOT use formal written pronouns like "ඔබ" -> ALWAYS use spoken "ඔයා", "ඔයාලා", or contextual pronouns.
   - Do NOT use formal verb endings like "කරන්නේය", "පැමිණියේය", "නොවන්න" -> ALWAYS use natural spoken contractions like "කරනවා / කරන්නෙ", "ආවා", "එපා".
   - Example 1: "Don't worry about it" -> "ඒ ගැන බයවෙන්න එපා" (NEVER: "ඒ පිළිබඳව කරදර නොවන්න").
   - Example 2: "Where are you going?" -> "කොහෙද ඔය යන්නේ?" or "ඔයා කොහෙද යන්නෙ?" (NEVER: "ඔබ කොහේද යන්නේ?").
   - Example 3: "Wait, what are you doing?" -> "පොඩ්ඩක් ඉන්න, ඔයා මොකද කරන්නෙ?" (NEVER: "මඳක් රැඳෙන්න, ඔබ කුමක් කරන්නේද?").
   - Example 4: "Listen to me" -> "මං කියන දේ අහන්න" (NEVER: "මට සවන් දෙන්න").
2. KEEP IT CONCISE: Viewers read subtitles while watching action. Keep sentence lengths natural and tight without losing meaning.
3. SOUND EFFECTS & LABELS: Keep brackets like [Gunshot], [Music], or [Laughs] either as-is or cleanly noted.
4. NAMES: Keep character names as recognized or natural phonetic transliteration (e.g. John -> ජෝන්).
${genrePrompt ? `5. GENRE FOCUS: ${genrePrompt}` : ''}

OUTPUT FORMAT:
You MUST respond with a JSON array containing objects with exact keys:
[
  { "id": <number>, "sinhala": "<translated spoken Sinhala line>" }
]`;
}

/**
 * Translates a batch of subtitle cues using Google Gemini API
 */
export async function translateCueBatch(
  cues: { id: number; text: string }[],
  apiKey: string,
  genre: TranslationGenre = 'general'
): Promise<{ id: number; sinhala: string }[]> {
  if (!cues.length) return [];

  const systemInstruction = getSystemPrompt(genre);
  const promptText = `Translate the following ${cues.length} movie dialogue cues into natural spoken Sinhala (කථික සිංහල):\n\n` +
    JSON.stringify(cues.map(c => ({ id: c.id, text: c.text })), null, 2);

  const payload = {
    systemInstruction: {
      parts: [{ text: systemInstruction }],
    },
    contents: [
      {
        parts: [{ text: promptText }],
      },
    ],
    generationConfig: {
      temperature: 0.3,
      responseMimeType: 'application/json',
    },
  };

  const res = await fetch(`${GEMINI_API_BASE}/${DEFAULT_MODEL}:generateContent?key=${apiKey.trim()}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => null);
    const msg = errorData?.error?.message || `Gemini API error (${res.status})`;
    throw new Error(msg);
  }

  const responseJson = await res.json();
  const rawText = responseJson.candidates?.[0]?.content?.parts?.[0]?.text;

  if (!rawText) {
    throw new Error('Gemini API එකෙන් ප්‍රතිචාරයක් නොලැබුණි.');
  }

  try {
    const parsed = JSON.parse(rawText);
    if (Array.isArray(parsed)) {
      return parsed.map((item: any) => ({
        id: Number(item.id),
        sinhala: String(item.sinhala || item.text || '').trim(),
      }));
    }
    throw new Error('Invalid JSON array returned');
  } catch (err) {
    console.error('Failed to parse Gemini response:', rawText);
    throw new Error('පරිවර්තන ප්‍රතිචාරය කියවා ගැනීමට නොහැකි විය.');
  }
}
