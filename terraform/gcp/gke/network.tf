# 목적 - GKE 클러스터가 사용할 전용 VPC와 Subnet을 생성하기 위해 추가됨
# 설명 - Pod/Service용 secondary range를 분리해 GKE VPC-native 클러스터를 안정적으로 구성한다.
resource "google_compute_network" "gke" {
  name                    = "${local.name_prefix}-vpc"
  auto_create_subnetworks = false

  depends_on = [
    google_project_service.required,
  ]
}

resource "google_compute_subnetwork" "gke" {
  name          = "${local.name_prefix}-gke-subnet"
  region        = var.gcp_region
  network       = google_compute_network.gke.id
  ip_cidr_range = var.gke_subnet_ipv4_cidr_range

  secondary_ip_range {
    range_name    = "${local.name_prefix}-pods"
    ip_cidr_range = var.gke_pods_ipv4_cidr_range
  }

  secondary_ip_range {
    range_name    = "${local.name_prefix}-services"
    ip_cidr_range = var.gke_services_ipv4_cidr_range
  }
}

resource "google_compute_global_address" "private_service_access" {
  name          = "${local.name_prefix}-private-service-access"
  purpose       = "VPC_PEERING"
  address_type  = "INTERNAL"
  prefix_length = var.private_service_access_ipv4_prefix_length
  network       = google_compute_network.gke.id

  depends_on = [
    google_project_service.required,
  ]
}

resource "google_service_networking_connection" "private_service_access" {
  network                 = google_compute_network.gke.id
  service                 = "servicenetworking.googleapis.com"
  reserved_peering_ranges = [google_compute_global_address.private_service_access.name]
}
