# 목적 - GKE 배포에 사용할 client/server Docker 이미지 저장소를 생성하기 위해 추가됨
# 설명 - Artifact Registry는 GCP에서 AWS ECR에 해당하며, 이미지 push/pull 기준 URL을 outputs.tf로 노출한다.
resource "google_artifact_registry_repository" "app" {
  for_each = local.artifact_registry_repositories

  location      = var.gcp_region
  repository_id = each.value.repository_id
  description   = each.value.description
  format        = "DOCKER"

  cleanup_policies {
    id     = "keep-recent-images"
    action = "KEEP"

    most_recent_versions {
      keep_count = 10
    }
  }

  cleanup_policies {
    id     = "delete-untagged-images-after-7-days"
    action = "DELETE"

    condition {
      tag_state  = "UNTAGGED"
      older_than = "604800s"
    }
  }
}
