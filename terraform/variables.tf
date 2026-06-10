# 목적 - dev/prod 환경별로 달라지는 EKS 인프라 입력값을 선언하기 위해 추가됨
# 설명 - 네트워크 CIDR, 노드 그룹 크기, ALB controller/EFS CSI 활성화, 애플리케이션 namespace/secret 전략을 변수로 분리한다.
variable "project_name" {
  description = "Project name used for AWS resource names."
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

variable "aws_region" {
  description = "AWS region where the EKS stack is created."
  type        = string
  default     = "ap-northeast-2"
}

variable "vpc_cidr" {
  description = "CIDR block for the EKS VPC."
  type        = string
}

variable "az_count" {
  description = "Number of availability zones to use."
  type        = number
  default     = 2

  validation {
    condition     = var.az_count >= 2
    error_message = "EKS requires subnets across at least two availability zones."
  }
}

variable "public_subnet_cidrs" {
  description = "Public subnet CIDRs. Provide one CIDR per selected AZ."
  type        = list(string)
}

variable "private_subnet_cidrs" {
  description = "Private subnet CIDRs. Provide one CIDR per selected AZ."
  type        = list(string)
}

variable "enable_nat_gateway" {
  description = "Whether to create a NAT gateway for private node egress."
  type        = bool
  default     = true
}

variable "kubernetes_version" {
  description = "Optional EKS Kubernetes control plane version. Null lets AWS choose the default supported version."
  type        = string
  default     = null
}

variable "cluster_endpoint_public_access" {
  description = "Whether the EKS API endpoint is reachable from the public internet. Set false for hardened private-access environments."
  type        = bool
  default     = true
}

variable "cluster_endpoint_private_access" {
  description = "Whether the EKS API endpoint is reachable from inside the VPC."
  type        = bool
  default     = true
}

variable "bootstrap_cluster_creator_admin_permissions" {
  description = "Whether the Terraform caller receives bootstrap cluster-admin permissions."
  type        = bool
  default     = true
}

variable "node_instance_types" {
  description = "EC2 instance types for the managed node group."
  type        = list(string)
  default     = ["t3.medium"]
}

variable "node_ami_type" {
  description = "Optional EKS node AMI type. Null lets EKS choose the default for the selected Kubernetes version."
  type        = string
  default     = null
}

variable "node_min_size" {
  description = "Minimum node count."
  type        = number
  default     = 2
}

variable "node_desired_size" {
  description = "Desired node count."
  type        = number
  default     = 2
}

variable "node_max_size" {
  description = "Maximum node count."
  type        = number
  default     = 4
}

variable "node_disk_size" {
  description = "Node root volume size in GiB."
  type        = number
  default     = 30
}

variable "ecr_image_retention_count" {
  description = "Number of recent ECR images to retain per repository."
  type        = number
  default     = 30
}

variable "enable_alb_controller" {
  description = "Whether Terraform installs AWS Load Balancer Controller prerequisites and Helm release."
  type        = bool
  default     = true
}

variable "alb_controller_chart_version" {
  description = "AWS Load Balancer Controller Helm chart version."
  type        = string
  default     = "1.14.0"
}

variable "alb_controller_policy_arn" {
  description = "Existing IAM policy ARN for AWS Load Balancer Controller. Required when enable_alb_controller is true."
  type        = string
  default     = null
}

variable "enable_efs_csi_driver" {
  description = "Whether Terraform installs the Amazon EFS CSI EKS add-on and creates the efs-sc StorageClass."
  type        = bool
  default     = true
}

variable "efs_csi_addon_version" {
  description = "Optional pinned EKS add-on version for aws-efs-csi-driver. Null lets AWS choose the default compatible version."
  type        = string
  default     = null
}

variable "app_namespace" {
  description = "Kubernetes namespace expected by k8s/base and overlays. This baseline intentionally keeps it fixed."
  type        = string
  default     = "seoul-vibe"

  validation {
    condition     = var.app_namespace == "seoul-vibe"
    error_message = "app_namespace must stay 'seoul-vibe' unless the Kubernetes base and overlays are updated in the same change."
  }
}

variable "create_app_secret" {
  description = "Whether Terraform creates the seoul-vibe-server-env Kubernetes Secret."
  type        = bool
  default     = false
}

variable "server_secret_values" {
  description = "Sensitive server environment values for seoul-vibe-server-env. Prefer CI or a secret manager for real production values."
  type        = map(string)
  default     = {}
  sensitive   = true
}

variable "tags" {
  description = "Additional tags applied to all supported AWS resources."
  type        = map(string)
  default     = {}
}
