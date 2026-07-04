import { Switch, Match, Show, onMount } from 'solid-js';
import type { Component } from 'solid-js';
import BottomNav from './components/layout/BottomNav';
import Header from './components/layout/Header';
import Sidebar from './components/layout/Sidebar';
import SearchPalette from './components/layout/SearchPalette';
import Updater from './components/ui/Updater';
import WelcomeModal from './components/ui/WelcomeModal';
import UpdateChangelog from './components/ui/UpdateChangelog';
import DashboardPage from './features/dashboard/DashboardPage';
import ClientsPage from './features/clients/ClientsPage';
import ProjectsPage from './features/projects/ProjectsPage';
import TasksPage from './features/tasks/TasksPage';
import ChecklistsPage from './features/checklists/ChecklistsPage';
import SettingsPage from './features/settings/SettingsPage';
import { currentView, setCurrentView, showSidebar, bootstrapAppVersion } from './store';

const App: Component = () => {
  onMount(() => {
    // Fire-and-forget: kicks off the Tauri runtime version lookup that
    // decides whether the post-upgrade changelog modal should appear.
    void bootstrapAppVersion();
  });

  return (
    <div style={{ display: 'flex', 'flex-direction': 'column', height: '100%', width: '100%', overflow: 'hidden' }}>
      {/* Auto-Updater Modal overlay */}
      <Updater />

      {/* Welcome Modal - asks for name on first launch */}
      <WelcomeModal />

      {/* Update Changelog - shows after update */}
      <UpdateChangelog />

      {/* Search Palette Overlay */}
      <SearchPalette />

      {/* Desktop: sidebar + content side-by-side. Mobile/Tablet: stacked with bottom nav. */}
      <div classList={{ 'app-shell': true, 'has-sidebar': showSidebar() }} style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        <Show when={showSidebar()}>
          <Sidebar currentView={currentView()} setView={setCurrentView} />
        </Show>

        <main class="layout-container">
          {/* Header bar */}
          <Header title={currentView()} />

          {/* Dynamic content view */}
          <div class="content-scroll">
            <div class="content-inner">
              <Switch fallback={
                <div class="animate-fade-in" style={{ padding: 'var(--space-12) 0', 'text-align': 'center' }}>
                  <h2 style={{ color: 'var(--color-text-muted)' }}>این بخش در حال توسعه است</h2>
                </div>
              }>
                <Match when={currentView() === 'dashboard'}>
                  <DashboardPage />
                </Match>
                <Match when={currentView() === 'clients'}>
                  <ClientsPage />
                </Match>
                <Match when={currentView() === 'projects'}>
                  <ProjectsPage />
                </Match>
                <Match when={currentView() === 'tasks'}>
                  <TasksPage />
                </Match>
                <Match when={currentView() === 'checklists'}>
                  <ChecklistsPage />
                </Match>
                <Match when={currentView() === 'settings'}>
                  <SettingsPage />
                </Match>
              </Switch>
            </div>
          </div>
        </main>
      </div>

      {/* Android-style Bottom Navigation — mobile/tablet only */}
      <Show when={!showSidebar()}>
        <BottomNav currentView={currentView()} setView={setCurrentView} />
      </Show>
    </div>
  );
};

export default App;
