#!/bin/bash
# update-version.sh - Update version across all files
# Usage: ./scripts/update-version.sh <version>

set -e

VERSION=${1:-""}

if [ -z "$VERSION" ]; then
    echo "❌ Error: Version not provided"
    echo "Usage: $0 <version>"
    echo "Example: $0 1.0.0"
    exit 1
fi

# Validate version format
if [[ ! "$VERSION" =~ ^[0-9]+\.[0-9]+\.[0-9]+(-[a-zA-Z0-9.]+)?$ ]]; then
    echo "❌ Invalid version format: ${VERSION}"
    echo "Expected format: X.Y.Z or X.Y.Z-prerelease"
    exit 1
fi

echo "[UPDATE] Updating version to ${VERSION}..."

# Update tauri.conf.json
echo "Updating src-tauri/tauri.conf.json..."
jq --arg v "$VERSION" '.version = $v' src-tauri/tauri.conf.json > tmp.json && mv tmp.json src-tauri/tauri.conf.json

# Update Cargo.toml
echo "Updating src-tauri/Cargo.toml..."
sed -i "s/^version = \".*\"/version = \"${VERSION}\"/" src-tauri/Cargo.toml

# Update package.json
echo "Updating package.json..."
jq --arg v "$VERSION" '.version = $v' package.json > tmp.json && mv tmp.json package.json

echo ""
echo "✅ Version updated to ${VERSION}"
echo ""
echo "Files updated:"
echo "  - src-tauri/tauri.conf.json"
echo "  - src-tauri/Cargo.toml"
echo "  - package.json"
echo ""
echo "Next steps:"
echo "  1. Run './scripts/validate-release.sh ${VERSION}' to verify"
echo "  2. Commit changes: 'git commit -m \"chore: update version to ${VERSION}\"'"
