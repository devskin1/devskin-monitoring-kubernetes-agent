"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EventCollector = void 0;
const client_node_1 = require("@kubernetes/client-node");
class EventCollector {
    constructor(kubeConfig, clusterName) {
        this.coreApi = kubeConfig.makeApiClient(client_node_1.CoreV1Api);
        this.eventsApi = kubeConfig.makeApiClient(client_node_1.EventsV1Api);
        this.clusterName = clusterName;
        // Start collecting events from 5 minutes ago on first run
        this.lastCollectionTime = new Date(Date.now() - 5 * 60 * 1000);
    }
    async collect() {
        try {
            // Try to use Events v1 API first, fall back to Core v1 if not available
            let events = [];
            try {
                const eventsResponse = await this.eventsApi.listEventForAllNamespaces();
                events = eventsResponse.body.items;
            }
            catch (error) {
                // Fall back to core v1 events
                const eventsResponse = await this.coreApi.listEventForAllNamespaces();
                events = eventsResponse.body.items;
            }
            const result = [];
            const now = new Date();
            for (const event of events) {
                const eventTime = new Date(event.eventTime || event.lastTimestamp || event.metadata?.creationTimestamp || Date.now());
                // Only collect events since last collection
                if (eventTime < this.lastCollectionTime) {
                    continue;
                }
                const name = event.metadata?.name || 'unknown';
                const namespace = event.metadata?.namespace || 'default';
                // Determine severity based on type and reason
                let severity = 'info';
                const type = event.type || '';
                const reason = event.reason || '';
                if (type === 'Warning' || type === 'Error') {
                    // Critical errors
                    if (reason.includes('Failed') ||
                        reason.includes('Error') ||
                        reason.includes('CrashLoopBackOff') ||
                        reason.includes('ImagePullBackOff') ||
                        reason.includes('ErrImagePull') ||
                        reason.includes('OOMKilled') ||
                        reason.includes('Evicted')) {
                        severity = 'error';
                    }
                    else {
                        severity = 'warning';
                    }
                }
                result.push({
                    event_name: name,
                    namespace,
                    cluster_name: this.clusterName,
                    type: type || 'Normal',
                    reason,
                    message: event.message || '',
                    severity,
                    object_kind: event.involvedObject?.kind || event.regarding?.kind,
                    object_name: event.involvedObject?.name || event.regarding?.name,
                    object_namespace: event.involvedObject?.namespace || event.regarding?.namespace,
                    source_component: event.source?.component || event.reportingController,
                    source_host: event.source?.host || event.reportingInstance,
                    count: event.count || event.series?.count || 1,
                    first_timestamp: new Date(event.firstTimestamp || eventTime),
                    last_timestamp: new Date(event.lastTimestamp || eventTime),
                    created_at: eventTime,
                });
            }
            // Update last collection time
            this.lastCollectionTime = now;
            // Sort by severity (errors first, then warnings, then info)
            result.sort((a, b) => {
                const severityOrder = { error: 0, warning: 1, info: 2 };
                return severityOrder[a.severity] - severityOrder[b.severity];
            });
            return result;
        }
        catch (error) {
            console.error('[EventCollector] Failed to collect events:', error.message);
            return [];
        }
    }
    // Method to get only critical events for alert generation
    async collectCriticalEvents() {
        const allEvents = await this.collect();
        return allEvents.filter(e => e.severity === 'error');
    }
}
exports.EventCollector = EventCollector;
//# sourceMappingURL=event.collector.js.map