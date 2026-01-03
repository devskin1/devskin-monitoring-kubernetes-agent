import { KubeConfig } from '@kubernetes/client-node';
import * as winston from 'winston';
import { AgentConfig, ClusterInfo } from './types';
import { ApiClient } from './api-client';
import { ClusterCollector } from './collectors/cluster.collector';
import { NodeCollector } from './collectors/node.collector';
import { PodCollector } from './collectors/pod.collector';
import { DeploymentCollector } from './collectors/deployment.collector';
import { ServiceCollector } from './collectors/service.collector';
import { EventCollector } from './collectors/event.collector';
import { HPACollector } from './collectors/hpa.collector';

export class KubernetesAgent {
  private config: AgentConfig;
  private apiClient: ApiClient;
  private logger: winston.Logger;
  private kubeConfig: KubeConfig;
  private clusterId?: string;
  private clusterInfo?: ClusterInfo;

  private collectionTimer?: NodeJS.Timeout;
  private heartbeatTimer?: NodeJS.Timeout;
  private isRunning = false;

  // Collectors
  private clusterCollector: ClusterCollector;
  private nodeCollector: NodeCollector;
  private podCollector: PodCollector;
  private deploymentCollector: DeploymentCollector;
  private serviceCollector: ServiceCollector;
  private eventCollector: EventCollector;
  private hpaCollector: HPACollector;

  constructor(config: AgentConfig) {
    this.config = {
      collectionInterval: 60000, // 1 minute
      batchSize: 100,
      flushInterval: 10000,
      debug: false,
      ...config,
    };

    this.apiClient = new ApiClient(
      this.config.serverUrl,
      this.config.apiKey,
      this.config.tenantId,
      this.config.debug
    );

    this.logger = this.createLogger();
    this.kubeConfig = new KubeConfig();

    // Load kubeconfig
    if (this.config.kubeconfigPath) {
      this.kubeConfig.loadFromFile(this.config.kubeconfigPath);
    } else {
      try {
        this.kubeConfig.loadFromCluster();
      } catch (error) {
        this.kubeConfig.loadFromDefault();
      }
    }

    // Initialize collectors
    this.clusterCollector = new ClusterCollector(this.kubeConfig, this.config.clusterName);
    this.nodeCollector = new NodeCollector(this.kubeConfig, this.config.clusterName);
    this.podCollector = new PodCollector(this.kubeConfig, this.config.clusterName);
    this.deploymentCollector = new DeploymentCollector(this.kubeConfig, this.config.clusterName);
    this.serviceCollector = new ServiceCollector(this.kubeConfig, this.config.clusterName);
    this.eventCollector = new EventCollector(this.kubeConfig, this.config.clusterName);
    this.hpaCollector = new HPACollector(this.kubeConfig, this.config.clusterName);
  }

  private createLogger(): winston.Logger {
    return winston.createLogger({
      level: this.config.debug ? 'debug' : 'info',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.printf(({ timestamp, level, message }) => {
          return `${timestamp} [${level.toUpperCase()}] ${message}`;
        })
      ),
      transports: [
        new winston.transports.Console(),
        new winston.transports.File({
          filename: 'devskin-k8s-agent.log',
          maxsize: 10485760, // 10MB
          maxFiles: 5,
        }),
      ],
    });
  }

  async start(): Promise<void> {
    try {
      this.logger.info('Starting DevSkin Kubernetes Agent...');

      // Discover and register cluster
      await this.discoverCluster();

      // Start collection loop
      this.isRunning = true;
      this.startCollectionLoop();
      this.startHeartbeatLoop();

      this.logger.info('Kubernetes Agent started successfully');
    } catch (error: any) {
      this.logger.error(`Failed to start agent: ${error.message}`);
      throw error;
    }
  }

  async stop(): Promise<void> {
    this.logger.info('Stopping Kubernetes Agent...');
    this.isRunning = false;

    if (this.collectionTimer) {
      clearInterval(this.collectionTimer);
    }

    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
    }

    this.logger.info('Kubernetes Agent stopped');
  }

  private async discoverCluster(): Promise<void> {
    this.logger.info(`Discovering cluster: ${this.config.clusterName}`);

    try {
      this.clusterInfo = await this.clusterCollector.collect();
      this.clusterId = await this.apiClient.registerCluster(this.clusterInfo);

      this.logger.info(`Cluster registered with ID: ${this.clusterId}`);
      this.logger.info(
        `Cluster info: ${this.clusterInfo.node_count} nodes, ${this.clusterInfo.pod_count} pods, ${this.clusterInfo.namespace_count} namespaces`
      );
    } catch (error: any) {
      this.logger.error(`Failed to discover cluster: ${error.message}`);
      throw error;
    }
  }

  private startCollectionLoop(): void {
    // Collect immediately
    this.collectMetrics();

    // Then collect at intervals
    this.collectionTimer = setInterval(() => {
      this.collectMetrics();
    }, this.config.collectionInterval);
  }

  private startHeartbeatLoop(): void {
    // Send heartbeat every 30 seconds
    this.heartbeatTimer = setInterval(async () => {
      if (this.clusterId) {
        try {
          await this.apiClient.sendHeartbeat(this.clusterId);
          this.logger.debug('Heartbeat sent');
        } catch (error: any) {
          this.logger.error(`Failed to send heartbeat: ${error.message}`);
        }
      }
    }, 30000);
  }

  private async collectMetrics(): Promise<void> {
    if (!this.clusterId) {
      this.logger.warn('Cannot collect metrics: cluster not registered');
      return;
    }

    try {
      this.logger.debug('Collecting Kubernetes metrics...');

      // Collect all metrics in parallel
      const [nodes, pods, deployments, services, events, hpas] = await Promise.all([
        this.nodeCollector.collect(),
        this.podCollector.collect(),
        this.deploymentCollector.collect(),
        this.serviceCollector.collect(),
        this.eventCollector.collect(),
        this.hpaCollector.collect(),
      ]);

      // Send metrics to backend
      await Promise.all([
        this.apiClient.sendNodeMetrics(nodes),
        this.apiClient.sendPodMetrics(pods),
        this.apiClient.sendDeploymentMetrics(deployments),
        this.apiClient.sendServiceMetrics(services),
        this.apiClient.sendEvents(events),
        this.apiClient.sendHPAMetrics(hpas),
      ]);

      this.logger.debug(
        `Collected and sent: ${nodes.length} nodes, ${pods.length} pods, ${deployments.length} deployments, ${services.length} services, ${events.length} events, ${hpas.length} HPAs`
      );
    } catch (error: any) {
      this.logger.error(`Failed to collect metrics: ${error.message}`);
    }
  }
}
