# 목적 - GKE 애플리케이션이 사용할 Cloud SQL PostgreSQL 데이터베이스를 생성하기 위해 추가됨
# 설명 - GKE VPC에서 private IP로 접근하는 저비용 dev 기본값을 제공하고, 앱 DB/user/password를 Terraform 출력으로 연결한다.
resource "google_sql_database_instance" "postgres" {
  name             = "${local.name_prefix}-postgres"
  database_version = var.cloud_sql_database_version
  region           = var.gcp_region

  deletion_protection = var.cloud_sql_deletion_protection

  settings {
    tier              = var.cloud_sql_tier
    availability_type = var.cloud_sql_availability_type
    disk_type         = var.cloud_sql_disk_type
    disk_size         = var.cloud_sql_disk_size_gb
    disk_autoresize   = true

    ip_configuration {
      ipv4_enabled                                  = false
      private_network                               = google_compute_network.gke.id
      enable_private_path_for_google_cloud_services = true
    }

    backup_configuration {
      enabled = var.cloud_sql_backup_enabled
    }

    user_labels = local.labels
  }

  depends_on = [
    google_project_service.required,
    google_service_networking_connection.private_service_access,
  ]
}

resource "google_sql_database" "app" {
  name     = var.cloud_sql_database_name
  instance = google_sql_database_instance.postgres.name
}

resource "random_password" "cloud_sql_app_user" {
  length  = 32
  special = false
}

resource "google_sql_user" "app" {
  name     = var.cloud_sql_app_user_name
  instance = google_sql_database_instance.postgres.name
  password = random_password.cloud_sql_app_user.result
}
