'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { translations, Lang, Translations } from './i18n';

interface LangCtx {
  lang: Lang;
  t: Translations;
  setLang: (l: Lang) => void;
}

const LangContext = createContext<LangCtx>({
  lang: 'en',
  t: translations.en,
  setLang: () => {},
});

export function LangProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>('en');

  useEffect(() => {
    const saved = localStorage.getItem('seeyou-lang') as Lang | null;
    if (saved && translations[saved]) setLangState(saved);
  }, []);

  function setLang(l: Lang) {
    setLangState(l);
    localStorage.setItem('seeyou-lang', l);
  }

  return (
    <LangContext.Provider value={{ lang, t: translations[lang] as Translations, setLang }}>
      {children}
    </LangContext.Provider>
  );
}

export function useLang() {
  return useContext(LangContext);
}

export function LangToggle() {
  const { lang, setLang } = useLang();
  return (
    <div className="flex items-center gap-0.5 bg-black/20 rounded-full p-0.5 border border-white/10">
      <button
        onClick={() => setLang('en')}
        className={`text-[11px] font-bold px-2.5 py-1 rounded-full transition-all ${
          lang === 'en' ? 'bg-white text-gray-900' : 'text-white/50 hover:text-white'
        }`}
      >EN</button>
      <button
        onClick={() => setLang('lt')}
        className={`text-[11px] font-bold px-2.5 py-1 rounded-full transition-all ${
          lang === 'lt' ? 'bg-white text-gray-900' : 'text-white/50 hover:text-white'
        }`}
      >LT</button>
    </div>
  );
}
