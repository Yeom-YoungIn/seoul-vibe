#!/usr/bin/env bash
# 목적 - GCP dev 실행 리소스의 on/off 상태를 빠르게 확인하기 위해 추가됨
# 설명 - Cloud SQL activation policy, GKE node pool 크기, Kubernetes 리소스 상태를 조회한다.
set -euo pipefail

PROJECT_ID="${PROJECT_ID:-seoul-vibe}"
REGION="${REGION:-asia-northeast3}"
NAMESPACE="${NAMESPACE:-seoul-vibe}"
CLUSTER_NAME="${CLUSTER_NAME:-seoul-vibe-dev-gke}"
NODE_POOL="${NODE_POOL:-seoul-vibe-dev-primary}"
SQL_INSTANCE="${SQL_INSTANCE:-seoul-vibe-dev-postgres}"

echo "Cloud SQL:"
gcloud sql instances describe "${SQL_INSTANCE}" \
  --project "${PROJECT_ID}" \
  --format="table(name,state,settings.activationPolicy,ipAddresses.ipAddress)"

echo
echo "GKE node pool:"
gcloud container node-pools describe "${NODE_POOL}" \
  --cluster "${CLUSTER_NAME}" \
  --region "${REGION}" \
  --project "${PROJECT_ID}" \
  --format="table(name,status,initialNodeCount,config.machineType,config.diskType,config.diskSizeGb)"

echo
echo "Kubernetes resources:"
if kubectl get namespace "${NAMESPACE}" >/dev/null 2>&1; then
  kubectl -n "${NAMESPACE}" get pods,pvc,svc,ingress -o wide
else
  echo "Namespace ${NAMESPACE} does not exist in the current kubeconfig context."
fi
