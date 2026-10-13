'use client';

import React from 'react';
import { Film, Heart } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="mt-20 border-t border-slate-200/80 bg-white py-12 text-slate-500 text-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-6">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-blue-600 rounded-xl flex items-center justify-center text-white">
            <Film className="w-4 h-4" />
          </div>
          <div>
            <span className="font-extrabold text-slate-800 text-sm">
              Sinhala<span className="text-blue-600">Sub</span> Translator
            </span>
            <p className="text-[11px] text-slate-400">Natural Sinhala Subtitle Localization Hub</p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 text-slate-600">
          <span>Made with</span>
          <Heart className="w-3.5 h-3.5 text-rose-500 fill-current" />
          <span>for Sri Lankan Movie & Drama Fans</span>
        </div>

        <div className="text-[11px] text-slate-400">
          Powered by Google Gemini 2.5 Flash · Free BYOK Architecture
        </div>
      </div>
    </footer>
  );
}
