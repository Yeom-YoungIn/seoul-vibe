# 목적 - GKE 배포에 필요한 GCP API를 Terraform에서 명시적으로 활성화하기 위해 추가됨
# 설명 - 새 프로젝트에서 수동 콘솔 작업 없이 Artifact Registry, Compute, GKE API를 사용할 수 있게 한다.
locals {
  required_project_services = toset([
    "artifactregistry.googleapis.com",
    "compute.googleapis.com",
    "container.googleapis.com",
    "iam.googleapis.com",
    "servicenetworking.googleapis.com",
    "sqladmin.googleapis.com",
  ])
}

resource "google_project_service" "required" {
  for_each = local.required_project_services

  project = var.gcp_project_id
  service = each.value

  disable_on_destroy = false
}
