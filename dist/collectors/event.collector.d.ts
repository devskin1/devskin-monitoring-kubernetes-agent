import { KubeConfig } from '@kubernetes/client-node';
import { K8sEvent } from '../types';
export declare class EventCollector {
    private coreApi;
    private eventsApi;
    private clusterName;
    private lastCollectionTime;
    constructor(kubeConfig: KubeConfig, clusterName: string);
    collect(): Promise<K8sEvent[]>;
    collectCriticalEvents(): Promise<K8sEvent[]>;
}
//# sourceMappingURL=event.collector.d.ts.map