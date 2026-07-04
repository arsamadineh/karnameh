# Release System Summary

## Overview

This document summarizes the comprehensive release system implemented for KarNama.

## Files Created/Modified

### New Files
1. **RELEASING.md** - Comprehensive release guide for all agents
2. **scripts/validate-release.sh** - Validates release readiness before publishing
3. **scripts/update-version.sh** - Updates version across all files
4. **src-tauri/latest.json.template** - Template for updater manifest

### Modified Files
1. **src-tauri/tauri.conf.json** - Enhanced with NSIS installer and updater config
2. **.github/workflows/release.yml** - Comprehensive multi-platform build workflow
3. **AGENTS.md** - Added mandatory release rules (Section 10)
4. **README.md** - Added release process summary

## Release Process

### Quick Start
```bash
# 1. Update version
./scripts/update-version.sh 1.0.0

# 2. Validate release
./scripts/validate-release.sh 1.0.0

# 3. Commit and tag
git add -A
git commit -m "chore: release v1.0.0"
git tag -a v1.0.0 -m "Release v1.0.0"

# 4. Push
git push origin main && git tag v1.0.0
```

### Automated Workflow
GitHub Actions automatically:
1. ✅ Validates version consistency
2. ✅ Builds for Windows (NSIS + MSI)
3. ✅ Builds for macOS (DMG - Intel + Apple Silicon)
4. ✅ Builds for Linux (Debian + AppImage)
5. ✅ Builds for Android (APK per ABI)
6. ✅ Generates checksums
7. ✅ Creates GitHub Release with all artifacts

## Platform Builds

| Platform | Format | Description |
|----------|--------|-------------|
| Windows | `.exe` | NSIS installer (recommended) |
| Windows | `.msi` | MSI installer |
| macOS | `.dmg` | Universal (Intel + Apple Silicon) |
| Linux | `.deb` | Debian/Ubuntu package |
| Linux | `.AppImage` | Portable, no installation |
| Android | `.apk` | Per ABI (arm64, armv7, x86, x86_64) |

## Windows Setup Wizard (NSIS)

Features:
- Language selector (Persian supported)
- Custom header and sidebar images
- Start Menu and Desktop shortcuts
- Both per-user and per-machine install modes
- Auto-update integration

## Auto-Update System

- Signed updates with `TAURI_PRIVATE_KEY`
- Checks `latest.json` on GitHub Releases
- Signature verification mandatory
- Public key embedded in `tauri.conf.json`

## Security

- Private keys stored in GitHub Secrets
- Never committed to repository
- Signature verification for all updates
- Strong password protection

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Version mismatch | Run `./scripts/update-version.sh <version>` |
| NSIS not found | Install: `brew install nsis` (macOS) or `apt-get install nsis` (Linux) |
| Android build fails | Check NDK version `27.0.11902837` |
| Signature error | Verify `TAURI_PRIVATE_KEY` secret is set |
| Update not showing | Check `latest.json` is accessible |

## Documentation

- **RELEASING.md** - Complete release guide
- **AGENTS.md** - Section 10: Release rules (mandatory for all agents)
- **README.md** - Quick release summary

## Validation

Run validation before any release:
```bash
./scripts/validate-release.sh <version>
```

This checks:
- Version consistency across all files
- Build tools availability
- Code quality (clippy, fmt, TypeScript)
- Frontend build
- Documentation completeness
