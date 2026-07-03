import { Switch, Match } from 'solid-js';
import type { Component } from 'solid-js';
import BottomNav from './components/layout/BottomNav';
import Header from './components/layout/Header';
import SearchPalette from './components/layout/SearchPalette';
import Updater from './components/ui/Updater';
import DashboardPage from './features/dashboard/DashboardPage';
import ClientsPage from './features/clients/ClientsPage';
import ProjectsPage from './features/projects/ProjectsPage';
import TasksPage from './features/tasks/TasksPage';
import ChecklistsPage from './features/checklists/ChecklistsPage';
import SettingsPage from './features/settings/SettingsPage';
import { currentView, setCurrentView } from './store';

const App: Component = () => {
  return (
    <div style={{ display: 'flex', 'flex-direction': 'column', height: '100%', width: '100%', overflow: 'hidden' }}>
      {/* Auto-Updater Modal overlay */}
      <Updater />
      
      {/* Search Palette Overlay */}
      <SearchPalette />
      
      {/* Main Panel */}
      <main class="layout-container">
        {/* Header bar */}
        <Header title={currentView()} />
        
        {/* Dynamic content view */}
        <div style={{ 
          flex: 1, 
          padding: 'var(--layout-page-padding)', 
          'overflow-y': 'auto',
          'background-color': 'var(--color-bg)',
          display: 'flex',
          'flex-direction': 'column',
          gap: 'var(--layout-gap)',
          width: '100%',
          'max-width': 'var(--layout-max-width)',
          margin: '0 auto'
        }}>
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
      </main>

      {/* Android-style Bottom Navigation */}
      <BottomNav currentView={currentView()} setView={setCurrentView} />
    </div>
  );
};

export default App;
