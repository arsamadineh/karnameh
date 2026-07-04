import { Show } from 'solid-js';
import type { Component } from 'solid-js';
import { Portal } from 'solid-js/web';
import { hasUpdate, markVersionSeen, getCurrentAppVersion } from '../../store';

const UpdateChangelog: Component = () => {
  const handleClose = () => {
    markVersionSeen();
  };

  return (
    <Show when={hasUpdate()}>
      <Portal>
        <div style={{
          position: 'fixed',
          inset: 0,
          'z-index': 99998,
          display: 'flex',
          'align-items': 'center',
          'justify-content': 'center',
          padding: 'var(--space-4)'
        }}>
          {/* Backdrop */}
          <div style={{
            position: 'absolute',
            inset: 0,
            'background-color': 'rgba(0, 0, 0, 0.6)',
            'backdrop-filter': 'blur(4px)',
            'z-index': 0
          }} />

          {/* Modal Content */}
          <div class="premium-card animate-slide-up" style={{
            position: 'relative',
            width: '100%',
            'max-width': '440px',
            'z-index': 1,
            padding: 'var(--space-6)',
            display: 'flex',
            'flex-direction': 'column',
            gap: 'var(--space-4)'
          }}>
            {/* Header */}
            <div style={{ display: 'flex', 'align-items': 'center', gap: 'var(--space-3)' }}>
              <div style={{
                width: '44px',
                height: '44px',
                'border-radius': 'var(--radius-round)',
                'background-color': 'var(--color-success-muted)',
                display: 'flex',
                'align-items': 'center',
                'justify-content': 'center',
                'flex-shrink': 0
              }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--color-success)" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>
              <div>
                <h2 style={{ 'font-size': 'var(--text-h2-size)', 'font-weight': 700, margin: 0, color: 'var(--color-text)' }}>
                  بروزرسانی با موفقیت نصب شد!
                </h2>
                <span class="badge badge-primary" style={{ 'background-color': 'var(--color-primary-muted)', color: 'var(--color-primary)', 'font-size': 'var(--text-xs-size)', 'margin-top': '4px', display: 'inline-block' }}>
                  نسخه {getCurrentAppVersion()}
                </span>
              </div>
            </div>

            {/* Changelog */}
            <div style={{
              'background-color': 'rgba(255,255,255,0.02)',
              border: '1px solid var(--color-border)',
              'border-radius': 'var(--radius-md)',
              padding: 'var(--space-4)',
              display: 'flex',
              'flex-direction': 'column',
              gap: 'var(--space-3)'
            }}>
              <h4 style={{ margin: 0, 'font-size': 'var(--text-body-size)', 'font-weight': 600, color: 'var(--color-text)' }}>
                تغییرات نسخه جدید:
              </h4>
              <ul style={{ margin: 0, padding: '0 var(--space-4)', display: 'flex', 'flex-direction': 'column', gap: 'var(--space-2)', color: 'var(--color-text-muted)', 'font-size': 'var(--text-sm-size)' }}>
                <li>پرسیدن نام کاربر در شروع برنامه</li>
                <li>نمایش تأیید بروزرسانی پس از نصب</li>
                <li>نمایش تغییرات نسخه جدید</li>
                <li>بهبودهای عملکرد و رفع باگ‌ها</li>
              </ul>
            </div>

            {/* Footer */}
            <button
              class="btn-primary"
              onClick={handleClose}
              style={{ width: '100%', 'justify-content': 'center', padding: 'var(--space-3)' }}
            >
              عالیه، متوجه شدم!
            </button>
          </div>
        </div>
      </Portal>
    </Show>
  );
};

export default UpdateChangelog;
