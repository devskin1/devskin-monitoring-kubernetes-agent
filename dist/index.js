#!/usr/bin/env node
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
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
const agent_1 = require("./agent");
const fs = __importStar(require("fs"));
/**
 * Main entry point
 */
async function main() {
    const args = process.argv.slice(2);
    let configPath = 'config.json';
    // Parse command line arguments
    for (let i = 0; i < args.length; i++) {
        if (args[i] === '--config' && args[i + 1]) {
            configPath = args[i + 1];
        }
    }
    // Load configuration
    let config;
    if (fs.existsSync(configPath)) {
        console.log(`Loading configuration from: ${configPath}`);
        const configData = fs.readFileSync(configPath, 'utf-8');
        config = JSON.parse(configData);
    }
    else {
        // Try to load from environment variables
        config = {
            serverUrl: process.env.DEVSKIN_SERVER_URL || 'http://localhost:3000',
            apiKey: process.env.DEVSKIN_API_KEY || '',
            tenantId: process.env.DEVSKIN_TENANT_ID || '',
            clusterName: process.env.CLUSTER_NAME || 'default-cluster',
            collectionInterval: parseInt(process.env.COLLECTION_INTERVAL || '60000'),
            debug: process.env.DEBUG === 'true',
            kubeconfigPath: process.env.KUBECONFIG,
        };
        if (!config.apiKey || !config.tenantId) {
            console.error('Error: API key and Tenant ID are required');
            console.error('Either provide a config.json file or set environment variables:');
            console.error('  DEVSKIN_SERVER_URL');
            console.error('  DEVSKIN_API_KEY');
            console.error('  DEVSKIN_TENANT_ID');
            console.error('  CLUSTER_NAME');
            process.exit(1);
        }
    }
    // Create and start agent
    const agent = new agent_1.KubernetesAgent(config);
    // Handle graceful shutdown
    process.on('SIGTERM', async () => {
        console.log('Received SIGTERM, shutting down gracefully...');
        await agent.stop();
        process.exit(0);
    });
    process.on('SIGINT', async () => {
        console.log('Received SIGINT, shutting down gracefully...');
        await agent.stop();
        process.exit(0);
    });
    // Start the agent
    await agent.start();
    console.log('Kubernetes Agent is running. Press Ctrl+C to stop.');
}
// Run main
main().catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
});
__exportStar(require("./agent"), exports);
__exportStar(require("./types"), exports);
//# sourceMappingURL=index.js.map