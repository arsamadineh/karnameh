import { check, type Update } from '@tauri-apps/plugin-updater';
import { relaunch } from '@tauri-apps/plugin-process';

export interface UpdateInfo {
  version: string;
  body: string;
}

/**
 * Query the GitHub release endpoint for a newer version.
 * Returns the resolved `Update` (with download/install API) or `null` when
 * either there is no update or the check fails (offline, 404, bad signature).
 * Failures are swallowed so callers can treat "no update" uniformly.
 */
export async function checkForUpdate(): Promise<Update | null> {
  try {
    const update = await check();
    return update ?? null;
  } catch (err) {
    // Network/parse/permission errors should never crash the UI — the app
    // just stays on its current version until the next check.
    console.error('[updater] check failed:', err);
    return null;
  }
}

/**
 * Download + install an update, reporting integer progress (0–100).
 * Relaunches the app once the install completes. Throws on failure so the
 * caller can surface an error and let the user retry.
 */
export async function downloadAndInstall(
  update: Update,
  onProgress?: (percent: number) => void,
): Promise<void> {
  let downloaded = 0;
  let contentLength = 0;

  await update.downloadAndInstall((event) => {
    switch (event.event) {
      case 'Started':
        contentLength = event.data.contentLength ?? 0;
        break;
      case 'Progress':
        downloaded += event.data.chunkLength ?? 0;
        if (contentLength > 0) {
          onProgress?.(Math.round((downloaded / contentLength) * 100));
        }
        break;
      // 'Finished' needs no handling — downloadAndInstall resolves after it.
    }
  });

  await relaunch();
}
