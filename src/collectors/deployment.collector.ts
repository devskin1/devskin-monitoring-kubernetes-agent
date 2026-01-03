import { KubeConfig, AppsV1Api } from '@kubernetes/client-node';
import { DeploymentMetrics } from '../types';

export class DeploymentCollector {
  private k8sApi: AppsV1Api;
  private clusterName: string;

  constructor(kubeConfig: KubeConfig, clusterName: string) {
    this.k8sApi = kubeConfig.makeApiClient(AppsV1Api);
    this.clusterName = clusterName;
  }

  async collect(): Promise<DeploymentMetrics[]> {
    try {
      const deploymentsResponse = await this.k8sApi.listDeploymentForAllNamespaces();
      const deployments = deploymentsResponse.body.items;

      const result: DeploymentMetrics[] = [];

      for (const deployment of deployments) {
        const name = deployment.metadata?.name || 'unknown';
        const namespace = deployment.metadata?.namespace || 'default';

        const replicasDesired = deployment.spec?.replicas || 0;
        const replicasReady = deployment.status?.readyReplicas || 0;
        const replicasAvailable = deployment.status?.availableReplicas || 0;
        const replicasUpToDate = deployment.status?.updatedReplicas || 0;
        const replicasUnavailable = deployment.status?.unavailableReplicas || 0;

        // Calculate health status
        let health: 'healthy' | 'degraded' | 'critical' = 'healthy';
        if (replicasReady === 0) {
          health = 'critical';
        } else if (replicasReady < replicasDesired || replicasUnavailable > 0) {
          health = 'degraded';
        }

        // Check for issues
        const issues: string[] = [];
        if (replicasReady === 0 && replicasDesired > 0) {
          issues.push('No replicas are ready');
        } else if (replicasReady < replicasDesired) {
          issues.push(`Only ${replicasReady}/${replicasDesired} replicas are ready`);
        }

        if (replicasUnavailable > 0) {
          issues.push(`${replicasUnavailable} replicas unavailable`);
        }

        if (replicasUpToDate < replicasDesired) {
          issues.push(`${replicasDesired - replicasUpToDate} replicas not up-to-date`);
        }

        // Get deployment strategy
        const strategy = deployment.spec?.strategy?.type || 'RollingUpdate';

        // Check conditions
        const conditions = deployment.status?.conditions || [];
        const progressingCondition = conditions.find(c => c.type === 'Progressing');
        const availableCondition = conditions.find(c => c.type === 'Available');

        if (progressingCondition?.status === 'False') {
          issues.push(`Deployment not progressing: ${progressingCondition.reason}`);
        }

        if (availableCondition?.status === 'False') {
          issues.push(`Deployment not available: ${availableCondition.reason}`);
        }

        result.push({
          deployment_name: name,
          namespace,
          cluster_name: this.clusterName,
          replicas_desired: replicasDesired,
          replicas_ready: replicasReady,
          replicas_available: replicasAvailable,
          replicas_up_to_date: replicasUpToDate,
          replicas_unavailable: replicasUnavailable,
          strategy,
          health,
          issues: issues.length > 0 ? issues : undefined,
          labels: deployment.metadata?.labels || {},
          selector_labels: deployment.spec?.selector?.matchLabels || {},
          created_at: new Date(deployment.metadata?.creationTimestamp || Date.now()),
          generation: deployment.metadata?.generation || 0,
          observed_generation: deployment.status?.observedGeneration || 0,
        });
      }

      return result;
    } catch (error: any) {
      console.error('[DeploymentCollector] Failed to collect deployment metrics:', error.message);
      return [];
    }
  }
}
