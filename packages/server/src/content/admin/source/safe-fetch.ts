import { promises as dns } from 'dns';
import { BlockList, isIP } from 'net';
import { BlockedSourceHostError } from '../../shared/errors/content.errors';

export class SourceFetchFailedError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'SourceFetchFailedError';
  }
}

export interface SafeFetchOptions {
  maxBytes: number;
  timeoutMs?: number;
  maxRedirects?: number;
  userAgent: string;
  lookup?: (host: string) => Promise<string[]>;
  fetchImpl?: typeof fetch;
}

export interface SafeFetchResult {
  finalUrl: string;
  contentType: string;
  body: Buffer;
}

const DEFAULT_TIMEOUT_MS = 5000;
const DEFAULT_MAX_REDIRECTS = 3;

const blockList = new BlockList();
blockList.addSubnet('0.0.0.0', 8, 'ipv4');
blockList.addSubnet('10.0.0.0', 8, 'ipv4');
blockList.addSubnet('127.0.0.0', 8, 'ipv4');
blockList.addSubnet('169.254.0.0', 16, 'ipv4');
blockList.addSubnet('172.16.0.0', 12, 'ipv4');
blockList.addSubnet('192.168.0.0', 16, 'ipv4');
blockList.addSubnet('100.64.0.0', 10, 'ipv4');
blockList.addAddress('::', 'ipv6');
blockList.addAddress('::1', 'ipv6');
blockList.addSubnet('fc00::', 7, 'ipv6');
blockList.addSubnet('fe80::', 10, 'ipv6');

export function isPrivateAddress(ip: string): boolean {
  const mapped = ip.toLowerCase().match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/);
  if (mapped) return blockList.check(mapped[1], 'ipv4');

  const family = isIP(ip);
  if (family === 4) return blockList.check(ip, 'ipv4');
  if (family === 6) return blockList.check(ip, 'ipv6');
  return true;
}

const defaultLookup = async (host: string): Promise<string[]> => {
  const records = await dns.lookup(host, { all: true });
  return records.map((record) => record.address);
};

const assertPublicHost = async (url: URL, lookup: (host: string) => Promise<string[]>) => {
  if (url.protocol !== 'http:' && url.protocol !== 'https:') throw new BlockedSourceHostError();

  // URL.hostname은 IPv6를 [::1] 형태로 돌려준다
  const host = url.hostname.replace(/^\[|\]$/g, '');
  let addresses: string[];
  try {
    addresses = isIP(host) ? [host] : await lookup(host);
  } catch {
    throw new SourceFetchFailedError(`dns lookup failed: ${host}`);
  }

  if (!addresses.length || addresses.some(isPrivateAddress)) throw new BlockedSourceHostError();
};

const readLimited = async (res: Response, maxBytes: number): Promise<Buffer> => {
  if (!res.body) return Buffer.alloc(0);

  const reader = res.body.getReader();
  const chunks: Buffer[] = [];
  let total = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    total += value.byteLength;
    if (total > maxBytes) {
      await reader.cancel();
      throw new SourceFetchFailedError('response too large');
    }
    chunks.push(Buffer.from(value));
  }
  return Buffer.concat(chunks);
};

export async function safeFetch(url: string, opts: SafeFetchOptions): Promise<SafeFetchResult> {
  const fetchImpl = opts.fetchImpl ?? fetch;
  const lookup = opts.lookup ?? defaultLookup;
  const maxRedirects = opts.maxRedirects ?? DEFAULT_MAX_REDIRECTS;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), opts.timeoutMs ?? DEFAULT_TIMEOUT_MS);

  try {
    let current = new URL(url);
    for (let hop = 0; hop <= maxRedirects; hop++) {
      await assertPublicHost(current, lookup);

      let res: Response;
      try {
        res = await fetchImpl(current.toString(), {
          redirect: 'manual',
          signal: controller.signal,
          headers: { 'User-Agent': opts.userAgent, Accept: 'text/html,image/*;q=0.9,*/*;q=0.5' },
        });
      } catch (error) {
        throw new SourceFetchFailedError(`request failed: ${(error as Error).message}`);
      }

      if (res.status >= 300 && res.status < 400) {
        const location = res.headers.get('location');
        if (!location) throw new SourceFetchFailedError('redirect without location');
        current = new URL(location, current);
        continue;
      }

      if (!res.ok) throw new SourceFetchFailedError(`unexpected status ${res.status}`);

      return {
        finalUrl: current.toString(),
        contentType: (res.headers.get('content-type') ?? '').split(';')[0].trim().toLowerCase(),
        body: await readLimited(res, opts.maxBytes),
      };
    }
    throw new SourceFetchFailedError('too many redirects');
  } catch (error) {
    if (controller.signal.aborted && !(error instanceof BlockedSourceHostError)) {
      throw new SourceFetchFailedError('request timed out');
    }
    throw error;
  } finally {
    clearTimeout(timer);
  }
}
