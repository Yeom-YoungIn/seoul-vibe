# 목적 - 반복되는 이름, 태그, 애플리케이션 Secret 키 정의를 중앙화하기 위해 추가됨
# 설명 - dev/prod 별 리소스 접두어와 ECR repository 이름을 일관되게 만들고 문서화된 Secret 키 목록을 Terraform 출력에 반영한다.
locals {
  name_prefix = "${var.project_name}-${var.environment}"

  common_tags = merge(
    {
      Project     = var.project_name
      Environment = var.environment
      ManagedBy   = "terraform"
      Repository  = "seoul-vibe"
    },
    var.tags
  )

  ecr_repositories = {
    client = "${local.name_prefix}-client"
    server = "${local.name_prefix}-server"
  }

  required_server_secret_keys = [
    "DB_HOST",
    "DB_PORT",
    "DB_USER",
    "DB_PASS",
    "DB_NAME",
    "JWT_ACCESS_SECRET",
    "JWT_REFRESH_SECRET",
    "JWT_ACCESS_EXPIRES_IN",
    "JWT_REFRESH_EXPIRES_IN",
    "JWT_REFRESH_EXPIRES_MS",
    "MAIL_HOST",
    "MAIL_PORT",
    "MAIL_USER",
    "MAIL_PASS",
  ]

  oidc_provider_host = replace(aws_iam_openid_connect_provider.eks.url, "https://", "")

  alb_controller_policy_arn = var.enable_alb_controller ? var.alb_controller_policy_arn : null
}
