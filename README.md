<!--
목적 - 현재 레포의 애플리케이션, Kubernetes base, Terraform IaC 진입점을 한눈에 안내하기 위해 수정됨
설명 - 프론트엔드/백엔드 실행 방법과 함께 EKS/GKE 배포에 필요한 Docker, k8s/base, terraform/ 위치를 README에서 연결한다.
-->
# Seoul Vibe Monorepo

React frontend and NestJS backend in a single npm workspace.

## Structure

- packages/client — React + Vite app
- packages/server — NestJS API
  - libs/common — Nest CLI 라이브러리 모듈(`nest g library libs` 후 common으로 rename), 공통 로직/유틸 배치 위치
    - orm — TypeORM 설정/모듈 위치

## Getting started

1. Install dependencies from the repo root:

```bash
npm install
```

2. 환경 변수 파일(.env.local / .env.develope / .env.production)에서 DB 설정을 관리합니다.
   - 기본 키: DB_HOST, DB_PORT, DB_USER, DB_PASS, DB_NAME, TYPEORM_SYNC, PORT
   - NODE_ENV=production → .env.production, NODE_ENV=develope → .env.develope, 그 외 → .env.local 로 로드
3. Run the apps

- Client: `npm run dev:client`
- Server: `npm run dev:server`

## Server shared library

- Nest CLI로 생성한 공통 모듈: `packages/server/libs/common`
- 앱 코드에서 `import { CommonOrmModule } from '@app/common';` 등 경로 별칭(@app/common)으로 사용
- ORM 설정: `packages/server/libs/common/src/orm`
  - 환경 변수 기반 TypeORM 설정 헬퍼 `buildTypeOrmConfig`
  - DB 연결 모듈 `CommonOrmModule` (`CommonOrmModule.forRoot()`로 호출). `DB_HOST` 혹은 `DATABASE_URL`/`TYPEORM_URL`이 설정돼 있을 때만 연결 생성.

## Build

- Client: `npm run build:client`
- Server: `npm run build:server` (Nest CLI + webpack)
- Client container: `npm run docker:build:client`
- Server container: `npm run docker:build:server`

## Cloud deployment

- Application container definitions live in `Dockerfile.client` and `Dockerfile.server`.
- Kubernetes base manifests live in `k8s/base`.
- Environment overlays live in `k8s/overlays/dev` and `k8s/overlays/prod`.
- Terraform/IaC root modules live under `terraform` by cloud:
  - AWS EKS: `terraform/aws/eks`
  - GCP GKE: `terraform/gcp/gke`
- The AWS EKS module provides EKS, ECR, node groups, IAM/IRSA, AWS Load Balancer Controller prerequisites, EFS-backed `efs-sc`, namespace setup, and an optional Secret injection path.
- The GCP GKE module currently provides provider/backend/env structure for a future GKE baseline.
- Deployment details and required secret keys are documented in `docs/deployment/eks.md`.

## Lint

- Client: `npm run lint:client`
- Server: `npm run lint:server`
