# 외부 원문 큐레이션 + SEO Implementation Plan

> **For agentic workers (Codex):** 태스크를 순서대로 하나씩 구현한다. 각 태스크는 테스트 → 구현 → 검증 → 커밋으로 끝난다. 체크박스(`- [ ]`)로 진행을 추적한다. 막히거나 스펙과 충돌하면 추측하지 말고 멈춰서 보고한다.

**Goal:** 관리자 아티클에 외부 원문(인스타 임베드 / 블로그 링크 카드)을 첨부하고, 공개 페이지를 언어 접두어 URL + 크롤러용 HTML(SSI)로 SEO 가능하게 만든다.

**Architecture:** `contents`에 source 컬럼을 추가하고 관리자 전용 preview API가 SSRF-safe fetch로 OG 메타를 수집한다. 클라이언트는 `/:lang` 레이아웃 라우트로 언어를 URL에서 읽는다. nginx SSI가 `index.html`의 `<head>`와 `#root`에 NestJS `SeoModule`이 만든 조각을 끼워 넣고, sitemap/robots도 같은 모듈이 서빙한다.

**Tech Stack:** NestJS 10, TypeORM 0.3, Jest / React 18, React Router 7, Vite 5 / nginx 1.27 SSI / 신규 의존성: `cheerio`, `sanitize-html`, `@types/sanitize-html`

**Spec:** `docs/superpowers/specs/2026-11-08-external-source-and-seo-design.md` — 각 태스크 전에 해당 절을 읽을 것.

## Global Constraints

- 새 의존성은 `cheerio`, `sanitize-html`, `@types/sanitize-html`만 (server workspace). 클라이언트 신규 의존성 없음.
- 서버 모듈 구조 `service` / `admin` / `shared`, DTO + `@TransformResponse`, `HttpException` 상속 에러 클래스(`errorCode` 포함) 패턴 유지.
- 서버 테스트는 `packages/server/test/` 아래 `src` 미러 경로, 테스트명은 한국어 서술형(기존 스타일: `'…를 반환한다'`).
- 설정/인프라 파일 상단 `# 목적 - … / # 설명 - …` 주석이 있으면 수정 내용에 맞게 갱신.
- 언어 코드: 서버 `'KO' | 'EN'`(`LANGUAGE`), URL `en | ko`(소문자). 변환은 한 곳의 헬퍼로.
- 원문 썸네일은 링크 카드에서만 사용. `og:image`는 항상 `{SITE_URL}/og-default.png`.
- `SITE_URL`: base `https://seoul-vibe.example.com`, prod `http://seoul-vibe.example.com`, AWS/GCP dev `http://dev.seoul-vibe.example.com`, 미설정 시 `http://localhost:5173`.
- `SEO_INDEXABLE`: 기본 `false`, prod overlay만 `"true"`.
- fetch 제한: 타임아웃 5000ms, HTML 2MB, 이미지 5MB, 리다이렉트 최대 3회, UA `SeoulVibeBot/1.0 (+{SITE_URL})`.
- 디자인은 `packages/client/DESIGN.md` 토큰/타이포 준수, CSS는 `packages/client/src/styles.css`에 추가.
- 각 태스크 완료 시: `npm --workspace packages/server test`, `npm run lint:server`, `npm run build:server`(서버 변경 시) / `npm run lint:client`, `npm run build:client`(클라이언트 변경 시) 통과.

## Review Focus

1. **리다이렉트로 내부망 우회** (`http://public.example → 302 → http://169.254.169.254/`) → 두 번째 홉에서 차단되어 400. → Task 2 테스트 `리다이렉트 대상이 사설 IP면 차단한다`.
2. **OG가 없는 페이지 / 상대 경로 og:image / HTML 엔티티 포함 제목** → `<title>` 폴백, 절대 URL 변환, 엔티티 디코딩. → Task 2 파서 테스트.
3. **번역이 한 언어만 있는 아티클** → 없는 언어 URL은 noindex, hreflang에는 있는 언어만, x-default는 en 우선·없으면 ko. → Task 4 테스트.
4. **XSS / 깨진 HTML 주입**: 제목에 `"><script>`, bodyHtml에 `<script>`/`onerror` → head는 이스케이프, body 조각은 sanitize, JSON-LD의 `</script>` 무력화. → Task 4 테스트.
5. **수정 시 출처 제거** (`sourceUrl: null`) → 모든 source 필드 null, `sourceUrl` 미포함 업데이트는 기존 출처 유지. → Task 3 테스트.

---

## File Structure

**Server (`packages/server`)**
- Create `src/content/admin/source/source-url.ts` — URL 정규화 순수 함수
- Create `src/content/admin/source/safe-fetch.ts` — 사설 IP 검사 + 제한된 fetch
- Create `src/content/admin/source/source-meta.parser.ts` — cheerio OG 파싱
- Create `src/content/admin/source/source-preview.service.ts` — preview 조립 + 썸네일 저장
- Create `src/content/admin/dto/request/source-preview.dto.ts`, `src/content/admin/dto/response/source-preview.response.dto.ts`
- Modify `src/content/shared/entities/content.entity.ts`, `src/content/shared/errors/content.errors.ts`, `src/content/shared/dto/response/base-content.response.dto.ts`
- Modify `src/content/admin/dto/request/create-content.dto.ts`, `update-content.dto.ts`, `admin.content.service.ts`, `admin.content.controller.ts`, `admin.content.module.ts`
- Create `src/seo/seo.module.ts`, `src/seo/seo.controller.ts`, `src/seo/seo.service.ts`, `src/seo/seo.render.ts`(순수 렌더 함수), `src/seo/seo-path.ts`(경로 파싱)
- Modify `src/app.module.ts`
- Create `src/upload/uploads-root.ts` — `UPLOADS_ROOT` 상수 (`upload.controller.ts`, `main.ts`, preview 서비스가 공유)
- Create `sql/2026-11-08-content-source.sql`
- Tests: `test/content/admin/source/*.spec.ts`, `test/content/admin/admin.content.service.spec.ts`(확장), `test/seo/*.spec.ts`

