import { createSignal, Show, onCleanup } from 'solid-js';
import type { Component } from 'solid-js';
import { setSearchPaletteOpen } from '../../store';
import { userName } from '../../store';
import { IconSearch, IconUser, IconLogOut } from '../ui/Icons';

interface HeaderProps {
  title: string;
}

const viewTitles: Record<string, string> = {
  dashboard: 'داشبورد',
  clients: 'مشتریان',
  projects: 'پروژه‌ها',
  tasks: 'وظایف',
  checklists: 'چک‌لیست روزانه',
  settings: 'تنظیمات'
};

const Header: Component<HeaderProps> = (props) => {
  const [showProfileMenu, setShowProfileMenu] = createSignal(false);
  let profileRef: HTMLDivElement | undefined;

  const closeProfileMenu = (e: MouseEvent) => {
    if (profileRef && !profileRef.contains(e.target as Node)) {
      setShowProfileMenu(false);
    }
  };

  if (typeof window !== 'undefined') {
    window.addEventListener('click', closeProfileMenu);
    onCleanup(() => window.removeEventListener('click', closeProfileMenu));
  }

  return (
    <header style={{
      height: '64px',
      'border-bottom': '1px solid var(--color-border)',
      display: 'flex',
      'align-items': 'center',
      'justify-content': 'space-between',
      padding: '0 var(--space-4)',
      'background-color': 'var(--color-bg-translucent)',
      'backdrop-filter': 'var(--blur-md)',
      '-webkit-backdrop-filter': 'var(--blur-md)',
      'z-index': 10
    }}>
      <div style={{ display: 'flex', 'align-items': 'center', gap: 'var(--space-3)' }}>
        <h1 style={{ 'font-size': 'var(--text-h1-size)', 'font-weight': 700, color: 'var(--color-text)', 'margin-right': '4px' }}>
          {viewTitles[props.title] || props.title}
        </h1>
      </div>
      
      <div style={{ display: 'flex', gap: 'var(--space-2)', 'align-items': 'center' }}>
        {/* Search Bar Trigger */}
        <button 
          onClick={() => setSearchPaletteOpen(true)}
          style={{
            width: '40px',
            height: '40px',
            'border-radius': 'var(--radius-round)',
            'background-color': 'transparent',
            display: 'flex',
            'align-items': 'center',
            'justify-content': 'center',
            color: 'var(--color-text)',
          }}
          class="sidebar-menu-item"
        >
          <IconSearch style={{ width: '20px', height: '20px' }} />
        </button>

        {/* Profile Section */}
        <div ref={profileRef} style={{ position: 'relative' }}>
          <button 
            onClick={() => setShowProfileMenu(!showProfileMenu())}
            style={{
              width: '40px',
              height: '40px',
              'border-radius': 'var(--radius-round)',
              'background-color': 'var(--color-secondary)',
              display: 'flex',
              'align-items': 'center',
              'justify-content': 'center',
              color: '#0F172A',
              'font-weight': 'bold',
              'font-size': 'var(--text-body-size)',
              border: '2px solid transparent',
              transition: 'all var(--transition-fast)'
            }}
            onMouseEnter={(e) => e.currentTarget.style.borderColor = 'var(--color-secondary-glow)'}
            onMouseLeave={(e) => e.currentTarget.style.borderColor = 'transparent'}
          >
            {userName()?.charAt(0) || 'ک'}
          </button>

          {/* Profile Dropdown */}
          <Show when={showProfileMenu()}>
            <div style={{
              position: 'absolute',
              top: '50px',
              left: '0',
              'background-color': 'var(--color-surface)',
              border: '1px solid var(--color-border)',
              'border-radius': 'var(--radius-md)',
              'box-shadow': 'var(--shadow-lg)',
              padding: '4px',
              display: 'flex',
              'flex-direction': 'column',
              gap: '2px',
              'min-width': '180px',
              'z-index': 1000
            }}
            class="animate-fade-in"
            >
              <div style={{ padding: '8px 12px', 'border-bottom': '1px solid var(--color-border)', 'margin-bottom': '4px' }}>
                <p style={{ 'font-size': 'var(--text-body-size)', 'font-weight': 600, color: 'var(--color-text)' }}>{userName() || 'کاربر'}</p>
                <p style={{ 'font-size': 'var(--text-xs-size)', color: 'var(--color-text-muted)' }}>مدیر سیستم</p>
              </div>
              <button class="sidebar-menu-item" style={{ 'text-align': 'right', padding: '8px 12px', 'font-size': 'var(--text-sm-size)', 'border-radius': 'var(--radius-sm)', width: '100%', display: 'flex', 'align-items': 'center', gap: '8px' }}>
                <IconUser style={{ width: '16px', height: '16px' }} />
                مشاهده پروفایل
              </button>
              <button class="sidebar-menu-item" style={{ 'text-align': 'right', padding: '8px 12px', 'font-size': 'var(--text-sm-size)', 'border-radius': 'var(--radius-sm)', color: 'var(--color-danger)', width: '100%', display: 'flex', 'align-items': 'center', gap: '8px' }}>
                <IconLogOut style={{ width: '16px', height: '16px' }} />
                خروج از برنامه
              </button>
            </div>
          </Show>
        </div>
      </div>
    </header>
  );
};

export default Header;
