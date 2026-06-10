# 목적 - EKS control plane, node group, IRSA용 IAM role/policy를 구성하기 위해 추가됨
# 설명 - 클러스터와 노드 기본 권한, AWS Load Balancer Controller, EFS CSI driver가 사용할 service account role을 분리한다.
data "aws_iam_policy_document" "eks_cluster_assume_role" {
  statement {
    actions = ["sts:AssumeRole"]

    principals {
      type        = "Service"
      identifiers = ["eks.amazonaws.com"]
    }
  }
}

resource "aws_iam_role" "eks_cluster" {
  name               = "${local.name_prefix}-eks-cluster"
  assume_role_policy = data.aws_iam_policy_document.eks_cluster_assume_role.json
}

resource "aws_iam_role_policy_attachment" "eks_cluster" {
  policy_arn = "arn:aws:iam::aws:policy/AmazonEKSClusterPolicy"
  role       = aws_iam_role.eks_cluster.name
}

data "aws_iam_policy_document" "node_assume_role" {
  statement {
    actions = ["sts:AssumeRole"]

    principals {
      type        = "Service"
      identifiers = ["ec2.amazonaws.com"]
    }
  }
}

resource "aws_iam_role" "node" {
  name               = "${local.name_prefix}-node"
  assume_role_policy = data.aws_iam_policy_document.node_assume_role.json
}

resource "aws_iam_role_policy_attachment" "node_worker" {
  policy_arn = "arn:aws:iam::aws:policy/AmazonEKSWorkerNodePolicy"
  role       = aws_iam_role.node.name
}

resource "aws_iam_role_policy_attachment" "node_cni" {
  policy_arn = "arn:aws:iam::aws:policy/AmazonEKS_CNI_Policy"
  role       = aws_iam_role.node.name
}

resource "aws_iam_role_policy_attachment" "node_ecr" {
  policy_arn = "arn:aws:iam::aws:policy/AmazonEC2ContainerRegistryReadOnly"
  role       = aws_iam_role.node.name
}

data "tls_certificate" "eks_oidc" {
  url = aws_eks_cluster.this.identity[0].oidc[0].issuer
}

resource "aws_iam_openid_connect_provider" "eks" {
  url             = aws_eks_cluster.this.identity[0].oidc[0].issuer
  client_id_list  = ["sts.amazonaws.com"]
  thumbprint_list = [data.tls_certificate.eks_oidc.certificates[0].sha1_fingerprint]
}

data "aws_iam_policy_document" "alb_controller_assume_role" {
  statement {
    actions = ["sts:AssumeRoleWithWebIdentity"]

    principals {
      type        = "Federated"
      identifiers = [aws_iam_openid_connect_provider.eks.arn]
    }

    condition {
      test     = "StringEquals"
      variable = "${local.oidc_provider_host}:aud"
      values   = ["sts.amazonaws.com"]
    }

    condition {
      test     = "StringEquals"
      variable = "${local.oidc_provider_host}:sub"
      values   = ["system:serviceaccount:kube-system:aws-load-balancer-controller"]
    }
  }
}

resource "aws_iam_role" "alb_controller" {
  count = var.enable_alb_controller ? 1 : 0

  name               = "${local.name_prefix}-alb-controller"
  assume_role_policy = data.aws_iam_policy_document.alb_controller_assume_role.json
}

resource "terraform_data" "validate_alb_controller_policy" {
  count = var.enable_alb_controller && var.alb_controller_policy_arn == null ? 1 : 0

  lifecycle {
    precondition {
      condition     = var.alb_controller_policy_arn != null
      error_message = "alb_controller_policy_arn is required when enable_alb_controller is true. Use the official AWS Load Balancer Controller IAM policy for the chart version."
    }
  }
}

resource "aws_iam_role_policy_attachment" "alb_controller" {
  count = var.enable_alb_controller ? 1 : 0

  policy_arn = local.alb_controller_policy_arn
  role       = aws_iam_role.alb_controller[0].name

  depends_on = [terraform_data.validate_alb_controller_policy]
}

data "aws_iam_policy_document" "efs_csi_assume_role" {
  statement {
    actions = ["sts:AssumeRoleWithWebIdentity"]

    principals {
      type        = "Federated"
      identifiers = [aws_iam_openid_connect_provider.eks.arn]
    }

    condition {
      test     = "StringEquals"
      variable = "${local.oidc_provider_host}:aud"
      values   = ["sts.amazonaws.com"]
    }

    condition {
      test     = "StringLike"
      variable = "${local.oidc_provider_host}:sub"
      values   = ["system:serviceaccount:kube-system:efs-csi-*"]
    }
  }
}

resource "aws_iam_role" "efs_csi" {
  count = var.enable_efs_csi_driver ? 1 : 0

  name               = "${local.name_prefix}-efs-csi"
  assume_role_policy = data.aws_iam_policy_document.efs_csi_assume_role.json
}

resource "aws_iam_role_policy_attachment" "efs_csi" {
  count = var.enable_efs_csi_driver ? 1 : 0

  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonEFSCSIDriverPolicy"
  role       = aws_iam_role.efs_csi[0].name
}
