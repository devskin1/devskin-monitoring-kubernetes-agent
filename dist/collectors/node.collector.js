"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NodeCollector = void 0;
const client_node_1 = require("@kubernetes/client-node");
class NodeCollector {
    constructor(kubeConfig, clusterName) {
        this.k8sApi = kubeConfig.makeApiClient(client_node_1.CoreV1Api);
        this.metricsClient = new client_node_1.Metrics(kubeConfig);
        this.clusterName = clusterName;
    }
    async collect() {
        try {
            const nodesResponse = await this.k8sApi.listNode();
            const nodes = nodesResponse.body.items;
            // Try to get metrics (requires metrics-server)
            let nodeMetrics = [];
            try {
                const metricsResponse = await this.metricsClient.getNodeMetrics();
                nodeMetrics = metricsResponse.items || [];
            }
            catch (error) {
                console.warn('[NodeCollector] Metrics-server not available, skipping CPU/memory usage');
            }
            const result = [];
            for (const node of nodes) {
                const nodeName = node.metadata?.name || 'unknown';
                const status = node.status?.conditions?.find((c) => c.type === 'Ready')?.status || 'Unknown';
                // Find metrics for this node
                const metrics = nodeMetrics.find((m) => m.metadata?.name === nodeName);
                // Get pod count for this node
                const podsResponse = await this.k8sApi.listPodForAllNamespaces(undefined, undefined, `spec.nodeName=${nodeName}`);
                const podCount = podsResponse.body.items.length;
                // Parse conditions
                const conditions = (node.status?.conditions || []).map((c) => ({
                    type: c.type || '',
                    status: c.status || '',
                    reason: c.reason,
                    message: c.message,
                }));
                // Parse taints
                const taints = node.spec?.taints?.map((t) => ({
                    key: t.key || '',
                    value: t.value,
                    effect: t.effect || '',
                }));
                result.push({
                    node_name: nodeName,
                    cluster_name: this.clusterName,
                    status: status === 'True' ? 'Ready' : 'NotReady',
                    cpu_capacity: node.status?.capacity?.cpu || '0',
                    cpu_allocatable: node.status?.allocatable?.cpu || '0',
                    cpu_usage_cores: metrics ? this.parseCpuUsage(metrics.usage?.cpu) : undefined,
                    memory_capacity: node.status?.capacity?.memory || '0',
                    memory_allocatable: node.status?.allocatable?.memory || '0',
                    memory_usage_bytes: metrics ? this.parseMemoryUsage(metrics.usage?.memory) : undefined,
                    pod_capacity: node.status?.capacity?.pods || '0',
                    pod_count: podCount,
                    conditions,
                    labels: node.metadata?.labels || {},
                    taints,
                    created_at: new Date(node.metadata?.creationTimestamp || Date.now()),
                });
            }
            return result;
        }
        catch (error) {
            console.error('[NodeCollector] Failed to collect node metrics:', error.message);
            return [];
        }
    }
    parseCpuUsage(cpu) {
        if (!cpu)
            return undefined;
        // CPU can be in formats like "250m" (millicores) or "1" (cores)
        if (cpu.endsWith('m')) {
            return parseFloat(cpu.slice(0, -1)) / 1000; // Convert millicores to cores
        }
        if (cpu.endsWith('n')) {
            return parseFloat(cpu.slice(0, -1)) / 1000000000; // Convert nanocores to cores
        }
        return parseFloat(cpu);
    }
    parseMemoryUsage(memory) {
        if (!memory)
            return undefined;
        // Memory can be in formats like "1024Ki", "1Mi", "1Gi"
        const units = {
            Ki: 1024,
            Mi: 1024 * 1024,
            Gi: 1024 * 1024 * 1024,
            Ti: 1024 * 1024 * 1024 * 1024,
            K: 1000,
            M: 1000 * 1000,
            G: 1000 * 1000 * 1000,
            T: 1000 * 1000 * 1000 * 1000,
        };
        for (const [unit, multiplier] of Object.entries(units)) {
            if (memory.endsWith(unit)) {
                return parseFloat(memory.slice(0, -unit.length)) * multiplier;
            }
        }
        return parseFloat(memory);
    }
}
exports.NodeCollector = NodeCollector;
//# sourceMappingURL=node.collector.js.map