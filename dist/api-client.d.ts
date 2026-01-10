import { ClusterInfo, NodeMetrics, PodMetrics, DeploymentMetrics, ServiceMetrics, NamespaceInfo, K8sEvent, HPAMetrics } from './types';
/**
 * API client for sending Kubernetes data to DevSkin backend
 */
export declare class ApiClient {
    private client;
    private apiKey;
    private tenantId?;
    private debug;
    constructor(serverUrl: string, apiKey: string, tenantId?: string, debug?: boolean);
    /**
     * Register or update cluster
     */
    registerCluster(cluster: ClusterInfo): Promise<string>;
    /**
     * Send node metrics
     */
    sendNodeMetrics(nodes: NodeMetrics[]): Promise<void>;
    /**
     * Send pod metrics
     */
    sendPodMetrics(pods: PodMetrics[]): Promise<void>;
    /**
     * Send deployment metrics
     */
    sendDeploymentMetrics(deployments: DeploymentMetrics[]): Promise<void>;
    /**
     * Send service metrics
     */
    sendServiceMetrics(services: ServiceMetrics[]): Promise<void>;
    /**
     * Send namespace info
     */
    sendNamespaces(namespaces: NamespaceInfo[]): Promise<void>;
    /**
     * Send events
     */
    sendEvents(events: K8sEvent[]): Promise<void>;
    /**
     * Send HPA metrics
     */
    sendHPAMetrics(hpas: HPAMetrics[]): Promise<void>;
    /**
     * Send heartbeat
     */
    sendHeartbeat(clusterId: string): Promise<void>;
}
//# sourceMappingURL=api-client.d.ts.map