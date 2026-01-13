#!/bin/bash
set -e

echo "🚀 DevSkin Kubernetes Agent - Helm Chart Deployment"
echo "===================================================="

# Check if helm is installed
if ! command -v helm &> /dev/null; then
    echo "❌ Error: Helm is not installed"
    exit 1
fi

# Configuration
CHART_DIR="helm/devskin-kubernetes-agent"
REPO_URL="https://devskin1.github.io/devskin-monitoring-kubernetes-agent"
CHART_NAME="devskin-kubernetes-agent"

# Get current version from Chart.yaml
CHART_VERSION=$(grep '^version:' $CHART_DIR/Chart.yaml | awk '{print $2}')
echo "📦 Chart Version: $CHART_VERSION"

# Ensure we're on main branch
CURRENT_BRANCH=$(git branch --show-current)
if [ "$CURRENT_BRANCH" != "main" ]; then
    echo "❌ Error: Must be on main branch (currently on $CURRENT_BRANCH)"
    exit 1
fi

# Check for uncommitted changes
if [ -n "$(git status --porcelain)" ]; then
    echo "❌ Error: You have uncommitted changes. Please commit or stash them first."
    git status --short
    exit 1
fi

echo ""
echo "📋 Step 1: Linting Helm chart..."
helm lint $CHART_DIR

echo ""
echo "📦 Step 2: Packaging Helm chart..."
helm package $CHART_DIR -d /tmp/

echo ""
echo "🔄 Step 3: Switching to gh-pages branch..."
git fetch origin
git checkout gh-pages
git pull origin gh-pages

echo ""
echo "📝 Step 4: Updating Helm repository index..."
# Move packaged chart to gh-pages
mv /tmp/${CHART_NAME}-${CHART_VERSION}.tgz .

# Update index.yaml
helm repo index . --url $REPO_URL --merge index.yaml

echo ""
echo "💾 Step 5: Committing and pushing to gh-pages..."
git add ${CHART_NAME}-${CHART_VERSION}.tgz index.yaml
git commit -m "Release Helm chart v${CHART_VERSION}

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>"
git push origin gh-pages

echo ""
echo "🔄 Step 6: Returning to main branch..."
git checkout main

echo ""
echo "✅ Deployment complete!"
echo ""
echo "📚 To use the updated chart, run:"
echo "   helm repo update"
echo "   helm upgrade devskin-k8s-agent devskin/devskin-kubernetes-agent --version ${CHART_VERSION}"
echo ""
echo "🌐 Chart URL: ${REPO_URL}/${CHART_NAME}-${CHART_VERSION}.tgz"
