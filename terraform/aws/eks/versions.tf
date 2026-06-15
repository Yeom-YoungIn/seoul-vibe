# 목적 - Terraform 실행 버전과 필요한 provider 버전을 고정하기 위해 추가됨
# 설명 - AWS, Kubernetes, Helm, TLS provider를 사용해 EKS 인프라와 클러스터 내부 선행 리소스를 같은 루트 모듈에서 관리한다.
terraform {
  required_version = ">= 1.6.0"

  backend "s3" {}

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = ">= 5.50, < 7.0"
    }

    helm = {
      source  = "hashicorp/helm"
      version = ">= 2.13, < 3.0"
    }

    kubernetes = {
      source  = "hashicorp/kubernetes"
      version = ">= 2.30, < 3.0"
    }

    tls = {
      source  = "hashicorp/tls"
      version = ">= 4.0, < 5.0"
    }
  }
}
