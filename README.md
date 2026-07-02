# Seoul Vibe

## 프로젝트 개요

Seoul Vibe는 서울의 로컬 장소를 소개하는 콘텐츠와 사용자 피드를 함께 제공하는 지역 기반 서비스입니다. 운영자는 글 형태의 추천 콘텐츠를 발행하고, 사용자는 식당·카페·기타 장소에 대한 짧은 후기와 이미지, 위치 정보를 직접 공유할 수 있습니다.

이 프로젝트는 서울의 장소 정보를 한쪽에서는 큐레이션된 글로, 다른 한쪽에서는 커뮤니티 피드로 보여주도록 구성되어 있습니다. 처음 서울을 접하는 사용자나 새로운 장소를 찾는 사용자에게는 정리된 탐색 경험을 제공하고, 직접 경험을 남기고 싶은 사용자에게는 간단한 공유 수단을 제공합니다.

코드 기준으로는 회원가입·로그인, 이메일 인증, 게시글 작성, 위치 선택 지도, 관리자용 콘텐츠/게시글 관리 기능이 포함되어 있습니다. 또한 콘텐츠 번역 구조가 있어 단일 언어 블로그보다 확장 가능한 형태로 설계되어 있습니다.

## 기술 스택

- Frontend: React, TypeScript, Vite, React Router, Leaflet
- Backend: NestJS, TypeScript
- Database: PostgreSQL, TypeORM
- Infra: Docker, Docker Compose, Nginx, Kubernetes, Terraform, AWS EKS, GCP GKE
- Test: Jest, Supertest

## 참고 링크

- [클라이언트 앱](./packages/client)
- [서버 앱](./packages/server)
- [AWS EKS Terraform](./terraform/aws/eks/README.md)
- [GCP GKE Terraform](./terraform/gcp/gke/README.md)
