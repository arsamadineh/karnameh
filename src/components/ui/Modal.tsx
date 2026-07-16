import { Show } from 'solid-js';
import { Portal } from 'solid-js/web';
import type { Component, JSX } from 'solid-js';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: JSX.Element;
  footer?: JSX.Element;
}

export const Modal: Component<ModalProps> = (props) => {
  return (
    <Show when={props.isOpen}>
      <Portal>
        <div class="modal-backdrop" onClick={props.onClose}>
          {/* Modal Content */}
          <div
            class="modal-sheet premium-card"
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', 'justify-content': 'space-between', 'align-items': 'center' }}>
              <h2 style={{ 'font-size': 'var(--text-h1-size)', 'font-weight': 700, margin: 0 }}>{props.title}</h2>
              <button
                onClick={props.onClose}
                class="btn-secondary"
                style={{
                  padding: '4px',
                  'border-radius': 'var(--radius-round)',
                  display: 'flex',
                  'align-items': 'center',
                  'justify-content': 'center'
                }}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            <div style={{ color: 'var(--color-text-muted)', 'font-size': 'var(--text-body-size)', 'line-height': 1.6 }}>
              {props.children}
            </div>

            <Show when={props.footer}>
              <div style={{ display: 'flex', 'justify-content': 'flex-end', gap: 'var(--space-3)', 'margin-top': 'var(--space-2)' }}>
                {props.footer}
              </div>
            </Show>
          </div>
        </div>
      </Portal>
    </Show>
  );
};
