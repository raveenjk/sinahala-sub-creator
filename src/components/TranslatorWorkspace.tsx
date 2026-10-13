'use client';

import React, { useState, useRef, useEffect } from 'react';
import {
  Upload,
  FileText,
  Play,
  Download,
  Sparkles,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  HelpCircle,
  Tv,
  Film,
  Sliders,
  X,
  Search,
  Clock,
  Type,
  RotateCcw,
  Check,
} from 'lucide-react';
import { SubtitleCue, SubtitleFormat, TranslationGenre } from '@/types/subtitle';
import { parseSubtitleFile, downloadSubtitleFile, shiftSubtitleCues } from '@/lib/subtitle-parser';
import { translateCueBatch } from '@/lib/gemini';
import { singlishToSinhala } from '@/lib/singlish';
import { SAMPLE_CUES } from './SampleData';

interface TranslatorWorkspaceProps {
  apiKey: string;
  onOpenApiKeyModal: () => void;
}

export default function TranslatorWorkspace({ apiKey, onOpenApiKeyModal }: TranslatorWorkspaceProps) {
  const [fileName, setFileName] = useState<string>('');
  const [cues, setCues] = useState<SubtitleCue[]>([]);
  const [originalCuesBackup, setOriginalCuesBackup] = useState<SubtitleCue[]>([]);
  const [genre, setGenre] = useState<TranslationGenre>('general');
  const [isTranslating, setIsTranslating] = useState<boolean>(false);
  const [searchFilter, setSearchFilter] = useState<string>('');
  const [errorStatus, setErrorStatus] = useState<string | null>(null);

  // Singlish Real-time Transliteration Toggle
  const [isSinglishEnabled, setIsSinglishEnabled] = useState<boolean>(true);

  // Time Shifter State
  const [isTimeShiftModalOpen, setIsTimeShiftModalOpen] = useState<boolean>(false);
  const [shiftOffsetSeconds, setShiftOffsetSeconds] = useState<string>('1.0');
  const [shiftSuccessMessage, setShiftSuccessMessage] = useState<string | null>(null);

  // Translation progress tracking
  const [completedCuesCount, setCompletedCuesCount] = useState<number>(0);
  const [currentBatchNumber, setCurrentBatchNumber] = useState<number>(0);
  const [totalBatchesCount, setTotalBatchesCount] = useState<number>(0);

  const isCancelledRef = useRef<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // File Upload Handler
  const handleFileUpload = (file: File) => {
    if (!file) return;
    setErrorStatus(null);
    setFileName(file.name);

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      try {
        const parsed = parseSubtitleFile(file.name, text);
        if (!parsed.length) {
          setErrorStatus('Subtitle file එක තුළ වලංගු Dialogue Cues හමු නොවීය. කරුණාකර වෙනත් file එකක් උත්සාහ කරන්න.');
          return;
        }
        setCues(parsed);
        setOriginalCuesBackup(JSON.parse(JSON.stringify(parsed)));
        setCompletedCuesCount(0);
      } catch (err: any) {
        setErrorStatus('Subtitle file එක කියවීමේදී දෝෂයක් සිදුවිය: ' + err.message);
      }
    };
    reader.readAsText(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  // Load Sample Subtitle
  const handleLoadSample = () => {
    setFileName('Sample_Movie_Scene.srt');
    setCues(SAMPLE_CUES);
    setOriginalCuesBackup(JSON.parse(JSON.stringify(SAMPLE_CUES)));
    setCompletedCuesCount(SAMPLE_CUES.length);
    setErrorStatus(null);
  };

  // Batch Translation Core Function
  const startTranslation = async () => {
    if (!apiKey) {
      onOpenApiKeyModal();
      return;
    }

    if (!cues.length) return;

    setIsTranslating(true);
    isCancelledRef.current = false;
    setErrorStatus(null);

    const BATCH_SIZE = 10;
    const pendingIndices = cues
      .map((cue, idx) => ({ cue, idx }))
      .filter(({ cue }) => !cue.sinhalaText.trim());

    const totalBatches = Math.ceil(pendingIndices.length / BATCH_SIZE);
    setTotalBatchesCount(totalBatches);
    setCurrentBatchNumber(0);

    const updatedCues = [...cues];

    try {
      for (let b = 0; b < totalBatches; b++) {
        if (isCancelledRef.current) break;

        setCurrentBatchNumber(b + 1);
        const batchSlice = pendingIndices.slice(b * BATCH_SIZE, (b + 1) * BATCH_SIZE);

        // Mark batch cues as translating
        batchSlice.forEach(({ idx }) => {
          updatedCues[idx] = { ...updatedCues[idx], status: 'translating' };
        });
        setCues([...updatedCues]);

        try {
          const translatedList = await translateCueBatch(
            batchSlice.map(({ cue }) => ({ id: cue.id, text: cue.englishText })),
            apiKey,
            genre
          );

          // Update cues with translated Sinhala text
          batchSlice.forEach(({ cue, idx }) => {
            const found = translatedList.find((item) => item.id === cue.id);
            if (found && found.sinhala) {
              updatedCues[idx] = {
                ...updatedCues[idx],
                sinhalaText: found.sinhala,
                status: 'done',
              };
            } else {
              updatedCues[idx] = { ...updatedCues[idx], status: 'done' };
            }
          });

          setCompletedCuesCount((prev) => prev + batchSlice.length);
        } catch (err: any) {
          console.error('Batch error:', err);
          batchSlice.forEach(({ idx }) => {
            updatedCues[idx] = {
              ...updatedCues[idx],
              status: 'error',
              errorMessage: err.message || 'දෝෂයකි',
            };
          });
          setErrorStatus(`පරිවර්තනය අතරතුර දෝෂයක්: ${err.message}. කරුණාකර ඔබගේ Gemini Key එක පරීක්ෂා කරන්න.`);
          break;
        }

        setCues([...updatedCues]);
        // Slight natural pacing delay
        await new Promise((r) => setTimeout(r, 400));
      }
    } finally {
      setIsTranslating(false);
    }
  };

  const cancelTranslation = () => {
    isCancelledRef.current = true;
    setIsTranslating(false);
  };

  // Editable Cell Handler (with Singlish Auto-Transliteration)
  const handleSinhalaTextChange = (id: number, rawInput: string) => {
    const finalText = isSinglishEnabled ? singlishToSinhala(rawInput) : rawInput;
    setCues((prev) =>
      prev.map((cue) => (cue.id === id ? { ...cue, sinhalaText: finalText, status: 'done' } : cue))
    );
  };

  // Time Shifter: Apply Offset in Milliseconds
  const handleApplyTimeShift = (offsetMs: number) => {
    if (!cues.length) return;
    const shifted = shiftSubtitleCues(cues, offsetMs);
    setCues(shifted);

    const seconds = (offsetMs / 1000).toFixed(1);
    const sign = offsetMs >= 0 ? '+' : '';
    setShiftSuccessMessage(`සියලුම පේළි වල කාලය ${sign}${seconds}s කින් සාර්ථකව වෙනස් විය!`);
    setTimeout(() => setShiftSuccessMessage(null), 3000);
  };

  // Time Shifter: Reset to Original Timestamps
  const handleResetTimestamps = () => {
    if (!originalCuesBackup.length) return;
    setCues((prev) =>
      prev.map((cue, i) => ({
        ...cue,
        startTime: originalCuesBackup[i]?.startTime || cue.startTime,
        endTime: originalCuesBackup[i]?.endTime || cue.endTime,
      }))
    );
    setShiftSuccessMessage('මුල් කාල සීමාවන් (Original Timestamps) යථා තත්ත්වයට පත් කරන ලදී.');
    setTimeout(() => setShiftSuccessMessage(null), 3000);
  };

  // Progress Calculation
  const totalCuesCount = cues.length;
  const progressPercentage =
    totalCuesCount > 0 ? Math.round((cues.filter((c) => c.sinhalaText.trim()).length / totalCuesCount) * 100) : 0;

  // Filtered cues for table search
  const filteredCues = cues.filter(
    (c) =>
      c.englishText.toLowerCase().includes(searchFilter.toLowerCase()) ||
      c.sinhalaText.toLowerCase().includes(searchFilter.toLowerCase())
  );

  return (
    <div className="space-y-12">
      {/* Hero Header */}
      <section className="text-center max-w-4xl mx-auto pt-6 pb-2">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-50 text-blue-700 text-xs font-bold mb-4 border border-blue-100 shadow-2xs">
          <Sparkles className="w-3.5 h-3.5 text-blue-600" />
          <span>ස්වාභාවික කථික සිංහල උපසිරැසි නිර්මාණකරු (Sinhala Sub Creator)</span>
          <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
          <span>Google Gemini Flash Engine</span>
        </div>

        <h1 className="text-3xl sm:text-5xl font-black text-slate-900 tracking-tight leading-tight">
          ඕනෑම English Subtitle එකක් තත්පර ගණනින්{' '}
          <span className="text-blue-600 underline decoration-blue-200 decoration-wavy decoration-2">
            කථික සිංහලට
          </span>{' '}
          හරවන්න
        </h1>

        <p className="mt-4 text-sm sm:text-base text-slate-600 max-w-2xl mx-auto leading-relaxed">
          Google Translate වල එන අස්වාභාවික ලිඛිත භාෂාව (Diglossia) වෙනුවට සැබෑ චිත්‍රපට වල කතා කරන ජීවමාන කථික සිංහල (කථික සිංහල)
          උපසිරැසි නොමිලේම සාදා ගන්න.
        </p>
      </section>

      {/* Main Workspace Card */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xl shadow-slate-200/50 overflow-hidden">
        {/* If no cues loaded: Upload Zone */}
        {cues.length === 0 ? (
          <div className="p-8 sm:p-14">
            <div
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-blue-200 hover:border-blue-400 bg-blue-50/20 hover:bg-blue-50/50 rounded-3xl p-10 sm:p-14 text-center cursor-pointer transition-all duration-200 group"
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".srt,.vtt"
                className="hidden"
                onChange={(e) => e.target.files && handleFileUpload(e.target.files[0])}
              />
              <div className="w-16 h-16 rounded-3xl bg-blue-100 text-blue-600 flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform shadow-sm">
                <Upload className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-bold text-slate-800 mb-1">
                ඔබගේ .SRT හෝ .VTT Subtitle ගොනුව මෙතැනට Drag & Drop කරන්න
              </h3>
              <p className="text-xs text-slate-500 mb-4">හෝ පරිගණකයෙන් තෝරා ගැනීමට මෙහි Click කරන්න</p>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-slate-100 text-slate-600 text-[11px] font-mono">
                <span>සහය දක්වන ආකෘති: .SRT (SubRip) සහ .VTT (WebVTT)</span>
              </div>
            </div>

            <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3">
              <span className="text-xs text-slate-400">Subtitle file එකක් ළඟ නැද්ද?</span>
              <button
                onClick={handleLoadSample}
                className="inline-flex items-center gap-2 text-xs font-bold text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 px-4 py-2 rounded-full border border-blue-200 transition-all cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Sample Subtitle එකක් උත්සාහ කර බලන්න</span>
              </button>
            </div>
          </div>
        ) : (
          /* When cues are loaded: Editor & Controls */
          <div className="flex flex-col divide-y divide-slate-100">
            {/* Top Toolbar */}
            <div className="p-5 sm:p-6 bg-slate-50/70 flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-blue-600 text-white flex items-center justify-center font-bold text-xs shadow-sm">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-extrabold text-slate-900 text-sm">{fileName}</h4>
                  <p className="text-xs text-slate-500">
                    මුළු පේළි {totalCuesCount} · පරිවර්තනය වී ඇත {cues.filter((c) => c.sinhalaText.trim()).length} (
                    {progressPercentage}%)
                  </p>
                </div>
              </div>

              {/* Controls: Time Shifter, Genre & Actions */}
              <div className="flex flex-wrap items-center gap-2.5">
                {/* Time Shifter Modal Trigger Button */}
                <button
                  onClick={() => setIsTimeShiftModalOpen(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 hover:border-blue-400 rounded-full text-xs font-bold text-slate-700 shadow-2xs hover:bg-blue-50/50 transition-all cursor-pointer"
                  title="Subtitle කාල සීමාව Sync කරන්න"
                >
                  <Clock className="w-3.5 h-3.5 text-blue-600" />
                  <span>කාලය Sync (Time Shift)</span>
                </button>

                {/* Singlish Transliteration Toggle */}
                <button
                  onClick={() => setIsSinglishEnabled(!isSinglishEnabled)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border transition-all cursor-pointer ${
                    isSinglishEnabled
                      ? 'bg-blue-50 text-blue-700 border-blue-200'
                      : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'
                  }`}
                  title="Singlish ටයිප් කරන විට සිංහලට හැරවීම (ON/OFF)"
                >
                  <Type className="w-3.5 h-3.5" />
                  <span>Singlish: {isSinglishEnabled ? 'ON' : 'OFF'}</span>
                </button>

                {/* Genre Selector */}
                <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-full px-3 py-1 shadow-2xs">
                  <Sliders className="w-3.5 h-3.5 text-slate-400" />
                  <span className="text-[11px] font-bold text-slate-500">ශෛලිය:</span>
                  <select
                    value={genre}
                    onChange={(e) => setGenre(e.target.value as TranslationGenre)}
                    disabled={isTranslating}
                    className="text-xs font-bold text-slate-800 bg-transparent outline-none cursor-pointer"
                  >
                    <option value="general">සාමාන්‍ය (General)</option>
                    <option value="comedy">හාස්‍ය (Comedy Slang)</option>
                    <option value="action">ක්‍රියාදාම (Action/Punchy)</option>
                    <option value="drama">නාට්‍ය (Emotional Drama)</option>
                  </select>
                </div>

                {/* Translate Button */}
                {!isTranslating ? (
                  <button
                    onClick={startTranslation}
                    className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-blue-600 text-white text-xs font-bold shadow-md shadow-blue-200 hover:bg-blue-700 active:scale-95 transition-all cursor-pointer"
                  >
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span>පරිවර්තනය ආරම්භ කරන්න</span>
                  </button>
                ) : (
                  <button
                    onClick={cancelTranslation}
                    className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-rose-600 text-white text-xs font-bold shadow-md shadow-rose-200 hover:bg-rose-700 active:scale-95 transition-all cursor-pointer"
                  >
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>නවත්වා නවතින්න (Cancel)</span>
                  </button>
                )}

                {/* Download Menu */}
                <button
                  onClick={() => downloadSubtitleFile(fileName, cues, 'srt')}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-emerald-600 text-white text-xs font-bold shadow-md shadow-emerald-200 hover:bg-emerald-700 active:scale-95 transition-all cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download .SRT</span>
                </button>

                <button
                  onClick={() => {
                    setCues([]);
                    setFileName('');
                  }}
                  className="p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-200/50 transition-colors"
                  title="නව Subtitle එකක්"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Time Shift Notification Alert */}
            {shiftSuccessMessage && (
              <div className="px-6 py-2.5 bg-emerald-50 border-b border-emerald-100 text-emerald-800 text-xs flex items-center gap-2 animate-in fade-in">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{shiftSuccessMessage}</span>
              </div>
            )}

            {/* Progress Bar (Visible while or after translating) */}
            <div className="px-6 py-3 bg-white border-b border-slate-100">
              <div className="flex items-center justify-between text-xs font-bold mb-1.5">
                <span className="text-slate-600">
                  {isTranslating
                    ? `පරිවර්තනය වෙමින් පවතී (Batch ${currentBatchNumber}/${totalBatchesCount})...`
                    : progressPercentage === 100
                    ? 'සියලුම පේළි සාර්ථකව පරිවර්තනය කර අවසන්!'
                    : `ප්‍රගතිය: ${progressPercentage}%`}
                </span>
                <span className="text-blue-600">{progressPercentage}%</span>
              </div>
              <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-blue-600 to-indigo-600 transition-all duration-300 rounded-full"
                  style={{ width: `${progressPercentage}%` }}
                ></div>
              </div>
            </div>

            {/* Error Message if any */}
            {errorStatus && (
              <div className="p-4 bg-rose-50 border-b border-rose-100 text-rose-800 text-xs flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{errorStatus}</span>
                </div>
                <button
                  onClick={onOpenApiKeyModal}
                  className="underline font-bold text-rose-700 hover:text-rose-900 ml-4"
                >
                  API Key එක පරීක්ෂා කරන්න
                </button>
              </div>
            )}

            {/* Search / Filter & Singlish helper info */}
            <div className="px-6 py-3 bg-slate-50/50 flex flex-wrap items-center justify-between gap-3">
              <div className="relative w-full max-w-sm">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchFilter}
                  onChange={(e) => setSearchFilter(e.target.value)}
                  placeholder="දෙබස් හෝ වචන සොයන්න..."
                  className="w-full pl-9 pr-3 py-1.5 text-xs bg-white border border-slate-200 rounded-xl focus:border-blue-500 outline-none text-slate-800"
                />
              </div>

              {/* Singlish Helper Tip */}
              <div className="flex items-center gap-2 text-[11px] text-slate-500">
                <span className="inline-block w-2 h-2 rounded-full bg-blue-500"></span>
                <span>
                  {isSinglishEnabled
                    ? 'Singlish Typing සක්‍රීයයි: ඉංග්‍රීසි අකුරින් ලියන විට (උදා: mchn) ස්වයංක්‍රීයව සිංහලට හැරේ'
                    : 'සාමාන්‍ය Typing සක්‍රීයයි'}
                </span>
                <span className="text-slate-400">· පේළි {filteredCues.length}ක් පෙන්වයි</span>
              </div>
            </div>

            {/* Interactive Side-by-Side Table */}
            <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
              <table className="w-full text-left border-collapse">
                <thead className="sticky top-0 bg-slate-100/90 backdrop-blur-sm border-b border-slate-200 text-slate-700 text-[11px] font-bold uppercase tracking-wider z-10">
                  <tr>
                    <th className="py-3 px-4 w-14">#</th>
                    <th className="py-3 px-4 w-40">කාල සීමාව (Time)</th>
                    <th className="py-3 px-4 w-1/2">ඉංග්‍රීසි දෙබස (Original English)</th>
                    <th className="py-3 px-4 w-1/2">
                      කථික සිංහල (Spoken Sinhala - {isSinglishEnabled ? 'Singlish Enabled' : 'Raw Text'})
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs text-slate-800">
                  {filteredCues.map((cue) => (
                    <tr key={cue.id} className="hover:bg-blue-50/30 transition-colors">
                      <td className="py-3 px-4 font-mono text-[11px] text-slate-400 align-top">{cue.id}</td>
                      <td className="py-3 px-4 font-mono text-[10px] text-slate-500 whitespace-nowrap align-top">
                        {cue.startTime} → {cue.endTime}
                      </td>
                      <td className="py-3 px-4 text-slate-700 leading-relaxed align-top">
                        {cue.englishText}
                      </td>
                      <td className="py-2.5 px-4 align-top">
                        {cue.status === 'translating' ? (
                          <div className="flex items-center gap-2 text-blue-600 text-xs italic py-1">
                            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                            <span>පරිවර්තනය වෙමින් පවතී...</span>
                          </div>
                        ) : (
                          <textarea
                            value={cue.sinhalaText}
                            onChange={(e) => handleSinhalaTextChange(cue.id, e.target.value)}
                            placeholder="පරිවර්තනය බලාපොරොත්තුවෙන්..."
                            rows={cue.sinhalaText.length > 50 ? 2 : 1}
                            className="w-full p-2 bg-transparent hover:bg-white focus:bg-white border border-transparent hover:border-slate-200 focus:border-blue-500 rounded-xl outline-none font-medium text-slate-900 transition-all resize-none leading-relaxed"
                          />
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Bottom Actions Bar */}
            <div className="p-4 sm:p-6 bg-slate-50 flex flex-wrap items-center justify-between gap-4">
              <div className="text-xs text-slate-500">
                💡 <strong>Tip:</strong> සිංහල දෙබස් වල යම් වචනයක් වෙනස් කිරීමට අවශ්‍ය නම් අදාළ කොටුව මත Click කර
                Singlish වලින් හෝ සෘජුවම Edit කළ හැක.
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => downloadSubtitleFile(fileName, cues, 'vtt')}
                  className="px-4 py-2 rounded-full border border-slate-200 bg-white hover:bg-slate-50 text-xs font-bold text-slate-700 shadow-2xs transition-all cursor-pointer"
                >
                  Download .VTT
                </button>
                <button
                  onClick={() => downloadSubtitleFile(fileName, cues, 'srt')}
                  className="inline-flex items-center gap-1.5 px-6 py-2.5 rounded-full bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-200 transition-all cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  <span>Download .SRT (UTF-8)</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Subtitle Time Shifter / Sync Modal */}
      {isTimeShiftModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-slate-100 bg-slate-50/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
                  <Clock className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-900 text-base">Subtitle කාල සීමාව Sync කරන්න (Time Shift)</h3>
                  <p className="text-xs text-slate-500">වීඩියෝවට අනුකූලව Subtitle එක Forward හෝ Backward කරන්න</p>
                </div>
              </div>
              <button
                onClick={() => setIsTimeShiftModalOpen(false)}
                className="p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-5">
              <p className="text-xs text-slate-600 leading-relaxed">
                චිත්‍රපටිය Play වෙද්දී Subtitle පේළි කටහඬට වඩා <strong>ඉස්සරහින්</strong> යනවා නම් කාලය වැඩි කරන්න (+),
                <strong>පස්සෙන්</strong> එනවා නම් කාලය අඩු කරන්න (-).
              </p>

              {/* Quick Preset Buttons */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-2 uppercase tracking-wider">
                  ක්ෂණික Presets:
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    onClick={() => handleApplyTimeShift(-2000)}
                    className="py-2 px-3 rounded-xl border border-slate-200 hover:border-blue-400 hover:bg-blue-50/40 text-xs font-bold text-slate-700 transition-all cursor-pointer"
                  >
                    -2.0 තත්පර
                  </button>
                  <button
                    onClick={() => handleApplyTimeShift(-1000)}
                    className="py-2 px-3 rounded-xl border border-slate-200 hover:border-blue-400 hover:bg-blue-50/40 text-xs font-bold text-slate-700 transition-all cursor-pointer"
                  >
                    -1.0 තත්පර
                  </button>
                  <button
                    onClick={() => handleApplyTimeShift(-500)}
                    className="py-2 px-3 rounded-xl border border-slate-200 hover:border-blue-400 hover:bg-blue-50/40 text-xs font-bold text-slate-700 transition-all cursor-pointer"
                  >
                    -0.5 තත්පර
                  </button>
                  <button
                    onClick={() => handleApplyTimeShift(500)}
                    className="py-2 px-3 rounded-xl border border-slate-200 hover:border-blue-400 hover:bg-blue-50/40 text-xs font-bold text-slate-700 transition-all cursor-pointer"
                  >
                    +0.5 තත්පර
                  </button>
                  <button
                    onClick={() => handleApplyTimeShift(1000)}
                    className="py-2 px-3 rounded-xl border border-slate-200 hover:border-blue-400 hover:bg-blue-50/40 text-xs font-bold text-slate-700 transition-all cursor-pointer"
                  >
                    +1.0 තත්පර
                  </button>
                  <button
                    onClick={() => handleApplyTimeShift(2000)}
                    className="py-2 px-3 rounded-xl border border-slate-200 hover:border-blue-400 hover:bg-blue-50/40 text-xs font-bold text-slate-700 transition-all cursor-pointer"
                  >
                    +2.0 තත්පර
                  </button>
                </div>
              </div>

              {/* Custom Shift Input */}
              <div className="pt-2">
                <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
                  Custom කාලය ඇතුළත් කරන්න (තත්පර වලින්):
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    step="0.1"
                    value={shiftOffsetSeconds}
                    onChange={(e) => setShiftOffsetSeconds(e.target.value)}
                    placeholder="උදා: 1.5 හෝ -1.5"
                    className="flex-1 px-4 py-2.5 rounded-2xl border border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 text-sm font-bold text-slate-800 outline-none transition-all"
                  />
                  <button
                    onClick={() => {
                      const sec = parseFloat(shiftOffsetSeconds);
                      if (!isNaN(sec)) {
                        handleApplyTimeShift(Math.round(sec * 1000));
                      }
                    }}
                    className="px-5 py-2.5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all shadow-sm cursor-pointer"
                  >
                    Apply කරන්න
                  </button>
                </div>
              </div>

              {/* Reset to Original Button */}
              {originalCuesBackup.length > 0 && (
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-[11px] text-slate-400">මුල් කාල සීමාවන් වෙත ආපසු යාමට:</span>
                  <button
                    onClick={handleResetTimestamps}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold text-rose-600 hover:bg-rose-50 border border-rose-200 transition-all cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Reset to Original</span>
                  </button>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-4 bg-slate-50/80 border-t border-slate-100 text-right">
              <button
                onClick={() => setIsTimeShiftModalOpen(false)}
                className="px-5 py-2 rounded-full bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-bold transition-colors cursor-pointer"
              >
                ඉවරයි (Close)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Feature & Comparison Showcase (Diglossia Explanation) */}
      <section className="bg-white rounded-3xl border border-slate-200 p-8 sm:p-12 shadow-sm space-y-8">
        <div className="max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold mb-3 border border-emerald-100">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>සැබෑ වෙනස පරීක්ෂා කරන්න</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            සාමාන්‍ය Google Translate සහ Sinhala Sub Creator අතර වෙනස
          </h2>
          <p className="mt-2 text-sm text-slate-600 leading-relaxed">
            චිත්‍රපට නරඹන විට ලිඛිත සිංහලෙන් කියවීම රසවින්දනයට බාධාවකි. අපගේ AI එන්ජිම මගින් නිර්මාණය වන ස්වාභාවික වචන භාවිතය
            පහතින් සසඳා බලන්න:
          </p>
        </div>

        <div className="overflow-x-auto rounded-2xl border border-slate-200">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
              <tr>
                <th className="py-3 px-4 w-1/4">English Dialogue</th>
                <th className="py-3 px-4 w-1/3 text-rose-700 bg-rose-50/30">සාමාන්‍ය ලිඛිත සිංහල (Google Translate)</th>
                <th className="py-3 px-4 w-1/3 text-emerald-800 bg-emerald-50/30">අපගේ කථික සිංහල (Spoken Sinhala)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              <tr>
                <td className="py-3.5 px-4 font-semibold text-slate-900">“Don&#39;t worry about it.”</td>
                <td className="py-3.5 px-4 text-rose-600 bg-rose-50/10">ඒ පිළිබඳව කරදර නොවන්න.</td>
                <td className="py-3.5 px-4 text-emerald-800 bg-emerald-50/10 font-bold">ඒ ගැන බයවෙන්න එපා.</td>
              </tr>
              <tr>
                <td className="py-3.5 px-4 font-semibold text-slate-900">“Where are you going?”</td>
                <td className="py-3.5 px-4 text-rose-600 bg-rose-50/10">ඔබ කොහේද යන්නේ?</td>
                <td className="py-3.5 px-4 text-emerald-800 bg-emerald-50/10 font-bold">කොහෙද ඔය යන්නේ?</td>
              </tr>
              <tr>
                <td className="py-3.5 px-4 font-semibold text-slate-900">“Wait, what are you doing?”</td>
                <td className="py-3.5 px-4 text-rose-600 bg-rose-50/10">මඳක් රැඳෙන්න, ඔබ කුමක් කරන්නේද?</td>
                <td className="py-3.5 px-4 text-emerald-800 bg-emerald-50/10 font-bold">පොඩ්ඩක් ඉන්න, ඔයා මොකද කරන්නෙ?</td>
              </tr>
              <tr>
                <td className="py-3.5 px-4 font-semibold text-slate-900">“Let&#39;s sort it out tomorrow.”</td>
                <td className="py-3.5 px-4 text-rose-600 bg-rose-50/10">අපි හෙට දිනයේදී එය විසඳා ගනිමු.</td>
                <td className="py-3.5 px-4 text-emerald-800 bg-emerald-50/10 font-bold">අපි හෙට ඒක විසඳගමු.</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* Media Player Compatibility Guide */}
      <section className="bg-slate-900 text-white rounded-3xl p-8 sm:p-12 space-y-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-blue-500/20 text-blue-400 flex items-center justify-center">
            <Tv className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-xl font-bold">VLC සහ Smart TV වල උපසිරැසි පෙන්වන ආකාරය</h3>
            <p className="text-xs text-slate-400">අකුරු කොටු කොටු නොවී (UTF-8 BOM) නිවැරදිව සිංහල පෙන්වීම</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs text-slate-300 leading-relaxed">
          <div className="bg-slate-800/60 p-5 rounded-2xl border border-slate-700 space-y-2">
            <span className="w-6 h-6 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center text-[10px]">
              1
            </span>
            <h4 className="font-bold text-white text-sm">Download කරගන්න</h4>
            <p>පරිවර්තනය අවසන් වූ පසු &quot;Download .SRT&quot; ඔබන්න. එය ස්වයංක්‍රීයව UTF-8 BOM ආකෘතියෙන් Save වේ.</p>
          </div>

          <div className="bg-slate-800/60 p-5 rounded-2xl border border-slate-700 space-y-2">
            <span className="w-6 h-6 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center text-[10px]">
              2
            </span>
            <h4 className="font-bold text-white text-sm">එකම නම ලබා දෙන්න</h4>
            <p>
              වීඩියෝව සහ Subtitle එක එකම Folder එකක තබා දෙකටම එකම නම දෙන්න (උදා: Inception.mp4 සහ Inception.si.srt).
            </p>
          </div>

          <div className="bg-slate-800/60 p-5 rounded-2xl border border-slate-700 space-y-2">
            <span className="w-6 h-6 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center text-[10px]">
              3
            </span>
            <h4 className="font-bold text-white text-sm">VLC / TV එකෙන් Play කරන්න</h4>
            <p>VLC හෝ Smart TV එකෙන් Play කරන්න. සිංහල අකුරු නොකැඩී අලංකාරව තිරයේ දිස්වනු ඇත.</p>
          </div>
        </div>
      </section>
    </div>
  );
}
