import { For, Show, createSignal, onCleanup } from 'solid-js';
import type { Component } from 'solid-js';
import { 
  IconDashboard, 
  IconClients, 
  IconProjects, 
  IconTasks, 
  IconChecklists, 
  IconSettings,
  IconLogo,
  IconChevronRight,
  IconChevronLeft,
  IconUser,
  IconLogOut
} from '../ui/Icons';
import { isSidebarCollapsed, setIsSidebarCollapsed } from '../../store';

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

  // Close profile menu on clicking outside
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

  return (
    <aside style={{
      width: isSidebarCollapsed() ? 'var(--layout-sidebar-collapsed)' : 'var(--layout-sidebar-width)',
      'background-color': 'var(--color-surface)',
      'border-left': '1px solid var(--color-border)',
      display: 'flex',
      'flex-direction': 'column',
      padding: 'var(--space-5) 0',
      'justify-content': 'space-between',
      'box-shadow': 'var(--shadow-sm)',
      transition: 'width 300ms cubic-bezier(0.4, 0, 0.2, 1)',
      'z-index': 20,
      'position': 'relative',
      'flex-shrink': 0
    }}>
      <div style={{ display: 'flex', 'flex-direction': 'column', gap: 'var(--space-8)' }}>
        {/* Logo Section */}
        <div style={{ 
          padding: isSidebarCollapsed() ? '0 var(--space-3)' : '0 var(--space-6)', 
          display: 'flex', 
          'flex-direction': isSidebarCollapsed() ? 'column' : 'row',
          'align-items': 'center', 
          'justify-content': isSidebarCollapsed() ? 'center' : 'space-between',
          gap: 'var(--space-3)',
          transition: 'all 300ms ease-in-out'
        }}>
          <div style={{ display: 'flex', 'align-items': 'center', gap: 'var(--space-3)' }}>
            <IconLogo />
            <span style={{ 
              'font-size': '1.25rem', 
              color: 'var(--color-text)', 
              'font-weight': 700, 
              'letter-spacing': '-0.5px',
              opacity: isSidebarCollapsed() ? 0 : 1,
              width: isSidebarCollapsed() ? '0px' : 'auto',
              overflow: 'hidden',
              'white-space': 'nowrap',
              transition: 'opacity 200ms ease-in-out, width 200ms ease-in-out'
            }}>
              کارنامه
            </span>
          </div>
          <button 
            type="button"
            onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed())}
            style={{
              padding: '6px',
              'border-radius': 'var(--radius-md)',
              border: '1px solid var(--color-border)',
              display: 'flex',
              'align-items': 'center',
              'justify-content': 'center',
              'background-color': 'rgba(255,255,255,0.01)',
              color: 'var(--color-text-muted)',
              'margin-top': isSidebarCollapsed() ? 'var(--space-2)' : '0'
            }}
          >
            {isSidebarCollapsed() ? <IconChevronLeft style={{ width: '16px', height: '16px' }} /> : <IconChevronRight style={{ width: '16px', height: '16px' }} />}
          </button>
        </div>

        {/* Navigation Items */}
        <nav style={{ display: 'flex', 'flex-direction': 'column', gap: 'var(--space-1)', padding: isSidebarCollapsed() ? '0 var(--space-2)' : '0 var(--space-3)' }}>
          <For each={menuItems}>
            {(item) => {
              const isActive = () => props.currentView === item.id;
              const Icon = item.icon;
              return (
                <div class="sidebar-item-wrapper">
                  <button
                    onClick={() => props.setView(item.id)}
                    classList={{ 'sidebar-item': true, 'active': isActive() }}
                    style={{
                      display: 'flex',
                      'align-items': 'center',
                      gap: isSidebarCollapsed() ? '0' : 'var(--space-3)',
                      'justify-content': isSidebarCollapsed() ? 'center' : 'flex-start',
                      padding: isSidebarCollapsed() ? 'var(--space-3) 0' : 'var(--space-3) var(--space-4)',
                      width: '100%',
                      transition: 'all 300ms ease-in-out'
                    }}
                  >
                    <Icon class="sidebar-icon" />
                    <span style={{
                      'font-size': '0.95rem',
                      opacity: isSidebarCollapsed() ? 0 : 1,
                      transform: isSidebarCollapsed() ? 'translateX(10px)' : 'translateX(0)',
                      transition: 'opacity 200ms ease-in-out, transform 200ms ease-in-out',
                      'white-space': 'nowrap',
                      overflow: 'hidden',
                      width: isSidebarCollapsed() ? '0px' : 'auto'
                    }}>{item.label}</span>
                  </button>
                  <Show when={isSidebarCollapsed()}>
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
          padding: isSidebarCollapsed() ? '0 var(--space-2)' : '0 var(--space-4)',
          position: 'relative'
        }}
      >
        <div 
          onClick={() => showProfileMenu() ? setShowProfileMenu(false) : setShowProfileMenu(true)}
          style={{
            display: 'flex',
            'align-items': 'center',
            'justify-content': isSidebarCollapsed() ? 'center' : 'flex-start',
            gap: isSidebarCollapsed() ? '0' : 'var(--space-3)',
            padding: isSidebarCollapsed() ? 'var(--space-2) 0' : 'var(--space-3)',
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
            'background-color': 'var(--color-primary)',
            display: 'flex',
            'align-items': 'center',
            'justify-content': 'center',
            color: 'white',
            'font-weight': 'bold',
            'font-size': '1.1rem',
            'flex-shrink': 0
          }}>
            آ
          </div>
          
          <div style={{ 
            overflow: 'hidden',
            width: isSidebarCollapsed() ? '0px' : 'auto',
            opacity: isSidebarCollapsed() ? 0 : 1,
            transition: 'opacity 200ms ease-in-out, width 200ms ease-in-out',
            'white-space': 'nowrap'
          }}>
            <h4 style={{ 'font-size': '0.9rem', 'font-weight': 600, color: 'var(--color-text)', 'text-overflow': 'ellipsis', 'white-space': 'nowrap' }}>
              آرسام
            </h4>
            <p style={{ 'font-size': '0.75rem', color: 'var(--color-text-muted)' }}>مدیر سیستم</p>
          </div>
        </div>

        {/* Options Menu on Click */}
        <Show when={showProfileMenu()}>
          <div style={{
            position: 'absolute',
            bottom: '50px',
            right: isSidebarCollapsed() ? '10px' : '16px',
            left: isSidebarCollapsed() ? 'auto' : '16px',
            'background-color': 'var(--color-surface)',
            border: '1px solid var(--color-border)',
            'border-radius': 'var(--radius-md)',
            'box-shadow': 'var(--shadow-lg)',
            padding: '4px',
            display: 'flex',
            'flex-direction': 'column',
            gap: '2px',
            'min-width': isSidebarCollapsed() ? '150px' : 'auto',
            'z-index': 1000,
            transform: isSidebarCollapsed() ? 'translateX(-80px)' : 'translateY(-10px)',
            transition: 'all 200ms ease-in-out'
          }}
          class="animate-fade-in"
          >
            <button 
              type="button"
              style={{ 
                'text-align': 'right', 
                padding: 'var(--space-2) var(--space-3)', 
                'font-size': '0.85rem', 
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
                'font-size': '0.85rem', 
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
