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

## Notes

- `backend.hcl` uses a GCS backend and requires a pre-created GCS bucket.
- `gcp_project_id` must point to the target project.
- Dev defaults create one `e2-medium` node in `asia-northeast3-a` with `pd-standard` boot disks to avoid small-project SSD quota failures. Override `gke_node_locations`, `gke_node_count`, `gke_node_machine_type`, or `gke_node_disk_type` in the environment tfvars when needed.
- This module creates the cluster, but application secrets and the GCP upload-storage strategy are still deployment decisions before `kubectl apply -k k8s/overlays/gcp/dev`.
- Keep real `terraform.tfvars`, backend config, state, and plan files out of Git.
