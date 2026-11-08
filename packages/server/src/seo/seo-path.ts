import { Language } from '@app/common';

export type UrlLang = 'en' | 'ko';

export type SeoRoute =
  | { kind: 'home'; lang: UrlLang }
  | { kind: 'articles'; lang: UrlLang }
  | { kind: 'article'; lang: UrlLang; slug: string }
  | { kind: 'other' };

export const URL_LANGS: UrlLang[] = ['en', 'ko'];

export const toLanguage = (lang: UrlLang): Language => (lang === 'ko' ? 'KO' : 'EN');
export const toUrlLang = (lang: Language): UrlLang => (lang === 'KO' ? 'ko' : 'en');

const isUrlLang = (value: string): value is UrlLang => (URL_LANGS as string[]).includes(value);

export function parseSeoPath(path: string): SeoRoute {
  const segments = path.split('?')[0].split('/').filter(Boolean);
  const [lang, section, slug, ...rest] = segments;

  if (!lang || !isUrlLang(lang) || rest.length) return { kind: 'other' };
  if (!section) return { kind: 'home', lang };
  if (section !== 'articles') return { kind: 'other' };
  if (!slug) return { kind: 'articles', lang };

  try {
    return { kind: 'article', lang, slug: decodeURIComponent(slug) };
  } catch {
    return { kind: 'other' };
  }
}
