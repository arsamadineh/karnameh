# Release Guide for KarNama (کارنامه)

This document is the **single source of truth** for releasing new versions of KarNama. All agents (AI or human) MUST follow these procedures exactly.

## Release Checklist

### Pre-Release (Mandatory)

- [ ] All features are merged to `main`
- [ ] All tests pass (`cargo clippy`, `npm run build`, `cargo fmt`)
- [ ] Version numbers are consistent across all files:
  - `src-tauri/tauri.conf.json` → `"version"`
  - `src-tauri/Cargo.toml` → `version`
  - `package.json` → `"version"`
- [ ] Database migrations are complete (if schema changed)
- [ ] `CHANGELOG.md` is updated (if exists)
- [ ] No `TODO`s or `FIXME`s in production code

### Version Naming Convention

Follow [Semantic Versioning](https://semver.org/):

| Format | When to Use | Example |
|--------|-------------|---------|
| `X.Y.Z` | Stable release | `1.0.0`, `1.2.3` |
| `X.Y.Z-beta.N` | Beta testing | `1.0.0-beta.1` |
| `X.Y.Z-alpha.N` | Early testing | `1.0.0-alpha.1` |
| `X.Y.Z-rc.N` | Release candidate | `1.0.0-rc.1` |

**Version History:**
- `0.x.x` → Initial development
- `1.0.0` → First stable release
- `X.0.0` → Major breaking changes
- `x.Y.0` → New features (backward compatible)
- `x.y.Z` → Bug fixes only

## Release Process

### Step 1: Update Version Numbers

Update ALL THREE files to the new version:

```bash
# Option A: Manual update
# Edit src-tauri/tauri.conf.json
# Edit src-tauri/Cargo.toml
# Edit package.json

# Option B: Use jq (recommended for CI)
VERSION="1.0.0"
jq --arg v "$VERSION" '.version = $v' src-tauri/tauri.conf.json > tmp.json && mv tmp.json src-tauri/tauri.conf.json
sed -i "s/^version = \".*\"/version = \"${VERSION}\"/" src-tauri/Cargo.toml
jq --arg v "$VERSION" '.version = $v' package.json > tmp.json && mv tmp.json package.json
```

### Step 2: Commit Changes

```bash
git add -A
git commit -m "chore: release v${VERSION}"
```

### Step 3: Create Git Tag

```bash
# Create annotated tag
git tag -a "v${VERSION}" -m "Release v${VERSION}"

# Or lightweight tag (simpler)
git tag "v${VERSION}"
```

### Step 4: Push to GitHub

```bash
git push origin main
git push origin "v${VERSION}"
```

### Step 5: Monitor GitHub Actions

1. Go to [GitHub Actions](https://github.com/arsamadineh/karnameh/actions)
2. Watch the "Release Build" workflow
3. Wait for all jobs to complete:
   - ✅ Validate Release
   - ✅ Desktop (windows-latest)
   - ✅ Desktop (macos-latest)
   - ✅ Desktop (ubuntu-22.04)
   - ✅ Android APK
   - ✅ Update Checksums

### Step 6: Verify Release

1. Go to [Releases](https://github.com/arsamadineh/karnameh/releases)
2. Verify all artifacts are present:
   - **Windows**: `.exe` (NSIS installer), `.msi`
   - **macOS**: `.dmg`
   - **Linux**: `.deb`, `.AppImage`
   - **Android**: `.apk` (per ABI)
   - **Checksums**: `checksums-sha256.txt`
3. Verify the release notes are correct
4. Test downloads work

## Auto-Update System

### How It Works

1. **Tauri Updater Plugin** checks `latest.json` on app start
2. If new version available, shows update dialog
3. Downloads and verifies signature
4. Installs update and restarts

### latest.json Location

The updater fetches from:
```
https://github.com/arsamadineh/karnameh/releases/latest/download/latest.json
```

### latest.json Structure

```json
{
  "version": "1.0.0",
  "notes": "See the changelog for details.",
  "pub_date": "2026-07-04T12:00:00Z",
  "platforms": {
    "linux-x86_64": {
      "signature": "...",
      "url": "https://github.com/arsamadineh/karnameh/releases/download/v1.0.0/karnameh_1.0.0_amd64.AppImage.tar.gz"
    },
    "windows-x86_64": {
      "signature": "...",
      "url": "https://github.com/arsamadineh/karnameh/releases/download/v1.0.0/karnameh_1.0.0_x64-setup.nsis.zip"
    },
    "darwin-x86_64": {
      "signature": "...",
      "url": "https://github.com/arsamadineh/karnameh/releases/download/v1.0.0/karnameh_1.0.0_x64.app.tar.gz"
    },
    "darwin-aarch64": {
      "signature": "...",
      "url": "https://github.com/arsamadineh/karnameh/releases/download/v1.0.0/karnameh_1.0.0_aarch64.app.tar.gz"
    }
  }
}
```

**Note**: The `tauri-apps/tauri-action@v0` automatically generates `latest.json` when `createUpdaterArtifacts: true` is set in `tauri.conf.json`.

## 🪟 Windows Setup Wizard (NSIS)

### Configuration

The NSIS installer is configured in `src-tauri/tauri.conf.json`:

```json
{
  "bundle": {
    "windows": {
      "nsis": {
        "installMode": "both",
        "displayLanguageSelector": true,
        "headerImage": "icons/128x128@2x.png",
        "sidebarImage": "icons/128x128.png",
        "startMenuShortcut": true,
        "desktopShortcut": true
      }
    }
  }
}
```

### NSIS Features

- **Install Mode**: Both per-user and per-machine
- **Language Selector**: Shows before installation (Persian supported)
- **Custom Images**: Header and sidebar with app branding
- **Shortcuts**: Start Menu and Desktop shortcuts
- **Auto-Update**: Integrates with Tauri updater

### Building NSIS Locally

```bash
# Windows
npm run tauri build

# macOS (cross-compile)
brew install nsis
npm run tauri build -- --target universal-apple-darwin

# Linux (cross-compile)
sudo apt-get install nsis
npm run tauri build
```

## Android Build

### Requirements

- Java 17 (Temurin)
- Android SDK
- NDK 27.0.11902837
- Rust targets: `aarch64-linux-android`, `armv7-linux-androideabi`, `i686-linux-android`, `x86_64-linux-android`

### Building Locally

```bash
npx tauri android init
npx tauri android build --apk --debug
```

### Output

APKs are built per ABI:
- `karnameh-android-arm64-v8a-debug.apk` (most devices)
- `karnameh-android-armeabi-v7a-debug.apk` (older devices)
- `karnameh-android-x86-debug.apk` (emulators)
- `karnameh-android-x86_64-debug.apk` (64-bit emulators)

## Security

### Signing Keys

- **TAURI_PRIVATE_KEY**: Private key for signing updates
- **TAURI_KEY_PASSWORD**: Password for the private key
- **GITHUB_TOKEN**: Auto-provided by GitHub Actions

### Key Management

1. Never commit private keys to the repository
2. Store keys in GitHub Secrets
3. Regenerate keys if compromised
4. Use strong passwords

### Update Verification

1. App downloads update + signature
2. Verifies signature with embedded public key
3. Only installs if signature is valid
4. Public key is in `tauri.conf.json`

## Troubleshooting

### Common Issues

| Issue | Solution |
|-------|----------|
| Version mismatch | Ensure all 3 files have same version |
| NSIS build fails | Install NSIS: `brew install nsis` (macOS) or `apt-get install nsis` (Linux) |
| Android build fails | Check NDK version matches `27.0.11902837` |
| Signature error | Verify `TAURI_PRIVATE_KEY` secret is set |
| Update not showing | Check `latest.json` is accessible |

### Debug Mode

Enable verbose logging:

```bash
RUST_LOG=debug npm run tauri dev
```

## References

- [Tauri Distribution Guide](https://v2.tauri.app/distribute/)
- [Tauri Updater Plugin](https://v2.tauri.app/plugin/updater/)
- [NSIS Documentation](https://nsis.sourceforge.io/)
- [GitHub Actions](https://docs.github.com/en/actions)

## Support

For issues with the release process:
1. Check this document first
2. Review GitHub Actions logs
3. Check Tauri documentation
4. Open an issue on GitHub