**Client (`packages/client`)**
- Modify `src/hooks/useLanguage.ts`, `src/App.tsx`, `src/components/layouts/NavBar.tsx`, `Footer.tsx`, 공개 페이지들의 링크
- Create `src/lib/locale.ts` — `localePath`, 변환 헬퍼
- Create `src/components/layouts/LocaleLayout.tsx` — `/:lang` 가드 + `<html lang>` 갱신
- Create `src/components/ui/RootRedirect.tsx`, `src/components/ui/LegacyRedirect.tsx`
- Create `src/components/ui/ArticleSource.tsx`, `src/components/ui/InstagramEmbed.tsx`
- Modify `src/lib/api/articles.ts`, `src/lib/api/admin.ts`, `src/pages/admin/AdminArticlesPage.tsx`, `src/pages/articles/ArticleDetailPage.tsx`, `src/styles.css`
- Create `public/og-default.png`
- Modify `index.html`, `nginx.conf.template`

**Infra / Docs**
- Modify `k8s/base/server-configmap.yaml`, `k8s/overlays/{prod,aws/dev,gcp/dev}/server-configmap-patch.yaml`
- Modify `docs/deployment/eks.md` (SQL 적용 절차 단락)

---

### Task 1: 원문 URL 정규화

**Files:**
- Create: `packages/server/src/content/admin/source/source-url.ts`
- Modify: `packages/server/src/content/shared/errors/content.errors.ts`
- Test: `packages/server/test/content/admin/source/source-url.spec.ts`

**Interfaces:**
- Produces:
  - `export type SourceType = 'INSTAGRAM' | 'LINK'` (같은 파일에서 export, 이후 모든 태스크가 사용)
  - `export interface NormalizedSource { url: string; type: SourceType; fetchUrl: string | null }` — `fetchUrl`은 메타 수집용 URL, 인스타는 `null`
  - `export function normalizeSourceUrl(raw: string): NormalizedSource` — 잘못된 입력은 `InvalidSourceUrlError` throw
  - `content.errors.ts`: `export class InvalidSourceUrlError extends HttpException` (400, `errorCode: 'INVALID_SOURCE_URL'`)

- [ ] **Step 1: 실패하는 테스트 작성** — 아래 표의 각 행을 `it.each`로:

```ts
it.each([
  ['https://www.instagram.com/p/DcOEG9qkwW6/?img_index=2&psln=N2Z3', 'https://www.instagram.com/p/DcOEG9qkwW6/', 'INSTAGRAM', null],
  ['https://instagram.com/reel/AbC_12-x#x', 'https://www.instagram.com/reel/AbC_12-x/', 'INSTAGRAM', null],
  ['https://www.instagram.com/someuser/p/DcOEG9qkwW6/', 'https://www.instagram.com/p/DcOEG9qkwW6/', 'INSTAGRAM', null],
  ['https://blog.naver.com/cafe_lover/223456789012?trackingCode=x', 'https://blog.naver.com/cafe_lover/223456789012', 'LINK', 'https://m.blog.naver.com/cafe_lover/223456789012'],
  ['https://blog.naver.com/PostView.naver?blogId=cafe_lover&logNo=223456789012', 'https://blog.naver.com/cafe_lover/223456789012', 'LINK', 'https://m.blog.naver.com/cafe_lover/223456789012'],
  ['https://m.blog.naver.com/cafe_lover/223456789012', 'https://blog.naver.com/cafe_lover/223456789012', 'LINK', 'https://m.blog.naver.com/cafe_lover/223456789012'],
  ['https://foo.tistory.com/12?utm_source=ig&fbclid=1&page=2#c', 'https://foo.tistory.com/12?page=2', 'LINK', 'https://foo.tistory.com/12?page=2'],
])('%s 를 정규화한다', (raw, url, type, fetchUrl) => {
  expect(normalizeSourceUrl(raw)).toEqual({ url, type, fetchUrl });
});

it.each(['ftp://a.com/x', 'javascript:alert(1)', 'not a url', '', 'https://www.instagram.com/someuser/'])(
  '%s 는 InvalidSourceUrlError', (raw) => {
    expect(() => normalizeSourceUrl(raw)).toThrow(InvalidSourceUrlError);
  });
```
(인스타 도메인인데 게시물 경로가 아니면 에러 — 마지막 케이스.) 쿼리 제거 대상: `utm_*`, `fbclid`, `gclid`, 네이버 `trackingCode`.

- [ ] **Step 2: 실패 확인** — `npm --workspace packages/server test -- source-url` → FAIL (모듈 없음)
- [ ] **Step 3: `normalizeSourceUrl` 구현** — `new URL()` 기반, 앞뒤 공백 trim.
- [ ] **Step 4: 통과 확인** — 같은 명령 → PASS
- [ ] **Step 5: 커밋** — `feat(server): 외부 원문 URL 정규화 추가`

