# DevSkin Kubernetes Agent Helm Repository

## Usage

```bash
# Add Helm repository
helm repo add devskin https://devskin1.github.io/devskin-monitoring-kubernetes-agent
helm repo update

# Install the chart
helm install devskin-k8s-agent devskin/devskin-kubernetes-agent \
  --namespace devskin-monitoring \
  --create-namespace \
  --set apiKey="your-api-key" \
  --set clusterName="my-cluster"

# Search available charts
helm search repo devskin
```

## Available Charts

- **devskin-kubernetes-agent** - Kubernetes cluster monitoring agent
