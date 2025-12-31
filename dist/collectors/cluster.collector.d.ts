import { KubeConfig } from '@kubernetes/client-node';
import { ClusterInfo } from '../types';
export declare class ClusterCollector {
    private k8sApi;
    private clusterName;
    constructor(kubeConfig: KubeConfig, clusterName: string);
    collect(): Promise<ClusterInfo>;
    private generateClusterId;
}
//# sourceMappingURL=cluster.collector.d.ts.map