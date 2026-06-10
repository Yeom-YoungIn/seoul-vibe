# 목적 - k8s/base/server-uploads-pvc.yaml이 요구하는 efs-sc StorageClass 기반 RWX 저장소를 만들기 위해 추가됨
# 설명 - EFS 파일시스템, mount target, CSI driver add-on, Kubernetes StorageClass를 구성해 업로드 PVC가 동적 provisioning을 사용할 수 있게 한다.
resource "aws_security_group" "efs" {
  count = var.enable_efs_csi_driver ? 1 : 0

  name        = "${local.name_prefix}-efs"
  description = "Allow EKS nodes to mount EFS"
  vpc_id      = aws_vpc.this.id

  ingress {
    description = "NFS from EKS worker nodes"
    from_port   = 2049
    to_port     = 2049
    protocol    = "tcp"
    cidr_blocks = var.private_subnet_cidrs
  }

  egress {
    description = "All outbound"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "${local.name_prefix}-efs"
  }
}

resource "aws_efs_file_system" "uploads" {
  count = var.enable_efs_csi_driver ? 1 : 0

  encrypted        = true
  performance_mode = "generalPurpose"
  throughput_mode  = "elastic"

  tags = {
    Name = "${local.name_prefix}-uploads"
  }
}

resource "aws_efs_mount_target" "uploads" {
  count = var.enable_efs_csi_driver ? var.az_count : 0

  file_system_id  = aws_efs_file_system.uploads[0].id
  subnet_id        = aws_subnet.private[count.index].id
  security_groups  = [aws_security_group.efs[0].id]
}

resource "aws_eks_addon" "efs_csi" {
  count = var.enable_efs_csi_driver ? 1 : 0

  cluster_name                = aws_eks_cluster.this.name
  addon_name                  = "aws-efs-csi-driver"
  addon_version               = var.efs_csi_addon_version
  service_account_role_arn    = aws_iam_role.efs_csi[0].arn
  resolve_conflicts_on_create = "OVERWRITE"
  resolve_conflicts_on_update = "OVERWRITE"

  depends_on = [
    aws_eks_node_group.this,
    aws_iam_role_policy_attachment.efs_csi,
  ]
}

resource "kubernetes_storage_class" "efs" {
  count = var.enable_efs_csi_driver ? 1 : 0

  metadata {
    name = "efs-sc"
  }

  storage_provisioner = "efs.csi.aws.com"
  reclaim_policy      = "Retain"
  volume_binding_mode = "Immediate"

  parameters = {
    provisioningMode = "efs-ap"
    fileSystemId     = aws_efs_file_system.uploads[0].id
    directoryPerms   = "700"
    gidRangeStart    = "1000"
    gidRangeEnd      = "2000"
    basePath         = "/seoul-vibe"
  }

  depends_on = [
    aws_efs_mount_target.uploads,
    aws_eks_addon.efs_csi,
  ]
}
