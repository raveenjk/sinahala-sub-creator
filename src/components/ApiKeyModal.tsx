'use client';

import React, { useState, useEffect } from 'react';
import { KeyRound, ExternalLink, CheckCircle2, AlertCircle, X, ShieldCheck, Loader2 } from 'lucide-react';
import { validateApiKey } from '@/lib/gemini';
import { getStoredApiKey, setStoredApiKey } from '@/lib/storage';

interface ApiKeyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (key: string) => void;
}

export default function ApiKeyModal({ isOpen, onClose, onSuccess }: ApiKeyModalProps) {
  const [apiKey, setApiKey] = useState('');
  const [isValidating, setIsValidating] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const stored = getStoredApiKey();
      setApiKey(stored);
      setValidationError(null);
      setIsSaved(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSaveAndTest = async () => {
    if (!apiKey.trim()) {
      setValidationError('කරුණාකර Gemini API Key එකක් ඇතුළත් කරන්න.');
      return;
    }

    setIsValidating(true);
    setValidationError(null);

    const result = await validateApiKey(apiKey.trim());
    setIsValidating(false);

    if (result.valid) {
      setStoredApiKey(apiKey.trim());
      setIsSaved(true);
      setTimeout(() => {
        onSuccess(apiKey.trim());
        onClose();
      }, 700);
    } else {
      setValidationError(result.error || 'API Key එක පරීක්ෂා කිරීම අසාර්ථක විය.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shadow-xs">
              <KeyRound className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-slate-900 text-lg">Google Gemini API Key එක සම්බන්ධ කරන්න</h3>
              <p className="text-xs text-slate-500">100% නොමිලේ · Unlimited Subtitles · Credit Card අවශ්‍ය නොවේ</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content & Steps */}
        <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
          {/* Quick Guide */}
          <div className="rounded-2xl bg-blue-50/60 border border-blue-100 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-blue-900 uppercase tracking-wider">
                API Key එකක් නොමිලේ ලබාගන්නා ආකාරය
              </span>
              <a
                href="https://aistudio.google.com/app/apikey"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 hover:text-blue-800 bg-white px-3 py-1 rounded-full border border-blue-200 shadow-2xs transition-all hover:scale-105"
              >
                <span>Google AI Studio වෙත යන්න</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>

            <ol className="text-xs text-slate-700 space-y-2 list-decimal list-inside leading-relaxed">
              <li>
                ඉහත <strong>Google AI Studio</strong> ලින්ක් එකට ගොස් ඔබගේ Google ගිණුමෙන් Sign in වන්න.
              </li>
              <li>
                එහි ඇති <strong>&quot;Create API key&quot;</strong> නිල් පාට බටන් එක ක්ලික් කරන්න.
              </li>
              <li>
                සාදාගත් API Key එක <strong>Copy</strong> කරගන්න.
              </li>
              <li>
                පහත ඇති කොටුව තුළ එය <strong>Paste</strong> කර <strong>&quot;සම්බන්ධ කරන්න&quot;</strong> ඔබන්න!
              </li>
            </ol>
          </div>

          {/* Key Input Field */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
              ඔබගේ Gemini API Key එක:
            </label>
            <div className="relative">
              <input
                type="password"
                value={apiKey}
                onChange={(e) => {
                  setApiKey(e.target.value);
                  setValidationError(null);
                }}
                placeholder="AIzaSy..."
                className="w-full px-4 py-3 rounded-2xl border border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 text-sm font-mono tracking-wide text-slate-900 transition-all outline-none"
              />
            </div>
            {validationError && (
              <div className="flex items-start gap-2 p-3 rounded-xl bg-rose-50 border border-rose-100 text-rose-700 text-xs animate-in fade-in">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{validationError}</span>
              </div>
            )}
            {isSaved && (
              <div className="flex items-center gap-2 p-3 rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-700 text-xs animate-in fade-in">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>API Key එක සාර්ථකව සම්බන්ධ විය!</span>
              </div>
            )}
          </div>

          {/* Privacy Note */}
          <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-slate-50 border border-slate-100 text-slate-600 text-xs leading-relaxed">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <span>
              <strong>පූර්ණ රහස්‍යතාවය:</strong> ඔබගේ API Key එක ඔබගේ පරිගණකයේ බ්‍රවුසරය (LocalStorage) තුළ පමණක්
              සුරක්ෂිතව පවතින අතර, එය අපගේ හෝ බාහිර කිසිදු Server එකක ගබඩා නොවේ.
            </span>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-6 bg-slate-50/70 border-t border-slate-100 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded-full text-xs font-bold text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
          >
            අවලංගු කරන්න
          </button>

          <button
            type="button"
            disabled={isValidating || !apiKey.trim()}
            onClick={handleSaveAndTest}
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-blue-600 text-white text-xs font-bold shadow-md shadow-blue-200 hover:bg-blue-700 active:scale-95 disabled:opacity-50 disabled:pointer-events-none transition-all"
          >
            {isValidating ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>පරීක්ෂා කරමින්...</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>පරීක්ෂා කර සුරකින්න</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
