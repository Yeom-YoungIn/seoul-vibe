# 외부 원문 큐레이션 + SEO 설계

- 작성일: 2026-11-08
- 구현: Codex (이 문서와 `docs/superpowers/plans/2026-11-08-external-source-and-seo.md` 기준)

## 1. 왜 하는가

운영자가 자체 아티클을 매번 새로 쓰기 어렵다. 인스타그램·블로그에 이미 좋은 서울 장소 글이 많으니, 그걸 **소개하고 링크로 연결**하는 방식으로 콘텐츠 수를 늘린다.

단, 원문을 그대로 복사하면 저작권 문제가 생기고, 검색엔진은 중복 콘텐츠로 보고 원본만 노출한다. iframe은 인스타·네이버가 대부분 차단(X-Frame-Options / CSP frame-ancestors)하고, 열리더라도 SEO 가치가 원본 도메인으로 간다. 그래서 **"큐레이션 노트"** 방식을 쓴다.

> 큐레이션 노트 = 운영자가 직접 쓴 3~6문장(추천 이유, 위치, 팁) + 원문을 플랫폼이 허용한 방식(공식 임베드 / 링크 카드)으로 첨부 + 명확한 출처 표기.

동시에 현재 Vite SPA는 크롤러가 받는 HTML이 빈 `<div id="root">`라서 SEO가 사실상 0이다. 언어도 localStorage에만 있어 EN/KO가 같은 URL을 공유한다. 이번 작업에서 함께 해결한다.

## 2. 목표 / 비목표 / 안티목표

### 목표
1. 관리자 아티클 작성/수정 화면에서 **원문 URL(선택)** 을 등록할 수 있다.
   - 인스타그램 URL → 공식 임베드로 표시.
   - 그 외(네이버 블로그, 티스토리, 일반 웹) → OG 메타 기반 링크 카드로 표시.
2. URL 입력 후 "불러오기" 시 서버가 제목·설명·사이트명·썸네일을 자동으로 채운다(인스타 제외). 관리자가 수정 가능.
3. 공개 아티클 상세 화면은 **기존 레이아웃 그대로**, 본문 아래에 출처 블록이 붙는다.
4. 공개 페이지 URL에 언어 접두어(`/en/...`, `/ko/...`)를 도입한다.
5. 크롤러가 JS 없이도 아티클 제목·설명·OG·canonical·hreflang·JSON-LD·본문 텍스트를 받는다.
6. `sitemap.xml`, `robots.txt` 제공.

### 비목표
- 일반 회원 포스트에 외부 링크 기능 추가 (관리자 아티클만).
- Next.js 등 SSR 프레임워크로 전환.
- 아티클 목록 카드에 썸네일 표시 (데이터는 생기지만 UI 변경은 이번 범위 아님).
- 피드/포스트 페이지의 SEO 최적화 (언어 접두어 라우팅만 적용, 메타는 사이트 기본값).
- 원문 내용 자동 요약/번역.

### 안티목표 (기술적으로 돌아가도 실패)
- 원문 본문 전체나 원문 사진 여러 장을 우리 서버에 복제해서 보여주는 것.
- 원문 링크/작성자 표기가 눈에 띄지 않는 것.
- 서버의 URL 불러오기 기능이 내부망 요청(SSRF) 통로가 되는 것.
- 기존 `/articles/...` 등 외부에 이미 공유된 URL이 깨지는 것 (301로 보존해야 함).
- 디자인이 기존 에디토리얼 스타일(DESIGN.md, the-edit.co.kr 레퍼런스)에서 벗어나는 것.

## 3. 결정된 사항

| 항목 | 결정 | 출처 |
|---|---|---|
| 대상 | 관리자 아티클만 | 사용자 |
| 화면 | 기존 아티클 상세 화면 동일 + 출처 블록 | 사용자 |
| 방식 | 운영자 자체 문장 + 공식 임베드/링크 카드 (iframe·전문복사 X) | Claude 제안, 사용자 수락 |
| 운영자 작성 분량 | 글마다 3~6문장 작성 가능 | 사용자 |
| 언어별 URL | 이번 작업에 포함 | 사용자 |

## 4. 설계

### 4.1 데이터 모델

