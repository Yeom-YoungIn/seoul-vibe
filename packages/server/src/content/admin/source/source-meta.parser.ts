import { load } from 'cheerio';

export interface SourceMeta {
  title: string | null;
  description: string | null;
  siteName: string | null;
  author: string | null;
  imageUrl: string | null;
}

const clean = (value: string | undefined | null): string | null => {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
};

const toAbsoluteUrl = (value: string | null, pageUrl: string): string | null => {
  if (!value) return null;
  try {
    return new URL(value, pageUrl).toString();
  } catch {
    return null;
  }
};

export function parseSourceMeta(html: string, pageUrl: string): SourceMeta {
  const $ = load(html);
  const meta = (selector: string) => clean($(selector).first().attr('content'));

  return {
    title: meta('meta[property="og:title"]') ?? clean($('title').first().text()),
    description: meta('meta[property="og:description"]') ?? meta('meta[name="description"]'),
    siteName: meta('meta[property="og:site_name"]'),
    author: meta('meta[property="article:author"]') ?? meta('meta[name="author"]'),
    imageUrl: toAbsoluteUrl(meta('meta[property="og:image"]'), pageUrl),
  };
}
