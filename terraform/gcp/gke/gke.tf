# 목적 - Seoul Vibe 애플리케이션을 실행할 GKE 클러스터와 기본 Node Pool을 생성하기 위해 추가됨
# 설명 - 기본 node pool을 제거하고 별도 서비스 계정 기반 node pool을 사용해 권한과 비용을 명확히 관리한다.
resource "google_container_cluster" "primary" {
  name     = local.gke_cluster_name
  location = var.gcp_region

  node_locations = var.gke_node_locations

  network    = google_compute_network.gke.id
  subnetwork = google_compute_subnetwork.gke.id

  deletion_protection = var.gke_deletion_protection

  remove_default_node_pool = true
  initial_node_count       = 1

  node_config {
    machine_type = var.gke_node_machine_type
    disk_type    = var.gke_node_disk_type
    disk_size_gb = var.gke_node_disk_size_gb
  }

  release_channel {
    channel = var.gke_release_channel
  }

  ip_allocation_policy {
    cluster_secondary_range_name  = "${local.name_prefix}-pods"
    services_secondary_range_name = "${local.name_prefix}-services"
  }

  workload_identity_config {
    workload_pool = "${var.gcp_project_id}.svc.id.goog"
  }

  master_auth {
    client_certificate_config {
      issue_client_certificate = false
    }
  }

  resource_labels = local.labels

  depends_on = [
    google_project_service.required,
  ]
}

resource "google_container_node_pool" "primary" {
  name     = "${local.name_prefix}-primary"
  location = google_container_cluster.primary.location
  cluster  = google_container_cluster.primary.name

  node_locations = var.gke_node_locations
  node_count     = var.gke_node_count

  management {
    auto_repair  = true
    auto_upgrade = true
  }

  node_config {
    machine_type    = var.gke_node_machine_type
    disk_type       = var.gke_node_disk_type
    disk_size_gb    = var.gke_node_disk_size_gb
    service_account = google_service_account.gke_nodes.email

    oauth_scopes = [
      "https://www.googleapis.com/auth/cloud-platform",
    ]

    labels = local.labels

    metadata = {
      disable-legacy-endpoints = "true"
    }
  }

  depends_on = [
    google_project_iam_member.gke_nodes,
  ]
}
