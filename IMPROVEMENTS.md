# Melhorias do Agente Kubernetes

## 📊 Novos Collectors Adicionados

### 1. **Deployment Collector** (`deployment.collector.ts`)
Coleta informações detalhadas sobre Deployments:
- ✅ Réplicas (desired, ready, available, up-to-date, unavailable)
- ✅ Status de saúde (healthy/degraded/critical)
- ✅ Estratégia de deployment (RollingUpdate, Recreate)
- ✅ Detecção automática de problemas (replicas not ready, not up-to-date, etc.)
- ✅ Condições do deployment (Progressing, Available)
- ✅ Labels e selectors
- ✅ Generation tracking

**Insights Gerados**:
- Alerta quando nenhuma réplica está pronta
- Aviso quando réplicas estão unavailable
- Detecção de deployments travados (not progressing)

### 2. **Service Collector** (`service.collector.ts`)
Coleta informações sobre Services:
- ✅ Tipo de service (ClusterIP, NodePort, LoadBalancer, ExternalName)
- ✅ Cluster IP e External IPs
- ✅ LoadBalancer status (IP e hostname)
- ✅ Portas expostas (com nodePort se aplicável)
- ✅ Contagem de endpoints (pods backing the service)
- ✅ Status de saúde baseado em endpoints
- ✅ Detecção de services sem pods

**Insights Gerados**:
- Alerta quando service não tem endpoints (sem pods)
- Aviso quando LoadBalancer não tem IP atribuído
- Tracking de session affinity

### 3. **Event Collector** (`event.collector.ts`)
Coleta eventos do cluster K8s:
- ✅ Eventos de Warning e Error
- ✅ Severidade automática (info/warning/error)
- ✅ Detecção de eventos críticos:
  - CrashLoopBackOff
  - ImagePullBackOff
  - OOMKilled
  - Evicted
  - Failed
- ✅ Informações do objeto afetado (kind, name, namespace)
- ✅ Source component e host
- ✅ Contagem de ocorrências
- ✅ Timestamps (first/last occurrence)

**Insights Gerados**:
- Identificação automática de pods com problemas
- Tracking de eventos críticos para alertas
- Método especial `collectCriticalEvents()` para geração de alertas

### 4. **HPA Collector** (`hpa.collector.ts`)
Coleta métricas de Horizontal Pod Autoscalers:
- ✅ Min/Max/Current/Desired replicas
- ✅ Métricas configuradas (CPU, Memory, Custom, External)
- ✅ Valores atuais vs target
- ✅ Status de saúde do HPA
- ✅ Detecção de problemas:
  - HPA no limite máximo (precisa aumentar maxReplicas)
  - Métricas acima do target
  - Scaling não ativo
  - Unable to scale
  - Scaling limited
- ✅ Last scale time
- ✅ Condições do HPA (ScalingActive, AbleToScale, ScalingLimited)

**Insights Gerados**:
- Alerta quando HPA está no máximo (recomenda aumentar limit)
- Aviso quando métricas estão 50% acima do target
- Detecção de HPA que não consegue escalar
- Tracking de scaling events

## 🔄 Melhorias no Agent Principal

### agent.ts
- Inicialização de todos os novos collectors
- Coleta paralela de todas as métricas (nodes, pods, deployments, services, events, HPAs)
- Envio paralelo otimizado para o backend
- Logs detalhados do que foi coletado

### api-client.ts
- Novos endpoints para:
  - `/api/v1/kubernetes/deployments`
  - `/api/v1/kubernetes/services`
  - `/api/v1/kubernetes/events`
  - `/api/v1/kubernetes/hpas`
- Atualização de tipos (K8sEvent, HPAMetrics)

### types.ts
- Tipos completamente atualizados com campos de health e issues
- DeploymentMetrics com health status
- ServiceMetrics com endpoint count e health
- K8sEvent com severity e tracking completo
- HPAMetrics com métricas detalhadas e health

## 📈 Próximos Passos

### Backend (Precisa Implementar)
1. Criar tabelas no banco de dados:
   - `k8s_deployments`
   - `k8s_services`
   - `k8s_events`
   - `k8s_hpas`
2. Criar controllers para receber dados
3. Criar serviços para processar e gerar insights/alertas
4. Popular tabelas de métricas, alerts e insights

### Frontend (Precisa Melhorar)
1. Dashboard com widgets de insights:
   - Deployments com problemas
   - Services sem endpoints
   - Eventos críticos recentes (últimas 24h)
   - HPAs no limite
2. Gráficos de utilização por namespace
3. Timeline de eventos
4. Recomendações automáticas
5. Alertas visuais para problemas detectados

## 🎯 Valor Agregado

Com essas melhorias, o agente agora fornece:

1. **Visibilidade Completa**: Não apenas nodes e pods, mas deployments, services, HPAs e eventos
2. **Detecção Proativa**: Identifica problemas antes que afetem usuários
3. **Insights Automáticos**: Health status calculado automaticamente
4. **Troubleshooting**: Eventos fornecem contexto para problemas
5. **Otimização**: HPAs mostram se recursos estão bem configurados
6. **Alertas Inteligentes**: Dados estruturados permitem criar alertas precisos

## 📝 Notas Técnicas

- Todos os collectors fazem coleta paralela para performance
- Tratamento de erros robusto (ex: metrics-server pode não estar disponível)
- EventCollector usa timestamps para coletar apenas eventos novos
- Health status é calculado no agent (não no backend) para reduzir processamento
- Suporte para API v1 e v2 de eventos (fallback automático)
- Detecção automática de cloud provider (AWS, GCP, Azure)
