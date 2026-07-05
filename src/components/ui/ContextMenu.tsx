import { createSignal, Show, For, onCleanup, onMount } from 'solid-js';
import type { Component, JSX } from 'solid-js';
import { Portal } from 'solid-js/web';
import { setSearchPaletteOpen } from '../../store';
import {
  IconScissors,
  IconCopy,
  IconClipboard,
  IconSelectAll,
  IconSearch,
  IconRefresh,
} from './Icons';

interface MenuItem {
  label: string;
  icon?: Component<{ style?: string | JSX.CSSProperties }>;
  shortcut?: string;
  danger?: boolean;
  divider?: boolean;
  action?: () => void;
}

export const ContextMenu: Component = () => {
  const [visible, setVisible] = createSignal(false);
  const [x, setX] = createSignal(0);
  const [y, setY] = createSignal(0);

  const handleCopy = async () => {
    const sel = window.getSelection()?.toString();
    if (sel) {
      try { await navigator.clipboard.writeText(sel); } catch {}
    }
  };

  const handleCut = async () => {
    const sel = window.getSelection();
    if (sel && sel.toString()) {
      try { await navigator.clipboard.writeText(sel.toString()); } catch {}
      document.execCommand('delete');
    }
  };

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      const active = document.activeElement as HTMLInputElement | HTMLTextAreaElement | null;
      if (active && (active.tagName === 'INPUT' || active.tagName === 'TEXTAREA')) {
        const start = active.selectionStart ?? 0;
        const end = active.selectionEnd ?? 0;
        const val = active.value;
        active.value = val.slice(0, start) + text + val.slice(end);
        active.dispatchEvent(new Event('input', { bubbles: true }));
      } else {
        document.execCommand('insertText', false, text);
      }
    } catch {}
  };

  const handleSelectAll = () => {
    const active = document.activeElement as HTMLInputElement | HTMLTextAreaElement | null;
    if (active && (active.tagName === 'INPUT' || active.tagName === 'TEXTAREA')) {
      active.select();
    } else {
      document.execCommand('selectAll');
    }
  };

  const getItems = (): MenuItem[] => {
    const hasSelection = !!(window.getSelection()?.toString());

    return [
      ...(hasSelection ? [
        { label: 'بریدن', icon: IconScissors, shortcut: 'Ctrl+X', action: handleCut },
        { label: 'کپی', icon: IconCopy, shortcut: 'Ctrl+C', action: handleCopy },
      ] : []),
      { label: 'چسباندن', icon: IconClipboard, shortcut: 'Ctrl+V', action: handlePaste },
      { label: '', divider: true },
      { label: 'انتخاب همه', icon: IconSelectAll, shortcut: 'Ctrl+A', action: handleSelectAll },
      { label: '', divider: true },
      { label: 'جستجو در برنامه', icon: IconSearch, shortcut: 'Ctrl+K', action: () => setSearchPaletteOpen(true) },
      { label: 'بازخوانی صفحه', icon: IconRefresh, shortcut: 'Ctrl+R', action: () => window.location.reload() },
    ];
  };

  const handleContextMenu = (e: MouseEvent) => {
    const target = e.target as HTMLElement;
    // Allow native context menu on inputs, textareas, contenteditable, and interactive elements
    if (
      target.tagName === 'INPUT' ||
      target.tagName === 'TEXTAREA' ||
      target.tagName === 'SELECT' ||
      target.isContentEditable ||
      target.closest('input') ||
      target.closest('textarea') ||
      target.closest('select') ||
      target.closest('[contenteditable]')
    ) {
      return;
    }

    e.preventDefault();
    e.stopPropagation();

    const menuWidth = 220;
    const menuHeight = 300;
    const viewportW = window.innerWidth;
    const viewportH = window.innerHeight;

    let posX = e.clientX;
    let posY = e.clientY;

    if (posX + menuWidth > viewportW) posX = viewportW - menuWidth - 8;
    if (posY + menuHeight > viewportH) posY = viewportH - menuHeight - 8;

    setX(posX);
    setY(posY);
    setVisible(true);
  };

  const handleClick = () => {
    if (visible()) setVisible(false);
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Escape' && visible()) {
      setVisible(false);
      e.preventDefault();
    }
  };

  onMount(() => {
    document.addEventListener('contextmenu', handleContextMenu, true);
    document.addEventListener('click', handleClick);
    document.addEventListener('keydown', handleKeyDown);
  });

  onCleanup(() => {
    document.removeEventListener('contextmenu', handleContextMenu, true);
    document.removeEventListener('click', handleClick);
    document.removeEventListener('keydown', handleKeyDown);
  });

  const handleItemClick = (item: MenuItem) => {
    if (item.action) item.action();
    setVisible(false);
  };

  return (
    <Show when={visible()}>
      <Portal>
        <div
          class="animate-scale-in"
          style={{
            position: 'fixed',
            top: `${y()}px`,
            left: `${x()}px`,
            'z-index': 99999,
            'min-width': '210px',
            'background-color': 'var(--color-surface-1)',
            border: '1px solid var(--color-border)',
            'border-radius': 'var(--radius-lg)',
            'box-shadow': 'var(--shadow-4)',
            padding: 'var(--space-1)',
            direction: 'rtl',
            'backdrop-filter': 'blur(20px) saturate(1.6)',
            '-webkit-backdrop-filter': 'blur(20px) saturate(1.6)',
            'transform-origin': 'top right',
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <For each={getItems()}>
            {(item) => {
              if (item.divider) {
                return (
                  <div style={{
                    height: '1px',
                    'background-color': 'var(--color-border)',
                    margin: 'var(--space-1) var(--space-2)',
                  }} />
                );
              }
              const Icon = item.icon;
              return (
                <button
                  onClick={() => handleItemClick(item)}
                  style={{
                    display: 'flex',
                    'align-items': 'center',
                    'justify-content': 'space-between',
                    width: '100%',
                    padding: 'var(--space-2) var(--space-3)',
                    'border-radius': 'var(--radius-md)',
                    'font-size': 'var(--text-sm-size)',
                    color: item.danger ? 'var(--color-danger)' : 'var(--color-text)',
                    transition: 'all var(--transition-fast)',
                    gap: 'var(--space-3)',
                    cursor: 'pointer',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = item.danger
                      ? 'var(--color-danger-muted)'
                      : 'var(--color-surface-2)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }}
                >
                  <div style={{ display: 'flex', 'align-items': 'center', gap: 'var(--space-2-5)' }}>
                    {Icon && <Icon style={{ width: '16px', height: '16px', color: 'var(--color-text-muted)', 'flex-shrink': '0' }} />}
                    <span style={{ 'font-weight': 500 }}>{item.label}</span>
                  </div>
                  <Show when={item.shortcut}>
                    <span style={{
                      'font-size': 'var(--text-xs-size)',
                      color: 'var(--color-text-faint)',
                      'font-weight': 500,
                      'direction': 'ltr',
                    }}>
                      {item.shortcut}
                    </span>
                  </Show>
                </button>
              );
            }}
          </For>
        </div>
      </Portal>
    </Show>
  );
};

export default ContextMenu;
