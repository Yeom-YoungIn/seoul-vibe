<!--
목적 - 현재 저장소의 Terraform IaC와 Kubernetes base 사이의 EKS 배포 책임 범위를 문서화하기 위해 수정됨
설명 - 컨테이너 빌드, Terraform 기반 AWS EKS/ECR/ALB/EFS 선행 인프라, Kustomize base 적용 순서와 필요한 입력값을 정리한다.
-->
# EKS Deployment

This repository owns application container images, Kubernetes application manifests, and the AWS EKS Terraform IaC baseline under `terraform/aws/eks`.

Terraform provides EKS, ECR, node capacity, IAM/IRSA, AWS Load Balancer Controller prerequisites, EFS-backed `efs-sc` storage, the application namespace, and an optional Secret injection path. DNS, ACM certificates, external databases, and production secret values still need environment-specific decisions before a real production rollout.

## Images

Build from the repository root:

```bash
docker build -f Dockerfile.client -t seoul-vibe-client:local .
docker build -f Dockerfile.server -t seoul-vibe-server:local .
```

For EKS, tag and push both images to ECR. The Kubernetes base uses placeholder image names and immutable placeholder tags in `k8s/base/kustomization.yaml`; Terraform outputs `ecr_repository_urls`, and the deployment pipeline should replace `newName` and `newTag` with the ECR repository and a release tag or digest.

The client image builds the Vite app with `VITE_API_URL=/api` by default. The nginx runtime proxies `/api/*` to `SERVER_UPSTREAM`, which defaults to `http://seoul-vibe-server:3000`.

## Kubernetes Base

Render the base locally:

```bash
kubectl kustomize k8s/base
kubectl kustomize k8s/overlays/dev
kubectl kustomize k8s/overlays/prod
```

Apply only after `terraform/aws/eks` has created or configured:

- EKS cluster and node capacity
- ECR repositories for `client` and `server`
- AWS Load Balancer Controller
- RWX storage for uploaded files, exposed through a storage class named `efs-sc`
- `seoul-vibe` namespace
- `seoul-vibe-server-env` secret in the `seoul-vibe` namespace, either through Terraform with `create_app_secret=true` or through the deployment pipeline

Terraform does not currently create DNS records, ACM certificates, or a PostgreSQL database. Add those in a later IaC iteration once domain, certificate, and database requirements are fixed.

Use `k8s/base` as the shared manifest contract. Use `k8s/overlays/dev` or `k8s/overlays/prod` for actual environment rendering so host, CORS origin, and ECR image names are not hardcoded in the base layer.

## Terraform Flow

Run from the AWS EKS Terraform root:

```bash
cd terraform/aws/eks
cp envs/dev/backend.hcl.example envs/dev/backend.hcl
cp envs/dev/terraform.tfvars.example envs/dev/terraform.tfvars
terraform init -backend-config=envs/dev/backend.hcl
terraform plan -var-file=envs/dev/terraform.tfvars
terraform apply -var-file=envs/dev/terraform.tfvars
```

Use `envs/prod/*` for production. Keep real backend config, tfvars, state, and plan files out of Git.

`k8s/base/server-secret.example.yaml` documents the required secret keys and is intentionally not included in the kustomization.

## Runtime Notes

- Client health endpoint: `/healthz`
- Server health endpoint: `/health`
- Public API path from the browser: `/api`
- Public upload path from the browser: `/uploads`
- Internal API service: `http://seoul-vibe-server:3000`
- Uploaded files are stored on the `seoul-vibe-server-uploads` ReadWriteMany PVC. The base assumes an EFS CSI-style storage class named `efs-sc`; patch `k8s/base/server-uploads-pvc.yaml` from the Terraform/deployment layer if the cluster uses a different storage class. For higher scale, replace local upload storage with S3/CDN-backed object URLs.
- The base ingress is HTTP-only because this Terraform baseline does not create ACM certificates or DNS records. Add `alb.ingress.kubernetes.io/certificate-arn`, HTTPS listener ports, and redirect annotations in an environment overlay only after ACM/DNS are available.
