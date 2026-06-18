# 목적 - GKE Node Pool이 GCP 리소스에 접근할 최소 서비스 계정을 만들기 위해 추가됨
# 설명 - 노드가 Artifact Registry 이미지 pull, 로그 전송, 모니터링 전송을 할 수 있는 권한만 부여한다.
resource "google_service_account" "gke_nodes" {
  account_id   = "${local.name_prefix}-gke-nodes"
  display_name = "Seoul Vibe ${var.environment} GKE nodes"

  depends_on = [
    google_project_service.required,
  ]
}

resource "google_project_iam_member" "gke_nodes" {
  for_each = toset([
    "roles/artifactregistry.reader",
    "roles/logging.logWriter",
    "roles/monitoring.metricWriter",
  ])

  project = var.gcp_project_id
  role    = each.value
  member  = "serviceAccount:${google_service_account.gke_nodes.email}"
}
