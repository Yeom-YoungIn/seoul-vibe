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

variable "private_service_access_ipv4_prefix_length" {
  description = "Prefix length for the reserved private service access range used by Cloud SQL private IP."
  type        = number
  default     = 16

  validation {
    condition     = var.private_service_access_ipv4_prefix_length >= 16 && var.private_service_access_ipv4_prefix_length <= 24
    error_message = "private_service_access_ipv4_prefix_length must be between 16 and 24."
  }
}

variable "cloud_sql_database_version" {
  description = "Cloud SQL PostgreSQL database version."
  type        = string
  default     = "POSTGRES_16"
}

variable "cloud_sql_tier" {
  description = "Cloud SQL machine tier. db-f1-micro is a low-cost dev default."
  type        = string
  default     = "db-f1-micro"
}

variable "cloud_sql_disk_type" {
  description = "Cloud SQL disk type."
  type        = string
  default     = "PD_HDD"

  validation {
    condition     = contains(["PD_HDD", "PD_SSD"], var.cloud_sql_disk_type)
    error_message = "cloud_sql_disk_type must be PD_HDD or PD_SSD."
  }
}

variable "cloud_sql_disk_size_gb" {
  description = "Cloud SQL disk size in GB."
  type        = number
  default     = 10

  validation {
    condition     = var.cloud_sql_disk_size_gb >= 10
    error_message = "cloud_sql_disk_size_gb must be at least 10."
  }
}

variable "cloud_sql_availability_type" {
  description = "Cloud SQL availability type."
  type        = string
  default     = "ZONAL"

  validation {
    condition     = contains(["ZONAL", "REGIONAL"], var.cloud_sql_availability_type)
    error_message = "cloud_sql_availability_type must be ZONAL or REGIONAL."
  }
}

variable "cloud_sql_backup_enabled" {
  description = "Whether Cloud SQL automated backups are enabled."
  type        = bool
  default     = true
}

variable "cloud_sql_deletion_protection" {
  description = "Whether deletion protection is enabled for the Cloud SQL instance."
  type        = bool
  default     = false
}

variable "cloud_sql_database_name" {
  description = "Application database name."
  type        = string
  default     = "seoul_vibe"
}

variable "cloud_sql_app_user_name" {
  description = "Application database user name."
  type        = string
  default     = "seoul_vibe_app"
}
