# Publicar Helm Chart

## Opção 1: Publicar no GitHub Pages (Recomendado)

### 1. Empacotar o chart

```bash
cd /var/www/html/devskin-monitoramento-agents/kubernetes-agent/helm
helm package devskin-kubernetes-agent
# Gera: devskin-kubernetes-agent-1.0.0.tgz
```

### 2. Criar repositório Helm no GitHub

```bash
# Criar repo helm-charts no GitHub
# https://github.com/devskin1/helm-charts

# Clonar o repo
git clone https://github.com/devskin1/helm-charts.git
cd helm-charts

# Copiar o pacote
cp ../devskin-kubernetes-agent-1.0.0.tgz .

# Gerar index
helm repo index . --url https://devskin1.github.io/helm-charts

# Commit e push
git add .
git commit -m "Add devskin-kubernetes-agent v1.0.0"
git push origin main

# Habilitar GitHub Pages em Settings > Pages > Source: main branch
```

### 3. Uso

```bash
helm repo add devskin https://devskin1.github.io/helm-charts
helm repo update
helm install devskin-k8s-agent devskin/devskin-kubernetes-agent \
  --namespace devskin-monitoring \
  --create-namespace \
  --set apiKey="your-key"
```

## Opção 2: Uso Local (sem publicação)

```bash
# Instalar direto do diretório
cd /var/www/html/devskin-monitoramento-agents/kubernetes-agent
helm install devskin-k8s-agent ./helm/devskin-kubernetes-agent \
  --namespace devskin-monitoring \
  --create-namespace \
  --set apiKey="your-key" \
  --set clusterName="my-cluster"
```

## Opção 3: OCI Registry (Docker Hub)

```bash
# Package
cd /var/www/html/devskin-monitoramento-agents/kubernetes-agent/helm
helm package devskin-kubernetes-agent

# Login
helm registry login registry-1.docker.io -u devskin

# Push
helm push devskin-kubernetes-agent-1.0.0.tgz oci://registry-1.docker.io/devskin

# Uso
helm install devskin-k8s-agent oci://registry-1.docker.io/devskin/devskin-kubernetes-agent \
  --version 1.0.0 \
  --namespace devskin-monitoring \
  --create-namespace \
  --set apiKey="your-key"
```

## Atualizar Versão

1. Editar `Chart.yaml` e incrementar `version`
2. Empacotar novamente
3. Atualizar index.yaml (opção 1) ou push (opção 3)

## Testar Localmente

```bash
# Validar chart
helm lint ./devskin-kubernetes-agent

# Dry-run
helm install devskin-k8s-agent ./devskin-kubernetes-agent \
  --dry-run --debug \
  --set apiKey="test-key"

# Template
helm template devskin-k8s-agent ./devskin-kubernetes-agent \
  --set apiKey="test-key"
```
