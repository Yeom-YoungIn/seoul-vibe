<!--
목적 - AWS와 GCP Terraform root module의 위치와 실행 방식을 안내하기 위해 추가됨
설명 - 클라우드별 IaC 상태와 provider 구성을 분리해 EKS/GKE 배포 기반을 각각 관리하는 구조를 문서화한다.
-->
# Seoul Vibe Terraform IaC

This directory groups independent Terraform root modules by cloud and platform.

## Layout

```text
terraform/
  aws/
    eks/    # AWS EKS, ECR, EFS, ALB Controller prerequisites
  gcp/
    gke/    # GCP GKE baseline entrypoint
```

Each root module owns its own backend, provider configuration, variables, and environment files. Run Terraform from the target root module, not from `terraform/`.

## AWS EKS

```bash
cd terraform/aws/eks
cp envs/dev/backend.hcl.example envs/dev/backend.hcl
cp envs/dev/terraform.tfvars.example envs/dev/terraform.tfvars
terraform init -backend-config=envs/dev/backend.hcl
terraform plan -var-file=envs/dev/terraform.tfvars
```

See `terraform/aws/eks/README.md` for AWS-specific resources and deployment notes.

## GCP GKE

```bash
cd terraform/gcp/gke
cp envs/dev/backend.hcl.example envs/dev/backend.hcl
cp envs/dev/terraform.tfvars.example envs/dev/terraform.tfvars
terraform init -backend-config=envs/dev/backend.hcl
terraform plan -var-file=envs/dev/terraform.tfvars
```

The GCP module currently provides the provider/backend/env structure. Add GKE, Artifact Registry, networking, IAM, and storage resources there as GCP deployment requirements are finalized.

## State And Secrets

Keep real `backend.hcl`, `terraform.tfvars`, state, and plan files out of Git. The ignore rules in this directory cover nested cloud root modules.
