import { KubeConfig } from '@kubernetes/client-node';
import { PodMetrics } from '../types';
export declare class PodCollector {
    private k8sApi;
    private metricsClient;
    private clusterName;
    constructor(kubeConfig: KubeConfig, clusterName: string);
    collect(): Promise<PodMetrics[]>;
    private parseCpuUsage;
    private parseMemoryUsage;
    private addResourceValues;
}
//# sourceMappingURL=pod.collector.d.ts.map