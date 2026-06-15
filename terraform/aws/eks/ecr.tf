# 목적 - client/server 컨테이너 이미지를 저장할 ECR repository를 만들기 위해 추가됨
# 설명 - 기존 k8s/base 이미지 placeholder를 이 repository URL로 치환하도록 출력값을 제공하고, 오래된 이미지는 lifecycle policy로 정리한다.
resource "aws_ecr_repository" "app" {
  for_each = local.ecr_repositories

  name                 = each.value
  image_tag_mutability = "IMMUTABLE"

  encryption_configuration {
    encryption_type = "AES256"
  }

  image_scanning_configuration {
    scan_on_push = true
  }
}

resource "aws_ecr_lifecycle_policy" "app" {
  for_each = aws_ecr_repository.app

  repository = each.value.name

  policy = jsonencode({
    rules = [
      {
        rulePriority = 1
        description  = "Keep only the most recent images"
        selection = {
          tagStatus   = "any"
          countType   = "imageCountMoreThan"
          countNumber = var.ecr_image_retention_count
        }
        action = {
          type = "expire"
        }
      }
    ]
  })
}
