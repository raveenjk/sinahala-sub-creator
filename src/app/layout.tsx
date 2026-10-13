import type { Metadata } from 'next';
import { Inter, Noto_Sans_Sinhala } from 'next/font/google';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

const notoSansSinhala = Noto_Sans_Sinhala({
  subsets: ['sinhala'],
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-sinhala',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Sinhala Sub Creator — AI Spoken Sinhala Subtitle Localization',
  description:
    'Free AI-powered Sinhala subtitle creator. Convert English SRT and VTT files into natural colloquial spoken Sinhala (කථික සිංහල) with Google Gemini AI.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="si" className={`${inter.variable} ${notoSansSinhala.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col font-sans">{children}</body>
    </html>
  );
}
