#!/bin/bash
# validate-release.sh - Validate release readiness
# Usage: ./scripts/validate-release.sh [version]

set -e

VERSION=${1:-""}
ERRORS=0

echo "[VALIDATE] Validating release readiness..."
echo ""

# Check if version is provided
if [ -z "$VERSION" ]; then
    echo "[ERROR] Version not provided"
    echo "Usage: $0 <version>"
    echo "Example: $0 1.0.0"
    exit 1
fi

# Validate version format
if [[ ! "$VERSION" =~ ^[0-9]+\.[0-9]+\.[0-9]+(-[a-zA-Z0-9.]+)?$ ]]; then
    echo "[ERROR] Invalid version format: ${VERSION}"
    echo "Expected format: X.Y.Z or X.Y.Z-prerelease"
    exit 1
fi

echo "[CHECK] Checking version consistency..."
echo ""

# Check tauri.conf.json
CONF_VERSION=$(jq -r '.version' src-tauri/tauri.conf.json)
if [ "$CONF_VERSION" = "$VERSION" ]; then
    echo "[OK] tauri.conf.json: ${CONF_VERSION}"
else
    echo "[FAIL] tauri.conf.json: ${CONF_VERSION} (expected ${VERSION})"
    ERRORS=$((ERRORS + 1))
fi

# Check Cargo.toml
CARGO_VERSION=$(grep '^version' src-tauri/Cargo.toml | head -1 | sed 's/.*"\(.*\)".*/\1/')
if [ "$CARGO_VERSION" = "$VERSION" ]; then
    echo "[OK] Cargo.toml: ${CARGO_VERSION}"
else
    echo "[FAIL] Cargo.toml: ${CARGO_VERSION} (expected ${VERSION})"
    ERRORS=$((ERRORS + 1))
fi

# Check package.json
PKG_VERSION=$(jq -r '.version' package.json)
if [ "$PKG_VERSION" = "$VERSION" ]; then
    echo "[OK] package.json: ${PKG_VERSION}"
else
    echo "[FAIL] package.json: ${PKG_VERSION} (expected ${VERSION})"
    ERRORS=$((ERRORS + 1))
fi

echo ""
echo "[CHECK] Checking build tools..."
echo ""

# Check Rust
if command -v cargo &> /dev/null; then
    echo "[OK] cargo: $(cargo --version)"
else
    echo "[FAIL] cargo not found"
    ERRORS=$((ERRORS + 1))
fi

# Check Node.js
if command -v node &> /dev/null; then
    echo "[OK] node: $(node --version)"
else
    echo "[FAIL] node not found"
    ERRORS=$((ERRORS + 1))
fi

# Check npm
if command -v npm &> /dev/null; then
    echo "[OK] npm: $(npm --version)"
else
    echo "[FAIL] npm not found"
    ERRORS=$((ERRORS + 1))
fi

# Check Tauri CLI
if command -v npx &> /dev/null && npx tauri --version &> /dev/null; then
    echo "[OK] tauri cli: $(npx tauri --version)"
else
    echo "[FAIL] tauri cli not found"
    ERRORS=$((ERRORS + 1))
fi

echo ""
echo "[CHECK] Running code quality checks..."
echo ""

# Check cargo fmt
echo "Running cargo fmt --check..."
if (cd src-tauri && cargo fmt --all --check 2>/dev/null); then
    echo "[OK] cargo fmt: passed"
else
    echo "[FAIL] cargo fmt: failed"
    ERRORS=$((ERRORS + 1))
fi

# Check cargo clippy
echo "Running cargo clippy..."
if (cd src-tauri && cargo clippy --all-targets --all-features -- -D warnings 2>/dev/null); then
    echo "[OK] cargo clippy: passed"
else
    echo "[FAIL] cargo clippy: failed"
    ERRORS=$((ERRORS + 1))
fi

# Check TypeScript
echo "Running TypeScript check..."
if npx tsc -b --noEmit 2>/dev/null; then
    echo "[OK] TypeScript: passed"
else
    echo "[FAIL] TypeScript: failed"
    ERRORS=$((ERRORS + 1))
fi

# Check frontend build
echo "Running frontend build..."
if npm run build 2>/dev/null; then
    echo "[OK] Frontend build: passed"
else
    echo "[FAIL] Frontend build: failed"
    ERRORS=$((ERRORS + 1))
fi

echo ""
echo "[CHECK] Checking documentation..."
echo ""

# Check CHANGELOG.md
if [ -f "CHANGELOG.md" ]; then
    if grep -q "$VERSION" CHANGELOG.md; then
        echo "[OK] CHANGELOG.md: contains version ${VERSION}"
    else
        echo "[WARN] CHANGELOG.md: does not contain version ${VERSION}"
    fi
else
    echo "[WARN] CHANGELOG.md: not found"
fi

# Check RELEASING.md
if [ -f "RELEASING.md" ]; then
    echo "[OK] RELEASING.md: exists"
else
    echo "[FAIL] RELEASING.md: not found"
    ERRORS=$((ERRORS + 1))
fi

echo ""
echo "[SUMMARY] ..."
echo ""

if [ $ERRORS -eq 0 ]; then
    echo "[PASS] All checks passed! Ready to release v${VERSION}"
    echo ""
    echo "Next steps:"
    echo "  1. git add -A"
    echo "  2. git commit -m 'chore: release v${VERSION}'"
    echo "  3. git tag -a v${VERSION} -m 'Release v${VERSION}'"
    echo "  4. git push origin main && git tag v${VERSION}"
else
    echo "[FAIL] ${ERRORS} error(s) found. Please fix before releasing."
    exit 1
fi
