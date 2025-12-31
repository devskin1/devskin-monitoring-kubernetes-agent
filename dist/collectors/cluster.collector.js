"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ClusterCollector = void 0;
const client_node_1 = require("@kubernetes/client-node");
class ClusterCollector {
    constructor(kubeConfig, clusterName) {
        this.k8sApi = kubeConfig.makeApiClient(client_node_1.CoreV1Api);
        this.clusterName = clusterName;
    }
    async collect() {
        try {
            // Get cluster version
            const versionInfo = await this.k8sApi.getAPIResources();
            // Get nodes
            const nodesResponse = await this.k8sApi.listNode();
            const nodeCount = nodesResponse.body.items.length;
            // Get pods across all namespaces
            const podsResponse = await this.k8sApi.listPodForAllNamespaces();
            const podCount = podsResponse.body.items.length;
            // Get namespaces
            const namespacesResponse = await this.k8sApi.listNamespace();
            const namespaceCount = namespacesResponse.body.items.length;
            // Try to detect cloud provider from node labels
            let provider;
            let region;
            if (nodesResponse.body.items.length > 0) {
                const firstNode = nodesResponse.body.items[0];
                const labels = firstNode.metadata?.labels || {};
                // AWS EKS
                if (labels['eks.amazonaws.com/nodegroup']) {
                    provider = 'aws';
                    region = labels['topology.kubernetes.io/region'];
                }
                // GKE
                else if (labels['cloud.google.com/gke-nodepool']) {
                    provider = 'gcp';
                    region = labels['topology.kubernetes.io/zone'];
                }
                // AKS
                else if (labels['kubernetes.azure.com/cluster']) {
                    provider = 'azure';
                    region = labels['topology.kubernetes.io/region'];
                }
            }
            return {
                cluster_id: this.generateClusterId(),
                cluster_name: this.clusterName,
                version: versionInfo.body.groupVersion || 'unknown',
                provider,
                region,
                node_count: nodeCount,
                pod_count: podCount,
                namespace_count: namespaceCount,
                metadata: {
                    collected_at: new Date().toISOString(),
                },
            };
        }
        catch (error) {
            console.error('[ClusterCollector] Failed to collect cluster info:', error.message);
            throw error;
        }
    }
    generateClusterId() {
        // Generate a consistent cluster ID based on cluster name
        // In production, you might want to use a UUID stored in a ConfigMap
        return Buffer.from(this.clusterName).toString('base64').substring(0, 32);
    }
}
exports.ClusterCollector = ClusterCollector;
//# sourceMappingURL=cluster.collector.js.map