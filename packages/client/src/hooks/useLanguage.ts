import { createContext, useCallback, useContext, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { isUrlLang, localePath, swapLocale, toLanguage } from '../lib/locale';

export type Language = 'EN' | 'KO';

const STORAGE_KEY = 'sv_language';

export function getStoredLanguage(): Language | null {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored === 'KO' || stored === 'EN' ? stored : null;
  } catch {
    return null;
  }
}

interface LanguageContextValue {
  language: Language;
  setLanguage: (lang: Language) => void;
}

/** 저장된 선호 언어. 실제 화면 언어는 URL 접두어가 우선한다 (useLanguage 참고) */
export const LanguageContext = createContext<LanguageContextValue>({
  language: 'EN',
  setLanguage: () => {},
});

export function useLanguageState(): LanguageContextValue {
  const [language, setLanguageState] = useState<Language>(() => getStoredLanguage() ?? 'EN');

  const setLanguage = useCallback((lang: Language) => {
    try {
      localStorage.setItem(STORAGE_KEY, lang);
    } catch {
      // 저장 실패해도 URL 기준으로 동작한다
    }
    setLanguageState(lang);
  }, []);

  return { language, setLanguage };
}

export function useLanguage(): LanguageContextValue {
  const { language: stored, setLanguage: store } = useContext(LanguageContext);
  const { lang } = useParams();
  const { pathname, search } = useLocation();
  const navigate = useNavigate();

  const language = isUrlLang(lang) ? toLanguage(lang) : stored;

  const setLanguage = (next: Language) => {
    store(next);
    const nextPath = swapLocale(pathname, next);
    if (nextPath !== pathname) navigate(nextPath + search);
  };

  return { language, setLanguage };
}

/** 현재 언어 접두어를 붙인 공개 경로 생성기 */
export function useLocalePath() {
  const { language } = useLanguage();
  return (path: string) => localePath(language, path);
}
