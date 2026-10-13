# Sinhala Sub Creator — Spoken Sinhala AI Subtitle Localization 🎬🇱🇰

> **AI-Powered Subtitle Creator** that smoothly converts English movie subtitles (`.srt` and `.vtt`) into natural, colloquial **spoken Sinhala (කථික සිංහල)** rather than stiff, textbook prose. Powered by **Google Gemini 2.5 Flash** with a 100% Free Bring-Your-Own-Key (BYOK) architecture.

---

## 🌟 Why Sinhala Sub Creator? (The Diglossia Solution)

Traditional machine translation tools (Google Translate, DeepL) default to rigid, archaic **literary written Sinhala (ලිඛිත සිංහල)** — turning lively movie dialogues into awkward textbook essays:
- *“Don’t worry about it”* ❌ Google Translate: `ඒ පිළිබඳව කරදර නොවන්න.`
- *“Don’t worry about it”* ✅ **Sinhala Sub Creator:** `ඒ ගැන බයවෙන්න එපා.`
- *“Where are you going?”* ❌ Google Translate: `ඔබ කොහේද යන්නේ?`
- *“Where are you going?”* ✅ **Sinhala Sub Creator:** `කොහෙද ඔය යන්නේ?`

**Sinhala Sub Creator** solves this linguistic friction by tuning **Google Gemini 2.5 Flash** with custom system prompts that produce punchy, emotionally rich, and conversational Sri Lankan spoken dialogues ready for movies, TV series, and anime.

---

## 🚀 Key Features

- **⚡ Smooth Conversational Translation:** Fine-tuned to output natural spoken Sinhala (කථික සිංහල) with contextual contractions, natural pronouns, and movie timing.
- **🔑 Zero Cost BYOK Model:** Users connect their personal, free Google AI Studio Gemini API key. No credit card required, unlimited movie translations, zero server costs for the maintainer.
- **🔒 In-Browser Privacy:** Subtitle files are parsed and serialized 100% locally in your browser memory. Your media files and scripts are never stored on external databases.
- **📺 Flawless UTF-8 BOM Export:** Automatically formats exported `.srt` and `.vtt` files with UTF-8 Byte Order Mark (`\uFEFF`) so VLC, MX Player, and Smart TVs (Samsung, LG, Sony) render Sinhala Unicode letters without corruption or boxes.
- **✏️ Interactive Side-by-Side Editor:** Preview original English vs. Sinhala lines side-by-side with instant inline editing.
- **🎭 Genre-Tuned Styles:** Choose between General Movies, Action (punchy), Comedy (Sri Lankan witty slang), and Emotional Drama.

---

## 🛠️ Tech Stack

- **Framework:** [Next.js 15](https://nextjs.org/) (App Router & Turbopack)
- **Styling:** [Tailwind CSS v4](https://tailwindcss.com/)
- **Icons:** [Lucide Icons](https://lucide.dev/)
- **Typography:** `Noto Sans Sinhala` & `Inter` Google Fonts
- **AI Engine:** Google Gemini 2.5 Flash via REST API

---

## 🏃 Getting Started Locally

### 1. Clone the repository
```bash
git clone https://github.com/raveenjk/sinahala-sub-creator.git
cd sinahala-sub-creator
```

### 2. Install dependencies
```bash
npm install
```

### 3. Run the development server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the app!

---

## 🔑 How to Get a Free Gemini API Key (No Credit Card)

1. Go to [Google AI Studio](https://aistudio.google.com/app/apikey).
2. Sign in with any regular Google Account.
3. Click **"Create API key"**.
4. Copy the key and paste it into the Sinhala Sub Creator popup. You're ready to create unlimited subtitles!

---

## 📄 License

MIT License © 2026. Made with ❤️ for Sri Lankan movie and entertainment enthusiasts.
