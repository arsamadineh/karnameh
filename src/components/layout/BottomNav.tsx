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

  // On very narrow phones, hide labels so all six items fit comfortably.
  const showLabels = () => !isCompactNav();

  return (
    <nav class="bottom-nav">
      <For each={menuItems}>
        {(item) => {
          const isActive = () => props.currentView === item.id;
          const Icon = item.icon;
          return (
            <button
              onClick={() => props.setView(item.id)}
              class="bottom-nav-btn"
              aria-label={item.label}
              aria-current={isActive() ? 'page' : undefined}
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
              <div
                class="bottom-nav-pill"
                classList={{ 'is-active': isActive() }}
              />

              <Icon
                class="bottom-nav-icon"
                style={{
                  color: isActive() ? 'var(--color-primary)' : 'var(--color-text-muted)'
                }}
              />

              <Show when={showLabels()}>
                <span
                  class="bottom-nav-label"
                  style={{
                    'font-weight': isActive() ? 700 : 500,
                    color: isActive() ? 'var(--color-text)' : 'var(--color-text-muted)'
                  }}
                >
                  {item.label}
                </span>
              </Show>
            </button>
          );
        }}
      </For>
    </nav>
  );
};

export default BottomNav;
