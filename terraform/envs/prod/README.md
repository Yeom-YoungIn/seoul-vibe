# 목적 - prod 환경 Terraform 실행 절차와 운영 주의사항을 문서화하기 위해 추가됨
# 설명 - 운영 적용 전 plan 검토, state backend 분리, 민감값 관리 원칙을 명시해 dev와 prod가 섞이지 않게 한다.
# Terraform Prod Environment

Use this directory only for environment input examples. Run Terraform from the repository `terraform/` root:

```bash
cd terraform
cp envs/prod/terraform.tfvars.example envs/prod/terraform.tfvars
cp envs/prod/backend.hcl.example envs/prod/backend.hcl
terraform init -backend-config=envs/prod/backend.hcl
terraform plan -var-file=envs/prod/terraform.tfvars
terraform apply -var-file=envs/prod/terraform.tfvars
```

For production, keep `create_app_secret = false` unless your Terraform state backend and access controls are approved for secret storage. Prefer a CI secret injection step or AWS Secrets Manager based workflow for real credentials.