---

### Task 2: SSRF-safe fetch + OG 메타 파서

**Files:**
- Create: `packages/server/src/content/admin/source/safe-fetch.ts`, `source-meta.parser.ts`
- Modify: `packages/server/src/content/shared/errors/content.errors.ts`, `packages/server/package.json` (`cheerio` 추가)
- Test: `packages/server/test/content/admin/source/safe-fetch.spec.ts`, `source-meta.parser.spec.ts`

**Interfaces:**
- Produces:
  - `export function isPrivateAddress(ip: string): boolean` — IPv4/IPv6, IPv4-mapped IPv6(`::ffff:10.0.0.1`) 포함
  - `export interface SafeFetchOptions { maxBytes: number; timeoutMs?: number /* 5000 */; maxRedirects?: number /* 3 */; userAgent: string; lookup?: (host: string) => Promise<string[]> /* 테스트 주입용, 기본 dns.promises.lookup all */ ; fetchImpl?: typeof fetch /* 테스트 주입용 */ }`
  - `export interface SafeFetchResult { finalUrl: string; contentType: string; body: Buffer }`
  - `export async function safeFetch(url: string, opts: SafeFetchOptions): Promise<SafeFetchResult>` — 차단 시 `BlockedSourceHostError`(400, `'BLOCKED_SOURCE_HOST'`), 타임아웃/HTTP 오류/크기 초과 시 `SourceFetchFailedError`(일반 `Error` 서브클래스, HTTP 예외 아님 — preview 서비스가 잡아서 폴백)
  - `export interface SourceMeta { title: string | null; description: string | null; siteName: string | null; author: string | null; imageUrl: string | null }`
  - `export function parseSourceMeta(html: string, pageUrl: string): SourceMeta`

- [ ] **Step 1: `isPrivateAddress` 실패 테스트** — true: `10.1.2.3`, `172.16.0.1`, `172.31.255.255`, `192.168.0.1`, `127.0.0.1`, `169.254.169.254`, `0.0.0.0`, `::1`, `fc00::1`, `fe80::1`, `::ffff:10.0.0.1`. false: `8.8.8.8`, `172.32.0.1`, `2001:4860:4860::8888`.
- [ ] **Step 2: `safeFetch` 실패 테스트** (`lookup`, `fetchImpl` 주입):
  - `'호스트가 사설 IP로 해석되면 차단한다'` — lookup → `['10.0.0.5']` → `BlockedSourceHostError`, fetchImpl 미호출
  - `'리다이렉트 대상이 사설 IP면 차단한다'` — 1번째 응답 302 `Location: http://internal.test/`, internal.test → `169.254.169.254` → `BlockedSourceHostError`
  - `'리다이렉트가 3회를 넘으면 실패한다'` → `SourceFetchFailedError`
  - `'maxBytes를 넘으면 중단한다'` — 본문 maxBytes+1 → `SourceFetchFailedError`
  - `'정상 응답의 본문과 최종 URL을 반환한다'`
  - fetchImpl 호출 시 `redirect: 'manual'`, `User-Agent` 헤더 전달 assert
- [ ] **Step 3: `parseSourceMeta` 실패 테스트**:
  - og:title/description/site_name/image + `article:author` 모두 있는 HTML → 각각 추출
  - OG 없음 → `<title>`, `meta[name=description]` 폴백, 나머지 null
  - `og:image="/img/a.jpg"` + pageUrl `https://foo.tistory.com/12` → `https://foo.tistory.com/img/a.jpg`
  - `og:title="카페 &amp; 베이커리"` → `'카페 & 베이커리'`
  - 값 앞뒤 공백 trim, 빈 문자열은 null
- [ ] **Step 4: 실패 확인** — `npm --workspace packages/server test -- source/` → FAIL
- [ ] **Step 5: 구현** — `npm --workspace packages/server i cheerio`. `isPrivateAddress`는 `net.BlockList`로. `safeFetch`는 Node 22 전역 `fetch` + `AbortController`, 매 홉마다 `lookup` → 하나라도 private면 차단, `res.body` 스트림을 누적하며 maxBytes 초과 시 abort.
- [ ] **Step 6: 통과 확인** — 같은 명령 → PASS
- [ ] **Step 7: 커밋** — `feat(server): 원문 메타 수집용 안전 fetch와 OG 파서 추가`

---

### Task 3: 엔티티·DTO·관리자 서비스·preview API

**Files:**
- Create: `packages/server/src/upload/uploads-root.ts`, `packages/server/src/content/admin/source/source-preview.service.ts`, `packages/server/src/content/admin/dto/request/source-preview.dto.ts`, `packages/server/src/content/admin/dto/response/source-preview.response.dto.ts`, `packages/server/sql/2026-11-08-content-source.sql`
- Modify: `content.entity.ts`, `base-content.response.dto.ts`, `create-content.dto.ts`, `update-content.dto.ts`, `admin.content.service.ts`, `admin.content.controller.ts`, `admin.content.module.ts`, `upload.controller.ts`, `main.ts`, `docs/deployment/eks.md`
- Test: `packages/server/test/content/admin/admin.content.service.spec.ts`, `packages/server/test/content/admin/source/source-preview.service.spec.ts`

