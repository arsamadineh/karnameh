import { createSignal, onMount, Show, onCleanup } from 'solid-js';
import type { Component } from 'solid-js';
import { checkForUpdate, downloadAndInstall } from '../../lib/updater';

const DISMISS_KEY = 'karnameh:update-dismissed-version';

const Updater: Component = () => {
  const [update, setUpdate] = createSignal<{ version: string; body: string } | null>(null);
  const [isUpdating, setIsUpdating] = createSignal(false);
  const [progress, setProgress] = createSignal(0);
  const [error, setError] = createSignal('');

  let timer: number | undefined;

  const probe = async () => {
    const u = await checkForUpdate();
    if (!u) {
      setUpdate(null);
      return;
    }
    // Skip a version the user already dismissed this session/install.
    if (localStorage.getItem(DISMISS_KEY) === u.version) {
      setUpdate(null);
      return;
    }
    setUpdate({ version: u.version, body: u.body || '' });
  };

  onMount(() => {
    // Check immediately, then re-check every 30 minutes while the app is open.
    void probe();
    timer = window.setInterval(() => void probe(), 30 * 60 * 1000);
  });

  onCleanup(() => {
    if (timer) window.clearInterval(timer);
  });

  const handleUpdate = async () => {
    const u = await checkForUpdate();
    if (!u) return;
    setIsUpdating(true);
    setError('');
    try {
      await downloadAndInstall(u, (pct) => setProgress(pct));
      // relaunch() ends the process; code below only runs on failure.
    } catch (err: any) {
      console.error('[updater] install failed:', err);
      setError(typeof err?.toString === 'function' ? err.toString() : String(err));
      setIsUpdating(false);
    }
  };

  const dismiss = () => {
    const current = update();
    if (current) localStorage.setItem(DISMISS_KEY, current.version);
    setUpdate(null);
  };

  return (
    <Show when={update()}>
      <div class="update-toast" role="alertdialog" aria-label="بروزرسانی جدید">
        <div class="update-toast-inner">
          <div class="update-toast-head">
            <h3 class="update-toast-title">بروزرسانی جدید در دسترس است!</h3>
            <span class="badge badge-primary update-toast-badge">v{update()?.version}</span>
          </div>

          <Show when={update()?.body}>
            <p class="update-toast-body">{update()?.body}</p>
          </Show>

          <Show when={error()}>
            <p class="update-toast-error">خطا: {error()}</p>
          </Show>

          <Show when={isUpdating()}>
            <div class="update-toast-progress-track">
              <div class="update-toast-progress-fill" style={{ width: `${progress()}%` }} />
            </div>
            <p class="update-toast-progress-label">در حال دانلود و نصب... {progress()}%</p>
          </Show>

          <Show when={!isUpdating()}>
            <div class="update-toast-actions">
              <button class="btn-primary update-toast-btn" onClick={handleUpdate}>
                بروزرسانی و شروع مجدد
              </button>
              <button class="btn-secondary update-toast-btn" onClick={dismiss}>
                بعداً
              </button>
            </div>
          </Show>
        </div>
      </div>
    </Show>
  );
};

export default Updater;
