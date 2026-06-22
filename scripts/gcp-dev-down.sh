#!/usr/bin/env bash
# 목적 - GCP dev 실행 리소스를 개발하지 않는 동안 중지하기 위해 추가됨
# 설명 - 데이터와 설정은 유지하고 Ingress, 앱 Pod, GKE 노드, Cloud SQL 실행 상태만 내린다.
set -euo pipefail

PROJECT_ID="${PROJECT_ID:-seoul-vibe}"
REGION="${REGION:-asia-northeast3}"
NAMESPACE="${NAMESPACE:-seoul-vibe}"
CLUSTER_NAME="${CLUSTER_NAME:-seoul-vibe-dev-gke}"
NODE_POOL="${NODE_POOL:-seoul-vibe-dev-primary}"
SQL_INSTANCE="${SQL_INSTANCE:-seoul-vibe-dev-postgres}"

echo "Stopping GCP dev runtime resources in project ${PROJECT_ID}..."

echo "Deleting dev Ingress to remove the external load balancer..."
kubectl -n "${NAMESPACE}" delete ingress seoul-vibe --ignore-not-found

echo "Scaling application deployments to zero..."
if kubectl -n "${NAMESPACE}" get deploy/seoul-vibe-client >/dev/null 2>&1; then
  kubectl -n "${NAMESPACE}" scale deploy/seoul-vibe-client --replicas=0
fi
if kubectl -n "${NAMESPACE}" get deploy/seoul-vibe-server >/dev/null 2>&1; then
  kubectl -n "${NAMESPACE}" scale deploy/seoul-vibe-server --replicas=0
fi

echo "Waiting for application Pods to terminate..."
kubectl -n "${NAMESPACE}" wait --for=delete pod \
  -l app.kubernetes.io/part-of=seoul-vibe \
  --timeout=180s || true

echo "Scaling GKE node pool ${NODE_POOL} to zero nodes..."
gcloud container clusters resize "${CLUSTER_NAME}" \
  --node-pool "${NODE_POOL}" \
  --num-nodes 0 \
  --region "${REGION}" \
  --project "${PROJECT_ID}" \
  --quiet

echo "Stopping Cloud SQL instance ${SQL_INSTANCE}..."
gcloud sql instances patch "${SQL_INSTANCE}" \
  --activation-policy=NEVER \
  --project "${PROJECT_ID}" \
  --quiet

echo "GCP dev runtime is down. Persistent data, Terraform state, images, secrets, and PVC definitions are kept."
