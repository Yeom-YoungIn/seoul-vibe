import type { Language } from '../hooks/useLanguage';

export type UrlLang = 'en' | 'ko';

export const isUrlLang = (value: unknown): value is UrlLang => value === 'en' || value === 'ko';

export const toLanguage = (lang: UrlLang): Language => (lang === 'ko' ? 'KO' : 'EN');
export const toUrlLang = (lang: Language): UrlLang => (lang === 'KO' ? 'ko' : 'en');

/** localePath('KO', '/articles/a') → '/ko/articles/a', localePath('EN', '/') → '/en' */
export const localePath = (lang: Language, path: string): string =>
  `/${toUrlLang(lang)}${path === '/' ? '' : path}`;

/** 언어 접두어만 교체. 접두어 없는 경로(/auth, /admin)는 그대로 둔다 */
export const swapLocale = (pathname: string, lang: Language): string =>
  pathname.replace(/^\/(en|ko)(?=\/|$)/, `/${toUrlLang(lang)}`);
