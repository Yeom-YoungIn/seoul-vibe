#!/usr/bin/env bash
# 목적 - 중지해 둔 GCP dev 실행 리소스를 다시 켜기 위해 추가됨
# 설명 - Cloud SQL과 GKE 노드를 시작한 뒤 GCP dev Kubernetes overlay를 재적용한다.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"
source "${SCRIPT_DIR}/lib/gcp-dev-guard.sh"

PROJECT_ID="${PROJECT_ID:-seoul-vibe}"
REGION="${REGION:-asia-northeast3}"
NAMESPACE="${NAMESPACE:-seoul-vibe}"
CLUSTER_NAME="${CLUSTER_NAME:-seoul-vibe-dev-gke}"
NODE_POOL="${NODE_POOL:-seoul-vibe-dev-primary}"
SQL_INSTANCE="${SQL_INSTANCE:-seoul-vibe-dev-postgres}"
OVERLAY_PATH="${OVERLAY_PATH:-${REPO_ROOT}/k8s/overlays/gcp/dev}"
DEV_HOST="${DEV_HOST:-dev.seoul-vibe.example.com}"
UPDATE_HOSTS="${UPDATE_HOSTS:-true}"

print_usage() {
  cat <<'USAGE'
Usage: scripts/gcp-dev-up.sh [--dry-run] [--allow-context-mismatch] [--allow-non-dev-target]

Starts only the configured GCP dev runtime target. Before kubectl applies the
overlay, the script refreshes kubeconfig and verifies the current context points
at the target GKE API server.
USAGE
}

parse_common_flags "$@"

echo "Starting GCP dev runtime resources in project ${PROJECT_ID}..."
load_gcp_target

if [[ "${DRY_RUN}" == "true" ]]; then
  echo "Dry-run plan:"
  echo "  gcloud sql instances patch ${SQL_INSTANCE} --activation-policy=ALWAYS"
  echo "  gcloud container clusters resize ${CLUSTER_NAME} --node-pool ${NODE_POOL} --num-nodes 1"
  echo "  gcloud container clusters get-credentials ${CLUSTER_NAME}"
  echo "  kubectl wait --for=condition=Ready node --all --timeout=300s"
  echo "  kubectl apply -k ${OVERLAY_PATH}"
  echo "  kubectl -n ${NAMESPACE} rollout status deploy/seoul-vibe-server --timeout=300s"
  echo "  kubectl -n ${NAMESPACE} rollout status deploy/seoul-vibe-client --timeout=300s"
  echo "  update /etc/hosts for ${DEV_HOST} if UPDATE_HOSTS=true and Ingress IP is ready"
  exit 0
fi

echo "Starting Cloud SQL instance ${SQL_INSTANCE}..."
gcloud sql instances patch "${SQL_INSTANCE}" \
  --activation-policy=ALWAYS \
  --project "${PROJECT_ID}" \
  --quiet

echo "Scaling GKE node pool ${NODE_POOL} to one node..."
gcloud container clusters resize "${CLUSTER_NAME}" \
  --node-pool "${NODE_POOL}" \
  --num-nodes 1 \
  --region "${REGION}" \
  --project "${PROJECT_ID}" \
  --quiet

echo "Refreshing kubeconfig..."
gcloud container clusters get-credentials "${CLUSTER_NAME}" \
  --region "${REGION}" \
  --project "${PROJECT_ID}"

verify_kube_context_for_target

echo "Waiting for a Ready node..."
kubectl wait --for=condition=Ready node --all --timeout=300s

echo "Applying GCP dev Kubernetes overlay..."
kubectl apply -k "${OVERLAY_PATH}"

echo "Waiting for deployments to roll out..."
kubectl -n "${NAMESPACE}" rollout status deploy/seoul-vibe-server --timeout=300s
kubectl -n "${NAMESPACE}" rollout status deploy/seoul-vibe-client --timeout=300s

echo "Waiting for Ingress external IP..."
INGRESS_IP=""
for _ in {1..60}; do
  INGRESS_IP="$(kubectl -n "${NAMESPACE}" get ingress seoul-vibe -o jsonpath='{.status.loadBalancer.ingress[0].ip}' 2>/dev/null || true)"
  if [[ -n "${INGRESS_IP}" ]]; then
    break
  fi
  sleep 5
done

if [[ -z "${INGRESS_IP}" ]]; then
  echo "Ingress external IP is not ready yet. Check it later with:"
  echo "kubectl -n ${NAMESPACE} get ingress seoul-vibe"
elif [[ "${UPDATE_HOSTS}" == "true" ]]; then
  echo "Updating /etc/hosts: ${INGRESS_IP} ${DEV_HOST}"
  HOSTS_TMP="$(mktemp)"
  awk -v host="${DEV_HOST}" '
    {
      keep = 1
      for (i = 1; i <= NF; i++) {
        if ($i == host) {
          keep = 0
        }
      }
      if (keep) {
        print
      }
    }
  ' /etc/hosts > "${HOSTS_TMP}"
  printf "%s %s\n" "${INGRESS_IP}" "${DEV_HOST}" >> "${HOSTS_TMP}"
  sudo cp "${HOSTS_TMP}" /etc/hosts
  rm -f "${HOSTS_TMP}"
else
  echo "Skipping /etc/hosts update. Add this manually if needed:"
  echo "${INGRESS_IP} ${DEV_HOST}"
fi

echo "GCP dev runtime is up."
kubectl -n "${NAMESPACE}" get pods,pvc,svc,ingress -o wide
