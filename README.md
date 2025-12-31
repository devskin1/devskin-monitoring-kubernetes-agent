# DevSkin Kubernetes Agent

Monitor your Kubernetes clusters with DevSkin - automatic discovery and metrics collection for nodes, pods, deployments, services, and more.

## Features

- ✅ Automatic cluster discovery
- ✅ Real-time node metrics (CPU, memory, status)
- ✅ Pod metrics and status tracking
- ✅ Deployment monitoring
- ✅ Service discovery
- ✅ Namespace tracking
- ✅ Event monitoring
- ✅ Multi-cluster support
- ✅ Cloud provider detection (AWS EKS, GCP GKE, Azure AKS)
- ✅ Metrics-server integration (optional)

## Installation

### 1. Build the Agent

```bash
npm install
npm run build
```

### 2. Configure

Create a `config.json` file:

```json
{
  "serverUrl": "https://api-monitoring.devskin.com",
  "apiKey": "your-api-key",
  "tenantId": "your-tenant-id",
  "clusterName": "production-cluster",
  "collectionInterval": 60000,
  "debug": false
}
```

Or use environment variables:

```bash
export DEVSKIN_SERVER_URL=https://api-monitoring.devskin.com
export DEVSKIN_API_KEY=your-api-key
export DEVSKIN_TENANT_ID=your-tenant-id
export CLUSTER_NAME=production-cluster
export COLLECTION_INTERVAL=60000
export DEBUG=false
```

### 3. Run the Agent

**Locally (with kubeconfig):**

```bash
node dist/index.js --config config.json
```

**In-Cluster (Kubernetes Deployment):**

```yaml
apiVersion: v1
kind: ServiceAccount
metadata:
  name: devskin-agent
  namespace: monitoring
---
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRole
metadata:
  name: devskin-agent
rules:
  - apiGroups: [""]
    resources: ["nodes", "pods", "services", "namespaces", "events"]
    verbs: ["get", "list", "watch"]
  - apiGroups: ["apps"]
    resources: ["deployments", "replicasets", "statefulsets", "daemonsets"]
    verbs: ["get", "list", "watch"]
  - apiGroups: ["metrics.k8s.io"]
    resources: ["nodes", "pods"]
    verbs: ["get", "list"]
---
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRoleBinding
metadata:
  name: devskin-agent
roleRef:
  apiGroup: rbac.authorization.k8s.io
  kind: ClusterRole
  name: devskin-agent
subjects:
  - kind: ServiceAccount
    name: devskin-agent
    namespace: monitoring
---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: devskin-k8s-agent
  namespace: monitoring
spec:
  replicas: 1
  selector:
    matchLabels:
      app: devskin-k8s-agent
  template:
    metadata:
      labels:
        app: devskin-k8s-agent
    spec:
      serviceAccountName: devskin-agent
      containers:
        - name: agent
          image: your-registry/devskin-k8s-agent:latest
          env:
            - name: DEVSKIN_SERVER_URL
              value: "https://api-monitoring.devskin.com"
            - name: DEVSKIN_API_KEY
              valueFrom:
                secretKeyRef:
                  name: devskin-credentials
                  key: api-key
            - name: DEVSKIN_TENANT_ID
              valueFrom:
                secretKeyRef:
                  name: devskin-credentials
                  key: tenant-id
            - name: CLUSTER_NAME
              value: "production-cluster"
            - name: COLLECTION_INTERVAL
              value: "60000"
          resources:
            requests:
              memory: "128Mi"
              cpu: "100m"
            limits:
              memory: "256Mi"
              cpu: "200m"
---
apiVersion: v1
kind: Secret
metadata:
  name: devskin-credentials
  namespace: monitoring
type: Opaque
stringData:
  api-key: "your-api-key-here"
  tenant-id: "your-tenant-id-here"
```

Apply with:

```bash
kubectl apply -f k8s-deployment.yaml
```

## Configuration Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `serverUrl` | string | *required* | DevSkin backend URL |
| `apiKey` | string | *required* | API key for authentication |
| `tenantId` | string | *required* | Your tenant ID |
| `clusterName` | string | *required* | Name to identify this cluster |
| `collectionInterval` | number | 60000 | Collection interval in ms |
| `batchSize` | number | 100 | Batch size for sending data |
| `flushInterval` | number | 10000 | Flush interval in ms |
| `debug` | boolean | false | Enable debug logging |
| `kubeconfigPath` | string | undefined | Path to kubeconfig (optional) |

## Metrics Collected

### Cluster
- Kubernetes version
- Cloud provider (AWS/GCP/Azure)
- Region
- Node count
- Pod count
- Namespace count

### Nodes
- Status (Ready/NotReady)
- CPU capacity & usage
- Memory capacity & usage
- Pod capacity & count
- Conditions
- Labels & taints

### Pods
- Status & phase
- CPU/memory requests & limits
- CPU/memory usage (requires metrics-server)
- Container count
- Restart count
- Owner references
- Labels

### Deployments
- Replica status
- Rollout strategy
- Labels

### Services
- Type (ClusterIP, NodePort, LoadBalancer)
- Ports
- Selectors

### Namespaces
- Status
- Resource counts
- Labels

## Requirements

- Node.js 18+
- Kubernetes 1.20+
- (Optional) Metrics-server for CPU/memory usage data

## Troubleshooting

### Agent can't connect to Kubernetes API

```bash
# Check kubeconfig
kubectl cluster-info

# Verify service account permissions (in-cluster)
kubectl auth can-i list pods --as=system:serviceaccount:monitoring:devskin-agent
```

### No CPU/memory metrics

Install metrics-server:

```bash
kubectl apply -f https://github.com/kubernetes-sigs/metrics-server/releases/latest/download/components.yaml
```

### Permission denied errors

Ensure the ClusterRole has all necessary permissions:

```bash
kubectl get clusterrole devskin-agent -o yaml
```

## License

MIT
