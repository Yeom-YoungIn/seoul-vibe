# Seoul Vibe Monorepo

React frontend and NestJS backend in a single npm workspace.

## Structure
- packages/client — React + Vite app
- packages/server — NestJS API
  - libs/common — Nest CLI 라이브러리 모듈(`nest g library libs` 후 common으로 rename), 공통 로직/유틸 배치 위치

## Getting started
1) Install dependencies from the repo root:
```bash
npm install
```
2) Run the apps
- Client: `npm run dev:client`
- Server: `npm run dev:server`

## Server shared library
- Nest CLI로 생성한 공통 모듈: `packages/server/libs/common`
- 앱 코드에서 `import { CommonModule, CommonService } from 'sv/common';`로 사용

## Build
- Client: `npm run build:client`
- Server: `npm run build:server`

## Lint
- Client: `npm run lint:client`
- Server: `npm run lint:server`