**Interfaces:**
- Consumes: Task 1 `normalizeSourceUrl`, `SourceType`; Task 2 `safeFetch`, `parseSourceMeta`, `SourceFetchFailedError`
- Produces:
  - `Content` 엔티티 컬럼 (모두 nullable, 타입은 스펙 4.1 표 그대로): `sourceUrl`, `sourceType`, `sourceTitle`, `sourceDescription`, `sourceSiteName`, `sourceAuthor`, `sourceImagePath`
  - `BaseContentResponseDto`에 위 7개 필드 `@Expose()` (모두 `string | null`)
  - `export class ContentSourceDto` (`create-content.dto.ts`에 정의, update에서 재사용): `sourceUrl?: string | null`(`@IsOptional() @IsString() @MaxLength(2048)`), `sourceTitle`(300), `sourceDescription`(500), `sourceSiteName`(100), `sourceAuthor`(100), `sourceImagePath`(500) — 모두 optional+nullable. `sourceType`은 받지 않음(서버가 정규화로 결정). `CreateContentDto`·`UpdateContentDto`가 이 필드들을 갖도록 (`IntersectionType` 또는 직접 선언).
  - `export const UPLOADS_ROOT: string` — 기존 `main.ts`(`join(__dirname,'..','uploads')`)와 `upload.controller.ts`가 쓰던 **같은 디렉터리**(빌드 후 `dist/uploads`)를 가리키도록 위치 기준으로 계산
  - `SourcePreviewService.preview(rawUrl: string): Promise<SourcePreviewResult>`, `SourcePreviewResult = { sourceUrl: string; sourceType: SourceType; sourceTitle: string|null; sourceDescription: string|null; sourceSiteName: string|null; sourceAuthor: string|null; sourceImagePath: string|null }`
  - `POST /content/admin/source-preview` body `SourcePreviewDto { url: string }` → `SourcePreviewResponseDto`
  - 썸네일 저장 경로: `${UPLOADS_ROOT}/sources/{uuid}.{jpg|png|webp|gif}`, 반환값 `/uploads/sources/{uuid}.{ext}` (확장자는 content-type 기준, 그 외 타입은 저장 안 함)

- [ ] **Step 1: admin 서비스 실패 테스트 추가** (`admin.content.service.spec.ts`)
  - `'create 시 sourceUrl을 정규화하고 sourceType을 설정한다'` — 입력 `https://www.instagram.com/p/DcOEG9qkwW6/?img_index=2` → 저장 엔티티 `sourceUrl: 'https://www.instagram.com/p/DcOEG9qkwW6/'`, `sourceType: 'INSTAGRAM'`
  - `'update 시 sourceUrl이 null이면 모든 source 필드를 비운다'` — 7개 필드 모두 null
  - `'update 시 sourceUrl이 없으면 기존 source 필드를 유지한다'`
  - `'update 시 sourceUrl만 바뀌면 sourceType을 다시 계산한다'`
  - `'잘못된 sourceUrl이면 InvalidSourceUrlError'`
- [ ] **Step 2: preview 서비스 실패 테스트** (`safeFetch` 모듈을 `jest.mock`)
  - 인스타 URL → `safeFetch` 미호출, `{ sourceType: 'INSTAGRAM', sourceSiteName: 'Instagram', 나머지 null }`
  - 블로그 URL → `fetchUrl`로 HTML fetch(maxBytes `2*1024*1024`), 파싱 결과 매핑, og:image를 maxBytes `5*1024*1024`로 fetch 후 `fs.promises.writeFile` 호출, `sourceImagePath`가 `/^\/uploads\/sources\/[0-9a-f-]+\.jpg$/`
  - HTML fetch가 `SourceFetchFailedError` → throw하지 않고 정규화 결과 + null 메타 반환
  - 이미지 content-type이 `text/html` → `sourceImagePath: null`, writeFile 미호출
  - `BlockedSourceHostError`는 그대로 전파
- [ ] **Step 3: 실패 확인** — `npm --workspace packages/server test -- content/admin` → FAIL
- [ ] **Step 4: 구현** — 엔티티/DTO/서비스/컨트롤러/모듈. `SITE_URL`은 `ConfigService`로 읽어 UA에 사용(기본 `http://localhost:5173`). `upload.controller.ts`, `main.ts`가 `UPLOADS_ROOT` 사용하도록 교체(동작 변화 없음). 저장 전 `sources` 디렉터리 `mkdir -p`.
- [ ] **Step 5: SQL 파일 작성** — `ALTER TABLE contents ADD COLUMN IF NOT EXISTS source_url varchar(2048), …` 7개 (snake_case). 파일 상단 주석으로 "서버 배포 전에 실행" 명시. `docs/deployment/eks.md`에 "스키마 변경 적용" 단락: GCP dev는 `TYPEORM_SYNC=true`라 자동, AWS dev·prod는 배포 전 `psql -f packages/server/sql/2026-11-08-content-source.sql` 수동 실행.
- [ ] **Step 6: 통과 확인** — `npm --workspace packages/server test && npm run lint:server && npm run build:server` → 모두 성공
- [ ] **Step 7: 커밋** — `feat(server): 아티클 원문 출처 필드와 미리보기 API 추가`

---

### Task 4: SEO 렌더러·컨트롤러 (head / body / sitemap / robots)

