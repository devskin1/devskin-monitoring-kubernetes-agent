"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.HPACollector = void 0;
const client_node_1 = require("@kubernetes/client-node");
class HPACollector {
    constructor(kubeConfig, clusterName) {
        this.k8sApi = kubeConfig.makeApiClient(client_node_1.AutoscalingV2Api);
        this.clusterName = clusterName;
    }
    async collect() {
        try {
            const hpasResponse = await this.k8sApi.listHorizontalPodAutoscalerForAllNamespaces();
            const hpas = hpasResponse.body.items;
            const result = [];
            for (const hpa of hpas) {
                const name = hpa.metadata?.name || 'unknown';
                const namespace = hpa.metadata?.namespace || 'default';
                const minReplicas = hpa.spec?.minReplicas || 1;
                const maxReplicas = hpa.spec?.maxReplicas || 10;
                const currentReplicas = hpa.status?.currentReplicas || 0;
                const desiredReplicas = hpa.status?.desiredReplicas || 0;
                // Get target resource
                const targetKind = hpa.spec?.scaleTargetRef?.kind || 'Unknown';
                const targetName = hpa.spec?.scaleTargetRef?.name || 'unknown';
                // Get metrics
                const metrics = hpa.spec?.metrics || [];
                const currentMetrics = hpa.status?.currentMetrics || [];
                // Parse metric targets and current values
                const metricDetails = [];
                for (let i = 0; i < metrics.length; i++) {
                    const metric = metrics[i];
                    const current = currentMetrics[i];
                    if (metric.type === 'Resource') {
                        const resourceName = metric.resource?.name || 'unknown';
                        const targetValue = metric.resource?.target?.averageUtilization;
                        const currentValue = current?.resource?.current?.averageUtilization;
                        metricDetails.push({
                            type: 'Resource',
                            resource_name: resourceName,
                            target_value: targetValue,
                            current_value: currentValue,
                        });
                    }
                    else if (metric.type === 'Pods') {
                        metricDetails.push({
                            type: 'Pods',
                            target_value: parseFloat(metric.pods?.target?.averageValue || '0'),
                            current_value: parseFloat(current?.pods?.current?.averageValue || '0'),
                        });
                    }
                    else if (metric.type === 'External') {
                        metricDetails.push({
                            type: 'External',
                            target_value: parseFloat(metric.external?.target?.averageValue || '0'),
                            current_value: parseFloat(current?.external?.current?.averageValue || '0'),
                        });
                    }
                }
                // Determine health status
                let health = 'healthy';
                const issues = [];
                // Check if at max replicas
                if (currentReplicas >= maxReplicas) {
                    health = 'warning';
                    issues.push(`HPA at maximum replicas (${maxReplicas}). Consider increasing maxReplicas.`);
                }
                // Check if scaling is needed but not happening
                if (desiredReplicas !== currentReplicas) {
                    if (desiredReplicas > currentReplicas) {
                        health = 'warning';
                        issues.push(`Scaling up: ${currentReplicas} -> ${desiredReplicas} replicas`);
                    }
                }
                // Check if metrics are significantly above target
                for (const metric of metricDetails) {
                    if (metric.current_value &&
                        metric.target_value &&
                        metric.current_value > metric.target_value * 1.5) {
                        health = 'warning';
                        issues.push(`${metric.resource_name || metric.type} at ${metric.current_value}% (target: ${metric.target_value}%)`);
                    }
                }
                // Check conditions
                const conditions = hpa.status?.conditions || [];
                const scalingActiveCondition = conditions.find(c => c.type === 'ScalingActive');
                const ableToScaleCondition = conditions.find(c => c.type === 'AbleToScale');
                const scalingLimitedCondition = conditions.find(c => c.type === 'ScalingLimited');
                if (scalingActiveCondition?.status === 'False') {
                    health = 'critical';
                    issues.push(`Scaling not active: ${scalingActiveCondition.reason}`);
                }
                if (ableToScaleCondition?.status === 'False') {
                    health = 'critical';
                    issues.push(`Unable to scale: ${ableToScaleCondition.reason}`);
                }
                if (scalingLimitedCondition?.status === 'True') {
                    if (health === 'healthy')
                        health = 'warning';
                    issues.push(`Scaling limited: ${scalingLimitedCondition.reason}`);
                }
                result.push({
                    hpa_name: name,
                    namespace,
                    cluster_name: this.clusterName,
                    target_kind: targetKind,
                    target_name: targetName,
                    min_replicas: minReplicas,
                    max_replicas: maxReplicas,
                    current_replicas: currentReplicas,
                    desired_replicas: desiredReplicas,
                    metrics: metricDetails.length > 0 ? metricDetails : undefined,
                    health,
                    issues: issues.length > 0 ? issues : undefined,
                    labels: hpa.metadata?.labels || {},
                    last_scale_time: hpa.status?.lastScaleTime
                        ? new Date(hpa.status.lastScaleTime)
                        : undefined,
                    created_at: new Date(hpa.metadata?.creationTimestamp || Date.now()),
                });
            }
            return result;
        }
        catch (error) {
            console.error('[HPACollector] Failed to collect HPA metrics:', error.message);
            return [];
        }
    }
}
exports.HPACollector = HPACollector;
//# sourceMappingURL=hpa.collector.js.map