# 목적 - AWS와 EKS 클러스터 접속용 provider 설정을 한곳에 정의하기 위해 추가됨
# 설명 - AWS 리전/태그를 공통 적용하고, 생성된 EKS 클러스터 인증 정보를 Kubernetes와 Helm provider에 연결한다.
provider "aws" {
  region = var.aws_region

  default_tags {
    tags = local.common_tags
  }
}

provider "kubernetes" {
  host                   = aws_eks_cluster.this.endpoint
  cluster_ca_certificate = base64decode(aws_eks_cluster.this.certificate_authority[0].data)
  token                  = data.aws_eks_cluster_auth.this.token
}

provider "helm" {
  kubernetes {
    host                   = aws_eks_cluster.this.endpoint
    cluster_ca_certificate = base64decode(aws_eks_cluster.this.certificate_authority[0].data)
    token                  = data.aws_eks_cluster_auth.this.token
  }
}
