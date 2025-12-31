#!/bin/sh
set -e

# Generate config.json from environment variables
cat > /app/config/config.json <<EOF
{
  "serverUrl": "${DEVSKIN_SERVER_URL:-https://api-monitoring.devskin.com}",
  "apiKey": "${DEVSKIN_API_KEY}",
  "clusterName": "${CLUSTER_NAME:-kubernetes-cluster}",
  "environment": "${DEVSKIN_ENVIRONMENT:-production}",
  "collectionInterval": ${COLLECTION_INTERVAL:-60000},
  "batchSize": ${BATCH_SIZE:-100},
  "flushInterval": ${FLUSH_INTERVAL:-10000},
  "debug": ${DEBUG:-false}
}
EOF

echo "Configuration generated successfully"
cat /app/config/config.json

# Start the agent
exec node dist/index.js --config /app/config/config.json
