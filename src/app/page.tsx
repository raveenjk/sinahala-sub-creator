'use client';

import React, { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import TranslatorWorkspace from '@/components/TranslatorWorkspace';
import ApiKeyModal from '@/components/ApiKeyModal';
import Footer from '@/components/Footer';
import { getStoredApiKey } from '@/lib/storage';

export default function Home() {
  const [apiKey, setApiKey] = useState<string>('');
  const [isApiKeyModalOpen, setIsApiKeyModalOpen] = useState<boolean>(false);
  const [isLoaded, setIsLoaded] = useState<boolean>(false);

  useEffect(() => {
    const key = getStoredApiKey();
    setApiKey(key);
    setIsLoaded(true);
  }, []);

  const handleApiKeySuccess = (newKey: string) => {
    setApiKey(newKey);
    setIsApiKeyModalOpen(false);
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#F8FAFC] text-[#0F172A] selection:bg-blue-600 selection:text-white">
      {/* Top Navbar */}
      <Navbar
        hasApiKey={Boolean(apiKey)}
        onOpenApiKeyModal={() => setIsApiKeyModalOpen(true)}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <TranslatorWorkspace
          apiKey={apiKey}
          onOpenApiKeyModal={() => setIsApiKeyModalOpen(true)}
        />
      </main>

      {/* Footer */}
      <Footer />

      {/* BYOK Google Gemini Key Modal */}
      {isLoaded && (
        <ApiKeyModal
          isOpen={isApiKeyModalOpen}
          onClose={() => setIsApiKeyModalOpen(false)}
          onSuccess={handleApiKeySuccess}
        />
      )}
    </div>
  );
}
