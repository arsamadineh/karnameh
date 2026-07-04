import { createSignal, onMount, Show } from 'solid-js';
import type { Component } from 'solid-js';
import { check } from '@tauri-apps/plugin-updater';
import { relaunch } from '@tauri-apps/plugin-process';

const Updater: Component = () => {
  const [updateAvailable, setUpdateAvailable] = createSignal(false);
  const [updateInfo, setUpdateInfo] = createSignal<{ version: string, body: string } | null>(null);
  const [isUpdating, setIsUpdating] = createSignal(false);
  const [updateProgress, setUpdateProgress] = createSignal(0);
  const [updateError, setUpdateError] = createSignal('');

  let updateInstance: any = null;

  onMount(async () => {
    try {
      console.log('Checking for updates...');
      const update = await check();
      if (update?.available) {
        setUpdateAvailable(true);
        setUpdateInfo({ version: update.version, body: update.body || '' });
        updateInstance = update;
      }
    } catch (err) {
      console.error('Failed to check for updates:', err);
    }
  });

  const handleUpdate = async () => {
    if (!updateInstance) return;
    setIsUpdating(true);
    setUpdateError('');
    try {
      let downloaded = 0;
      let contentLength = 0;
      await updateInstance.downloadAndInstall((event: any) => {
        switch (event.event) {
          case 'Started':
            contentLength = event.data.contentLength;
            break;
          case 'Progress':
            downloaded += event.data.chunkLength;
            if (contentLength > 0) {
              setUpdateProgress(Math.round((downloaded / contentLength) * 100));
            }
            break;
          case 'Finished':
            break;
        }
      });
      // Restart the app
      await relaunch();
    } catch (err: any) {
      console.error('Failed to install update:', err);
      setUpdateError(err.toString());
      setIsUpdating(false);
    }
  };

  return (
    <Show when={updateAvailable()}>
      <div class="animate-slide-up" style={{
        position: 'fixed',
        bottom: '100px',
        left: '50%',
        transform: 'translateX(-50%)',
        'background-color': 'var(--color-surface-1)',
        border: '1px solid var(--color-secondary)',
        'border-radius': 'var(--radius-lg)',
        padding: 'var(--space-4)',
        'box-shadow': '0 8px 30px rgba(15, 23, 42, 0.5)',
        'z-index': 9999,
        width: '340px',
        display: 'flex',
        'flex-direction': 'column',
        gap: 'var(--space-3)'
      }}>
        <div style={{ display: 'flex', 'justify-content': 'space-between', 'align-items': 'center' }}>
          <h3 style={{ margin: 0, color: 'var(--color-text)', 'font-size': 'var(--text-h2-size)', 'font-weight': 'bold' }}>بروزرسانی جدید در دسترس است!</h3>
          <span class="badge badge-primary" style={{ 'background-color': 'var(--color-secondary-muted)', color: 'var(--color-secondary)' }}>
            v{updateInfo()?.version}
          </span>
        </div>
        
        <Show when={updateInfo()?.body}>
          <p style={{ margin: 0, 'font-size': 'var(--text-sm-size)', color: 'var(--color-text-muted)', 'max-height': '60px', 'overflow-y': 'auto' }}>
            {updateInfo()?.body}
          </p>
        </Show>

        <Show when={updateError()}>
          <p style={{ margin: 0, 'font-size': 'var(--text-sm-size)', color: 'var(--color-danger)' }}>خطا: {updateError()}</p>
        </Show>

        <Show when={isUpdating()}>
          <div style={{ width: '100%', height: '6px', 'background-color': 'var(--color-surface-hover)', 'border-radius': '3px', overflow: 'hidden' }}>
            <div style={{ width: `${updateProgress()}%`, height: '100%', 'background-color': 'var(--color-primary)', transition: 'width 0.2s' }} />
          </div>
          <p style={{ margin: 0, 'font-size': 'var(--text-xs-size)', 'text-align': 'center', color: 'var(--color-text-muted)' }}>
            در حال دانلود و نصب... {updateProgress()}%
          </p>
        </Show>

        <Show when={!isUpdating()}>
          <div style={{ display: 'flex', gap: 'var(--space-2)', 'margin-top': 'var(--space-2)' }}>
            <button class="btn-primary" style={{ flex: 1, 'justify-content': 'center' }} onClick={handleUpdate}>
              بروزرسانی و شروع مجدد
            </button>
            <button class="btn-secondary" style={{ flex: 0.5, 'justify-content': 'center' }} onClick={() => setUpdateAvailable(false)}>
              بعداً
            </button>
          </div>
        </Show>
      </div>
    </Show>
  );
};

export default Updater;
