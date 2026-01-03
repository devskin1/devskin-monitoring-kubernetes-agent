import { KubeConfig } from '@kubernetes/client-node';
import { DeploymentMetrics } from '../types';
export declare class DeploymentCollector {
    private k8sApi;
    private clusterName;
    constructor(kubeConfig: KubeConfig, clusterName: string);
    collect(): Promise<DeploymentMetrics[]>;
}
//# sourceMappingURL=deployment.collector.d.ts.map