**Files:**
- Create: `packages/server/src/seo/seo-path.ts`, `seo.render.ts`, `seo.service.ts`, `seo.controller.ts`, `seo.module.ts`
- Modify: `packages/server/src/app.module.ts`, `packages/server/package.json` (`sanitize-html`, `@types/sanitize-html`)
- Test: `packages/server/test/seo/seo-path.spec.ts`, `seo.render.spec.ts`, `seo.service.spec.ts`

**Interfaces:**
- Consumes: `Content`/`ContentTranslation` 엔티티 + Task 3 source 필드
- Produces:
  - `export type UrlLang = 'en' | 'ko'`; `export function toLanguage(l: UrlLang): Language` / `toUrlLang(l: Language): UrlLang`
  - `export type SeoRoute = { kind: 'home'; lang: UrlLang } | { kind: 'articles'; lang: UrlLang } | { kind: 'article'; lang: UrlLang; slug: string } | { kind: 'other' }`
  - `export function parseSeoPath(path: string): SeoRoute` — 끝 슬래시 무시, 쿼리 무시, slug는 `decodeURIComponent`
  - `export interface SeoConfig { siteUrl: string; indexable: boolean }`
  - `export interface ArticleSeoData { slug: string; lang: UrlLang; title: string; bodyHtml: string|null; bodyText: string|null; publishedAt: Date|null; updatedAt: Date; availableLangs: UrlLang[]; sourceUrl: string|null; sourceAuthor: string|null; sourceSiteName: string|null }`
  - 순수 함수 (`seo.render.ts`): `renderDefaultHead(cfg, route)`, `renderArticleHead(cfg, a: ArticleSeoData)`, `renderArticleBody(a: ArticleSeoData)`, `renderArticleListBody(lang, items: { slug: string; title: string }[])`, `renderSitemap(cfg, entries: { path: string; alternates: Partial<Record<UrlLang,string>>; lastmod?: Date }[])`, `renderRobots(cfg)`, `describe(bodyHtml, bodyText): string` (태그 제거·공백 정리·155자 + `…`) — 모두 `string` 반환
  - 라우트 (전역 인터셉터 우회: `@Res()`로 `res.type(...).set('Cache-Control','public, max-age=300').send(...)`):
    - `GET /seo/head/*` → `text/html`
    - `GET /seo/body/*` → `text/html`
    - `GET /seo/sitemap.xml` → `application/xml`
    - `GET /seo/robots.txt` → `text/plain`
  - env: `SITE_URL`(기본 `http://localhost:5173`, 끝 슬래시 제거), `SEO_INDEXABLE`(`'true'`일 때만 true)

**고정 문구** (홈/목록 기본 메타):
- en 홈: title `Seoul Vibe — Local places in Seoul`, description `Curated guides and first-hand posts about restaurants, cafés and hidden spots in Seoul.`
- ko 홈: title `Seoul Vibe — 서울 로컬 장소 가이드`, description `서울의 식당, 카페, 숨은 장소를 큐레이션 가이드와 생생한 후기로 소개합니다.`
- 목록: title 앞에 `Guides | ` / `가이드 | `, description 동일
- other: en 홈 title/description, canonical 없음

- [ ] **Step 1: `parseSeoPath` 실패 테스트** — `/en`→home en, `/ko/`→home ko, `/en/articles`→articles, `/ko/articles/hidden-cafe?x=1`→article slug `hidden-cafe`, `/ko/articles/%EC%B9%B4%ED%8E%98`→slug `카페`, `/jp/articles/a`·`/admin`·`/en/feed`→other
- [ ] **Step 2: `seo.render` 실패 테스트** (cfg `{ siteUrl: 'https://sv.test', indexable: true }`)
  - `renderArticleHead` 양 언어 존재: `<title>제목 | Seoul Vibe</title>`, `rel="canonical" href="https://sv.test/ko/articles/a"`, hreflang `en`·`ko`·`x-default`(→en), `og:image` = `https://sv.test/og-default.png`, `og:type` `article`, `og:locale` `ko_KR`(en은 `en_US`), JSON-LD `"@type":"Article"`, `"isBasedOn":"<sourceUrl>"`, `"inLanguage":"ko"`
  - ko만 존재: hreflang `en` 없음, x-default → ko URL
  - sourceUrl null: JSON-LD에 `isBasedOn` 키 없음
  - 제목 `"><script>alert(1)</script>` → head 결과에 `<script>alert` 없음(이스케이프), JSON-LD 블록 안에 `</script>` 문자열이 원문 그대로 없음(`<\/` 처리)
  - `indexable: false` → `<meta name="robots" content="noindex, nofollow">` 포함
  - `renderArticleBody`: bodyHtml `<p>hi</p><script>x()</script><img src=x onerror=y()>` → `<p>hi</p>` 포함, `script`·`onerror` 없음; bodyHtml null + bodyText `a\nb` → `<p>a</p><p>b</p>`; sourceUrl 있으면 `rel="noopener"` 원문 링크 포함
  - `describe`: 200자 텍스트 → 길이 ≤ 156, `…`로 끝남; 태그·연속 공백 제거
  - `renderRobots` indexable true → `Disallow: /admin`, `Disallow: /auth`, `Disallow: /api`, `Sitemap: https://sv.test/sitemap.xml`; false → `Disallow: /`만
  - `renderSitemap` → `xmlns:xhtml` 선언, 각 `<url>`에 alternates `xhtml:link`, `lastmod` ISO 날짜; indexable false → `<url>` 0개
