# Kubernetes Overlays

## Dev

Dev overlays are split by cloud provider so AWS and GCP deployment values do not overwrite each other.

- Main dev path for GCP/GKE: `k8s/overlays/gcp/dev`
- Secondary dev path for AWS/EKS: `k8s/overlays/aws/dev`

Render before applying:

```bash
kubectl kustomize k8s/overlays/gcp/dev
kubectl kustomize k8s/overlays/aws/dev
```

`k8s/base` still contains the shared application manifests. Provider-specific image repositories, host values, and CORS origin values belong in the cloud-specific overlays.

