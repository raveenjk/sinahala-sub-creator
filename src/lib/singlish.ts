/**
 * Singlish (Romanized English) to Sinhala Unicode Transliteration Engine
 * Converts everyday Singlish typing into authentic Sinhala Unicode characters.
 */

// Consonants mapping
const CONSONANTS: Record<string, string> = {
  nndh: 'ඳ',
  nnd: 'ඬ',
  nng: 'ඟ',
  mmb: 'ඹ',
  k: 'ක',
  kh: 'ඛ',
  g: 'ග',
  gh: 'ඝ',
  ng: 'ඞ',
  ch: 'ච',
  chh: 'ඡ',
  j: 'ජ',
  jh: 'ඣ',
  ny: 'ඤ',
  t: 'ට',
  th: 'ථ',
  d: 'ඩ',
  dh: 'ධ',
  n: 'න',
  N: 'ණ',
  T: 'ත',
  D: 'ද',
  p: 'ප',
  ph: 'ඵ',
  b: 'බ',
  bh: 'භ',
  m: 'ම',
  y: 'ය',
  r: 'ර',
  l: 'ල',
  L: 'ළ',
  v: 'ව',
  w: 'ව',
  sh: 'ශ',
  Sh: 'ෂ',
  s: 'ස',
  h: 'හ',
  f: 'ෆ',
};

// Vowels mapping (Independent / Initial)
const INITIAL_VOWELS: Record<string, string> = {
  aa: 'ආ',
  A: 'ආ',
  a: 'අ',
  ae: 'ඇ',
  aae: 'ඈ',
  ii: 'ඊ',
  ee: 'ඊ',
  i: 'ඉ',
  uu: 'ඌ',
  oo: 'ඌ',
  u: 'උ',
  ea: 'ඒ',
  e: 'එ',
  E: 'ඒ',
  ai: 'ඓ',
  o: 'ඔ',
  O: 'ඕ',
  au: 'ඖ',
};

// Vowel signs (Pili) attached to consonants
const VOWEL_SIGNS: Record<string, string> = {
  aa: 'ා',
  A: 'ා',
  a: '',
  ae: 'ැ',
  aae: 'ෑ',
  ii: 'ී',
  ee: 'ී',
  i: 'ි',
  uu: 'ූ',
  oo: 'ූ',
  u: 'ු',
  ea: 'ේ',
  e: 'ෙ',
  E: 'ේ',
  ai: 'ෛ',
  o: 'ො',
  O: 'ෝ',
  au: 'ෞ',
};

/**
 * Transliterates a Singlish text string into Sinhala Unicode
 */
export function singlishToSinhala(text: string): string {
  if (!text) return '';

  let result = '';
  let i = 0;
  const len = text.length;

  while (i < len) {
    // Check 4-char consonants (nndh, etc.)
    const c4 = text.substring(i, i + 4);
    const c3 = text.substring(i, i + 3);
    const c2 = text.substring(i, i + 2);
    const c1 = text.substring(i, i + 1);

    let consonant = '';
    let consLen = 0;

    if (CONSONANTS[c4]) {
      consonant = CONSONANTS[c4];
      consLen = 4;
    } else if (CONSONANTS[c3]) {
      consonant = CONSONANTS[c3];
      consLen = 3;
    } else if (CONSONANTS[c2]) {
      consonant = CONSONANTS[c2];
      consLen = 2;
    } else if (CONSONANTS[c1]) {
      consonant = CONSONANTS[c1];
      consLen = 1;
    }

    if (consonant) {
      i += consLen;
      // Look ahead for attached vowel signs
      const v3 = text.substring(i, i + 3);
      const v2 = text.substring(i, i + 2);
      const v1 = text.substring(i, i + 1);

      if (VOWEL_SIGNS[v3] !== undefined) {
        result += consonant + VOWEL_SIGNS[v3];
        i += 3;
      } else if (VOWEL_SIGNS[v2] !== undefined) {
        result += consonant + VOWEL_SIGNS[v2];
        i += 2;
      } else if (VOWEL_SIGNS[v1] !== undefined) {
        result += consonant + VOWEL_SIGNS[v1];
        i += 1;
      } else {
        // If no vowel follows, append Hal-kirima (al-lakuna)
        result += consonant + '්';
      }
    } else {
      // Independent vowel or non-Sinhala character
      const v3 = text.substring(i, i + 3);
      const v2 = text.substring(i, i + 2);
      const v1 = text.substring(i, i + 1);

      if (INITIAL_VOWELS[v3]) {
        result += INITIAL_VOWELS[v3];
        i += 3;
      } else if (INITIAL_VOWELS[v2]) {
        result += INITIAL_VOWELS[v2];
        i += 2;
      } else if (INITIAL_VOWELS[v1]) {
        result += INITIAL_VOWELS[v1];
        i += 1;
      } else {
        // Punctuation, numbers, whitespace, or other chars
        result += text[i];
        i += 1;
      }
    }
  }

  return result;
}
