import { createContext, useContext, useState } from 'react';

export type Language = 'EN' | 'KO';

const STORAGE_KEY = 'sv_language';

function getInitialLanguage(): Language {
  const stored = localStorage.getItem(STORAGE_KEY);
  return stored === 'KO' ? 'KO' : 'EN';
}

interface LanguageContextValue {
  language: Language;
  setLanguage: (lang: Language) => void;
}

export const LanguageContext = createContext<LanguageContextValue>({
  language: 'EN',
  setLanguage: () => {},
});

export function useLanguageState(): LanguageContextValue {
  const [language, setLanguageState] = useState<Language>(getInitialLanguage);

  const setLanguage = (lang: Language) => {
    localStorage.setItem(STORAGE_KEY, lang);
    setLanguageState(lang);
  };

  return { language, setLanguage };
}

export function useLanguage() {
  return useContext(LanguageContext);
}
