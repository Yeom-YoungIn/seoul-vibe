import sanitizeHtml = require('sanitize-html');
import { SeoRoute, UrlLang, URL_LANGS } from './seo-path';

export interface SeoConfig {
  siteUrl: string;
  indexable: boolean;
}

export interface ArticleSeoData {
  slug: string;
  lang: UrlLang;
  title: string;
  bodyHtml: string | null;
  bodyText: string | null;
  publishedAt: Date | null;
  updatedAt: Date;
  availableLangs: UrlLang[];
  sourceUrl: string | null;
  sourceAuthor: string | null;
  sourceSiteName: string | null;
}

export interface SitemapEntry {
  path: string;
  alternates: Partial<Record<UrlLang, string>>;
  lastmod?: Date;
}

const SITE_NAME = 'Seoul Vibe';
const DESCRIPTION_LIMIT = 155;
const OG_LOCALE: Record<UrlLang, string> = { en: 'en_US', ko: 'ko_KR' };
const HOME_COPY: Record<UrlLang, { title: string; description: string; guides: string }> = {
  en: {
    title: 'Seoul Vibe — Local places in Seoul',
    description:
      'Curated guides and first-hand posts about restaurants, cafés and hidden spots in Seoul.',
    guides: 'Guides | ',
  },
  ko: {
    title: 'Seoul Vibe — 서울 로컬 장소 가이드',
    description: '서울의 식당, 카페, 숨은 장소를 큐레이션 가이드와 생생한 후기로 소개합니다.',
    guides: '가이드 | ',
  },
};
const SOURCE_LABEL: Record<UrlLang, string> = { en: 'Source', ko: '원문' };

const escapeHtml = (value: string): string =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

const decodeEntities = (value: string): string =>
  value
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, '&');

// JSON-LD는 <script> 안에 들어가므로 </script> 조기 종료를 막는다
const toJsonLd = (data: object): string => JSON.stringify(data).replace(/</g, '\\u003c');

const meta = (attr: 'name' | 'property', key: string, content: string) =>
  `<meta ${attr}="${key}" content="${escapeHtml(content)}">`;
const link = (rel: string, href: string, hreflang?: string) =>
  hreflang
    ? `<link rel="${rel}" hreflang="${hreflang}" href="${escapeHtml(href)}">`
    : `<link rel="${rel}" href="${escapeHtml(href)}">`;

const robotsMeta = (cfg: SeoConfig, noindex = false) =>
  !cfg.indexable || noindex ? [meta('name', 'robots', 'noindex, nofollow')] : [];

const alternateLinks = (cfg: SeoConfig, pathFor: (lang: UrlLang) => string, langs: UrlLang[]) => {
  if (!langs.length) return [];
  const xDefault = langs.includes('en') ? 'en' : langs[0];
  return [
    ...langs.map((lang) => link('alternate', cfg.siteUrl + pathFor(lang), lang)),
    link('alternate', cfg.siteUrl + pathFor(xDefault), 'x-default'),
  ];
};

const commonOg = (cfg: SeoConfig, title: string, description: string) => [
  meta('property', 'og:site_name', SITE_NAME),
  meta('property', 'og:title', title),
  meta('property', 'og:description', description),
  meta('property', 'og:image', `${cfg.siteUrl}/og-default.png`),
  meta('name', 'twitter:card', 'summary_large_image'),
];

export function summarize(bodyHtml: string | null, bodyText: string | null): string {
  const source = bodyHtml
    ? decodeEntities(
        sanitizeHtml(bodyHtml.replace(/<\/(p|div|li|h[1-6])>|<br\s*\/?>/gi, '$& '), {
          allowedTags: [],
          allowedAttributes: {},
        })
      )
    : (bodyText ?? '');
  const text = source.replace(/\s+/g, ' ').trim();
  return text.length > DESCRIPTION_LIMIT ? `${text.slice(0, DESCRIPTION_LIMIT).trimEnd()}…` : text;
}

export function renderDefaultHead(
  cfg: SeoConfig,
  route: SeoRoute,
  opts: { noindex?: boolean } = {}
): string {
  const lang: UrlLang = route.kind === 'other' ? 'en' : route.lang;
  const copy = HOME_COPY[lang];
  const title = route.kind === 'articles' ? copy.guides + copy.title : copy.title;
  const tags = [
    `<title>${escapeHtml(title)}</title>`,
    meta('name', 'description', copy.description),
  ];

  if (route.kind === 'home' || route.kind === 'articles') {
    const pathFor = (l: UrlLang) => (route.kind === 'home' ? `/${l}` : `/${l}/articles`);
    tags.push(
      link('canonical', cfg.siteUrl + pathFor(lang)),
      ...alternateLinks(cfg, pathFor, URL_LANGS),
      meta('property', 'og:type', 'website'),
      meta('property', 'og:url', cfg.siteUrl + pathFor(lang)),
      meta('property', 'og:locale', OG_LOCALE[lang])
    );
  }

  tags.push(...commonOg(cfg, title, copy.description), ...robotsMeta(cfg, opts.noindex));
  return tags.join('\n');
}

