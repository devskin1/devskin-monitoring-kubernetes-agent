"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ApiClient = void 0;
const axios_1 = __importDefault(require("axios"));
/**
 * API client for sending Kubernetes data to DevSkin backend
 */
class ApiClient {
    constructor(serverUrl, apiKey, tenantId, debug = false) {
        this.apiKey = apiKey;
        this.tenantId = tenantId;
        this.debug = debug;
        this.client = axios_1.default.create({
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
    async registerCluster(cluster) {
        try {
            if (this.debug) {
                console.log('[K8s Agent] Registering cluster:', cluster.cluster_name);
            }
            const response = await this.client.post('/api/v1/kubernetes/clusters', cluster);
            return response.data.cluster_id || cluster.cluster_id;
        }
        catch (error) {
            console.error('[K8s Agent] Failed to register cluster:', error.message);
            throw error;
        }
    }
    /**
     * Send node metrics
     */
    async sendNodeMetrics(nodes) {
        if (nodes.length === 0)
            return;
        try {
            if (this.debug) {
                console.log(`[K8s Agent] Sending ${nodes.length} node metrics`);
            }
            await this.client.post('/api/v1/kubernetes/nodes', { nodes });
        }
        catch (error) {
            console.error('[K8s Agent] Failed to send node metrics:', error.message);
        }
    }
    /**
     * Send pod metrics
     */
    async sendPodMetrics(pods) {
        if (pods.length === 0)
            return;
        try {
            if (this.debug) {
                console.log(`[K8s Agent] Sending ${pods.length} pod metrics`);
            }
            await this.client.post('/api/v1/kubernetes/pods', { pods });
        }
        catch (error) {
            console.error('[K8s Agent] Failed to send pod metrics:', error.message);
        }
    }
    /**
     * Send deployment metrics
     */
    async sendDeploymentMetrics(deployments) {
        if (deployments.length === 0)
            return;
        try {
            if (this.debug) {
                console.log(`[K8s Agent] Sending ${deployments.length} deployment metrics`);
            }
            await this.client.post('/api/v1/kubernetes/deployments', { deployments });
        }
        catch (error) {
            console.error('[K8s Agent] Failed to send deployment metrics:', error.message);
        }
    }
    /**
     * Send service metrics
     */
    async sendServiceMetrics(services) {
        if (services.length === 0)
            return;
        try {
            if (this.debug) {
                console.log(`[K8s Agent] Sending ${services.length} service metrics`);
            }
            await this.client.post('/api/v1/kubernetes/services', { services });
        }
        catch (error) {
            console.error('[K8s Agent] Failed to send service metrics:', error.message);
        }
    }
    /**
     * Send namespace info
     */
    async sendNamespaces(namespaces) {
        if (namespaces.length === 0)
            return;
        try {
            if (this.debug) {
                console.log(`[K8s Agent] Sending ${namespaces.length} namespaces`);
            }
            await this.client.post('/api/v1/kubernetes/namespaces', { namespaces });
        }
        catch (error) {
            console.error('[K8s Agent] Failed to send namespaces:', error.message);
        }
    }
    /**
     * Send events
     */
    async sendEvents(events) {
        if (events.length === 0)
            return;
        try {
            if (this.debug) {
                console.log(`[K8s Agent] Sending ${events.length} events`);
            }
            await this.client.post('/api/v1/kubernetes/events', { events });
        }
        catch (error) {
            console.error('[K8s Agent] Failed to send events:', error.message);
        }
    }
    /**
     * Send HPA metrics
     */
    async sendHPAMetrics(hpas) {
        if (hpas.length === 0)
            return;
        try {
            if (this.debug) {
                console.log(`[K8s Agent] Sending ${hpas.length} HPA metrics`);
            }
            await this.client.post('/api/v1/kubernetes/hpas', { hpas });
        }
        catch (error) {
            console.error('[K8s Agent] Failed to send HPA metrics:', error.message);
        }
    }
    /**
     * Send heartbeat
     */
    async sendHeartbeat(clusterId) {
        try {
            await this.client.post('/api/v1/kubernetes/heartbeat', {
                cluster_id: clusterId,
                timestamp: new Date().toISOString(),
            });
        }
        catch (error) {
            if (this.debug) {
                console.error('[K8s Agent] Failed to send heartbeat:', error.message);
            }
        }
    }
}
exports.ApiClient = ApiClient;
//# sourceMappingURL=api-client.js.map