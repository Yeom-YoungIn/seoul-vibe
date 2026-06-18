# 목적 - GCP GKE root module의 주요 결과값 출력 지점을 제공하기 위해 추가됨
# 설명 - 실제 GKE/Artifact Registry 리소스가 추가될 때 배포 파이프라인에서 필요한 값을 이 파일에 모은다.
output "gcp_project_id" {
  description = "GCP project ID used by this root module."
  value       = var.gcp_project_id
}

output "gcp_region" {
  description = "GCP region used by this root module."
  value       = var.gcp_region
}

output "name_prefix" {
  description = "Common prefix for GCP resource names."
  value       = local.name_prefix
}

output "artifact_registry_repository_ids" {
  description = "Artifact Registry repository IDs by application component."
  value = {
    for component, repository in google_artifact_registry_repository.app :
    component => repository.repository_id
  }
}

output "artifact_registry_image_prefixes" {
  description = "Docker image prefixes by application component."
  value = {
    for component, repository in google_artifact_registry_repository.app :
    component => "${var.gcp_region}-docker.pkg.dev/${var.gcp_project_id}/${repository.repository_id}"
  }
}

output "gke_cluster_name" {
  description = "GKE cluster name."
  value       = google_container_cluster.primary.name
}

output "gke_cluster_location" {
  description = "GKE cluster location."
  value       = google_container_cluster.primary.location
}

output "gke_node_service_account" {
  description = "Service account used by GKE nodes."
  value       = google_service_account.gke_nodes.email
}

output "configure_kubeconfig_command" {
  description = "Command that configures kubectl to use this GKE cluster."
  value       = "gcloud container clusters get-credentials ${google_container_cluster.primary.name} --region ${google_container_cluster.primary.location} --project ${var.gcp_project_id}"
}

output "cloud_sql_instance_name" {
  description = "Cloud SQL PostgreSQL instance name."
  value       = google_sql_database_instance.postgres.name
}

output "cloud_sql_private_ip_address" {
  description = "Private IP address for the Cloud SQL PostgreSQL instance."
  value       = google_sql_database_instance.postgres.private_ip_address
}

output "cloud_sql_database_name" {
  description = "Application database name."
  value       = google_sql_database.app.name
}

output "cloud_sql_app_user_name" {
  description = "Application database user name."
  value       = google_sql_user.app.name
}

output "cloud_sql_app_user_password" {
  description = "Generated application database user password. Store it in Kubernetes Secret, not in Git."
  value       = random_password.cloud_sql_app_user.result
  sensitive   = true
}
