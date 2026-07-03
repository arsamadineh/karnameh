import { createSignal } from 'solid-js';
import { createMediaQuery } from '../lib/media';

// Navigation & Active States
export const [currentView, setCurrentView] = createSignal<string>('dashboard');
export const [selectedClientId, setSelectedClientId] = createSignal<string | null>(null);
export const [selectedProjectId, setSelectedProjectId] = createSignal<string | null>(null);

// UI Modals & Palette State
export const [searchPaletteOpen, setSearchPaletteOpen] = createSignal<boolean>(false);
export const [searchQuery, setSearchQuery] = createSignal<string>('');

// Sidebar Collapse State
export const [isSidebarCollapsed, setIsSidebarCollapsed] = createSignal<boolean>(false);

// ─── Viewport / responsive breakpoints ───
// Single source of truth for adaptive layout decisions. Matches the CSS
// breakpoints in src/styles/global.css (mobile <768, tablet 768–1023, desktop ≥1024).
export const isMobile = createMediaQuery('(max-width: 767px)');
export const isTablet = createMediaQuery('(min-width: 768px) and (max-width: 1023px)');
export const isDesktop = createMediaQuery('(min-width: 1024px)');
// The desktop sidebar is shown from the tablet breakpoint up on large screens;
// phones and small tablets use the bottom navigation instead.
export const showSidebar = createMediaQuery('(min-width: 1024px)');
// Extra-narrow phones drop nav labels to fit six items comfortably.
export const isCompactNav = createMediaQuery('(max-width: 380px)');

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
