import { KubeConfig, CoreV1Api, Metrics } from '@kubernetes/client-node';
import { PodMetrics } from '../types';

export class PodCollector {
  private k8sApi: CoreV1Api;
  private metricsClient: Metrics;
  private clusterName: string;

  constructor(kubeConfig: KubeConfig, clusterName: string) {
    this.k8sApi = kubeConfig.makeApiClient(CoreV1Api);
    this.metricsClient = new Metrics(kubeConfig);
    this.clusterName = clusterName;
  }

  async collect(): Promise<PodMetrics[]> {
    try {
      const podsResponse = await this.k8sApi.listPodForAllNamespaces();
      const pods = podsResponse.body.items;

      // Try to get pod metrics
      let podMetrics: any[] = [];
      try {
        const metricsResponse = await this.metricsClient.getPodMetrics();
        podMetrics = metricsResponse.items || [];
      } catch (error) {
        console.warn('[PodCollector] Metrics-server not available, skipping CPU/memory usage');
      }

      const result: PodMetrics[] = [];

      for (const pod of pods) {
        const podName = pod.metadata?.name || 'unknown';
        const namespace = pod.metadata?.namespace || 'default';

        // Find metrics for this pod
        const metrics = podMetrics.find(
          (m: any) => m.metadata?.name === podName && m.metadata?.namespace === namespace
        );

        // Calculate total CPU and memory from containers
        let cpuUsageCores: number | undefined;
        let memoryUsageBytes: number | undefined;

        if (metrics?.containers) {
          cpuUsageCores = metrics.containers.reduce((sum: number, c: any) => {
            return sum + (this.parseCpuUsage(c.usage?.cpu) || 0);
          }, 0);

          memoryUsageBytes = metrics.containers.reduce((sum: number, c: any) => {
            return sum + (this.parseMemoryUsage(c.usage?.memory) || 0);
          }, 0);
        }

        // Calculate total requests and limits
        let cpuRequest = '0';
        let cpuLimit = '0';
        let memoryRequest = '0';
        let memoryLimit = '0';

        pod.spec?.containers?.forEach((container) => {
          if (container.resources?.requests?.cpu) {
            cpuRequest = this.addResourceValues(cpuRequest, container.resources.requests.cpu);
          }
          if (container.resources?.limits?.cpu) {
            cpuLimit = this.addResourceValues(cpuLimit, container.resources.limits.cpu);
          }
          if (container.resources?.requests?.memory) {
            memoryRequest = this.addResourceValues(
              memoryRequest,
              container.resources.requests.memory
            );
          }
          if (container.resources?.limits?.memory) {
            memoryLimit = this.addResourceValues(memoryLimit, container.resources.limits.memory);
          }
        });

        // Calculate restart count
        const restartCount = (pod.status?.containerStatuses || []).reduce(
          (sum, status) => sum + (status.restartCount || 0),
          0
        );

        // Get owner reference
        const ownerRef = pod.metadata?.ownerReferences?.[0];

        result.push({
          pod_name: podName,
          namespace,
          cluster_name: this.clusterName,
          node_name: pod.spec?.nodeName,
          status: pod.status?.phase || 'Unknown',
          phase: pod.status?.phase || 'Unknown',
          cpu_request: cpuRequest !== '0' ? cpuRequest : undefined,
          cpu_limit: cpuLimit !== '0' ? cpuLimit : undefined,
          cpu_usage_cores: cpuUsageCores,
          memory_request: memoryRequest !== '0' ? memoryRequest : undefined,
          memory_limit: memoryLimit !== '0' ? memoryLimit : undefined,
          memory_usage_bytes: memoryUsageBytes,
          container_count: pod.spec?.containers?.length || 0,
          restart_count: restartCount,
          labels: pod.metadata?.labels || {},
          owner_kind: ownerRef?.kind,
          owner_name: ownerRef?.name,
          created_at: new Date(pod.metadata?.creationTimestamp || Date.now()),
        });
      }

      return result;
    } catch (error: any) {
      console.error('[PodCollector] Failed to collect pod metrics:', error.message);
      return [];
    }
  }

  private parseCpuUsage(cpu?: string): number | undefined {
    if (!cpu) return undefined;
    if (cpu.endsWith('m')) {
      return parseFloat(cpu.slice(0, -1)) / 1000;
    }
    if (cpu.endsWith('n')) {
      return parseFloat(cpu.slice(0, -1)) / 1000000000;
    }
    return parseFloat(cpu);
  }

  private parseMemoryUsage(memory?: string): number | undefined {
    if (!memory) return undefined;

    const units: Record<string, number> = {
      Ki: 1024,
      Mi: 1024 * 1024,
      Gi: 1024 * 1024 * 1024,
      K: 1000,
      M: 1000 * 1000,
      G: 1000 * 1000 * 1000,
    };

    for (const [unit, multiplier] of Object.entries(units)) {
      if (memory.endsWith(unit)) {
        return parseFloat(memory.slice(0, -unit.length)) * multiplier;
      }
    }

    return parseFloat(memory);
  }

  private addResourceValues(a: string, b: string): string {
    // Simple addition - in production you'd want more sophisticated handling
    const aNum = parseFloat(a) || 0;
    const bNum = parseFloat(b) || 0;
    return (aNum + bNum).toString();
  }
}
