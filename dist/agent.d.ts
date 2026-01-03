import { AgentConfig } from './types';
export declare class KubernetesAgent {
    private config;
    private apiClient;
    private logger;
    private kubeConfig;
    private clusterId?;
    private clusterInfo?;
    private collectionTimer?;
    private heartbeatTimer?;
    private isRunning;
    private clusterCollector;
    private nodeCollector;
    private podCollector;
    private deploymentCollector;
    private serviceCollector;
    private eventCollector;
    private hpaCollector;
    constructor(config: AgentConfig);
    private createLogger;
    start(): Promise<void>;
    stop(): Promise<void>;
    private discoverCluster;
    private startCollectionLoop;
    private startHeartbeatLoop;
    private collectMetrics;
}
//# sourceMappingURL=agent.d.ts.map