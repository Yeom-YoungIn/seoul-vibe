# 목적 - GCP GKE Terraform 실행 버전과 provider 버전을 고정하기 위해 추가됨
# 설명 - GCS backend와 google/kubernetes provider를 사용해 GCP 배포 root module의 기본 실행 계약을 정의한다.
terraform {
  required_version = ">= 1.6.0"

  backend "gcs" {}

  required_providers {
    google = {
      source  = "hashicorp/google"
      version = ">= 6.0, < 7.0"
    }

    kubernetes = {
      source  = "hashicorp/kubernetes"
      version = ">= 2.30, < 3.0"
    }

    random = {
      source  = "hashicorp/random"
      version = ">= 3.6, < 4.0"
    }
  }
}
