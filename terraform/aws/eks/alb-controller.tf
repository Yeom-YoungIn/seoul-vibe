# 목적 - Kubernetes Ingress를 AWS ALB로 연결하기 위한 controller 선행 구성을 만들기 위해 추가됨
# 설명 - IRSA service account와 Helm release를 설치해 기존 k8s/base/ingress.yaml이 ALB Controller에 의해 처리되도록 한다.
resource "kubernetes_service_account" "alb_controller" {
  count = var.enable_alb_controller ? 1 : 0

  metadata {
    name      = "aws-load-balancer-controller"
    namespace = "kube-system"
    annotations = {
      "eks.amazonaws.com/role-arn" = aws_iam_role.alb_controller[0].arn
    }
  }

  depends_on = [aws_eks_node_group.this]
}

resource "helm_release" "alb_controller" {
  count = var.enable_alb_controller ? 1 : 0

  name       = "aws-load-balancer-controller"
  repository = "https://aws.github.io/eks-charts"
  chart      = "aws-load-balancer-controller"
  version    = var.alb_controller_chart_version
  namespace  = "kube-system"

  set {
    name  = "clusterName"
    value = aws_eks_cluster.this.name
  }

  set {
    name  = "region"
    value = var.aws_region
  }

  set {
    name  = "vpcId"
    value = aws_vpc.this.id
  }

  set {
    name  = "serviceAccount.create"
    value = "false"
  }

  set {
    name  = "serviceAccount.name"
    value = kubernetes_service_account.alb_controller[0].metadata[0].name
  }

  depends_on = [
    aws_iam_role_policy_attachment.alb_controller,
    kubernetes_service_account.alb_controller,
  ]
}
