# Seoul Vibe 무료 배포 가이드

이 문서는 카드 등록 없이 무료 플랜으로 다음 구성을 만드는 수동 절차입니다. 기존 GCP/AWS 구성과 로컬 docker-compose DB·업로드 디스크는 그대로 사용할 수 있습니다. 여기서는 계정 생성이나 실제 배포를 자동 실행하지 않습니다. 서비스의 가입·무료 정책은 바뀔 수 있으므로 생성 화면에서 Free인지 확인하고 유료 전환이나 카드 등록을 선택하지 않습니다.

```text
Cloudflare Pages (React 정적 파일 + Pages Functions SEO 조각 주입)
  -> Render Free Web Service (NestJS / Docker / Singapore)
    -> Neon Free (PostgreSQL / Singapore)
    -> Supabase Storage Free (public 이미지 버킷 / S3 호환 API)
```

## 1. 사전 준비

- GitHub 계정, 이 저장소의 원격 repository와 배포할 브랜치. 작업 브랜치는 `feat/free-deploy`이며 운영 브랜치에 반영한 뒤 연결하는 것을 권장합니다.
- [Neon](https://console.neon.tech/signup), [Render](https://dashboard.render.com/register), [Cloudflare](https://dash.cloudflare.com/sign-up), [Supabase](https://supabase.com/dashboard) 무료 계정.
- 메일을 켤 경우 Gmail 앱 비밀번호 또는 Brevo 무료 SMTP 계정. **Render Free는 25·465·587 포트의 외부 연결을 차단**합니다. 기본 587 구성에서는 메일을 끄고 시작합니다. Gmail/Brevo 587 설정은 7절을 참고합니다. [Render 제한](https://render.com/docs/free).
- DB URL, JWT secret, SMTP 비밀번호, S3 키는 대시보드에만 입력합니다. Git, 클라이언트의 `VITE_*`, 공개 빌드 로그에 넣지 않습니다.

## 2. Neon PostgreSQL 생성

1. Neon에서 Free project `seoul-vibe`를 만들고 **Singapore (`ap-southeast-1`)**를 선택합니다.
2. **Connect**에서 PostgreSQL connection string을 복사합니다. 앱 연결용 pooled URL도 사용할 수 있습니다.
3. `sslmode=require`를 포함하는 전체 URL을 Render의 `DATABASE_URL`로 보관합니다.

```text
postgresql://USER:PASSWORD@HOST/DATABASE?sslmode=require
```

`DATABASE_URL`이 설정되면 기존 `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASS`, `DB_NAME`보다 우선합니다. URL이 없을 때만 기존 다섯 값이 모두 필요합니다. `DB_SSL=true`는 `ssl: { rejectUnauthorized: false }`를 설정합니다. 기존 로컬 개발은 `DATABASE_URL`과 `DB_SSL`을 설정하지 않으면 됩니다.

**이 프로젝트에는 마이그레이션이 없습니다.** 빈 DB의 초기 스키마 생성은 4절의 `TYPEORM_SYNC` 절차를 사용합니다. 기존 데이터가 있는 DB에 동기화를 상시 활성화하지 않습니다.

## 3. Supabase public 버킷과 S3 키

1. Supabase에서 Free project를 만들고 가까운 Singapore region을 선택합니다. 애플리케이션 DB는 Neon이며 Supabase DB에는 연결하지 않습니다.
2. **Storage > New bucket**에서 `uploads` 버킷을 만들고 **Public bucket**을 켭니다. 이미지 파일을 공개 제공할 버킷입니다.
3. Storage의 S3 설정에서 S3 연결을 활성화하고 **Access Key ID / Secret Access Key** 쌍을 생성합니다. 화면에 표시된 endpoint와 region을 복사합니다.
4. Render에 다음 값을 입력합니다. endpoint는 화면 값을 우선하며 아래는 예시입니다.

| 변수                   | 예시/의미                                                             |
| ---------------------- | --------------------------------------------------------------------- |
| `S3_ENDPOINT`          | `https://<project-ref>.storage.supabase.co/storage/v1/s3`             |
| `S3_REGION`            | S3 설정 화면의 region (예: `ap-southeast-1`)                          |
| `S3_BUCKET`            | `uploads`                                                             |
| `S3_ACCESS_KEY_ID`     | 생성한 S3 access key ID                                               |
| `S3_SECRET_ACCESS_KEY` | 생성한 S3 secret. Supabase anon/publishable key를 대신 쓰지 않습니다. |
| `S3_PUBLIC_BASE_URL`   | `https://<project-ref>.supabase.co/storage/v1/object/public/uploads`  |
| `S3_FORCE_PATH_STYLE`  | `true` (Blueprint 기본값)                                             |

S3 endpoint와 공개 URL 접두사는 서로 다릅니다. 공개 URL 접두사에는 버킷 이름까지 넣습니다. S3 키는 RLS를 우회하는 서버 전용 자격 증명이므로 Render에만 둡니다. [Supabase S3 인증](https://supabase.com/docs/guides/storage/s3/authentication).

`STORAGE_DRIVER=s3`이면 게시글 이미지와 `sources/{uuid}.{ext}` 썸네일 모두 같은 버킷에 저장하며 DB에는 공개 절대 URL이 들어갑니다. R2나 AWS S3도 endpoint·region·키·공개 URL과 path-style 설정만 바꾸면 같은 구현을 사용합니다. 기본 `local`에서는 기존 업로드 디스크와 URL 형태를 유지합니다. 이전 디스크 이미지를 자동 이관하지는 않습니다.

## 4. Render Blueprint로 API 배포

1. Render에서 **New > Blueprint**를 선택하고 이 repository와 배포 브랜치를 연결합니다.
2. 루트 `render.yaml`을 읽는지 확인합니다. Docker runtime, Free plan, Singapore, `Dockerfile.server`, `/health`, commit 자동 배포가 설정되어 있습니다.
3. `sync: false` 변수에 아래 값을 입력합니다. 처음에는 사용할 Pages project 이름을 정하고 예상 주소를 넣습니다.

| 직접 입력 변수                                                   | 첫 배포 값                                                                   |
| ---------------------------------------------------------------- | ---------------------------------------------------------------------------- |
| `DATABASE_URL`                                                   | Neon 전체 연결 URL                                                           |
| `CORS_ORIGIN`                                                    | `https://<project>.pages.dev` (쉼표로 여러 origin 가능, 공백·끝 슬래시 없이) |
| `CLIENT_URL`                                                     | `https://<project>.pages.dev` (인증 메일 링크 기준)                          |
| `SITE_URL`                                                       | `https://<project>.pages.dev` (canonical·OG·사이트맵 기준)                   |
| `SEO_INDEXABLE`                                                  | 검증 중 `false`; 실서비스로 공개할 때만 `true`                               |
| `S3_ENDPOINT`, `S3_REGION`, `S3_BUCKET`                          | 3절의 값                                                                     |
| `S3_ACCESS_KEY_ID`, `S3_SECRET_ACCESS_KEY`, `S3_PUBLIC_BASE_URL` | 3절의 값                                                                     |
| `MAIL_HOST`                                                      | 메일 사용 시 7절 값. 미사용 시 `smtp.invalid`                                |
| `MAIL_USER`                                                      | 메일 사용 시 SMTP login. 미사용 시 `disabled`                                |
| `MAIL_PASS`                                                      | 메일 사용 시 비밀번호. 미사용 시 `disabled`                                  |
| `MAIL_FROM`                                                      | 메일 사용 시 인증된 발신 주소. 미사용 시 `noreply@example.invalid`           |
| `MAIL_SEND_ENABLED`                                              | 무료 587 기본 구성에서는 `false`                                             |

메일을 꺼도 `EmailService` 생성자가 `MAIL_HOST/USER/PASS`를 필수 검사하므로 **비어 있지 않은 값**이 필요합니다. 생성자는 SMTP 연결을 열지 않으므로 위 미사용 예시로 시작할 수 있습니다.

Blueprint 고정값과 자동 생성값:

| 변수                                                                        | 값                                               |
| --------------------------------------------------------------------------- | ------------------------------------------------ |
| `NODE_ENV`, `PORT`                                                          | `production`, `3000`                             |
| `DB_SSL`, `DB_NAMING_STRATEGY`                                              | `true`, `snake`                                  |
| `TYPEORM_SYNC`                                                              | `false` (초기 스키마 생성 때만 아래 절차로 변경) |
| `STORAGE_DRIVER`, `S3_FORCE_PATH_STYLE`                                     | `s3`, `true`                                     |
| `MAIL_PORT`, `MAIL_SECURE`                                                  | `587`, `false`                                   |
| `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`                                   | Render 자동 생성 (`generateValue: true`)         |
| `JWT_ACCESS_EXPIRES_IN`, `JWT_REFRESH_EXPIRES_IN`, `JWT_REFRESH_EXPIRES_MS` | `15m`, `7d`, `604800000`                         |

서버가 읽는 환경변수는 위 표 전체와 로컬 폴백용 `DB_HOST/PORT/USER/PASS/NAME`입니다. `DATABASE_URL`, `DB_SSL`, `STORAGE_DRIVER`, `S3_*`가 이번에 추가된 서버 설정입니다. 문자열 `TYPEORM_SYNC`, `DB_SSL`, `MAIL_SECURE`, `S3_FORCE_PATH_STYLE`는 정확히 `true`일 때만 활성화됩니다.

### 빈 DB 초기화

1. Blueprint 생성 후 Render **Environment**에서 `TYPEORM_SYNC=true`로 임시 변경하고 저장·배포합니다. 소스의 기본값은 `false`로 유지합니다.
2. 배포 로그에서 DB 연결과 애플리케이션 시작을 확인합니다. Neon SQL editor에서 다음을 실행해 `users`, `contents` 등 테이블이 생겼는지 확인합니다.

   ```sql
   select table_name from information_schema.tables
   where table_schema = 'public' order by table_name;
   ```

3. 즉시 Render에서 `TYPEORM_SYNC=false`로 되돌리고 다시 배포합니다. 환경변수 화면과 배포 로그를 확인합니다.
4. 생성된 `https://<render>.onrender.com/health`가 HTTP 200인지 확인합니다.

초기화 전에 테이블을 사용하는 API는 실패할 수 있습니다. 운영 중 스키마 변경에는 별도 SQL 검토가 필요하며 동기화를 상시 켜는 방식으로 대체하지 않습니다.

## 5. Cloudflare Pages 배포 (GitHub Actions)

wb와 같이 Pages Git 연결 대신 GitHub Actions(`.github/workflows/deploy-frontend.yml`)가 main 반영 시 빌드 후 `wrangler pages deploy`로 직접 업로드합니다. Pages 프로젝트가 없으면 첫 실행에서 만듭니다.

1. Cloudflare **My Profile > API Tokens > Create Token**에서 `Account > Cloudflare Pages > Edit` 권한 토큰을 만듭니다. wb용으로 만든 같은 권한의 토큰을 재사용해도 됩니다.
2. GitHub 저장소 **Settings > Secrets and variables > Actions**에 등록합니다.

   | 종류     | 이름                            | 값                                                                |
   | -------- | ------------------------------- | ----------------------------------------------------------------- |
   | Secret   | `CLOUDFLARE_API_TOKEN`          | 1의 토큰                                                          |
   | Secret   | `CLOUDFLARE_ACCOUNT_ID`         | Cloudflare 대시보드의 Account ID                                  |
   | Variable | `API_ORIGIN`                    | `https://<render>.onrender.com`                                   |
   | Variable | `CLOUDFLARE_PAGES_PROJECT_NAME` | (선택) 기본값은 저장소 이름 `seoul-vibe`                          |
   | Variable | `API_HEALTH_URL`                | (선택) `https://<render>.onrender.com/health` — keep-warm 사용 시 |

   `API_ORIGIN` 하나가 빌드 변수 `VITE_API_URL`과 Functions 런타임 변수 `API_ORIGIN`에 모두 쓰입니다. 워크플로가 배포 직전에 `packages/client/wrangler.toml`을 생성해 런타임 변수를 넣으므로 Cloudflare 대시보드에서 따로 입력하지 않습니다(이 파일은 커밋하지 않음).

3. **Actions > Deploy Frontend > Run workflow**로 첫 배포를 실행합니다(이후에는 main 반영 시 자동).
4. 로그의 `https://<project>.pages.dev` 주소를 기록합니다.
5. Render의 **`CORS_ORIGIN`, `CLIENT_URL`, `SITE_URL` 세 값을 모두 실제 Pages 주소**로 맞추고 API를 재배포합니다. CORS를 확인한 뒤 회원가입·인증 링크·canonical을 검사합니다.
6. 사이트를 공개 운영할 때만 Render의 `SEO_INDEXABLE=true`로 바꿉니다. 기존 SEO 조각 캐시는 최대 300초 남을 수 있으므로 대기 후 확인합니다.

PR마다 `.github/workflows/ci.yml`이 서버 테스트·lint·build와 클라이언트 lint·Functions 테스트·build를 실행합니다. API는 Render가 커밋을 감지해 배포합니다(`render.yaml`의 `autoDeployTrigger: commit`).

### Pages의 SEO와 라우팅

- 루트 `_middleware.ts`는 `context.next()`로 정적 파일/SPA 폴백을 받은 다음 GET HTML의 SSI 주석을 HTMLRewriter로 치환합니다. 원래 `url.pathname`을 사용하고 쿼리는 SEO API와 캐시 키에서 제외합니다.
- `/assets/`와 확장자가 있는 경로는 주입하지 않습니다. `/en`, `/ko/articles/{slug}`처럼 파일이 없는 SPA 경로도 주입됩니다. 최상위 `404.html`을 추가하지 않습니다. [Pages SPA 폴백](https://developers.cloudflare.com/pages/configuration/serving-pages/), [미들웨어](https://developers.cloudflare.com/pages/functions/middleware/).
- head/body는 병렬 요청하고 각각 본문 수신까지 2.5초 제한을 둡니다. 네트워크 오류·타임아웃·비2xx·리다이렉트는 빈 조각이 되며 SSI 주석은 제거됩니다. API의 오류 HTML을 주입하지 않습니다.
- 성공한 조각만 API origin·원래 경로·head/body별 `caches.default`에 300초 저장합니다. 이 캐시는 데이터센터별이며 영구 저장이 아닙니다. **캐시가 없는 경로 또는 만료 후 cold start에서는 SEO가 비어 있을 수 있습니다.** 완성된 HTML은 `no-cache`로 반환합니다.
- `/sitemap.xml`, `/robots.txt`는 API의 `/seo/` 경로를 프록시하며 content-type을 유지합니다. 장애 시 빈 503으로 응답합니다.
- `public/_redirects`가 `/articles`, `/articles/*`, `/feed`, `/posts/*`를 `/en/...`으로 301 전환하며 splat을 유지합니다. Functions가 처리한 요청에는 `_redirects`가 적용되지 않으므로 `public/_routes.json`에서 이 경로들과 `/assets/*`를 제외했습니다. [리다이렉트와 Functions 제약](https://developers.cloudflare.com/pages/configuration/redirects/).
- `public/_headers`는 `/index.html`에 `Cache-Control: no-cache`를 지정합니다. Functions에서 변환한 HTML에도 코드로 같은 헤더를 지정합니다.

## 6. 관리자 계정 만들기

1. Pages에서 회원가입합니다. 메일을 켰다면 인증 메일 링크까지 완료합니다.
2. Neon SQL editor에서 **본인 계정 이메일**로 실행합니다.

   ```sql
   update users set role='admin', is_email_verified=true where email='your-email@example.com';
   ```

3. 로그아웃 후 다시 로그인해 관리자 권한이 새 JWT에 반영되게 합니다.

## 7. 기존 SMTP 이메일 설정

nodemailer SMTP를 그대로 사용합니다. `MAIL_PORT`와 `MAIL_SECURE`는 환경변수 문자열을 숫자·불리언으로 변환해 전달합니다.

| 변수                | Gmail 앱 비밀번호           | Brevo 무료 SMTP               |
| ------------------- | --------------------------- | ----------------------------- |
| `MAIL_HOST`         | `smtp.gmail.com`            | `smtp-relay.brevo.com`        |
| `MAIL_PORT`         | `587`                       | `587`                         |
| `MAIL_SECURE`       | `false` (STARTTLS)          | `false` (STARTTLS)            |
| `MAIL_USER`         | Gmail 전체 주소             | Brevo SMTP 화면의 login       |
| `MAIL_PASS`         | Google 앱 비밀번호          | Brevo SMTP key (API key 아님) |
| `MAIL_FROM`         | Gmail 발신 주소             | Brevo에서 인증한 발신 주소    |
| `MAIL_SEND_ENABLED` | 연결 가능한 환경에서 `true` | 연결 가능한 환경에서 `true`   |

Gmail은 Google 계정의 2단계 인증을 켠 뒤 **앱 비밀번호**를 생성합니다. 일반 계정 비밀번호를 쓰지 않습니다. 조직 계정 등에서는 앱 비밀번호가 허용되지 않을 수 있습니다. [Google 안내](https://support.google.com/accounts/answer/185833).

Brevo는 무료 계정을 만들고 발신자를 인증한 뒤 **SMTP & API**에서 SMTP login/key를 발급합니다. SMTP 발신·도메인 인증과 일일 무료 발송 한도를 확인합니다. [Brevo SMTP 안내](https://help.brevo.com/hc/en-us/articles/7924908994450-Send-transactional-emails-using-Brevo-SMTP).

**Render Free의 기본 587에서는 위 두 설정 모두 발송할 수 없습니다.** 먼저 `MAIL_SEND_ENABLED=false`로 운영합니다. Brevo는 대체 포트 `2525`도 지원하므로 SMTP를 꼭 써야 하면 Render의 `MAIL_PORT`를 2525로 수동 변경해 실제 연결·수신을 검증한 후 켤 수 있습니다. Blueprint 고정값 587과 다르므로 Blueprint 재동기화 시 재확인해야 합니다. 이 문서는 Render에서 2525 연결 성공을 보장하지 않습니다. [Brevo 지원 포트](https://help.brevo.com/hc/en-us/articles/10905415650322-Which-SMTP-port-should-I-use-Port-587-465-or-2525).

`MAIL_SEND_ENABLED`의 실제 동작:

- 정확히 `true`: 회원가입 시 미인증 계정과 24시간 인증 토큰을 저장하고 메일을 보냅니다. 인증 전 로그인은 차단됩니다.
- `false` 또는 미설정: 메일을 보내지 않고 **가입 시 이메일 인증 완료로 저장**하며 토큰을 생성하지 않습니다. 따라서 메일 없이 회원가입·로그인이 가능합니다. 이메일 소유권 확인은 생략됩니다.
- 기존 미인증 사용자는 플래그를 꺼도 자동 인증되지 않습니다. 필요한 계정만 SQL로 확인·수정합니다.
- 메일 발송은 사용자 저장 후 수행되므로 SMTP 실패 시 가입 요청이 실패해도 계정이 이미 DB에 남을 수 있습니다. 실제 수신 검증 후 `true`를 사용합니다.

## 8. 최종 검증

- [ ] `curl -i https://<render>.onrender.com/health` → 200.
- [ ] `TYPEORM_SYNC=false`로 복구했고 Render 재배포 후 기존 데이터가 유지됨.
- [ ] 실제 Pages 주소에서 CORS 오류 없이 회원가입·로그인. 메일 활성화 시 인증 링크·수신까지 확인.
- [ ] 관리자 글 작성에서 이미지 업로드 → Supabase 공개 URL로 표시 → **Render 재배포 후에도 같은 이미지 표시**.
- [ ] 원문 불러오기에서 메타와 `sources/` 썸네일을 가져오고 절대 이미지 URL이 저장됨.
- [ ] 게시된 실제 slug로 아래 curl 응답에 `title`, canonical, `og:`, `application/ld+json`이 있음. JS 실행 전 HTML 자체를 확인.

  ```sh
  curl -fsS https://<pages>/en
  curl -fsS https://<pages>/ko/articles/<published-slug>
  ```

- [ ] `curl -I https://<pages>/articles` 및 `/articles/<slug>`, `/feed`, `/posts/<id>` → 301, `/en/...` Location, splat 보존.
- [ ] `/sitemap.xml` → XML, `/robots.txt` → plain text, `SEO_INDEXABLE`에 맞는 정책. 비공개/관리자 경로가 색인 대상에서 제외됨.
- [ ] API가 느리거나 실패할 때 HTML에 SSI 주석과 서버 오류 페이지가 없고 React 정적 파일은 제공됨.

로컬 검증 명령:

```sh
npm --workspace packages/server test
npm run lint:server
npm run build:server
npm run lint:client
npm run build:client
npm --workspace packages/client run test:functions
```

실제 Pages 런타임으로 확인하려면 `packages/client`에서 `npx wrangler@4 pages dev dist --binding API_ORIGIN=https://<render>.onrender.com`을 실행합니다. 배포 계정 없이 로컬 Workers에서 HTMLRewriter·SPA 폴백·301을 확인할 수 있습니다. 이 작업에서는 로컬 모의 SEO API와 Wrangler 4.158.0으로 정상 조각, 500, 지연 응답, API 중지 후 캐시, 301, sitemap/robots MIME을 확인했습니다. 실제 공급자 연결·배포 검증은 위 체크리스트를 직접 수행해야 합니다.

## 무료 플랜 제한과 keep-warm

- Render Free는 15분 유휴 후 잠들며 cold start가 약 1분 걸릴 수 있습니다. 로컬 파일은 재시작/재배포 때 사라지므로 이미지는 Supabase에 둡니다. workspace 전체 무료 실행 시간은 월 750시간이며 대역폭·빌드 시간·외부 요청 제한도 있습니다. [Render Free](https://render.com/docs/free).
- `.github/workflows/keep-warm.yml`은 10분 간격으로 health를 호출합니다. GitHub **Settings > Secrets and variables > Actions > Variables**에 repository 변수 `API_HEALTH_URL=https://<render>.onrender.com/health`를 추가합니다. 변수가 없으면 호출 없이 성공합니다. 스케줄은 기본 브랜치에 workflow가 반영된 후 동작하며 지연·누락될 수 있습니다. 유휴 정지 방지나 SEO를 보장하지 않습니다. 계속 깨어 있으면 무료 실행 시간도 소비합니다.
- Neon Free는 DB 저장공간·compute·전송량 한도가 있습니다. 생성 시 [현재 Neon 한도](https://neon.com/pricing)를 확인하고 사용량을 모니터링합니다. 무료 한도는 변경될 수 있습니다.
- Supabase Free는 현재 파일 저장소 1GB와 전송량 한도가 있고 유휴 프로젝트 일시 중지 정책도 있습니다. [현재 Supabase 한도](https://supabase.com/pricing)를 확인합니다. 이 프로젝트는 업로드 파일 자동 삭제/정리 기능을 추가하지 않습니다.
- Pages Functions는 Workers 무료 요청 한도를 소비하며 HTML 요청마다 캐시 조회가 발생합니다. `/assets/*`는 Functions에서 제외했습니다. [Functions 요금/한도](https://developers.cloudflare.com/pages/functions/pricing/).
- SMTP는 위 Render 포트 제약과 각 공급자의 무료 발송 한도를 따릅니다. 무료 플랜은 가용성이나 SLA를 보장하지 않습니다.