`contents` 테이블에 nullable 컬럼 추가 (출처는 언어 무관, 글당 하나). *Claude 판단: 별도 엔티티 대신 컬럼 — 1:1이고 항상 함께 조회되므로.*

| 컬럼 | 타입 | 설명 |
|---|---|---|
| `sourceUrl` | varchar(2048) null | 정규화된 원문 URL |
| `sourceType` | varchar(20) null | `INSTAGRAM` \| `LINK` |
| `sourceTitle` | varchar(300) null | 원문 제목 (OG) |
| `sourceDescription` | varchar(500) null | 원문 설명 (OG) — 카드에 1~2줄만 |
| `sourceSiteName` | varchar(100) null | 예: "네이버 블로그", "Instagram" |
| `sourceAuthor` | varchar(100) null | 예: "@seoul_cafe_log" |
| `sourceImagePath` | varchar(500) null | 우리 서버에 저장한 썸네일 경로 (`/uploads/sources/...`) |

`sourceUrl`이 null이면 기존 자체 아티클과 동일하게 동작.

**스키마 반영:** 이 프로젝트는 마이그레이션 체계가 없다. `TYPEORM_SYNC=true`는 **GCP dev overlay만**이고, base·AWS dev·prod는 `false`다. *Claude 판단:* 마이그레이션 프레임워크 도입은 하지 않고, `packages/server/sql/2026-11-08-content-source.sql`에 `ALTER TABLE contents ADD COLUMN IF NOT EXISTS ...` 문을 둔다 (snake_case 네이밍 기준, 재실행 안전). **배포 순서: SQL 적용 → 서버 배포.** SQL 적용은 배포 담당자(사용자)가 수동으로 수행하며, `docs/deployment/`에 절차를 한 단락 추가한다.

### 4.2 URL 정규화 규칙 (서버, 순수 함수 + 단위 테스트)

- `http`/`https`만 허용. 그 외 → 400.
- 인스타그램: 호스트 `instagram.com` / `www.instagram.com`, 경로 `/p/{code}`, `/reel/{code}`, `/{user}/p/{code}` → `https://www.instagram.com/p/{code}/` (reel은 `/reel/{code}/`). 쿼리·해시 제거. `sourceType=INSTAGRAM`.
  - 예: `https://www.instagram.com/p/DcOEG9qkwW6/?img_index=2&psln=...` → `https://www.instagram.com/p/DcOEG9qkwW6/`
- 그 외: 해시 제거, `utm_*`·`fbclid`·`gclid` 쿼리 제거, 나머지 유지. `sourceType=LINK`.
- 네이버 블로그: `blog.naver.com/{id}/{logNo}` 및 `blog.naver.com/PostView.naver?blogId=..&logNo=..` → 저장 URL은 `https://blog.naver.com/{id}/{logNo}`, 메타 수집은 `https://m.blog.naver.com/{id}/{logNo}`에서 (PC 버전은 프레임 구조라 OG가 불안정).

### 4.3 원문 미리보기 API (관리자 전용)

`POST /content/admin/source-preview` body `{ url }` → `{ sourceUrl, sourceType, sourceTitle, sourceDescription, sourceSiteName, sourceAuthor, sourceImagePath }`

- 인스타그램: 외부 요청 없이 정규화 결과 + `sourceSiteName: "Instagram"`만 반환 (서버 fetch 시 로그인 벽). 작성자 핸들은 관리자가 직접 입력.
- LINK: HTML을 가져와 `og:title`/`og:description`/`og:site_name`/`og:image`/`article:author`(없으면 `<title>`, `meta[name=description]`) 추출. HTML 파싱은 `cheerio` 사용 *(Claude 판단)*.
- 썸네일: `og:image`를 받아 `uploads/sources/{uuid}.{ext}`에 저장하고 경로 반환. 네이버 이미지는 외부 hotlink 차단이라 저장이 필요함. 리사이즈는 하지 않음 *(Claude 판단: sharp 네이티브 의존성 회피)*. 5MB 초과·`image/*` 아님 → 썸네일 없이 진행.
- 실패(타임아웃·4xx/5xx·파싱 실패)해도 400이 아니라 **정규화 결과만 담아 200**으로 반환하고 관리자가 수동 입력. 단, URL 형식 자체가 잘못되거나 차단 대상이면 400.

