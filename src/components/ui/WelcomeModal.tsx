import { createSignal, Show } from 'solid-js';
import type { Component } from 'solid-js';
import { Portal } from 'solid-js/web';
import { saveUserName, userName } from '../../store';

const WelcomeModal: Component = () => {
  const [name, setName] = createSignal('');
  const [isOpen, setIsOpen] = createSignal(userName() === '');

  const handleSubmit = () => {
    const trimmed = name().trim();
    if (trimmed.length > 0) {
      saveUserName(trimmed);
      setIsOpen(false);
    }
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Enter') handleSubmit();
  };

  return (
    <Show when={isOpen()}>
      <Portal>
        <div class="modal-backdrop" style={{ 'z-index': 99999, 'background-color': 'rgba(0, 0, 0, 0.7)', 'backdrop-filter': 'blur(8px)', '-webkit-backdrop-filter': 'blur(8px)' }}>
          {/* Modal Content */}
          <div class="modal-sheet premium-card" style={{
            'max-width': '420px',
            padding: 'var(--space-8)',
            'text-align': 'center'
          }}>
            <div style={{ display: 'flex', 'flex-direction': 'column', gap: 'var(--space-2)' }}>
              <div style={{
                width: '64px',
                height: '64px',
                'border-radius': 'var(--radius-round)',
                'background-color': 'var(--color-secondary-muted)',
                display: 'flex',
                'align-items': 'center',
                'justify-content': 'center',
                margin: '0 auto'
              }}>
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--color-secondary)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
              </div>
              <h2 style={{ 'font-size': 'var(--text-h1-size)', 'font-weight': 700, margin: 0, color: 'var(--color-text)' }}>
                خوش آمدید!
              </h2>
              <p style={{ 'font-size': 'var(--text-body-size)', color: 'var(--color-text-muted)', margin: 0 }}>
                لطفاً نام خود را وارد کنید تا تجربه شخصی‌سازی شده‌ای داشته باشید.
              </p>
            </div>

            <input
              type="text"
              placeholder="نام شما"
              value={name()}
              onInput={(e) => setName(e.currentTarget.value)}
              onKeyDown={handleKeyDown}
              autofocus
              style={{
                width: '100%',
                padding: 'var(--space-3) var(--space-4)',
                'border-radius': 'var(--radius-md)',
                border: '1.5px solid var(--color-border)',
                'background-color': 'var(--color-surface)',
                color: 'var(--color-text)',
                'font-size': 'var(--text-body-size)',
                'font-family': 'inherit',
                outline: 'none',
                'text-align': 'center',
                direction: 'rtl'
              }}
              onFocus={(e) => e.currentTarget.style.borderColor = 'var(--color-primary)'}
              onBlur={(e) => e.currentTarget.style.borderColor = 'var(--color-border)'}
            />

            <button
              class="btn-primary"
              onClick={handleSubmit}
              style={{ width: '100%', 'justify-content': 'center', padding: 'var(--space-3)' }}
            >
              شروع کار
            </button>
          </div>
        </div>
      </Portal>
    </Show>
  );
};

export default WelcomeModal;