- [ ] **Step 3: `SeoService` 실패 테스트** (repository mock, 기존 `content.service.spec.ts` 방식)
  - `head('/ko/articles/a')`: 발행+미삭제 콘텐츠를 slug로 translations 포함 조회 → KO 번역 있으면 `renderArticleHead` 결과
  - KO 번역 없음 or 콘텐츠 없음 → 기본 head + `noindex`
  - `body('/ko/articles')` → 최신 발행 KO 아티클 최대 50개 링크 `href="/ko/articles/{slug}"`
  - `sitemap()` → home·articles 양 언어 + 아티클별 존재 번역 URL
- [ ] **Step 4: 실패 확인** — `npm --workspace packages/server test -- seo` → FAIL
- [ ] **Step 5: 구현** — `sanitize-html` 허용 태그는 기본값 + `img`(속성 `src`,`alt`), `a`(`href`,`rel`,`target`); 스킴 `http`,`https`. `SeoModule`은 `TypeOrmModule.forFeature([Content])`, `AppModule`에 등록.
- [ ] **Step 6: 통과 확인** — `npm --workspace packages/server test && npm run lint:server && npm run build:server`
- [ ] **Step 7: 수동 확인** — `npm run dev:server` 후 `curl -s localhost:3000/seo/head/en` 에 `<title>` 존재, `curl -s localhost:3000/seo/robots.txt` 가 `Disallow: /` (기본 indexable false), 응답이 `{"success":true…}`로 감싸지지 않음
- [ ] **Step 8: 커밋** — `feat(server): SEO 메타·본문 조각과 sitemap/robots 엔드포인트 추가`

---

### Task 5: 클라이언트 언어 접두어 라우팅

**Files:**
- Create: `packages/client/src/lib/locale.ts`, `src/components/layouts/LocaleLayout.tsx`, `src/components/ui/RootRedirect.tsx`, `src/components/ui/LegacyRedirect.tsx`
- Modify: `src/hooks/useLanguage.ts`, `src/App.tsx`, `src/components/layouts/NavBar.tsx`, `Footer.tsx`, `src/pages/HomePage.tsx`, `src/pages/articles/*.tsx`, `src/pages/posts/*.tsx`, `src/pages/auth/LoginPage.tsx`, `src/components/ui/PostCard.tsx` 등 공개 경로 링크를 만드는 모든 곳 (`grep -rn "to=\"/\|navigate(" src` 로 전수 확인)

**Interfaces:**
- Produces:
  - `locale.ts`: `export type UrlLang = 'en' | 'ko'`; `isUrlLang(v: unknown): v is UrlLang`; `toLanguage(l: UrlLang): Language`; `toUrlLang(l: Language): UrlLang`; `localePath(lang: Language, path: string): string` (`localePath('KO','/articles/a')` → `/ko/articles/a`, `localePath('EN','/')` → `/en`); `swapLocale(pathname: string, lang: Language): string` (`/en/articles/a` → `/ko/articles/a`, 접두어 없는 경로는 그대로)
  - `useLanguage()` 반환 타입 유지 `{ language, setLanguage }`. 단 `language`는 URL `:lang`가 있으면 그것, 없으면 localStorage(`sv_language`). `setLanguage(l)`은 localStorage 저장 + 현재 경로에 접두어가 있으면 `navigate(swapLocale(pathname, l))`. → `LanguageContext.Provider`를 `BrowserRouter` **안쪽**으로 옮겨야 함
  - 라우트: `<Route path="/:lang" element={<LocaleLayout/>}>` 아래 index(Home), `articles`, `articles/:slug`, `feed`, `posts/:id`, 그리고 PrivateRoute 하위 `posts/new`, `posts/:id/edit`. `LocaleLayout`은 `:lang`이 en/ko가 아니면 `<Navigate to={'/en' + 원래경로} replace/>`, 맞으면 `document.documentElement.lang` 설정 후 `<MainLayout/>` 렌더(=`<Outlet/>` 포함)
  - `/` → `RootRedirect`: localStorage → `navigator.language.startsWith('ko')` → `en` 순으로 정해 `<Navigate replace>`
  - `/articles/*`, `/feed`, `/posts/*` → `LegacyRedirect`: `/en` + 원래 경로·쿼리로 `<Navigate replace>`
  - `/auth/*`, `/admin/*` 변경 없음
- 로그인 후 리다이렉트처럼 저장된 경로가 있는 곳은 접두어 포함 경로를 그대로 쓰도록 확인

- [ ] **Step 1: 구현** (클라이언트는 테스트 러너가 없음 — 순수 함수 `locale.ts`는 작고 결정적이므로 아래 수동 검증으로 대체)
- [ ] **Step 2: 정적 검증** — `npm run lint:client && npm run build:client` → 성공. `grep -rnE "to=\"/(articles|feed|posts)|navigate\(['\"\`]/(articles|feed|posts)" packages/client/src` → 결과 0줄
- [ ] **Step 3: 수동 검증** — `npm run dev:client`(+server) 후 브라우저:
  - `/` → `/en`(또는 localStorage가 KO면 `/ko`)
  - `/articles/x` → `/en/articles/x`
  - `/jp/feed` → `/en/jp/feed` (가드는 무효 세그먼트를 버리지 않고 `/en`만 앞에 붙임 — 의도된 동작)
  - `/en/articles/x`에서 KO 토글 → `/ko/articles/x`, 새로고침 후에도 KO 유지, `<html lang="ko">`
  - 네비/푸터/카드 링크가 현재 언어 접두어 유지
  - `/admin`, `/auth/login` 정상