**보안 (SSRF 방어) — 필수:**
- 요청 전 DNS lookup → 사설/루프백/링크로컬/메타데이터 대역(`10/8`, `172.16/12`, `192.168/16`, `127/8`, `169.254/16`, `::1`, `fc00::/7`, `fe80::/10`, `0.0.0.0`) 차단.
- 리다이렉트는 수동 추적, 최대 3회, 매 홉마다 위 검사 재수행.
- 타임아웃 5초, HTML 응답 최대 2MB, 이미지 최대 5MB (스트림으로 읽으며 초과 시 중단).
- User-Agent: `SeoulVibeBot/1.0 (+{SITE_URL})`.

### 4.4 관리자 UI (`AdminArticlesPage`)

기존 편집 모달/폼의 slug 아래에 "원문 출처 (선택)" 섹션:
- URL 입력 + "불러오기" 버튼 → preview API 호출 → 아래 필드 채움.
- 필드: 제목, 설명, 사이트명, 작성자, 썸네일 미리보기(+제거 버튼). 모두 수정 가능.
- "출처 제거" 버튼 → 모든 source 필드 null.
- 인스타그램이면 썸네일 영역 대신 "인스타그램 공식 임베드로 표시됩니다" 안내, 작성자 입력 강조.
- 본문(bodyHtml) 입력란 placeholder에 "원문을 복사하지 말고 직접 쓴 추천 이유·위치·팁을 3~6문장으로" 안내.

Create/Update DTO에 source 필드 추가 (모두 optional, `sourceUrl`은 서버에서 다시 정규화). 업데이트 시 `sourceUrl: null`이면 모든 source 필드 초기화.

### 4.5 공개 아티클 상세 (`ArticleDetailPage`)

본문 아래 `<aside class="article-source">`:
- 라벨 "Source" / "원문"(언어별), 작성자, 사이트명.
- INSTAGRAM: `<blockquote class="instagram-media" data-instgrm-permalink="{sourceUrl}" data-instgrm-version="14">` 안에 원문 링크 fallback. `https://www.instagram.com/embed.js`를 한 번만 로드하고, 마운트·slug 변경 시 `window.instgrm?.Embeds.process()` 호출. 최대 폭 540px.
- LINK: 카드(썸네일 좌측/상단, 제목, 설명 2줄 말줄임, 사이트명) 전체가 `<a href target="_blank" rel="noopener">`.
- 하단에 "원문 보기 →" 텍스트 링크 (항상 노출).
- 스타일은 `styles.css`에 기존 토큰/타이포를 사용해 추가. 에디토리얼 톤 유지.

source 필드는 `BaseContentResponseDto`에 추가해 공개·관리자 목록/상세 응답 모두에 포함한다 (목록 UI 변경은 비목표).

### 4.6 언어 접두어 라우팅

공개 라우트 (React Router 7은 정규식 파라미터 미지원 → `/:lang` 레이아웃 라우트 + en/ko 외 값은 `/en{나머지}`로 리다이렉트하는 가드 컴포넌트): `/:lang`, `/:lang/articles`, `/:lang/articles/:slug`, `/:lang/feed`, `/:lang/posts/:id`, `/:lang/posts/new`, `/:lang/posts/:id/edit`.
인증(`/auth/*`)과 관리자(`/admin/*`)는 접두어 없음.

- **URL이 언어의 단일 진실 공급원.** `useLanguage()`는 URL 파라미터에서 언어를 읽는다. 접두어 없는 페이지(auth/admin)에서는 localStorage 값 사용.
- 언어 토글: 현재 경로의 접두어만 교체해 이동 + localStorage에 선호 저장.
- `/` 진입: 클라이언트에서 localStorage 선호 → 없으면 `navigator.language`가 `ko*`면 `ko`, 아니면 `en` → `/{lang}`로 replace. *(크롤러용 x-default는 `/en`.)*
- 기존 URL 호환: nginx에서 `/articles`, `/articles/*`, `/feed`, `/posts/*` → `/en/...` 로 **301** *(Claude 판단: 기존 클라이언트 기본값이 EN)*. React Router에도 같은 리다이렉트를 둬서 dev 서버에서도 동작.
- 앱 내 모든 `Link`/`navigate`의 공개 경로는 헬퍼 `localePath(lang, path)`로 생성.
- 해당 언어 번역이 없는 아티클: 기존 "No content available" 대신 "이 언어로는 아직 없음 + 다른 언어로 보기" 링크. (API 404 시 다른 언어 존재 여부는 SEO 메타 API의 `availableLocales`로 판단하거나 단순히 반대 언어 링크 제공 — 빌더 재량)
- `<html lang>`은 언어 변경 시 `document.documentElement.lang` 갱신.

