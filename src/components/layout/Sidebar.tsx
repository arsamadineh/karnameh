import { For, Show, createSignal, onCleanup } from 'solid-js';
import type { Component } from 'solid-js';
import { 
  IconDashboard, 
  IconClients, 
  IconProjects, 
  IconTasks, 
  IconChecklists, 
  IconSettings,
  IconChevronRight,
  IconChevronLeft,
  IconUser,
  IconLogOut
} from '../ui/Icons';
import { isSidebarCollapsed, setIsSidebarCollapsed, userName } from '../../store';

interface SidebarProps {
  currentView: string;
  setView: (view: string) => void;
}

const Sidebar: Component<SidebarProps> = (props) => {
  const [showProfileMenu, setShowProfileMenu] = createSignal(false);
  let profileRef: HTMLDivElement | undefined;

  const menuItems = [
    { id: 'dashboard', label: 'داشبورد', icon: IconDashboard },
    { id: 'clients', label: 'مشتریان', icon: IconClients },
    { id: 'projects', label: 'پروژه‌ها', icon: IconProjects },
    { id: 'tasks', label: 'وظایف', icon: IconTasks },
    { id: 'checklists', label: 'چک‌لیست روزانه', icon: IconChecklists },
    { id: 'settings', label: 'تنظیمات', icon: IconSettings },
  ];

  const closeProfileMenu = (e: MouseEvent) => {
    if (profileRef && !profileRef.contains(e.target as Node)) {
      setShowProfileMenu(false);
    }
  };

  if (typeof window !== 'undefined') {
    window.addEventListener('click', closeProfileMenu);
    onCleanup(() => {
      window.removeEventListener('click', closeProfileMenu);
    });
  }

  const collapsed = () => isSidebarCollapsed();

  return (
    <aside style={{
      width: collapsed() ? 'var(--layout-sidebar-collapsed)' : 'var(--layout-sidebar-width)',
      'background-color': 'var(--color-surface-1)',
      'border-right': '1px solid var(--color-border)',
      display: 'flex',
      'flex-direction': 'column',
      padding: 'var(--space-4) 0',
      'justify-content': 'space-between',
      'box-shadow': 'var(--shadow-sm)',
      transition: 'width 300ms cubic-bezier(0.4, 0, 0.2, 1)',
      'z-index': 20,
      'position': 'relative',
      'flex-shrink': 0,
      overflow: 'hidden'
    }}>
      {/* Top section: logo + nav */}
      <div style={{ display: 'flex', 'flex-direction': 'column', gap: 'var(--space-6)' }}>
        {/* Logo + Brand + Collapse toggle */}
        <div style={{ 
          padding: collapsed() ? '0 var(--space-2)' : '0 var(--space-4)', 
          display: 'flex', 
          'flex-direction': 'column',
          'align-items': collapsed() ? 'center' : 'flex-start', 
          gap: 'var(--space-3)',
          transition: 'padding 300ms ease-in-out'
        }}>
          <div style={{ 
            display: 'flex', 
            'align-items': 'center', 
            gap: collapsed() ? '0' : 'var(--space-2-5)',
            'justify-content': collapsed() ? 'center' : 'flex-start'
          }}>
            <img src="/favicon.png" alt="کارنامه" style={{ width: '28px', height: '28px', 'border-radius': 'var(--radius-sm)' }} />
            <Show when={!collapsed()}>
              <span style={{
                'font-size': 'var(--text-h3-size)',
                'font-weight': 700,
                color: 'var(--color-text)',
                'letter-spacing': '-0.03em',
                'white-space': 'nowrap',
                opacity: collapsed() ? 0 : 1,
                'max-width': collapsed() ? '0px' : '200px',
                overflow: 'hidden',
                transition: 'opacity 200ms ease-in-out, max-width 200ms ease-in-out'
              }}>
                کارنامه
              </span>
            </Show>
          </div>
          <button 
            type="button"
            onClick={() => setIsSidebarCollapsed(!collapsed())}
            style={{
              padding: '5px',
              'border-radius': 'var(--radius-md)',
              border: '1px solid var(--color-border)',
              display: 'flex',
              'align-items': 'center',
              'justify-content': 'center',
              'background-color': 'rgba(255,255,255,0.01)',
              color: 'var(--color-text-muted)',
              transition: 'all var(--transition-fast)',
              'align-self': collapsed() ? 'center' : 'flex-start'
            }}
          >
            {collapsed() ? <IconChevronLeft style={{ width: '14px', height: '14px' }} /> : <IconChevronRight style={{ width: '14px', height: '14px' }} />}
          </button>
        </div>

        {/* Nav Items */}
        <nav style={{ display: 'flex', 'flex-direction': 'column', gap: 'var(--space-1)', padding: collapsed() ? '0 var(--space-2)' : '0 var(--space-3)' }}>
          <For each={menuItems}>
            {(item) => {
              const isActive = () => props.currentView === item.id;
              const Icon = item.icon;
              return (
                <div class="sidebar-item-wrapper" style={{ position: 'relative' }}>
                  <button
                    onClick={() => props.setView(item.id)}
                    classList={{ 'sidebar-item': true, 'active': isActive() }}
                    style={{
                      display: 'flex',
                      'align-items': 'center',
                      gap: collapsed() ? '0' : 'var(--space-3)',
                      'justify-content': 'center',
                      padding: collapsed() ? 'var(--space-3) 0' : 'var(--space-3) var(--space-4)',
                      width: '100%',
                      transition: 'all 300ms ease-in-out'
                    }}
                  >
                    <Icon class="sidebar-icon" style={{ width: collapsed() ? '20px' : '18px', height: collapsed() ? '20px' : '18px' }} />
                    <span style={{
                      'font-size': 'var(--text-body-size)',
                      opacity: collapsed() ? 0 : 1,
                      'max-width': collapsed() ? '0px' : '200px',
                      overflow: 'hidden',
                      'white-space': 'nowrap',
                      transition: 'opacity 200ms ease-in-out, max-width 200ms ease-in-out'
                    }}>{item.label}</span>
                  </button>
                  <Show when={collapsed()}>
                    <div class="sidebar-tooltip">{item.label}</div>
                  </Show>
                </div>
              );
            }}
          </For>
        </nav>
      </div>

      {/* Profile Section */}
      <div 
        ref={profileRef}
        style={{ 
          padding: collapsed() ? '0 var(--space-2)' : '0 var(--space-4)',
          position: 'relative'
        }}
      >
        <div 
          onClick={() => setShowProfileMenu(!showProfileMenu())}
          style={{
            display: 'flex',
            'align-items': 'center',
            'justify-content': 'center',
            gap: collapsed() ? '0' : 'var(--space-3)',
            padding: collapsed() ? 'var(--space-2) 0' : 'var(--space-3)',
            'border-radius': 'var(--radius-lg)',
            'background-color': 'rgba(255, 255, 255, 0.02)',
            border: '1px solid var(--color-border)',
            cursor: 'pointer',
            transition: 'all 300ms ease-in-out'
          }}
        >
          <div style={{
            width: '38px',
            height: '38px',
            'border-radius': 'var(--radius-round)',
            'background-color': 'var(--color-secondary)',
            display: 'flex',
            'align-items': 'center',
            'justify-content': 'center',
            color: '#0F172A',
            'font-weight': 'bold',
            'font-size': 'var(--text-body-size)',
            'flex-shrink': 0
          }}>
            {userName()?.charAt(0) || 'ک'}
          </div>
          
          <div style={{ 
            overflow: 'hidden',
            'max-width': collapsed() ? '0px' : '200px',
            opacity: collapsed() ? 0 : 1,
            transition: 'opacity 200ms ease-in-out, max-width 200ms ease-in-out',
            'white-space': 'nowrap'
          }}>
            <h4 style={{ 'font-size': 'var(--text-body-size)', 'font-weight': 600, color: 'var(--color-text)', 'text-overflow': 'ellipsis', 'white-space': 'nowrap' }}>
              {userName() || 'کاربر'}
            </h4>
            <p style={{ 'font-size': 'var(--text-xs-size)', color: 'var(--color-text-muted)' }}>مدیر سیستم</p>
          </div>
        </div>

        {/* Profile Dropdown Menu */}
        <Show when={showProfileMenu()}>
          <div style={{
            position: 'absolute',
            bottom: '50px',
            right: collapsed() ? '8px' : '16px',
            left: collapsed() ? 'auto' : '16px',
            'background-color': 'var(--color-surface)',
            border: '1px solid var(--color-border)',
            'border-radius': 'var(--radius-md)',
            'box-shadow': 'var(--shadow-lg)',
            padding: '4px',
            display: 'flex',
            'flex-direction': 'column',
            gap: '2px',
            'min-width': '160px',
            'z-index': 1000
          }}
          class="animate-fade-in"
          >
            <button 
              type="button"
              style={{ 
                'text-align': 'right', 
                padding: 'var(--space-2) var(--space-3)', 
                'font-size': 'var(--text-sm-size)', 
                'border-radius': 'var(--radius-sm)',
                width: '100%',
                display: 'flex',
                'align-items': 'center',
                gap: '8px'
              }} 
              class="sidebar-menu-item"
            >
              <IconUser style={{ width: '16px', height: '16px' }} />
              مشاهده پروفایل
            </button>
            <button 
              type="button"
              style={{ 
                'text-align': 'right', 
                padding: 'var(--space-2) var(--space-3)', 
                'font-size': 'var(--text-sm-size)', 
                'border-radius': 'var(--radius-sm)',
                color: 'var(--color-danger)',
                width: '100%',
                display: 'flex',
                'align-items': 'center',
                gap: '8px'
              }} 
              class="sidebar-menu-item"
            >
              <IconLogOut style={{ width: '16px', height: '16px' }} />
              خروج از برنامه
            </button>
          </div>
        </Show>
      </div>
    </aside>
  );
};

export default Sidebar;
