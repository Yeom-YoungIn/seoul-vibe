import { InvalidSourceUrlError } from '../../shared/errors/content.errors';
import { SourceType } from '../../shared/types/source-type';

export type { SourceType };

export interface NormalizedSource {
  url: string;
  type: SourceType;
  fetchUrl: string | null;
}

const INSTAGRAM_HOSTS = ['instagram.com', 'www.instagram.com'];
const NAVER_BLOG_HOSTS = ['blog.naver.com', 'm.blog.naver.com'];
const TRACKING_PARAMS = ['fbclid', 'gclid', 'trackingCode'];

const parseUrl = (raw: string): URL => {
  try {
    const url = new URL(raw.trim());
    if (url.protocol !== 'http:' && url.protocol !== 'https:') throw new Error();
    return url;
  } catch {
    throw new InvalidSourceUrlError();
  }
};

const normalizeInstagram = (url: URL): NormalizedSource => {
  // /p/{code}, /reel/{code}, /{user}/p/{code}
  const match = url.pathname.match(/^\/(?:[^/]+\/)?(p|reel)\/([A-Za-z0-9_-]+)\/?$/);
  if (!match) throw new InvalidSourceUrlError('instagram post url required');
  const [, kind, code] = match;
  return { url: `https://www.instagram.com/${kind}/${code}/`, type: 'INSTAGRAM', fetchUrl: null };
};

const normalizeNaverBlog = (url: URL): NormalizedSource | null => {
  let blogId: string | null = null;
  let logNo: string | null = null;

  const pathMatch = url.pathname.match(/^\/([^/]+)\/(\d+)\/?$/);
  if (pathMatch) {
    [, blogId, logNo] = pathMatch;
  } else if (/^\/PostView\.naver$/i.test(url.pathname)) {
    blogId = url.searchParams.get('blogId');
    logNo = url.searchParams.get('logNo');
  }

  if (!blogId || !logNo) return null;
  return {
    url: `https://blog.naver.com/${blogId}/${logNo}`,
    type: 'LINK',
    fetchUrl: `https://m.blog.naver.com/${blogId}/${logNo}`,
  };
};

export function normalizeSourceUrl(raw: string): NormalizedSource {
  const url = parseUrl(raw);
  const host = url.hostname.toLowerCase();

  if (INSTAGRAM_HOSTS.includes(host)) return normalizeInstagram(url);

  if (NAVER_BLOG_HOSTS.includes(host)) {
    const naver = normalizeNaverBlog(url);
    if (naver) return naver;
  }

  url.hash = '';
  for (const key of [...url.searchParams.keys()]) {
    if (key.startsWith('utm_') || TRACKING_PARAMS.includes(key)) url.searchParams.delete(key);
  }
  const normalized = url.toString();
  return { url: normalized, type: 'LINK', fetchUrl: normalized };
}