### 4.7 크롤러용 HTML (nginx SSI + 서버 렌더 조각)

SSR 전환 없이 **nginx SSI**로 서버가 만든 `<head>` 조각과 본문 조각을 `index.html`에 끼워 넣는다.

```
브라우저/크롤러 ─GET /ko/articles/foo─▶ nginx
   nginx: index.html 서빙 (ssi on)
     <!--# include virtual="/__seo/head$seo_path" --> ─▶ server GET /seo/head/ko/articles/foo
     <!--# include virtual="/__seo/body$seo_path" --> ─▶ server GET /seo/body/ko/articles/foo
   ◀─ head 메타 + #root 안에 본문 HTML이 채워진 문서
React 로드 후 createRoot가 #root 내용을 교체 (기존 동작 그대로)
```

- `index.html`: 정적 `<title>` 제거, `<head>`에 head include, `<div id="root">` 안에 body include. Vite 빌드가 주석을 보존하는지 확인할 것 (보존 안 되면 빌드 후 치환 스크립트나 별도 플레이스홀더 방식으로).
- nginx 주의: `try_files` 폴백 후 `$uri`는 `/index.html`이 되므로 **`$uri`를 쓰면 안 된다.** `map $request_uri $seo_path { "~^(?<p>[^?]*)" $p; }` 처럼 쿼리를 뗀 원래 경로를 변수로 만들어 사용. index.html 응답(`location = /index.html` 또는 폴백 경로)에 `ssi on; ssi_silent_errors on; ssi_types text/html;` 적용, index.html은 `Cache-Control: no-cache`. `location /__seo/` 는 `internal;` + 서버로 proxy (`/seo/...`). include 실패 시 빈 문자열 → 기존 SPA처럼 동작해야 함.
- **head 조각** (`GET /seo/head/*path`, `text/html`):
  - 아티클 상세(번역 존재): `<title>{title} | Seoul Vibe</title>`, `meta description`(bodyText 또는 bodyHtml 태그 제거 후 앞 155자), `link rel=canonical`(`{SITE_URL}/{lang}/articles/{slug}`), 존재하는 번역마다 `link rel=alternate hreflang=en|ko` + `x-default`(en 있으면 en, 없으면 ko), `og:type=article`, `og:title`, `og:description`, `og:url`, `og:image`(**항상** `{SITE_URL}/og-default.png` — 원문 사진을 우리 공유 이미지로 쓰지 않는다. 원문 썸네일은 링크 카드 안에서만 사용), `og:locale`, `twitter:card=summary_large_image`, JSON-LD `Article` (`headline`, `datePublished`, `dateModified`, `inLanguage`, `mainEntityOfPage`, `publisher{name: Seoul Vibe}`, 출처가 있으면 `isBasedOn: sourceUrl`).
  - 아티클 상세(해당 언어 번역 없음 / 미존재): 기본 메타 + `<meta name="robots" content="noindex">`.
  - 아티클 목록 / 홈: 언어별 기본 제목·설명, canonical, hreflang en/ko/x-default.
  - 그 외 경로: 사이트 기본 메타만 (canonical 없음).
  - 모든 값은 HTML 이스케이프. JSON-LD는 `</`를 `<\/`로 이스케이프.
