export interface SubtitleCue {
  id: number;
  startTime: string; // e.g. "00:01:23,400"
  endTime: string;   // e.g. "00:01:26,100"
  englishText: string;
  sinhalaText: string;
  status: 'idle' | 'translating' | 'done' | 'error';
  errorMessage?: string;
}

export type SubtitleFormat = 'srt' | 'vtt';

export interface BatchProgress {
  totalCues: number;
  completedCues: number;
  currentBatch: number;
  totalBatches: number;
  isTranslating: boolean;
  hasErrors: boolean;
}

export type TranslationGenre = 'general' | 'comedy' | 'action' | 'drama';
