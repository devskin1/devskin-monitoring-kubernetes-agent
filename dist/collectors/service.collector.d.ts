import { KubeConfig } from '@kubernetes/client-node';
import { ServiceMetrics } from '../types';
export declare class ServiceCollector {
    private k8sApi;
    private clusterName;
    constructor(kubeConfig: KubeConfig, clusterName: string);
    collect(): Promise<ServiceMetrics[]>;
}
//# sourceMappingURL=service.collector.d.ts.map