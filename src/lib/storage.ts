import { TranslationGenre } from '@/types/subtitle';

const STORAGE_KEY_API = 'sinhala_subs_gemini_api_key';
const STORAGE_KEY_GENRE = 'sinhala_subs_genre';

export function getStoredApiKey(): string {
  if (typeof window === 'undefined') return '';
  return localStorage.getItem(STORAGE_KEY_API) || '';
}

export function setStoredApiKey(key: string): void {
  if (typeof window === 'undefined') return;
  if (!key.trim()) {
    localStorage.removeItem(STORAGE_KEY_API);
  } else {
    localStorage.setItem(STORAGE_KEY_API, key.trim());
  }
}

export function removeStoredApiKey(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(STORAGE_KEY_API);
}

export function getStoredGenre(): TranslationGenre {
  if (typeof window === 'undefined') return 'general';
  const val = localStorage.getItem(STORAGE_KEY_GENRE) as TranslationGenre;
  return val || 'general';
}

export function setStoredGenre(genre: TranslationGenre): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY_GENRE, genre);
}
