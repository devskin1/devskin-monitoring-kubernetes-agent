# DevSkin Kubernetes Agent Helm Chart

Official Helm chart for deploying the DevSkin Kubernetes monitoring agent.

## Installation

### Add Helm Repository (if published)

```bash
helm repo add devskin https://charts.devskin.com
helm repo update
```

### Install from Repository

```bash
helm install devskin-k8s-agent devskin/devskin-kubernetes-agent \
  --namespace devskin-monitoring \
  --create-namespace \
  --set apiKey="your-api-key" \
  --set clusterName="my-cluster"
```

### Install from Local Chart

```bash
helm install devskin-k8s-agent ./helm/devskin-kubernetes-agent \
  --namespace devskin-monitoring \
  --create-namespace \
  --set apiKey="your-api-key" \
  --set clusterName="my-cluster"
```

### Install with Values File

Create a `values.yaml`:

```yaml
apiKey: "your-api-key"
serverUrl: "https://api-monitoring.devskin.com"
clusterName: "production-eks"
environment: "production"

collectionInterval: 60000
debug: false

resources:
  requests:
    memory: "256Mi"
    cpu: "200m"
  limits:
    memory: "512Mi"
    cpu: "400m"
```

Install:

```bash
helm install devskin-k8s-agent ./helm/devskin-kubernetes-agent \
  --namespace devskin-monitoring \
  --create-namespace \
  -f values.yaml
```

## Configuration

| Parameter | Description | Default |
|-----------|-------------|---------|
| `apiKey` | **Required** - DevSkin API key | `""` |
| `serverUrl` | DevSkin server URL | `https://api-monitoring.devskin.com` |
| `clusterName` | Name to identify this cluster | `my-cluster` |
| `environment` | Environment name | `production` |
| `collectionInterval` | Collection interval in ms | `60000` |
| `batchSize` | Batch size for sending data | `100` |
| `flushInterval` | Flush interval in ms | `10000` |
| `debug` | Enable debug logging | `false` |
| `image.repository` | Docker image repository | `devskin/kubernetes-agent` |
| `image.tag` | Docker image tag | `latest` |
| `image.pullPolicy` | Image pull policy | `IfNotPresent` |
| `replicaCount` | Number of replicas | `1` |
| `resources.requests.memory` | Memory request | `128Mi` |
| `resources.requests.cpu` | CPU request | `100m` |
| `resources.limits.memory` | Memory limit | `256Mi` |
| `resources.limits.cpu` | CPU limit | `200m` |

## Uninstall

```bash
helm uninstall devskin-k8s-agent -n devskin-monitoring
```

## Upgrade

```bash
helm upgrade devskin-k8s-agent devskin/devskin-kubernetes-agent \
  --namespace devskin-monitoring \
  --set apiKey="your-api-key" \
  --set clusterName="my-cluster"
```

## Requirements

- Kubernetes 1.20+
- Helm 3.0+
- (Optional) metrics-server for CPU/memory metrics

## License

MIT
