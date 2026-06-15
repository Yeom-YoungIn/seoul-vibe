# 목적 - dev 환경 Terraform 실행 절차를 문서화하기 위해 추가됨
# 설명 - 예시 tfvars/backend 파일을 복사해 개발용 EKS 인프라를 초기화, 검토, 적용하는 흐름을 안내한다.
# Terraform Dev Environment

Use this directory only for environment input examples. Run Terraform from the AWS EKS root module:

```bash
cd terraform/aws/eks
cp envs/dev/terraform.tfvars.example envs/dev/terraform.tfvars
cp envs/dev/backend.hcl.example envs/dev/backend.hcl
terraform init -backend-config=envs/dev/backend.hcl
terraform plan -var-file=envs/dev/terraform.tfvars
terraform apply -var-file=envs/dev/terraform.tfvars
```

Do not commit real `terraform.tfvars` or `backend.hcl` files when they contain account-specific or sensitive values.
