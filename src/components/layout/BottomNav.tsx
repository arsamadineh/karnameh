import { For } from 'solid-js';
import type { Component } from 'solid-js';
import { 
  IconDashboard, 
  IconClients, 
  IconProjects, 
  IconTasks, 
  IconChecklists, 
  IconSettings 
} from '../ui/Icons';

interface BottomNavProps {
  currentView: string;
  setView: (view: string) => void;
}

const BottomNav: Component<BottomNavProps> = (props) => {
  const menuItems = [
    { id: 'dashboard', label: 'داشبورد', icon: IconDashboard },
    { id: 'clients', label: 'مشتریان', icon: IconClients },
    { id: 'projects', label: 'پروژه‌ها', icon: IconProjects },
    { id: 'tasks', label: 'وظایف', icon: IconTasks },
    { id: 'checklists', label: 'چک‌لیست', icon: IconChecklists },
    { id: 'settings', label: 'تنظیمات', icon: IconSettings },
  ];

  return (
    <nav style={{
      width: '100%',
      height: '80px',
      'background-color': 'var(--color-surface)',
      'backdrop-filter': 'var(--blur-lg)',
      '-webkit-backdrop-filter': 'var(--blur-lg)',
      'border-top': '1px solid var(--color-border)',
      display: 'flex',
      'justify-content': 'space-around',
      'align-items': 'center',
      padding: '0 var(--space-2)',
      'padding-bottom': 'calc(env(safe-area-inset-bottom, 0px) + var(--space-2))',
      'z-index': 50,
      'box-shadow': '0 -4px 20px rgba(0, 0, 0, 0.4)',
      'flex-shrink': 0
    }}>
      <For each={menuItems}>
        {(item) => {
          const isActive = () => props.currentView === item.id;
          const Icon = item.icon;
          return (
            <button
              onClick={() => props.setView(item.id)}
              style={{
                display: 'flex',
                'flex-direction': 'column',
                'align-items': 'center',
                'justify-content': 'center',
                gap: '4px',
                width: '60px',
                height: '56px',
                'border-radius': 'var(--radius-lg)',
                transition: 'all var(--transition-fast)',
                position: 'relative',
                'background-color': 'transparent'
              }}
              onMouseEnter={(e) => {
                if (!isActive()) e.currentTarget.style.transform = 'scale(1.05)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'scale(1)';
              }}
              onMouseDown={(e) => {
                e.currentTarget.style.transform = 'scale(0.95)';
              }}
              onMouseUp={(e) => {
                e.currentTarget.style.transform = isActive() ? 'scale(1)' : 'scale(1.05)';
              }}
            >
              {/* Active Indicator Pill (Material Design 3 style) */}
              <div style={{
                position: 'absolute',
                top: '4px',
                width: '48px',
                height: '28px',
                'border-radius': '14px',
                'background-color': isActive() ? 'var(--color-primary-muted)' : 'transparent',
                'z-index': 0,
                transition: 'background-color var(--transition-fast), transform var(--transition-spring)',
                transform: isActive() ? 'scale(1)' : 'scale(0.5)',
                opacity: isActive() ? 1 : 0
              }} />

              <Icon style={{ 
                width: '20px', 
                height: '20px', 
                'z-index': 1,
                color: isActive() ? 'var(--color-primary)' : 'var(--color-text-muted)',
                transition: 'color var(--transition-fast)'
              }} />
              
              <span style={{
                'font-size': '0.7rem',
                'font-weight': isActive() ? 700 : 500,
                color: isActive() ? 'var(--color-text)' : 'var(--color-text-muted)',
                'z-index': 1,
                transition: 'color var(--transition-fast)',
                'margin-top': '2px',
                'white-space': 'nowrap'
              }}>
                {item.label}
              </span>
            </button>
          );
        }}
      </For>
    </nav>
  );
};

export default BottomNav;
