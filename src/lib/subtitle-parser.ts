import { SubtitleCue, SubtitleFormat } from '@/types/subtitle';

/**
 * Robustly parses SRT subtitle text into structured SubtitleCue items
 */
export function parseSRT(content: string): SubtitleCue[] {
  // Normalize line endings
  const normalized = content.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  const blocks = normalized.trim().split(/\n\s*\n/);
  const cues: SubtitleCue[] = [];

  for (let i = 0; i < blocks.length; i++) {
    const block = blocks[i].trim();
    if (!block) continue;

    const lines = block.split('\n');
    if (lines.length < 2) continue;

    // Line 0 is usually the index number, but some malformed files might omit it
    let timeIndex = 1;
    let id = parseInt(lines[0].trim(), 10);

    if (isNaN(id) || !lines[0].match(/^\d+$/)) {
      // Index might be missing, check if line 0 is the timestamp
      if (lines[0].includes('-->')) {
        timeIndex = 0;
        id = cues.length + 1;
      } else {
        continue;
      }
    }

    const timeLine = lines[timeIndex];
    if (!timeLine || !timeLine.includes('-->')) continue;

    const [start, end] = timeLine.split('-->').map((t) => t.trim());
    const textLines = lines.slice(timeIndex + 1);
    const text = textLines.join('\n').trim();

    if (start && end) {
      cues.push({
        id: cues.length + 1,
        startTime: start,
        endTime: end,
        englishText: text,
        sinhalaText: '',
        status: 'idle',
      });
    }
  }

  return cues;
}

/**
 * Parses WebVTT subtitle text into structured SubtitleCue items
 */
export function parseVTT(content: string): SubtitleCue[] {
  const normalized = content.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  // Strip WEBVTT header
  const clean = normalized.replace(/^WEBVTT[^\n]*\n+/i, '').trim();
  const blocks = clean.split(/\n\s*\n/);
  const cues: SubtitleCue[] = [];

  for (let i = 0; i < blocks.length; i++) {
    const block = blocks[i].trim();
    if (!block || block.startsWith('NOTE') || block.startsWith('STYLE')) continue;

    const lines = block.split('\n');
    let timeIndex = 0;

    // Check if line 0 is an identifier or timestamp
    if (!lines[0].includes('-->') && lines.length > 1 && lines[1].includes('-->')) {
      timeIndex = 1;
    }

    const timeLine = lines[timeIndex];
    if (!timeLine || !timeLine.includes('-->')) continue;

    const [start, end] = timeLine.split('-->').map((t) => t.trim().split(' ')[0]);
    const textLines = lines.slice(timeIndex + 1);
    const text = textLines.join('\n').trim();

    if (start && end) {
      cues.push({
        id: cues.length + 1,
        startTime: start,
        endTime: end,
        englishText: text,
        sinhalaText: '',
        status: 'idle',
      });
    }
  }

  return cues;
}

/**
 * Automatically detects format (.srt or .vtt) and parses
 */
export function parseSubtitleFile(fileName: string, content: string): SubtitleCue[] {
  if (fileName.toLowerCase().endsWith('.vtt') || content.trim().startsWith('WEBVTT')) {
    return parseVTT(content);
  }
  return parseSRT(content);
}

/**
 * Generates valid SRT text formatted with timestamps and cue numbers
 */
export function generateSRT(cues: SubtitleCue[]): string {
  return cues
    .map((cue, index) => {
      const text = cue.sinhalaText.trim() || cue.englishText.trim();
      // SRT format requires comma for milliseconds: 00:00:12,400
      const start = cue.startTime.replace('.', ',');
      const end = cue.endTime.replace('.', ',');
      return `${index + 1}\n${start} --> ${end}\n${text}`;
    })
    .join('\n\n') + '\n';
}

/**
 * Generates valid WebVTT text
 */
export function generateVTT(cues: SubtitleCue[]): string {
  const content = cues
    .map((cue, index) => {
      const text = cue.sinhalaText.trim() || cue.englishText.trim();
      // VTT format requires dot for milliseconds: 00:00:12.400
      const start = cue.startTime.replace(',', '.');
      const end = cue.endTime.replace(',', '.');
      return `${index + 1}\n${start} --> ${end}\n${text}`;
    })
    .join('\n\n');

  return `WEBVTT\n\n${content}\n`;
}

/**
 * Downloads the subtitle file with strict UTF-8 BOM encoding for 100% VLC/TV compatibility
 */
export function downloadSubtitleFile(baseName: string, cues: SubtitleCue[], format: SubtitleFormat = 'srt'): void {
  const content = format === 'srt' ? generateSRT(cues) : generateVTT(cues);
  
  // \uFEFF is the Byte Order Mark (BOM) for UTF-8
  // This guarantees Smart TVs and media players render Sinhala Unicode correctly without mojibake.
  const blob = new Blob(['\uFEFF' + content], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  
  const cleanName = baseName.replace(/\.(srt|vtt)$/i, '');
  const downloadLink = document.createElement('a');
  downloadLink.href = url;
  downloadLink.download = `${cleanName}.si.${format}`;
  document.body.appendChild(downloadLink);
  downloadLink.click();
  document.body.removeChild(downloadLink);
  URL.revokeObjectURL(url);
}