- [ ] **Step 4: 커밋** — `feat(client): 공개 페이지에 언어 접두어 URL 도입`

---

### Task 6: 관리자 원문 출처 입력 UI

**Files:**
- Modify: `packages/client/src/lib/api/admin.ts`, `packages/client/src/lib/api/articles.ts`, `packages/client/src/pages/admin/AdminArticlesPage.tsx`, `packages/client/src/styles.css`

**Interfaces:**
- Consumes: Task 3 API (`POST /content/admin/source-preview`, create/update DTO의 source 필드, 응답의 source 필드)
- Produces:
  - `articles.ts`: `export type SourceType = 'INSTAGRAM' | 'LINK'`; `export interface ArticleSource { sourceUrl: string | null; sourceType: SourceType | null; sourceTitle: string | null; sourceDescription: string | null; sourceSiteName: string | null; sourceAuthor: string | null; sourceImagePath: string | null }`; `Article`이 `ArticleSource`를 extends
  - `admin.ts`: `previewSource(url: string): Promise<ArticleSource>`; 기존 create/update 페이로드 타입에 `Partial<Omit<ArticleSource,'sourceType'>>` 추가

- [ ] **Step 1: 구현** — 스펙 4.4대로. 폼 상태에 source 필드 추가, 편집 진입 시 기존 값 로드, "불러오기"(로딩/에러 표시, 400이면 서버 `message` 노출), "출처 제거"(→ 저장 시 `sourceUrl: null`), 썸네일 미리보기(`sourceImagePath`) + 제거 버튼, 인스타면 안내 문구 `인스타그램 공식 임베드로 표시됩니다. 작성자 핸들(@...)을 입력하세요.`. bodyHtml textarea placeholder: `원문을 복사하지 말고, 직접 쓴 추천 이유·위치·팁을 3~6문장으로 적어주세요.`
- [ ] **Step 2: 정적 검증** — `npm run lint:client && npm run build:client`
- [ ] **Step 3: 수동 검증** — 관리자로 로그인 → 새 아티클에 `https://www.instagram.com/p/DcOEG9qkwW6/?img_index=2&psln=N2Z3bWpodWptdno4` 입력 → 불러오기 → URL이 `https://www.instagram.com/p/DcOEG9qkwW6/`로 바뀌고 사이트명 `Instagram` → 저장 → 다시 열면 값 유지. 공개 네이버 블로그 글 URL 하나로 불러오기 → 제목/썸네일 채워짐. `http://localhost:3000/` 입력 → 에러 메시지 노출. 출처 제거 후 저장 → 다시 열면 비어 있음.
- [ ] **Step 4: 커밋** — `feat(client): 관리자 아티클에 원문 출처 입력 추가`

---

### Task 7: 공개 상세 출처 블록 (인스타 임베드 / 링크 카드)

**Files:**
- Create: `packages/client/src/components/ui/ArticleSource.tsx`, `packages/client/src/components/ui/InstagramEmbed.tsx`, `packages/client/public/og-default.png`
- Modify: `packages/client/src/pages/articles/ArticleDetailPage.tsx`, `packages/client/src/styles.css`

**Interfaces:**
- Consumes: Task 6 `ArticleSource`, Task 5 `useLanguage`
- Produces:
  - `export default function ArticleSource({ source }: { source: ArticleSource }): JSX.Element | null` — `sourceUrl` 없으면 null
  - `export default function InstagramEmbed({ url }: { url: string }): JSX.Element` — `https://www.instagram.com/embed.js`를 문서당 1회만 `<script async>` 삽입(id `instagram-embed-js`로 중복 방지), `url` 변경/마운트 시 `window.instgrm?.Embeds.process()`; `vite-env.d.ts`에 `Window.instgrm` 타입 선언

- [ ] **Step 1: 구현** — 스펙 4.5 구조. 라벨: EN `Source`, KO `원문`; 링크 텍스트: EN `View original →`, KO `원문 보기 →`. 카드 `<a href target="_blank" rel="noopener">`. 인스타 blockquote 안 fallback `<a href={url}>`. 썸네일 `sourceImagePath` 없으면 이미지 영역 생략. 해당 언어 번역 없음 상태(API 404)에서는 반대 언어로 가는 링크(`localePath(other, '/articles/'+slug)`) 제공 — 문구 EN `Not available in English yet. Read it in Korean →`, KO `아직 한국어 버전이 없습니다. 영어로 보기 →`.
- [ ] **Step 2: `og-default.png`** — 1200×630, DESIGN.md 라임(`#c4ff30` 등 기존 토큰) 배경에 검정 Pretendard 굵은 `Seoul Vibe` 텍스트만. 로고·사진 사용 금지. (생성 방법은 재량: 예) 임시 HTML을 Playwright로 스크린샷)
- [ ] **Step 3: 정적 검증** — `npm run lint:client && npm run build:client`
- [ ] **Step 4: 수동 검증** — Task 6에서 만든 인스타 아티클 발행 → `/en/articles/{slug}`에서 본문 아래 인스타 임베드 렌더(공개 게시물), 다른 아티클로 이동 후 돌아와도 렌더. 블로그 아티클 → 카드 클릭 시 새 탭으로 원문. 출처 없는 기존 아티클은 변화 없음. 375px 폭에서 가로 스크롤 없음.
- [ ] **Step 5: 커밋** — `feat(client): 아티클 상세에 원문 임베드와 링크 카드 표시`

