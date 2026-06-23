# 목적 - GCP dev 운영 스크립트가 잘못된 GKE/Kubernetes 대상에서 실행되지 않도록 공통 가드를 제공한다.
# 설명 - 대상 GCP 리소스와 현재 kube context를 검증하고 dry-run/override 플래그를 공통 처리한다.

DRY_RUN="${DRY_RUN:-false}"
ALLOW_CONTEXT_MISMATCH="${ALLOW_CONTEXT_MISMATCH:-false}"
ALLOW_NON_DEV_TARGET="${ALLOW_NON_DEV_TARGET:-false}"

die() {
  echo "ERROR: $*" >&2
  exit 1
}

require_command() {
  command -v "$1" >/dev/null 2>&1 || die "$1 command is required."
}

parse_common_flags() {
  while [[ $# -gt 0 ]]; do
    case "$1" in
      --dry-run)
        DRY_RUN="true"
        ;;
      --allow-context-mismatch)
        ALLOW_CONTEXT_MISMATCH="true"
        ;;
      --allow-non-dev-target)
        ALLOW_NON_DEV_TARGET="true"
        ;;
      -h|--help)
        print_usage
        exit 0
        ;;
      *)
        die "Unknown argument: $1"
        ;;
    esac
    shift
  done
}

expected_gke_context() {
  printf "gke_%s_%s_%s" "${PROJECT_ID}" "${REGION}" "${CLUSTER_NAME}"
}

print_target_summary() {
  echo "Target summary:"
  echo "  project:      ${PROJECT_ID}"
  echo "  region:       ${REGION}"
  echo "  cluster:      ${CLUSTER_NAME}"
  echo "  node pool:    ${NODE_POOL}"
  echo "  namespace:    ${NAMESPACE}"
  echo "  Cloud SQL:    ${SQL_INSTANCE}"
  echo "  kube context: $(expected_gke_context)"
}

verify_dev_target() {
  if [[ "${ALLOW_NON_DEV_TARGET}" == "true" ]]; then
    echo "Non-dev target override enabled. Continuing with the target above."
    return
  fi

  local non_dev=()
  [[ "${CLUSTER_NAME}" == *dev* ]] || non_dev+=("CLUSTER_NAME=${CLUSTER_NAME}")
  [[ "${NODE_POOL}" == *dev* ]] || non_dev+=("NODE_POOL=${NODE_POOL}")
  [[ "${SQL_INSTANCE}" == *dev* ]] || non_dev+=("SQL_INSTANCE=${SQL_INSTANCE}")

  if [[ ${#non_dev[@]} -gt 0 ]]; then
    printf "Refusing to run a dev runtime script against non-dev-looking target values:\n" >&2
    printf "  %s\n" "${non_dev[@]}" >&2
    die "Pass --allow-non-dev-target only after manually verifying this is intentional."
  fi
}

load_gcp_target() {
  require_command gcloud
  print_target_summary
  verify_dev_target

  GCLOUD_ACTIVE_PROJECT="$(gcloud config get-value project 2>/dev/null || true)"
  GCLOUD_ACTIVE_ACCOUNT="$(gcloud config get-value account 2>/dev/null || true)"
  echo "gcloud active account: ${GCLOUD_ACTIVE_ACCOUNT:-unset}"
  echo "gcloud active project: ${GCLOUD_ACTIVE_PROJECT:-unset} (commands use --project ${PROJECT_ID})"

  TARGET_CLUSTER_ENDPOINT="$(gcloud container clusters describe "${CLUSTER_NAME}" \
    --region "${REGION}" \
    --project "${PROJECT_ID}" \
    --format="value(endpoint)" 2>/dev/null)" || die "GKE cluster not found for project/region/name."

  [[ -n "${TARGET_CLUSTER_ENDPOINT}" ]] || die "GKE cluster endpoint is empty."

  gcloud container node-pools describe "${NODE_POOL}" \
    --cluster "${CLUSTER_NAME}" \
    --region "${REGION}" \
    --project "${PROJECT_ID}" \
    --format="value(name)" >/dev/null 2>&1 || die "GKE node pool not found for target cluster."

  gcloud sql instances describe "${SQL_INSTANCE}" \
    --project "${PROJECT_ID}" \
    --format="value(name)" >/dev/null 2>&1 || die "Cloud SQL instance not found for target project."

  echo "Verified GCP target: ${PROJECT_ID}/${REGION}/${CLUSTER_NAME}"
}

verify_kube_context_for_target() {
  require_command kubectl

  local current_context current_cluster current_server target_server expected_context
  expected_context="$(expected_gke_context)"
  target_server="https://${TARGET_CLUSTER_ENDPOINT}"
  current_context="$(kubectl config current-context 2>/dev/null || true)"
  [[ -n "${current_context}" ]] || die "No current kubectl context is configured."

  current_cluster="$(kubectl config view --minify -o jsonpath='{.contexts[0].context.cluster}' 2>/dev/null || true)"
  current_server="$(kubectl config view --minify -o jsonpath='{.clusters[0].cluster.server}' 2>/dev/null || true)"

  echo "Current kube context: ${current_context}"
  echo "Current kube cluster: ${current_cluster:-unknown}"
  echo "Current API server:   ${current_server:-unknown}"
  echo "Target API server:    ${target_server}"

  if [[ "${current_server}" == "${target_server}" ]]; then
    if [[ "${current_context}" != "${expected_context}" ]]; then
      echo "Context name differs from ${expected_context}, but API server matches the target GKE cluster."
    fi
    return
  fi

  if [[ "${ALLOW_CONTEXT_MISMATCH}" == "true" ]]; then
    echo "Kube context mismatch override enabled. Continuing after explicit override."
    return
  fi

  die "Refusing kubectl action because current context does not match the target GKE cluster. Run gcloud get-credentials for the target or pass --allow-context-mismatch after manual verification."
}
