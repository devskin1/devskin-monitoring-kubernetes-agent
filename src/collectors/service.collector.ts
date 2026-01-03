import { KubeConfig, CoreV1Api } from '@kubernetes/client-node';
import { ServiceMetrics } from '../types';

export class ServiceCollector {
  private k8sApi: CoreV1Api;
  private clusterName: string;

  constructor(kubeConfig: KubeConfig, clusterName: string) {
    this.k8sApi = kubeConfig.makeApiClient(CoreV1Api);
    this.clusterName = clusterName;
  }

  async collect(): Promise<ServiceMetrics[]> {
    try {
      const servicesResponse = await this.k8sApi.listServiceForAllNamespaces();
      const services = servicesResponse.body.items;

      const result: ServiceMetrics[] = [];

      for (const service of services) {
        const name = service.metadata?.name || 'unknown';
        const namespace = service.metadata?.namespace || 'default';

        const serviceType = service.spec?.type || 'ClusterIP';
        const clusterIP = service.spec?.clusterIP;
        const externalIPs = service.spec?.externalIPs || [];
        const ports = (service.spec?.ports || []).map(p => ({
          name: p.name,
          port: p.port,
          targetPort: p.targetPort?.toString(),
          protocol: p.protocol || 'TCP',
          nodePort: p.nodePort,
        }));

        // Get LoadBalancer status if applicable
        let loadBalancerIP: string | undefined;
        let loadBalancerHostname: string | undefined;

        if (serviceType === 'LoadBalancer' && service.status?.loadBalancer?.ingress) {
          const ingress = service.status.loadBalancer.ingress[0];
          loadBalancerIP = ingress.ip;
          loadBalancerHostname = ingress.hostname;
        }

        // Count endpoints to see if service has active pods
        let endpointCount = 0;
        try {
          const endpointsResponse = await this.k8sApi.readNamespacedEndpoints(name, namespace);
          endpointCount = endpointsResponse.body.subsets?.reduce((sum, subset) => {
            return sum + (subset.addresses?.length || 0);
          }, 0) || 0;
        } catch (error) {
          // Endpoints might not exist for headless services
        }

        // Determine health
        let health: 'healthy' | 'warning' | 'critical' = 'healthy';
        const issues: string[] = [];

        if (endpointCount === 0) {
          health = 'warning';
          issues.push('No endpoints available - no pods are backing this service');
        }

        if (serviceType === 'LoadBalancer' && !loadBalancerIP && !loadBalancerHostname) {
          health = 'warning';
          issues.push('LoadBalancer external IP not yet assigned');
        }

        result.push({
          service_name: name,
          namespace,
          cluster_name: this.clusterName,
          service_type: serviceType,
          cluster_ip: clusterIP,
          external_ips: externalIPs.length > 0 ? externalIPs : undefined,
          load_balancer_ip: loadBalancerIP,
          load_balancer_hostname: loadBalancerHostname,
          ports: ports.length > 0 ? ports : undefined,
          selector: service.spec?.selector || {},
          endpoint_count: endpointCount,
          health,
          issues: issues.length > 0 ? issues : undefined,
          labels: service.metadata?.labels || {},
          session_affinity: service.spec?.sessionAffinity,
          created_at: new Date(service.metadata?.creationTimestamp || Date.now()),
        });
      }

      return result;
    } catch (error: any) {
      console.error('[ServiceCollector] Failed to collect service metrics:', error.message);
      return [];
    }
  }
}
