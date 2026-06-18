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

variable "gke_cluster_name" {
  description = "Optional GKE cluster name. Defaults to <project_name>-<environment>-gke."
  type        = string
  default     = null
}

variable "gke_release_channel" {
  description = "GKE release channel."
  type        = string
  default     = "REGULAR"

  validation {
    condition     = contains(["RAPID", "REGULAR", "STABLE"], var.gke_release_channel)
    error_message = "gke_release_channel must be RAPID, REGULAR, or STABLE."
  }
}

variable "gke_node_locations" {
  description = "Zones where GKE nodes are created. Keep one zone for low-cost dev."
  type        = list(string)
  default     = ["asia-northeast3-a"]
}

variable "gke_node_count" {
  description = "Number of nodes in the primary node pool."
  type        = number
  default     = 1

  validation {
    condition     = var.gke_node_count >= 1
    error_message = "gke_node_count must be at least 1."
  }
}

variable "gke_node_machine_type" {
  description = "Machine type for the primary GKE node pool."
  type        = string
  default     = "e2-medium"
}

variable "gke_node_disk_size_gb" {
  description = "Boot disk size in GB for GKE nodes."
  type        = number
  default     = 30

  validation {
    condition     = var.gke_node_disk_size_gb >= 20
    error_message = "gke_node_disk_size_gb must be at least 20."
  }
}

variable "gke_node_disk_type" {
  description = "Boot disk type for GKE nodes. Use pd-standard for low-quota dev projects."
  type        = string
  default     = "pd-standard"

  validation {
    condition     = contains(["pd-standard", "pd-balanced", "pd-ssd"], var.gke_node_disk_type)
    error_message = "gke_node_disk_type must be pd-standard, pd-balanced, or pd-ssd."
  }
}

variable "gke_deletion_protection" {
  description = "Whether deletion protection is enabled for the GKE cluster."
  type        = bool
  default     = false
}

variable "gke_subnet_ipv4_cidr_range" {
  description = "Primary subnet CIDR range for GKE nodes."
  type        = string
  default     = "10.10.0.0/20"
}

variable "gke_pods_ipv4_cidr_range" {
  description = "Secondary CIDR range for GKE Pods."
  type        = string
  default     = "10.20.0.0/16"
}

variable "gke_services_ipv4_cidr_range" {
  description = "Secondary CIDR range for GKE Services."
  type        = string
  default     = "10.30.0.0/20"
}
