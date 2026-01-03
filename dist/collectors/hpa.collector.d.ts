import { KubeConfig } from '@kubernetes/client-node';
import { HPAMetrics } from '../types';
export declare class HPACollector {
    private k8sApi;
    private clusterName;
    constructor(kubeConfig: KubeConfig, clusterName: string);
    collect(): Promise<HPAMetrics[]>;
}
//# sourceMappingURL=hpa.collector.d.ts.map