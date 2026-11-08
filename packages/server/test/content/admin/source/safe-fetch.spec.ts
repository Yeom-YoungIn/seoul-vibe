import {
  isPrivateAddress,
  safeFetch,
  SafeFetchOptions,
  SourceFetchFailedError,
} from '../../../../src/content/admin/source/safe-fetch';
import { BlockedSourceHostError } from '../../../../src/content/shared/errors/content.errors';

describe('isPrivateAddress', () => {
  it.each([
    '10.1.2.3',
    '172.16.0.1',
    '172.31.255.255',
    '192.168.0.1',
    '127.0.0.1',
    '169.254.169.254',
    '0.0.0.0',
    '::1',
    'fc00::1',
    'fe80::1',
    '::ffff:10.0.0.1',
  ])('%s 는 사설 주소다', (ip) => {
    expect(isPrivateAddress(ip)).toBe(true);
  });

  it.each(['8.8.8.8', '172.32.0.1', '2001:4860:4860::8888'])('%s 는 공인 주소다', (ip) => {
    expect(isPrivateAddress(ip)).toBe(false);
  });
});

describe('safeFetch', () => {
  const htmlResponse = (body: string, init: ResponseInit = {}) =>
    new Response(body, { status: 200, headers: { 'content-type': 'text/html' }, ...init });

  const buildOptions = (
    fetchImpl: jest.Mock,
    hosts: Record<string, string[]> = {},
    overrides: Partial<SafeFetchOptions> = {},
  ): SafeFetchOptions => ({
    maxBytes: 1024,
    userAgent: 'SeoulVibeBot/1.0 (+http://localhost:5173)',
    lookup: async (host: string) => hosts[host] ?? ['93.184.216.34'],
    fetchImpl: fetchImpl as unknown as typeof fetch,
    ...overrides,
  });

  it('호스트가 사설 IP로 해석되면 차단한다', async () => {
    const fetchImpl = jest.fn();
    await expect(
      safeFetch('http://evil.test/', buildOptions(fetchImpl, { 'evil.test': ['10.0.0.5'] })),
    ).rejects.toBeInstanceOf(BlockedSourceHostError);
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it('IP 리터럴 사설 주소도 차단한다', async () => {
    const fetchImpl = jest.fn();
    await expect(safeFetch('http://127.0.0.1:3000/', buildOptions(fetchImpl))).rejects.toBeInstanceOf(
      BlockedSourceHostError,
    );
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it('리다이렉트 대상이 사설 IP면 차단한다', async () => {
    const fetchImpl = jest
      .fn()
      .mockResolvedValueOnce(new Response(null, { status: 302, headers: { location: 'http://internal.test/' } }));
    await expect(
      safeFetch('http://public.test/', buildOptions(fetchImpl, { 'internal.test': ['169.254.169.254'] })),
    ).rejects.toBeInstanceOf(BlockedSourceHostError);
    expect(fetchImpl).toHaveBeenCalledTimes(1);
  });

  it('리다이렉트가 3회를 넘으면 실패한다', async () => {
    const fetchImpl = jest
      .fn()
      .mockImplementation(async () => new Response(null, { status: 301, headers: { location: '/next' } }));
    await expect(safeFetch('http://public.test/', buildOptions(fetchImpl))).rejects.toBeInstanceOf(
      SourceFetchFailedError,
    );
    expect(fetchImpl).toHaveBeenCalledTimes(4);
  });

  it('maxBytes를 넘으면 중단한다', async () => {
    const fetchImpl = jest.fn().mockResolvedValue(htmlResponse('a'.repeat(1025)));
    await expect(safeFetch('http://public.test/', buildOptions(fetchImpl))).rejects.toBeInstanceOf(
      SourceFetchFailedError,
    );
  });

  it('4xx/5xx 응답은 실패한다', async () => {
    const fetchImpl = jest.fn().mockResolvedValue(htmlResponse('nope', { status: 404 }));
    await expect(safeFetch('http://public.test/', buildOptions(fetchImpl))).rejects.toBeInstanceOf(
      SourceFetchFailedError,
    );
  });

  it('정상 응답의 본문과 최종 URL을 반환한다', async () => {
    const fetchImpl = jest
      .fn()
      .mockResolvedValueOnce(new Response(null, { status: 302, headers: { location: '/final' } }))
      .mockResolvedValueOnce(htmlResponse('<html>ok</html>'));

    const result = await safeFetch('http://public.test/start', buildOptions(fetchImpl));

    expect(result.finalUrl).toBe('http://public.test/final');
    expect(result.contentType).toBe('text/html');
    expect(result.body.toString('utf8')).toBe('<html>ok</html>');
    expect(fetchImpl).toHaveBeenCalledWith(
      'http://public.test/start',
      expect.objectContaining({
        redirect: 'manual',
        headers: expect.objectContaining({ 'User-Agent': 'SeoulVibeBot/1.0 (+http://localhost:5173)' }),
      }),
    );
  });
});
