import { LookupAddress, promises as dns } from 'dns';
import * as http from 'http';
import * as https from 'https';
import { BlockList, isIP } from 'net';
import { Readable } from 'stream';
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

// node transport는 리다이렉트를 따라가지 않으므로 redirect: 'manual'은 fetch 주입 시에만 의미가 있다
type Transport = (
  url: string,
  init: { redirect: 'manual'; signal: AbortSignal; headers: Record<string, string> }
) => Promise<Response>;

const NULL_BODY_STATUS = [101, 204, 205, 304];

/**
 * node http(s) 기반 transport. 연결 시점의 DNS lookup에서도 사설 주소를 다시 거부해
 * 사전 검사와 실제 연결 사이에 DNS 응답이 바뀌는 리바인딩을 막는다 (검사한 주소로만 연결).
 */
const pinnedTransport =
  (lookup: (host: string) => Promise<string[]>): Transport =>
  (url, init) =>
    new Promise((resolve, reject) => {
      const target = new URL(url);
      const client = target.protocol === 'https:' ? https : http;

      const req = client.request(
        target,
        {
          method: 'GET',
          headers: init.headers,
          signal: init.signal,
          lookup: (hostname, options, callback) => {
            lookup(hostname).then(
              (addresses) => {
                if (!addresses.length || addresses.some(isPrivateAddress)) {
                  callback(new BlockedSourceHostError() as unknown as NodeJS.ErrnoException, '', 4);
                  return;
                }
                if (options.all) {
                  const all: LookupAddress[] = addresses.map((address) => ({
                    address,
                    family: isIP(address),
                  }));
                  (callback as unknown as (err: null, addresses: LookupAddress[]) => void)(
                    null,
                    all
                  );
                } else {
                  callback(null, addresses[0], isIP(addresses[0]));
                }
              },
              (error) => callback(error, '', 4)
            );
          },
        },
        (res) => {
          const headers = new Headers();
          for (const [key, value] of Object.entries(res.headers)) {
            if (value !== undefined)
              headers.set(key, Array.isArray(value) ? value.join(', ') : value);
          }
          const status = res.statusCode ?? 502;
          const body = NULL_BODY_STATUS.includes(status)
            ? null
            : (Readable.toWeb(res) as ReadableStream);
          if (!body) res.resume();
          resolve(new Response(body, { status, headers }));
        }
      );

      req.on('error', reject);
      req.end();
    });

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
  const lookup = opts.lookup ?? defaultLookup;
  const fetchImpl: Transport = opts.fetchImpl ?? pinnedTransport(lookup);
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
        if (error instanceof BlockedSourceHostError) throw error;
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
