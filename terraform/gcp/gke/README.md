<!--
목적 - GCP GKE Terraform root module의 실행 방식과 확장 지점을 안내하기 위해 추가됨
설명 - GCS backend, google provider, dev/prod 입력 예시를 기준으로 GKE 배포 기반을 AWS EKS와 분리해 관리한다.
-->
# Seoul Vibe GCP GKE Terraform IaC

This root module is the GCP entrypoint for a future GKE deployment baseline.

It is intentionally separate from `terraform/aws/eks` so AWS and GCP can use different state backends, providers, IAM models, registries, and cluster resources.

## Planned Scope

- Artifact Registry repositories for `client` and `server`
- VPC and subnets for GKE
- GKE cluster and node pools
- Service accounts and Workload Identity bindings
- Kubernetes namespace and optional Secret injection path
- Storage strategy for uploads, such as GCS-backed application storage or Filestore/CSI

## Layout

```text
terraform/gcp/gke/
  *.tf                 # root module
  envs/dev/            # dev backend and tfvars examples
  envs/prod/           # prod backend and tfvars examples
```

Run Terraform from `terraform/gcp/gke/` and pass an environment var file:

```bash
cd terraform/gcp/gke
cp envs/dev/backend.hcl.example envs/dev/backend.hcl
cp envs/dev/terraform.tfvars.example envs/dev/terraform.tfvars
terraform init -backend-config=envs/dev/backend.hcl
terraform plan -var-file=envs/dev/terraform.tfvars
```

Use the same flow with `envs/prod/*` for production.

## Notes

- `backend.hcl` uses a GCS backend and requires a pre-created GCS bucket.
- `gcp_project_id` must point to the target project.
- This module currently defines provider/env structure only. Add actual GKE resources after region, network, image registry, secret, and upload-storage decisions are fixed.
- Keep real `terraform.tfvars`, backend config, state, and plan files out of Git.
