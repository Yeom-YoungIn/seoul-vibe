# 목적 - 현재 레포에서 Terraform IaC로 AWS EKS 배포 기반을 관리하기 위해 추가됨
# 설명 - ECR, EKS, node group, IAM/IRSA, ALB Controller, EFS StorageClass, namespace/Secret 주입 전략과 dev/prod 실행 방식을 한 문서에 정리한다.
# Seoul Vibe Terraform IaC

This directory owns AWS infrastructure needed before applying `k8s/base`.

It creates:

- ECR repositories for `client` and `server`
- VPC, public/private subnets, internet gateway, optional NAT gateway, and EKS subnet discovery tags
- EKS cluster, managed node group, and core EKS add-ons
- IAM roles for the cluster, nodes, AWS Load Balancer Controller, and EFS CSI driver
- AWS Load Balancer Controller Helm release prerequisites
- EFS file system and Kubernetes `efs-sc` StorageClass for uploaded files
- Application namespace and an optional `seoul-vibe-server-env` Secret injection path

## Layout

```text
terraform/
  *.tf                 # root module
  envs/dev/            # dev backend and tfvars examples
  envs/prod/           # prod backend and tfvars examples
```

Run Terraform from `terraform/` and pass an environment var file:

```bash
cd terraform
cp envs/dev/backend.hcl.example envs/dev/backend.hcl
cp envs/dev/terraform.tfvars.example envs/dev/terraform.tfvars
terraform init -backend-config=envs/dev/backend.hcl
terraform plan -var-file=envs/dev/terraform.tfvars
terraform apply -var-file=envs/dev/terraform.tfvars
```

Use the same flow with `envs/prod/*` for production.

## Kubernetes Integration

After `terraform apply`, configure `kubectl`:

```bash
terraform output -raw configure_kubeconfig_command
```

Use `terraform output ecr_repository_urls` to replace the image placeholders in `k8s/overlays/dev/kustomization.yaml` or `k8s/overlays/prod/kustomization.yaml`:

```yaml
images:
  - name: seoul-vibe-client
    newName: <client_ecr_repository_url>
    newTag: <immutable_release_tag_or_digest>
  - name: seoul-vibe-server
    newName: <server_ecr_repository_url>
    newTag: <immutable_release_tag_or_digest>
```

The base manifest expects:

- namespace: `seoul-vibe` by default, created by Terraform as `var.app_namespace`
- server secret: `seoul-vibe-server-env`
- upload storage class: `efs-sc`
- ingress class: handled by AWS Load Balancer Controller

Render the selected environment before applying:

```bash
kubectl kustomize ../k8s/overlays/dev
kubectl apply -k ../k8s/overlays/dev
```

## Secret Strategy

`create_app_secret` defaults to `false` so sensitive application values are not accidentally stored in Terraform state.

Recommended production flow:

1. Keep database and mail credentials in a secrets system or CI secret store.
2. Create/update `seoul-vibe-server-env` during deployment.
3. Keep `k8s/base/server-secret.example.yaml` as the required key contract.

If an environment explicitly accepts Terraform-managed secrets, set:

```hcl
create_app_secret = true
server_secret_values = {
  DB_HOST                = "..."
  DB_PORT                = "5432"
  DB_USER                = "..."
  DB_PASS                = "..."
  DB_NAME                = "..."
  JWT_ACCESS_SECRET     = "..."
  JWT_REFRESH_SECRET    = "..."
  JWT_ACCESS_EXPIRES_IN = "15m"
  JWT_REFRESH_EXPIRES_IN = "7d"
  JWT_REFRESH_EXPIRES_MS = "604800000"
  MAIL_HOST             = "..."
  MAIL_PORT             = "587"
  MAIL_USER             = "..."
  MAIL_PASS             = "..."
}
```

## Notes

- `alb_controller_policy_arn` can point to a centrally managed IAM policy if your AWS organization owns the official controller policy separately.
- `alb_controller_policy_arn` is required when `enable_alb_controller = true`; this repo intentionally does not generate a broad fallback IAM policy for the controller.
- `efs_csi_addon_version = null` lets AWS choose a compatible add-on version. Pin it only after checking the target EKS version.
- The base ingress is HTTP-only. Add ACM certificate and DNS-specific annotations in an overlay once those resources are available.
- ECR repository names include the environment, for example `seoul-vibe-dev-client` and `seoul-vibe-prod-client`, to avoid dev/prod state collisions in one AWS account.
- Keep real `terraform.tfvars`, backend config, state, and plan files out of Git.
