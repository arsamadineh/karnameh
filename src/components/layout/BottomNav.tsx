import { For, Show } from 'solid-js';
import type { Component } from 'solid-js';
import {
  IconDashboard,
  IconClients,
  IconProjects,
  IconTasks,
  IconChecklists,
  IconSettings
} from '../ui/Icons';
import { isCompactNav } from '../../store';

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

  const showLabels = () => !isCompactNav();

  return (
    <nav class="bottom-nav-glass">
      <div class="bottom-nav-glass-inner">
        <For each={menuItems}>
          {(item) => {
            const isActive = () => props.currentView === item.id;
            const Icon = item.icon;
            return (
              <button
                onClick={() => props.setView(item.id)}
                class="bottom-nav-glass-btn"
                aria-label={item.label}
                aria-current={isActive() ? 'page' : undefined}
              >
                {/* Active glow blob */}
                <Show when={isActive()}>
                  <div class="bottom-nav-glass-blob" />
                </Show>

                <div class="bottom-nav-glass-icon-wrap" style={{
                  'background': isActive() ? 'var(--color-secondary-muted)' : 'transparent',
                  'box-shadow': isActive() ? '0 2px 12px var(--color-secondary-glow)' : 'none',
                }}>
                  <Icon
                    class="bottom-nav-glass-icon"
                    style={{
                      color: isActive() ? 'var(--color-secondary)' : 'var(--color-text-muted)',
                      'transform': isActive() ? 'scale(1.1)' : 'scale(1)',
                    }}
                  />
                </div>

                <Show when={showLabels()}>
                  <span
                    class="bottom-nav-glass-label"
                    style={{
                      'font-weight': isActive() ? 700 : 500,
                      color: isActive() ? 'var(--color-secondary)' : 'var(--color-text-muted)',
                      opacity: isActive() ? 1 : 0.7,
                    }}
                  >
                    {item.label}
                  </span>
                </Show>
              </button>
            );
          }}
        </For>
      </div>
    </nav>
  );
};

export default BottomNav;
