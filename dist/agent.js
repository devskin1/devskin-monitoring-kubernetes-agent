"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.KubernetesAgent = void 0;
const client_node_1 = require("@kubernetes/client-node");
const winston = __importStar(require("winston"));
const api_client_1 = require("./api-client");
const cluster_collector_1 = require("./collectors/cluster.collector");
const node_collector_1 = require("./collectors/node.collector");
const pod_collector_1 = require("./collectors/pod.collector");
class KubernetesAgent {
    constructor(config) {
        this.isRunning = false;
        this.config = {
            collectionInterval: 60000, // 1 minute
            batchSize: 100,
            flushInterval: 10000,
            debug: false,
            ...config,
        };
        this.apiClient = new api_client_1.ApiClient(this.config.serverUrl, this.config.apiKey, this.config.tenantId, this.config.debug);
        this.logger = this.createLogger();
        this.kubeConfig = new client_node_1.KubeConfig();
        // Load kubeconfig
        if (this.config.kubeconfigPath) {
            this.kubeConfig.loadFromFile(this.config.kubeconfigPath);
        }
        else {
            try {
                this.kubeConfig.loadFromCluster();
            }
            catch (error) {
                this.kubeConfig.loadFromDefault();
            }
        }
        // Initialize collectors
        this.clusterCollector = new cluster_collector_1.ClusterCollector(this.kubeConfig, this.config.clusterName);
        this.nodeCollector = new node_collector_1.NodeCollector(this.kubeConfig, this.config.clusterName);
        this.podCollector = new pod_collector_1.PodCollector(this.kubeConfig, this.config.clusterName);
    }
    createLogger() {
        return winston.createLogger({
            level: this.config.debug ? 'debug' : 'info',
            format: winston.format.combine(winston.format.timestamp(), winston.format.printf(({ timestamp, level, message }) => {
                return `${timestamp} [${level.toUpperCase()}] ${message}`;
            })),
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
    async start() {
        try {
            this.logger.info('Starting DevSkin Kubernetes Agent...');
            // Discover and register cluster
            await this.discoverCluster();
            // Start collection loop
            this.isRunning = true;
            this.startCollectionLoop();
            this.startHeartbeatLoop();
            this.logger.info('Kubernetes Agent started successfully');
        }
        catch (error) {
            this.logger.error(`Failed to start agent: ${error.message}`);
            throw error;
        }
    }
    async stop() {
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
    async discoverCluster() {
        this.logger.info(`Discovering cluster: ${this.config.clusterName}`);
        try {
            this.clusterInfo = await this.clusterCollector.collect();
            this.clusterId = await this.apiClient.registerCluster(this.clusterInfo);
            this.logger.info(`Cluster registered with ID: ${this.clusterId}`);
            this.logger.info(`Cluster info: ${this.clusterInfo.node_count} nodes, ${this.clusterInfo.pod_count} pods, ${this.clusterInfo.namespace_count} namespaces`);
        }
        catch (error) {
            this.logger.error(`Failed to discover cluster: ${error.message}`);
            throw error;
        }
    }
    startCollectionLoop() {
        // Collect immediately
        this.collectMetrics();
        // Then collect at intervals
        this.collectionTimer = setInterval(() => {
            this.collectMetrics();
        }, this.config.collectionInterval);
    }
    startHeartbeatLoop() {
        // Send heartbeat every 30 seconds
        this.heartbeatTimer = setInterval(async () => {
            if (this.clusterId) {
                try {
                    await this.apiClient.sendHeartbeat(this.clusterId);
                    this.logger.debug('Heartbeat sent');
                }
                catch (error) {
                    this.logger.error(`Failed to send heartbeat: ${error.message}`);
                }
            }
        }, 30000);
    }
    async collectMetrics() {
        if (!this.clusterId) {
            this.logger.warn('Cannot collect metrics: cluster not registered');
            return;
        }
        try {
            this.logger.debug('Collecting Kubernetes metrics...');
            // Collect all metrics in parallel
            const [nodes, pods] = await Promise.all([
                this.nodeCollector.collect(),
                this.podCollector.collect(),
            ]);
            // Send metrics to backend
            await Promise.all([
                this.apiClient.sendNodeMetrics(nodes),
                this.apiClient.sendPodMetrics(pods),
            ]);
            this.logger.debug(`Collected and sent: ${nodes.length} nodes, ${pods.length} pods`);
        }
        catch (error) {
            this.logger.error(`Failed to collect metrics: ${error.message}`);
        }
    }
}
exports.KubernetesAgent = KubernetesAgent;
//# sourceMappingURL=agent.js.map