export function renderArticleHead(cfg: SeoConfig, a: ArticleSeoData): string {
  const pathFor = (lang: UrlLang) => `/${lang}/articles/${encodeURIComponent(a.slug)}`;
  const url = cfg.siteUrl + pathFor(a.lang);
  const title = `${a.title} | ${SITE_NAME}`;
  const description = summarize(a.bodyHtml, a.bodyText);

  const jsonLd: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: a.title,
    description,
    inLanguage: a.lang,
    mainEntityOfPage: url,
    image: `${cfg.siteUrl}/og-default.png`,
    datePublished: (a.publishedAt ?? a.updatedAt).toISOString(),
    dateModified: a.updatedAt.toISOString(),
    publisher: { '@type': 'Organization', name: SITE_NAME },
  };
  if (a.sourceUrl) jsonLd.isBasedOn = a.sourceUrl;

  return [
    `<title>${escapeHtml(title)}</title>`,
    meta('name', 'description', description),
    link('canonical', url),
    ...alternateLinks(cfg, pathFor, a.availableLangs),
    meta('property', 'og:type', 'article'),
    meta('property', 'og:url', url),
    meta('property', 'og:locale', OG_LOCALE[a.lang]),
    ...commonOg(cfg, title, description),
    ...robotsMeta(cfg),
    `<script type="application/ld+json">${toJsonLd(jsonLd)}</script>`,
  ].join('\n');
}

export function renderArticleBody(a: ArticleSeoData): string {
  const body = a.bodyHtml
    ? sanitizeHtml(a.bodyHtml, {
        allowedTags: [...sanitizeHtml.defaults.allowedTags, 'img'],
        allowedAttributes: { a: ['href', 'rel', 'target'], img: ['src', 'alt'] },
        allowedSchemes: ['http', 'https'],
      })
    : (a.bodyText ?? '')
        .split('\n')
        .filter((line) => line.trim())
        .map((line) => `<p>${escapeHtml(line)}</p>`)
        .join('');

  const date = (a.publishedAt ?? a.updatedAt).toISOString();
  const source = a.sourceUrl
    ? `<p>${SOURCE_LABEL[a.lang]}: <a href="${escapeHtml(a.sourceUrl)}" rel="noopener">${escapeHtml(
        [a.sourceAuthor, a.sourceSiteName].filter(Boolean).join(' · ') || a.sourceUrl
      )}</a></p>`
    : '';

  return `<article><h1>${escapeHtml(a.title)}</h1><time datetime="${date}">${date.slice(0, 10)}</time>${body}${source}</article>`;
}

export function renderArticleListBody(
  lang: UrlLang,
  items: { slug: string; title: string }[]
): string {
  const links = items
    .map(
      (item) =>
        `<li><a href="/${lang}/articles/${encodeURIComponent(item.slug)}">${escapeHtml(item.title)}</a></li>`
    )
    .join('');
  return `<nav><h1>${escapeHtml(HOME_COPY[lang].guides.replace(' | ', ''))}</h1><ul>${links}</ul></nav>`;
}

export function renderSitemap(cfg: SeoConfig, entries: SitemapEntry[]): string {
  const urls = cfg.indexable
    ? entries.map((entry) => {
        const alternates = (Object.entries(entry.alternates) as [UrlLang, string][])
          .map(
            ([lang, path]) =>
              `<xhtml:link rel="alternate" hreflang="${lang}" href="${escapeHtml(cfg.siteUrl + path)}"/>`
          )
          .join('');
        const lastmod = entry.lastmod
          ? `<lastmod>${entry.lastmod.toISOString().slice(0, 10)}</lastmod>`
          : '';
        return `<url><loc>${escapeHtml(cfg.siteUrl + entry.path)}</loc>${lastmod}${alternates}</url>`;
      })
    : [];

  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">',
    ...urls,
    '</urlset>',
  ].join('\n');
}

export function renderRobots(cfg: SeoConfig): string {
  if (!cfg.indexable) return 'User-agent: *\nDisallow: /\n';
  return [
    'User-agent: *',
    'Allow: /',
    'Disallow: /admin',
    'Disallow: /auth',
    'Disallow: /api',
    '',
    `Sitemap: ${cfg.siteUrl}/sitemap.xml`,
    '',
  ].join('\n');
}
