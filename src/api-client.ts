import axios, { AxiosInstance } from 'axios';
import {
  ClusterInfo,
  NodeMetrics,
  PodMetrics,
  DeploymentMetrics,
  ServiceMetrics,
  NamespaceInfo,
  K8sEvent,
  HPAMetrics,
} from './types';

/**
 * API client for sending Kubernetes data to DevSkin backend
 */
export class ApiClient {
  private client: AxiosInstance;
  private apiKey: string;
  private tenantId: string;
  private debug: boolean;

  constructor(serverUrl: string, apiKey: string, tenantId: string, debug = false) {
    this.apiKey = apiKey;
    this.tenantId = tenantId;
    this.debug = debug;

    this.client = axios.create({
      baseURL: serverUrl,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
        'X-DevSkin-API-Key': apiKey,
        'X-Tenant-ID': tenantId,
      },
    });
  }

  /**
   * Register or update cluster
   */
  async registerCluster(cluster: ClusterInfo): Promise<string> {
    try {
      if (this.debug) {
        console.log('[K8s Agent] Registering cluster:', cluster.cluster_name);
      }

      const response = await this.client.post('/api/v1/kubernetes/clusters', cluster);
      return response.data.cluster_id || cluster.cluster_id;
    } catch (error: any) {
      console.error('[K8s Agent] Failed to register cluster:', error.message);
      throw error;
    }
  }

  /**
   * Send node metrics
   */
  async sendNodeMetrics(nodes: NodeMetrics[]): Promise<void> {
    if (nodes.length === 0) return;

    try {
      if (this.debug) {
        console.log(`[K8s Agent] Sending ${nodes.length} node metrics`);
      }

      await this.client.post('/api/v1/kubernetes/nodes', { nodes });
    } catch (error: any) {
      console.error('[K8s Agent] Failed to send node metrics:', error.message);
    }
  }

  /**
   * Send pod metrics
   */
  async sendPodMetrics(pods: PodMetrics[]): Promise<void> {
    if (pods.length === 0) return;

    try {
      if (this.debug) {
        console.log(`[K8s Agent] Sending ${pods.length} pod metrics`);
      }

      await this.client.post('/api/v1/kubernetes/pods', { pods });
    } catch (error: any) {
      console.error('[K8s Agent] Failed to send pod metrics:', error.message);
    }
  }

  /**
   * Send deployment metrics
   */
  async sendDeploymentMetrics(deployments: DeploymentMetrics[]): Promise<void> {
    if (deployments.length === 0) return;

    try {
      if (this.debug) {
        console.log(`[K8s Agent] Sending ${deployments.length} deployment metrics`);
      }

      await this.client.post('/api/v1/kubernetes/deployments', { deployments });
    } catch (error: any) {
      console.error('[K8s Agent] Failed to send deployment metrics:', error.message);
    }
  }

  /**
   * Send service metrics
   */
  async sendServiceMetrics(services: ServiceMetrics[]): Promise<void> {
    if (services.length === 0) return;

    try {
      if (this.debug) {
        console.log(`[K8s Agent] Sending ${services.length} service metrics`);
      }

      await this.client.post('/api/v1/kubernetes/services', { services });
    } catch (error: any) {
      console.error('[K8s Agent] Failed to send service metrics:', error.message);
    }
  }

  /**
   * Send namespace info
   */
  async sendNamespaces(namespaces: NamespaceInfo[]): Promise<void> {
    if (namespaces.length === 0) return;

    try {
      if (this.debug) {
        console.log(`[K8s Agent] Sending ${namespaces.length} namespaces`);
      }

      await this.client.post('/api/v1/kubernetes/namespaces', { namespaces });
    } catch (error: any) {
      console.error('[K8s Agent] Failed to send namespaces:', error.message);
    }
  }

  /**
   * Send events
   */
  async sendEvents(events: K8sEvent[]): Promise<void> {
    if (events.length === 0) return;

    try {
      if (this.debug) {
        console.log(`[K8s Agent] Sending ${events.length} events`);
      }

      await this.client.post('/api/v1/kubernetes/events', { events });
    } catch (error: any) {
      console.error('[K8s Agent] Failed to send events:', error.message);
    }
  }

  /**
   * Send HPA metrics
   */
  async sendHPAMetrics(hpas: HPAMetrics[]): Promise<void> {
    if (hpas.length === 0) return;

    try {
      if (this.debug) {
        console.log(`[K8s Agent] Sending ${hpas.length} HPA metrics`);
      }

      await this.client.post('/api/v1/kubernetes/hpas', { hpas });
    } catch (error: any) {
      console.error('[K8s Agent] Failed to send HPA metrics:', error.message);
    }
  }

  /**
   * Send heartbeat
   */
  async sendHeartbeat(clusterId: string): Promise<void> {
    try {
      await this.client.post('/api/v1/kubernetes/heartbeat', {
        cluster_id: clusterId,
        timestamp: new Date().toISOString(),
      });
    } catch (error: any) {
      if (this.debug) {
        console.error('[K8s Agent] Failed to send heartbeat:', error.message);
      }
    }
  }
}
