# 목적 - 기존 k8s/base가 기대하는 namespace와 선택적 Secret 주입 지점을 만들기 위해 추가됨
# 설명 - namespace는 Terraform에서 항상 보장하고, 실제 민감값 Secret은 create_app_secret=true일 때만 생성해 CI/Secret Manager 전략과 충돌하지 않게 한다.
resource "kubernetes_namespace" "app" {
  metadata {
    name = var.app_namespace

    labels = {
      "app.kubernetes.io/part-of" = var.project_name
      "environment"              = var.environment
    }
  }

  depends_on = [aws_eks_node_group.this]
}

resource "kubernetes_secret" "server_env" {
  count = var.create_app_secret ? 1 : 0

  metadata {
    name      = "seoul-vibe-server-env"
    namespace = kubernetes_namespace.app.metadata[0].name
  }

  type = "Opaque"
  data = var.server_secret_values

  lifecycle {
    precondition {
      condition     = length(setsubtract(local.required_server_secret_keys, keys(var.server_secret_values))) == 0
      error_message = "server_secret_values must include all required keys from local.required_server_secret_keys when create_app_secret is true."
    }
  }
}
