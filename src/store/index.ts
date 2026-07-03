import { createSignal } from 'solid-js';

// Navigation & Active States
export const [currentView, setCurrentView] = createSignal<string>('dashboard');
export const [selectedClientId, setSelectedClientId] = createSignal<string | null>(null);
export const [selectedProjectId, setSelectedProjectId] = createSignal<string | null>(null);

// UI Modals & Palette State
export const [searchPaletteOpen, setSearchPaletteOpen] = createSignal<boolean>(false);
export const [searchQuery, setSearchQuery] = createSignal<string>('');

// Sidebar Collapse State
export const [isSidebarCollapsed, setIsSidebarCollapsed] = createSignal<boolean>(false);

// Refresh signals to trigger resource updates in separate modules
const [clientRefreshTrigger, setClientRefreshTrigger] = createSignal(0);
const [projectRefreshTrigger, setProjectRefreshTrigger] = createSignal(0);
const [taskRefreshTrigger, setTaskRefreshTrigger] = createSignal(0);
const [checklistRefreshTrigger, setChecklistRefreshTrigger] = createSignal(0);

export const triggerClientRefresh = () => setClientRefreshTrigger(prev => prev + 1);
export const triggerProjectRefresh = () => setProjectRefreshTrigger(prev => prev + 1);
export const triggerTaskRefresh = () => setTaskRefreshTrigger(prev => prev + 1);
export const triggerChecklistRefresh = () => setChecklistRefreshTrigger(prev => prev + 1);

export { clientRefreshTrigger, projectRefreshTrigger, taskRefreshTrigger, checklistRefreshTrigger };

// Theme Management
const initialTheme = (localStorage.getItem('theme') as 'light' | 'dark' | 'system') || 'system';
export const [currentTheme, setCurrentTheme] = createSignal<'light' | 'dark' | 'system'>(initialTheme);

export function applyTheme(theme: 'light' | 'dark' | 'system') {
  if (typeof document === 'undefined') return;
  let resolvedTheme = theme;
  if (theme === 'system') {
    resolvedTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  document.documentElement.setAttribute('data-theme', resolvedTheme);
}

export function setTheme(newTheme: 'light' | 'dark' | 'system') {
  setCurrentTheme(newTheme);
  localStorage.setItem('theme', newTheme);
  applyTheme(newTheme);
}

// Compatibility toggle function
export function toggleTheme() {
  const nextTheme = currentTheme() === 'dark' ? 'light' : 'dark';
  setTheme(nextTheme);
}

// Initialize theme on load
if (typeof window !== 'undefined') {
  const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
  const handleSystemThemeChange = () => {
    if (currentTheme() === 'system') {
      applyTheme('system');
    }
  };
  mediaQuery.addEventListener('change', handleSystemThemeChange);
  applyTheme(initialTheme);
}
