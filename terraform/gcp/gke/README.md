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

세 스크립트는 실행 전에 대상 GCP project/region/GKE cluster/node pool/Cloud SQL을 조회하고, `kubectl`로 리소스를 변경하기 전 현재 kube context가 대상 GKE API server와 일치하는지 확인한다.

`gcp-dev-down.sh`는 다음 순서로 실행된다.

1. Kubernetes Ingress를 삭제해 외부 Load Balancer를 제거한다.
2. client/server Deployment replica를 0으로 줄인다.
3. GKE node pool을 0대로 줄인다.
4. Cloud SQL activation policy를 `NEVER`로 바꿔 인스턴스를 중지한다.

`gcp-dev-up.sh`는 Cloud SQL을 다시 시작하고, GKE node pool을 1대로 늘린 뒤 `k8s/overlays/gcp/dev`를 다시 적용한다. Ingress 외부 IP가 준비되면 `/etc/hosts`의 `dev.seoul-vibe.example.com` 항목도 새 IP로 갱신한다.

주의할 점:

- 실제 변경 없이 대상과 실행 계획만 확인하려면 `./scripts/gcp-dev-down.sh --dry-run` 또는 `./scripts/gcp-dev-up.sh --dry-run`을 먼저 실행한다.
- `CLUSTER_NAME`, `NODE_POOL`, `SQL_INSTANCE`가 `dev`를 포함하지 않으면 실행을 중단한다. 의도적으로 다른 이름을 쓰는 개발 리소스라면 `--allow-non-dev-target`를 붙인다.
- kube context 이름/API server가 대상 GKE와 맞지 않으면 `kubectl` 작업을 중단한다. 비표준 kubeconfig를 검증한 뒤에만 `--allow-context-mismatch`를 사용한다.
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
