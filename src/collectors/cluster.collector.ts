import { KubeConfig, CoreV1Api } from '@kubernetes/client-node';
import { ClusterInfo } from '../types';

export class ClusterCollector {
  private k8sApi: CoreV1Api;
  private clusterName: string;

  constructor(kubeConfig: KubeConfig, clusterName: string) {
    this.k8sApi = kubeConfig.makeApiClient(CoreV1Api);
    this.clusterName = clusterName;
  }

  async collect(): Promise<ClusterInfo> {
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
      let provider: string | undefined;
      let region: string | undefined;

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
    } catch (error: any) {
      console.error('[ClusterCollector] Failed to collect cluster info:', error.message);
      throw error;
    }
  }

  private generateClusterId(): string {
    // Generate a consistent cluster ID based on cluster name
    // In production, you might want to use a UUID stored in a ConfigMap
    return Buffer.from(this.clusterName).toString('base64').substring(0, 32);
  }
}
