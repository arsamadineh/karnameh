import { createSignal, createResource, Show, For, onMount, onCleanup, createEffect } from 'solid-js';
import type { Component } from 'solid-js';
import { getClients, getProjects, getTasks } from '../../lib/tauri';
import { 
  searchPaletteOpen, 
  setSearchPaletteOpen, 
  setCurrentView, 
  setSelectedClientId, 
  setSelectedProjectId 
} from '../../store';

interface SearchResult {
  id: string;
  type: 'client' | 'project' | 'task';
  title: string;
  subtitle: string;
  color?: string;
  original: any;
}

const SearchPalette: Component = () => {
  const [query, setQuery] = createSignal('');
  const [activeIndex, setActiveIndex] = createSignal(0);
  
  // Load data reactively when open
  const [clients] = createResource<any[], boolean>(
    () => searchPaletteOpen(),
    async (open) => open ? await getClients() : []
  );
  const [projects] = createResource<any[], boolean>(
    () => searchPaletteOpen(),
    async (open) => open ? await getProjects() : []
  );
  const [tasks] = createResource<any[], boolean>(
    () => searchPaletteOpen(),
    async (open) => open ? await getTasks() : []
  );

  let inputRef: HTMLInputElement | undefined;

  // Auto-focus input when palette opens
  createEffect(() => {
    if (searchPaletteOpen()) {
      setTimeout(() => {
        inputRef?.focus();
        setQuery('');
        setActiveIndex(0);
      }, 50);
    }
  });

  // Combine and filter results
  const filteredResults = () => {
    const q = query().toLowerCase().trim();
    const results: SearchResult[] = [];

    const rawClients = (clients() || []) as any[];
    const rawProjects = (projects() || []) as any[];
    const rawTasks = (tasks() || []) as any[];

    // Map clients
    rawClients.forEach(c => {
      if (!q || c.name.toLowerCase().includes(q) || (c.phone && c.phone.includes(q))) {
        results.push({
          id: c.id,
          type: 'client',
          title: c.name,
          subtitle: c.phone ? `مشتری • تماس: ${c.phone}` : 'مشتری',
          color: c.color,
          original: c
        });
      }
    });

    // Map projects
    rawProjects.forEach(p => {
      const clientName = rawClients.find(c => c.id === p.client_id)?.name || '';
      if (!q || p.title.toLowerCase().includes(q) || p.description.toLowerCase().includes(q) || clientName.toLowerCase().includes(q)) {
        results.push({
          id: p.id,
          type: 'project',
          title: p.title,
          subtitle: `پروژه • مشتری: ${clientName || 'نامشخص'} • وضعیت: ${p.status === 'active' ? 'فعال' : p.status === 'draft' ? 'پیش‌نویس' : 'بسته شده'}`,
          color: p.color,
          original: p
        });
      }
    });

    // Map tasks
    rawTasks.forEach(t => {
      const projName = rawProjects.find(p => p.id === t.project_id)?.title || '';
      if (!q || t.title.toLowerCase().includes(q) || t.description.toLowerCase().includes(q) || projName.toLowerCase().includes(q)) {
        results.push({
          id: t.id,
          type: 'task',
          title: t.title,
          subtitle: `وظیفه • پروژه: ${projName || 'نامشخص'} • اولویت: ${t.priority === 'high' ? 'بالا' : t.priority === 'medium' ? 'متوسط' : 'کم'}`,
          original: t
        });
      }
    });

    return results.slice(0, 8); // Limit to top 8 items
  };

  const handleSelect = (item: SearchResult) => {
    setSearchPaletteOpen(false);
    if (item.type === 'client') {
      setSelectedClientId(item.id);
      setCurrentView('clients');
    } else if (item.type === 'project') {
      setSelectedProjectId(item.id);
      setCurrentView('projects');
    } else if (item.type === 'task') {
      if (item.original.project_id) {
        setSelectedProjectId(item.original.project_id);
      }
      setCurrentView('tasks');
    }
  };

  // Keyboard Navigation
  const handleKeyDown = (e: KeyboardEvent) => {
    if (!searchPaletteOpen()) return;

    if (e.key === 'Escape') {
      setSearchPaletteOpen(false);
      e.preventDefault();
    } else if (e.key === 'ArrowDown') {
      setActiveIndex(prev => (prev + 1) % Math.max(1, filteredResults().length));
      e.preventDefault();
    } else if (e.key === 'ArrowUp') {
      setActiveIndex(prev => (prev - 1 + filteredResults().length) % Math.max(1, filteredResults().length));
      e.preventDefault();
    } else if (e.key === 'Enter') {
      const items = filteredResults();
      if (items[activeIndex()]) {
        handleSelect(items[activeIndex()]);
      }
      e.preventDefault();
    }
  };

  // Bind Ctrl+K / Cmd+K globally
  const handleGlobalKeys = (e: KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
      setSearchPaletteOpen(!searchPaletteOpen());
      e.preventDefault();
    }
  };

  onMount(() => {
    window.addEventListener('keydown', handleGlobalKeys);
    window.addEventListener('keydown', handleKeyDown);
  });

  onCleanup(() => {
    window.removeEventListener('keydown', handleGlobalKeys);
    window.removeEventListener('keydown', handleKeyDown);
  });

  return (
    <Show when={searchPaletteOpen()}>
      {/* Overlay Backdrop */}
      <div 
        onClick={() => setSearchPaletteOpen(false)}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          'background-color': 'rgba(0, 0, 0, 0.6)',
          'backdrop-filter': 'var(--blur-md)',
          '-webkit-backdrop-filter': 'var(--blur-md)',
          'z-index': 9999,
          display: 'flex',
          'align-items': 'start',
          'justify-content': 'center',
          padding: '100px var(--space-4) 0 var(--space-4)'
        }}
        class="animate-fade-in"
      >
        {/* Search Modal Box */}
        <div 
          onClick={(e) => e.stopPropagation()}
          style={{
            width: '100%',
            'max-width': '600px',
            'background-color': 'var(--color-surface)',
            border: '1px solid var(--color-border)',
            'border-radius': 'var(--radius-lg)',
            'box-shadow': 'var(--shadow-lg)',
            display: 'flex',
            'flex-direction': 'column',
            overflow: 'hidden'
          }}
          class="animate-slide-up"
        >
          {/* Search Input Area */}
          <div style={{
            display: 'flex',
            'align-items': 'center',
            gap: 'var(--space-3)',
            padding: 'var(--space-4) var(--space-5)',
            'border-bottom': '1px solid var(--color-border)'
          }}>
            <span style={{ 'font-size': 'var(--text-h1-size)' }}>🔍</span>
            <input 
              ref={inputRef}
              type="text"
              placeholder="جستجو در مشتریان، پروژه‌ها، و وظایف..."
              value={query()}
              onInput={(e) => {
                setQuery(e.currentTarget.value);
                setActiveIndex(0);
              }}
              style={{
                flex: 1,
                'font-size': 'var(--text-body-size)',
                color: 'var(--color-text)'
              }}
            />
            <button 
              onClick={() => setSearchPaletteOpen(false)}
              style={{
                'font-size': 'var(--text-xs-size)',
                color: 'var(--color-text-muted)',
                padding: '2px 8px',
                'border-radius': 'var(--radius-sm)',
                border: '1px solid var(--color-border)',
                'background-color': 'var(--color-surface-hover)'
              }}
            >
              Esc
            </button>
          </div>

          {/* Results Area */}
          <div style={{ 'max-height': '350px', 'overflow-y': 'auto', padding: 'var(--space-2)' }}>
            <Show 
              when={filteredResults().length > 0} 
              fallback={
                <div style={{ padding: 'var(--space-8) 0', 'text-align': 'center', color: 'var(--color-text-muted)' }}>
                  موردی یافت نشد 🧐
                </div>
              }
            >
              <div style={{ display: 'flex', 'flex-direction': 'column', gap: '2px' }}>
                <For each={filteredResults()}>
                  {(item, index) => {
                    const isSelected = () => index() === activeIndex();
                    return (
                      <button
                        onClick={() => handleSelect(item)}
                        style={{
                          display: 'flex',
                          'align-items': 'center',
                          'justify-content': 'space-between',
                          padding: 'var(--space-3) var(--space-4)',
                          'border-radius': 'var(--radius-md)',
                          'background-color': isSelected() ? 'var(--color-primary-muted)' : 'transparent',
                          transition: 'all var(--transition-fast)',
                          'text-align': 'right',
                          border: '1px solid transparent',
                          'border-color': isSelected() ? 'var(--color-border-glow)' : 'transparent'
                        }}
                      >
                        <div style={{ display: 'flex', 'align-items': 'center', gap: 'var(--space-3)' }}>
                          <div style={{
                            width: '28px',
                            height: '28px',
                            'border-radius': 'var(--radius-sm)',
                            'background-color': item.color || 'var(--color-surface-hover)',
                            display: 'flex',
                            'align-items': 'center',
                            'justify-content': 'center',
                            'font-size': 'var(--text-sm-size)'
                          }}>
                            {item.type === 'client' ? '👥' : item.type === 'project' ? '📁' : '✅'}
                          </div>
                          <div>
                            <div style={{ 'font-weight': 600, color: isSelected() ? 'var(--color-primary)' : 'var(--color-text)', 'font-size': 'var(--text-body-size)' }}>
                              {item.title}
                            </div>
                            <div style={{ 'font-size': 'var(--text-sm-size)', color: 'var(--color-text-muted)', 'margin-top': '2px' }}>
                              {item.subtitle}
                            </div>
                          </div>
                        </div>
                        
                        <Show when={isSelected()}>
                          <span style={{ 'font-size': 'var(--text-sm-size)', color: 'var(--color-primary)' }}>↵ باز کردن</span>
                        </Show>
                      </button>
                    );
                  }}
                </For>
              </div>
            </Show>
          </div>
          
          {/* Footer Guidelines */}
          <div style={{
            padding: 'var(--space-2) var(--space-5)',
            'background-color': 'rgba(255,255,255,0.01)',
            'border-top': '1px solid var(--color-border)',
            display: 'flex',
            'justify-content': 'space-between',
            'font-size': 'var(--text-xs-size)',
            color: 'var(--color-text-muted)'
          }}>
            <span>ناوبری با کلیدهای جهتی ↑↓</span>
            <span>کلید Enter جهت ورود</span>
          </div>
        </div>
      </div>
    </Show>
  );
};

export default SearchPalette;
