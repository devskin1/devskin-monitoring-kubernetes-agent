#!/usr/bin/env node

import { KubernetesAgent } from './agent';
import { AgentConfig } from './types';
import * as fs from 'fs';
import * as path from 'path';

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
  let config: AgentConfig;

  if (fs.existsSync(configPath)) {
    console.log(`Loading configuration from: ${configPath}`);
    const configData = fs.readFileSync(configPath, 'utf-8');
    config = JSON.parse(configData);
  } else {
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
  const agent = new KubernetesAgent(config);

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

export * from './agent';
export * from './types';
