/**
 * Type definitions for Kubernetes Agent
 */
export interface AgentConfig {
    /** DevSkin backend URL */
    serverUrl: string;
    /** API key for authentication */
    apiKey: string;
    /** Tenant ID (optional, extracted from API key if not provided) */
    tenantId?: string;
    /** Cluster name */
    clusterName: string;
    /** Collection interval in milliseconds */
    collectionInterval?: number;
    /** Batch size for sending data */
    batchSize?: number;
    /** Flush interval in milliseconds */
    flushInterval?: number;
    /** Enable debug logging */
    debug?: boolean;
    /** Kubeconfig path (optional, defaults to in-cluster config) */
    kubeconfigPath?: string;
}
export interface ClusterInfo {
    cluster_id: string;
    cluster_name: string;
    version: string;
    provider?: string;
    region?: string;
    node_count: number;
    pod_count: number;
    namespace_count: number;
    metadata?: Record<string, any>;
}
export interface NodeMetrics {
    node_name: string;
    cluster_name: string;
    status: string;
    cpu_capacity: string;
    cpu_allocatable: string;
    cpu_usage_cores?: number;
    memory_capacity: string;
    memory_allocatable: string;
    memory_usage_bytes?: number;
    pod_capacity: string;
    pod_count: number;
    conditions: NodeCondition[];
    labels: Record<string, string>;
    taints?: NodeTaint[];
    created_at: Date;
}
export interface NodeCondition {
    type: string;
    status: string;
    reason?: string;
    message?: string;
}
export interface NodeTaint {
    key: string;
    value?: string;
    effect: string;
}
export interface PodMetrics {
    pod_name: string;
    namespace: string;
    cluster_name: string;
    node_name?: string;
    status: string;
    phase: string;
    cpu_request?: string;
    cpu_limit?: string;
    cpu_usage_cores?: number;
    memory_request?: string;
    memory_limit?: string;
    memory_usage_bytes?: number;
    container_count: number;
    restart_count: number;
    labels: Record<string, string>;
    owner_kind?: string;
    owner_name?: string;
    created_at: Date;
}
export interface DeploymentMetrics {
    deployment_name: string;
    namespace: string;
    cluster_name: string;
    replicas_desired: number;
    replicas_ready: number;
    replicas_available: number;
    replicas_up_to_date: number;
    replicas_unavailable: number;
    strategy: string;
    health: 'healthy' | 'degraded' | 'critical';
    issues?: string[];
    labels: Record<string, string>;
    selector_labels: Record<string, string>;
    generation: number;
    observed_generation: number;
    created_at: Date;
}
export interface ServiceMetrics {
    service_name: string;
    namespace: string;
    cluster_name: string;
    service_type: string;
    cluster_ip?: string;
    external_ips?: string[];
    load_balancer_ip?: string;
    load_balancer_hostname?: string;
    ports?: ServicePort[];
    selector: Record<string, string>;
    endpoint_count: number;
    health: 'healthy' | 'warning' | 'critical';
    issues?: string[];
    labels: Record<string, string>;
    session_affinity?: string;
    created_at: Date;
}
export interface ServicePort {
    name?: string;
    port: number;
    targetPort?: string;
    protocol: string;
    nodePort?: number;
}
export interface NamespaceInfo {
    namespace_name: string;
    cluster_name: string;
    status: string;
    labels: Record<string, string>;
    pod_count: number;
    service_count: number;
    created_at: Date;
}
export interface K8sEvent {
    event_name: string;
    namespace: string;
    cluster_name: string;
    type: string;
    reason: string;
    message: string;
    severity: 'info' | 'warning' | 'error';
    object_kind?: string;
    object_name?: string;
    object_namespace?: string;
    source_component?: string;
    source_host?: string;
    count: number;
    first_timestamp: Date;
    last_timestamp: Date;
    created_at: Date;
}
export interface HPAMetrics {
    hpa_name: string;
    namespace: string;
    cluster_name: string;
    target_kind: string;
    target_name: string;
    min_replicas: number;
    max_replicas: number;
    current_replicas: number;
    desired_replicas: number;
    metrics?: Array<{
        type: string;
        target_value?: number;
        current_value?: number;
        resource_name?: string;
    }>;
    health: 'healthy' | 'warning' | 'critical';
    issues?: string[];
    labels: Record<string, string>;
    last_scale_time?: Date;
    created_at: Date;
}
//# sourceMappingURL=types.d.ts.map