---

### Task 8: nginx SSI 연결 + 환경 설정

**Files:**
- Modify: `packages/client/index.html`, `packages/client/nginx.conf.template`, `k8s/base/server-configmap.yaml`, `k8s/overlays/prod/server-configmap-patch.yaml`, `k8s/overlays/aws/dev/server-configmap-patch.yaml`, `k8s/overlays/gcp/dev/server-configmap-patch.yaml`

**Interfaces:**
- Consumes: Task 4 라우트 `/seo/head/*`, `/seo/body/*`, `/seo/sitemap.xml`, `/seo/robots.txt`

- [ ] **Step 1: `index.html`** — 정적 `<title>` 제거, `<head>` 끝에 `<!--# include virtual="/__seo/head$seo_path" -->`, `<div id="root"><!--# include virtual="/__seo/body$seo_path" --></div>`. dev(Vite)에서는 주석이므로 무해 — 단 dev 탭 제목이 비므로 `main.tsx`에서 `document.title`이 비어 있으면 `'Seoul Vibe'`로 설정.
- [ ] **Step 2: 빌드 산출물 확인** — `npm run build:client && grep -c '<!--# include' packages/client/dist/index.html` → `2`. 0이면 Vite가 주석을 제거한 것 → `vite.config.ts`에 `transformIndexHtml`(order `'post'`)로 플레이스홀더 `%SEO_HEAD%`/`%SEO_BODY%`를 SSI 주석으로 치환하는 작은 플러그인으로 전환하고 다시 확인.
- [ ] **Step 3: `nginx.conf.template`**
  - `map $request_uri $seo_path { "~^(?<p>[^?]*)" $p; default /; }`
  - `location /__seo/ { internal; proxy_pass ${SERVER_UPSTREAM}/seo/; proxy_set_header Host $host; }` (기존 proxy 헤더 패턴 따름)
  - `location = /sitemap.xml { proxy_pass ${SERVER_UPSTREAM}/seo/sitemap.xml; … }`, `location = /robots.txt` 동일
  - 기존 URL 301: `location ~ ^/(articles|feed|posts)(/.*)?$ { return 301 /en$request_uri; }`
  - SPA 폴백이 SSI를 거치도록: `location / { try_files $uri $uri/ /index.html; }` 유지 + `location = /index.html { ssi on; ssi_silent_errors on; ssi_types text/html; add_header Cache-Control "no-cache"; }`
  - 상단 `목적/설명` 주석 갱신
- [ ] **Step 4: k8s 설정** — base: `SITE_URL: https://seoul-vibe.example.com`, `SEO_INDEXABLE: "false"`. prod patch: `SITE_URL: http://seoul-vibe.example.com`, `SEO_INDEXABLE: "true"`. AWS·GCP dev patch: `SITE_URL: http://dev.seoul-vibe.example.com`. 각 파일 주석 갱신. `kubectl kustomize k8s/overlays/prod | grep -E 'SITE_URL|SEO_INDEXABLE'` 로 값 확인(kubectl 없으면 `kustomize build`).
- [ ] **Step 5: 통합 검증 (Docker)** — 로컬 DB(`npm --workspace packages/server run db:up`)와 서버를 띄운 뒤:
  ```bash
  npm run docker:build:client
  docker run --rm -p 8080:80 -e SERVER_UPSTREAM=http://host.docker.internal:3000 seoul-vibe-client:local
  ```
  - `curl -s localhost:8080/en | grep -E '<title>|rel="canonical"|hreflang'` → 3종 모두 출력
  - 발행 아티클 slug로 `curl -s localhost:8080/ko/articles/{slug}` → `og:title`, `application/ld+json`, 본문 텍스트가 `#root` 안에 존재, `include virtual` 문자열 없음
  - `curl -sI localhost:8080/articles/{slug}` → `301`, `Location: …/en/articles/{slug}`
  - `curl -s localhost:8080/robots.txt`, `curl -s localhost:8080/sitemap.xml` → 서버 응답 그대로
  - `curl -s localhost:8080/__seo/head/en` → 404 (internal)
  - 서버를 끈 상태에서 `curl -s localhost:8080/en` → 200, 에러 문구 없이 SPA HTML
  - 브라우저로 `localhost:8080/en/articles/{slug}` → React가 정상 렌더(서버 조각이 남아 중복 표시되지 않음)
- [ ] **Step 6: 커밋** — `feat(infra): nginx SSI로 SEO 조각 주입 및 sitemap/robots 프록시`

---

### Task 9: 최종 점검

- [ ] `npm --workspace packages/server test && npm run lint:server && npm run build:server && npm run lint:client && npm run build:client && npm run format:check` → 모두 성공
- [ ] 스펙 7절 수용 기준 1~7 항목을 하나씩 다시 확인하고 결과를 PR 설명에 체크리스트로 기록 (인스타 임베드·네이버 카드 스크린샷 첨부)
- [ ] 배포 노트: "AWS dev / prod는 서버 배포 전에 `packages/server/sql/2026-11-08-content-source.sql` 실행 필요"를 PR 설명 상단에 명시
