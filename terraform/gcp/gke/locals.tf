# 목적 - GCP 리소스 이름 접두사를 한곳에서 계산하기 위해 추가됨
# 설명 - 환경별 이름 충돌을 피하고 실제 리소스 추가 시 공통 이름 규칙을 재사용할 수 있게 한다.
locals {
  name_prefix = "${var.project_name}-${var.environment}"
}
