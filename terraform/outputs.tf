# 목적 - 배포 파이프라인과 k8s/base overlay가 사용할 Terraform 결과값을 노출하기 위해 추가됨
# 설명 - EKS 접속 명령, ECR repository URL, namespace, EFS/IRSA 정보를 출력해 이미지 치환과 클러스터 후속 배포를 연결한다.
output "cluster_name" {
  description = "EKS cluster name."
  value       = aws_eks_cluster.this.name
}

output "cluster_endpoint" {
  description = "EKS cluster API endpoint."
  value       = aws_eks_cluster.this.endpoint
}

output "configure_kubeconfig_command" {
  description = "Command to configure local kubectl access."
  value       = "aws eks update-kubeconfig --region ${var.aws_region} --name ${aws_eks_cluster.this.name}"
}

output "ecr_repository_urls" {
  description = "ECR repository URLs keyed by app component."
  value       = { for name, repo in aws_ecr_repository.app : name => repo.repository_url }
}

output "app_namespace" {
  description = "Kubernetes namespace used by k8s/base."
  value       = kubernetes_namespace.app.metadata[0].name
}

output "required_server_secret_keys" {
  description = "Required keys for the seoul-vibe-server-env Secret."
  value       = local.required_server_secret_keys
}

output "efs_storage_class_name" {
  description = "StorageClass expected by k8s/base/server-uploads-pvc.yaml."
  value       = var.enable_efs_csi_driver ? kubernetes_storage_class.efs[0].metadata[0].name : null
}

output "efs_file_system_id" {
  description = "EFS file system backing uploaded files."
  value       = var.enable_efs_csi_driver ? aws_efs_file_system.uploads[0].id : null
}

output "alb_controller_role_arn" {
  description = "IAM role ARN used by AWS Load Balancer Controller."
  value       = var.enable_alb_controller ? aws_iam_role.alb_controller[0].arn : null
}

output "efs_csi_role_arn" {
  description = "IAM role ARN used by the EFS CSI driver."
  value       = var.enable_efs_csi_driver ? aws_iam_role.efs_csi[0].arn : null
}
