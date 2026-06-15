# 목적 - GCP GKE root module의 환경별 입력값을 선언하기 위해 추가됨
# 설명 - project, region, environment, namespace처럼 dev/prod에서 달라질 값을 tfvars로 분리한다.
variable "project_name" {
  description = "Project name used for GCP resource names."
  type        = string
  default     = "seoul-vibe"
}

variable "environment" {
  description = "Deployment environment name such as dev or prod."
  type        = string

  validation {
    condition     = contains(["dev", "prod"], var.environment)
    error_message = "environment must be either dev or prod."
  }
}

variable "gcp_project_id" {
  description = "GCP project ID where the GKE stack is created."
  type        = string
}

variable "gcp_region" {
  description = "GCP region where regional resources are created."
  type        = string
  default     = "asia-northeast3"
}
