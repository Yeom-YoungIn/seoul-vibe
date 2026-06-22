<!--
목적 - GCP GKE Terraform root module의 실행 방식과 확장 지점을 안내하기 위해 추가됨
설명 - GCS backend, google provider, dev/prod 입력 예시를 기준으로 GKE 배포 기반을 AWS EKS와 분리해 관리한다.
-->
# Seoul Vibe GCP GKE Terraform IaC

This root module is the GCP entrypoint for the GKE deployment baseline.

It is intentionally separate from `terraform/aws/eks` so AWS and GCP can use different state backends, providers, IAM models, registries, and cluster resources.

## Scope

- Artifact Registry repositories for `client` and `server`
- VPC and subnets for GKE
- GKE cluster and node pools
- Node service account with Artifact Registry pull, logging, and monitoring permissions
- Workload Identity enabled on the cluster
- Cloud SQL PostgreSQL with private IP, application database, and generated application user password
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
terraform apply -var-file=envs/dev/terraform.tfvars
```

Use the same flow with `envs/prod/*` for production.

After apply, configure `kubectl`:

```bash
terraform output -raw configure_kubeconfig_command
```

Run the printed `gcloud container clusters get-credentials ...` command, then verify:

```bash
kubectl config current-context
kubectl get nodes
kubectl kustomize ../../../k8s/overlays/gcp/dev
```

Cloud SQL connection values for the Kubernetes Secret:

```bash
terraform output -raw cloud_sql_private_ip_address
terraform output -raw cloud_sql_database_name
terraform output -raw cloud_sql_app_user_name
terraform output -raw cloud_sql_app_user_password
```

## Dev Runtime On/Off

개발하지 않는 시간에는 GCP dev 실행 리소스를 내려 비용을 줄일 수 있다.

```bash
./scripts/gcp-dev-status.sh
./scripts/gcp-dev-down.sh
./scripts/gcp-dev-up.sh
```

`gcp-dev-down.sh`는 다음 순서로 실행된다.

1. Kubernetes Ingress를 삭제해 외부 Load Balancer를 제거한다.
2. client/server Deployment replica를 0으로 줄인다.
3. GKE node pool을 0대로 줄인다.
4. Cloud SQL activation policy를 `NEVER`로 바꿔 인스턴스를 중지한다.

`gcp-dev-up.sh`는 Cloud SQL을 다시 시작하고, GKE node pool을 1대로 늘린 뒤 `k8s/overlays/gcp/dev`를 다시 적용한다. Ingress 외부 IP가 준비되면 `/etc/hosts`의 `dev.seoul-vibe.example.com` 항목도 새 IP로 갱신한다.

주의할 점:

- Persistent Disk, Cloud SQL storage, Artifact Registry image storage, GCS backend 같은 저장 데이터는 유지된다.
- Ingress를 삭제했다가 다시 만들면 외부 IP가 바뀔 수 있다. `gcp-dev-up.sh`는 기본적으로 `/etc/hosts`를 갱신하므로 실행 중 Mac 로그인 비밀번호를 물어볼 수 있다.
- `/etc/hosts` 갱신을 건너뛰려면 `UPDATE_HOSTS=false ./scripts/gcp-dev-up.sh`로 실행한다.
- Terraform의 `gke_node_count` 기본값은 1이다. 개발 중지/재개는 Terraform 상태를 바꾸는 작업이 아니라 운영 스크립트로 일시적으로 실행 리소스를 조정하는 작업이다.
- 이후 `terraform apply`를 다시 실행하면 Terraform 설정 기준으로 node pool이 다시 1대로 맞춰질 수 있다.

## Notes

- `backend.hcl` uses a GCS backend and requires a pre-created GCS bucket.
- `gcp_project_id` must point to the target project.
- Dev defaults create one `e2-medium` node in `asia-northeast3-a` with `pd-standard` boot disks to avoid small-project SSD quota failures. Override `gke_node_locations`, `gke_node_count`, `gke_node_machine_type`, or `gke_node_disk_type` in the environment tfvars when needed.
- Dev Cloud SQL defaults use `ENTERPRISE` edition because shared-core tiers such as `db-f1-micro` are not valid with `ENTERPRISE_PLUS`.
- Cloud SQL uses private IP through private service access. Use `cloud_sql_private_ip_address` as `DB_HOST` in the `seoul-vibe-server-env` Kubernetes Secret.
- This module creates the cluster and database, but application secrets and the GCP upload-storage strategy are still deployment decisions before `kubectl apply -k k8s/overlays/gcp/dev`.
- Keep real `terraform.tfvars`, backend config, state, and plan files out of Git.
