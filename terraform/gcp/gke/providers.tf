# 목적 - GCP provider의 기본 설정을 정의하기 위해 추가됨
# 설명 - GCP project/region을 변수로 받아 향후 GKE와 Artifact Registry 리소스 생성에 사용할 기본 provider를 설정한다.
provider "google" {
  project = var.gcp_project_id
  region  = var.gcp_region
}