- **body 조각** (`GET /seo/body/*path`): 아티클 상세면 `<article><h1>…</h1><time>…</time>{sanitized bodyHtml 또는 bodyText 문단}<p>원문: <a href=…>…</a></p></article>`, 목록이면 최신 아티클 링크 목록(`<a href="/{lang}/articles/{slug}">`). 그 외 빈 문자열.
- bodyHtml은 관리자 입력이지만 서버 렌더 시에도 `script`/`iframe`/`on*` 속성/`javascript:` 를 제거 *(Claude 판단: 기존 클라이언트는 sanitize 없이 렌더 중 — 이번엔 서버 조각에만 적용, 클라이언트는 그대로)*. 라이브러리는 `sanitize-html` 권장.
- 서버 응답에 `Cache-Control: public, max-age=300`.
- `SITE_URL` 환경변수 신규. 각 환경의 `CORS_ORIGIN`과 같은 값 (base `https://seoul-vibe.example.com`, prod `http://seoul-vibe.example.com`, AWS/GCP dev `http://dev.seoul-vibe.example.com`, 로컬 기본 `http://localhost:5173`). 도메인이 아직 placeholder이므로 실제 도메인 확정 시 CORS_ORIGIN과 함께 교체.
- `SEO_INDEXABLE` 환경변수 신규 (기본 `false`, **prod overlay만 `true`**). `false`면 head 조각에 `<meta name="robots" content="noindex, nofollow">`, robots.txt는 `Disallow: /`, sitemap은 빈 `<urlset>`. dev 도메인이 검색에 중복 노출되는 것을 막는다.
- `og-default.png`(1200×630)는 `packages/client/public/`(디렉터리 신규 생성)에 추가. 로고/브랜드 이미지가 없으므로 단색 라임 배경 + "Seoul Vibe" 텍스트 정도의 단순 이미지 *(Claude 판단; PRODUCT.md "로고 자산 없음, 날조 금지"에 맞춤)*.

### 4.8 sitemap / robots

- `GET /seo/sitemap.xml`: `/en`, `/ko`, `/en/articles`, `/ko/articles`, 발행된 아티클의 존재하는 번역별 URL, 각 `<url>`에 `xhtml:link rel=alternate hreflang` 포함, `lastmod`=updatedAt.
- `GET /seo/robots.txt` (`SEO_INDEXABLE=true`일 때): `Allow: /`, `Disallow: /admin`, `Disallow: /auth`, `Disallow: /api`, `Sitemap: {SITE_URL}/sitemap.xml`.
- nginx: `location = /sitemap.xml`, `location = /robots.txt` → 서버 프록시.
- SEO 컨트롤러는 전역 응답 래핑 인터셉터(`CommonSuccessResponseInterceptor` 등)를 우회해 raw 텍스트를 내려야 함 (`@Res()` 직접 사용 등).

## 5. 제약

- 스택 유지: React 18 + Vite + React Router 7 / NestJS 10 + TypeORM / nginx 1.27. 새 의존성은 `cheerio`, `sanitize-html`(+types) 정도로 제한.
- 기존 서버 코드 패턴 준수: `service`/`admin`/`shared` 모듈 구조, DTO + `@TransformResponse`, 에러 클래스, Jest 단위 테스트(`packages/server/test/...` 미러 구조).
- 파일 상단 `목적 - / 설명 -` 주석 관례가 있는 파일(설정·인프라)은 수정 시 주석도 갱신.
- dev 서버(Vite)에서는 SSI가 동작하지 않아도 됨. SPA 동작만 유지.
- 디자인: `packages/client/DESIGN.md` 토큰·타이포 준수.

## 6. 빌더 재량

- 컴포넌트 분리 방식, CSS 클래스명, 헬퍼 파일 위치.
- SSRF 검사 구현 세부(직접 `dns.lookup` + `net.BlockList` 등).
- 번역 없는 언어 페이지의 정확한 문구/UX.
- SEO 모듈 이름과 내부 구조.

## 7. 수용 기준 (요약)

1. 관리자가 인스타 URL을 넣으면 정규화된 URL이 저장되고, 공개 상세 하단에 인스타 임베드가 보인다.
2. 관리자가 네이버 블로그 URL을 넣고 불러오기하면 제목·썸네일이 채워지고, 공개 상세에 링크 카드가 보인다.
3. `curl {host}/ko/articles/{slug}` 응답 HTML에 title·description·canonical·hreflang·og·JSON-LD·본문 텍스트가 있다 (JS 미실행).
4. `/articles/{slug}` → `/en/articles/{slug}` 301.
5. `/sitemap.xml`, `/robots.txt`가 올바른 내용으로 응답.
6. 사설 IP·localhost URL로 preview 호출 시 400.
7. 서버 `npm test`, 클라이언트·서버 lint/build 통과.
