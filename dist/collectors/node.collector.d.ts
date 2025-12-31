import { KubeConfig } from '@kubernetes/client-node';
import { NodeMetrics } from '../types';
export declare class NodeCollector {
    private k8sApi;
    private metricsClient;
    private clusterName;
    constructor(kubeConfig: KubeConfig, clusterName: string);
    collect(): Promise<NodeMetrics[]>;
    private parseCpuUsage;
    private parseMemoryUsage;
}
//# sourceMappingURL=node.collector.d.ts.map