import { createResource, Show, For } from 'solid-js';
import type { Component } from 'solid-js';
import { getClients, getProjects, getTasks } from '../../lib/tauri';
import { formatPersianNumber, formatJalaliDate } from '../../lib/locale';
import { setCurrentView, setSelectedProjectId } from '../../store';
import { IconUsers, IconProjects, IconTasks } from '../../components/ui/Icons';

const DashboardPage: Component = () => {
  const [clients] = createResource<any[]>(getClients);
  const [projects] = createResource<any[]>(getProjects);
  const [tasks] = createResource<any[]>(getTasks);

  const activeProjects = () => (projects() || []).filter((p: any) => p.status === 'active');
  const todoTasks = () => (tasks() || []).filter((t: any) => t.status === 'todo');

  return (
    <div class="animate-fade-in" style={{ display: 'flex', 'flex-direction': 'column', gap: 'var(--space-8)' }}>
      {/* Welcome message */}
      <div style={{ display: 'flex', 'justify-content': 'space-between', 'align-items': 'center' }}>
        <div>
          <h2 style={{ 'font-size': '1.8rem', 'font-weight': 700, 'margin-bottom': 'var(--space-2)' }}>سلام آرسام 👋</h2>
          <p style={{ color: 'var(--color-text-muted)', 'font-size': '1rem' }}>امروز {formatJalaliDate(new Date())} است.</p>
        </div>
      </div>

      {/* Stats Widgets */}
      <div class="grid-dashboard" style={{ 'grid-template-columns': 'repeat(auto-fit, minmax(250px, 1fr))' }}>
        
        {/* Clients Card */}
        <div 
          onClick={() => setCurrentView('clients')}
          class="premium-card animate-slide-up" 
          style={{ cursor: 'pointer', display: 'flex', 'flex-direction': 'column', gap: 'var(--space-3)' }}
        >
          <div style={{ display: 'flex', 'justify-content': 'space-between', 'align-items': 'center' }}>
            <span style={{ color: 'var(--color-text-muted)', 'font-weight': 500 }}>تعداد مشتریان</span>
            <IconUsers style={{ width: '22px', height: '22px', color: 'var(--color-primary)' }} />
          </div>
          <p style={{ 'font-size': '2.8rem', 'font-weight': 700, color: 'var(--color-primary)', 'line-height': 1 }}>
            <Show when={clients()} fallback={formatPersianNumber(0)}>
              {formatPersianNumber((clients() || []).length)}
            </Show>
          </p>
          <span style={{ 'font-size': '0.8rem', color: 'var(--color-text-muted)' }}>مشتریان تجاری ثبت‌شده</span>
        </div>

        {/* Projects Card */}
        <div 
          onClick={() => setCurrentView('projects')}
          class="premium-card animate-slide-up" 
          style={{ cursor: 'pointer', display: 'flex', 'flex-direction': 'column', gap: 'var(--space-3)', 'animation-delay': '100ms' }}
        >
          <div style={{ display: 'flex', 'justify-content': 'space-between', 'align-items': 'center' }}>
            <span style={{ color: 'var(--color-text-muted)', 'font-weight': 500 }}>پروژه‌های فعال</span>
            <IconProjects style={{ width: '22px', height: '22px', color: 'var(--color-success)' }} />
          </div>
          <p style={{ 'font-size': '2.8rem', 'font-weight': 700, color: 'var(--color-success)', 'line-height': 1 }}>
            <Show when={projects()} fallback={formatPersianNumber(0)}>
              {formatPersianNumber((projects() || []).filter((p: any) => p.status === 'active').length)}
            </Show>
          </p>
          <span style={{ 'font-size': '0.8rem', color: 'var(--color-text-muted)' }}>از کل {formatPersianNumber((projects() || []).length)} پروژه</span>
        </div>

        {/* Tasks Card */}
        <div 
          onClick={() => setCurrentView('tasks')}
          class="premium-card animate-slide-up" 
          style={{ cursor: 'pointer', display: 'flex', 'flex-direction': 'column', gap: 'var(--space-3)', 'animation-delay': '200ms' }}
        >
          <div style={{ display: 'flex', 'justify-content': 'space-between', 'align-items': 'center' }}>
            <span style={{ color: 'var(--color-text-muted)', 'font-weight': 500 }}>وظایف در انتظار</span>
            <IconTasks style={{ width: '22px', height: '22px', color: 'var(--color-warning)' }} />
          </div>
          <p style={{ 'font-size': '2.8rem', 'font-weight': 700, color: 'var(--color-warning)', 'line-height': 1 }}>
            <Show when={tasks()} fallback={formatPersianNumber(0)}>
              {formatPersianNumber((tasks() || []).filter((t: any) => t.status === 'todo').length)}
            </Show>
          </p>
          <span style={{ 'font-size': '0.8rem', color: 'var(--color-text-muted)' }}>وظایف انجام‌نشده در کل سیستم</span>
        </div>
      </div>

      {/* Lists Layout */}
      <div class="grid-dashboard" style={{ 'grid-template-columns': 'repeat(auto-fit, minmax(360px, 1fr))' }}>
        
        {/* Active Projects Widget */}
        <div class="premium-card animate-slide-up" style={{ display: 'flex', 'flex-direction': 'column', gap: 'var(--space-4)', 'animation-delay': '300ms' }}>
          <h3 style={{ 'font-size': '1.1rem', 'font-weight': 600, border: 'none', 'padding-bottom': '2px', display: 'flex', 'align-items': 'center', gap: 'var(--space-2)' }}>
            <IconProjects style={{ width: '20px', height: '20px', color: 'var(--color-success)' }} />
            پروژه‌های فعال اخیر
          </h3>
          <Show 
            when={activeProjects().length > 0} 
            fallback={<p style={{ color: 'var(--color-text-muted)', 'font-size': '0.9rem' }}>هیچ پروژه فعالی وجود ندارد.</p>}
          >
            <div style={{ display: 'flex', 'flex-direction': 'column', gap: 'var(--space-3)' }}>
              <For each={activeProjects().slice(0, 4)}>
                {(project) => (
                  <div 
                    onClick={() => {
                      setSelectedProjectId(project.id);
                      setCurrentView('projects');
                    }}
                    style={{
                      display: 'flex',
                      'align-items': 'center',
                      'justify-content': 'space-between',
                      padding: 'var(--space-3)',
                      'border-radius': 'var(--radius-md)',
                      'background-color': 'rgba(255,255,255,0.01)',
                      border: '1px solid var(--color-border)',
                      cursor: 'pointer'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)'}
                    onMouseLeave={(e) => e.currentTarget.style.borderColor = 'var(--color-border)'}
                  >
                    <div style={{ display: 'flex', 'align-items': 'center', gap: 'var(--space-3)' }}>
                      <div style={{ width: '8px', height: '8px', 'border-radius': 'var(--radius-round)', 'background-color': project.color || 'var(--color-primary)' }} />
                      <span style={{ 'font-weight': 600, 'font-size': '0.95rem' }}>{project.title}</span>
                    </div>
                    <span class="badge badge-low" style={{ 'background-color': 'var(--color-success-muted)', color: 'var(--color-success)' }}>
                      فعال
                    </span>
                  </div>
                )}
              </For>
            </div>
          </Show>
        </div>

        {/* Pending Tasks Widget */}
        <div class="premium-card animate-slide-up" style={{ display: 'flex', 'flex-direction': 'column', gap: 'var(--space-4)', 'animation-delay': '400ms' }}>
          <h3 style={{ 'font-size': '1.1rem', 'font-weight': 600, border: 'none', 'padding-bottom': '2px', display: 'flex', 'align-items': 'center', gap: 'var(--space-2)' }}>
            <IconTasks style={{ width: '20px', height: '20px', color: 'var(--color-warning)' }} />
            وظایف معوقه و جدید
          </h3>
          <Show 
            when={todoTasks().length > 0} 
            fallback={<p style={{ color: 'var(--color-text-muted)', 'font-size': '0.9rem' }}>همه کارها انجام شده است!</p>}
          >
            <div style={{ display: 'flex', 'flex-direction': 'column', gap: 'var(--space-3)' }}>
              <For each={todoTasks().slice(0, 4)}>
                {(task) => (
                  <div 
                    onClick={() => setCurrentView('tasks')}
                    style={{
                      display: 'flex',
                      'align-items': 'center',
                      'justify-content': 'space-between',
                      padding: 'var(--space-3)',
                      'border-radius': 'var(--radius-md)',
                      'background-color': 'rgba(255,255,255,0.01)',
                      border: '1px solid var(--color-border)',
                      cursor: 'pointer'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)'}
                    onMouseLeave={(e) => e.currentTarget.style.borderColor = 'var(--color-border)'}
                  >
                    <div style={{ display: 'flex', 'flex-direction': 'column', gap: '2px' }}>
                      <span style={{ 'font-weight': 600, 'font-size': '0.95rem' }}>{task.title}</span>
                      <span style={{ 'font-size': '0.75rem', color: 'var(--color-text-muted)' }}>
                        {task.due_date ? `مهلت: ${formatJalaliDate(task.due_date)}` : 'بدون زمان مهلت'}
                      </span>
                    </div>
                    <span class={`badge badge-${task.priority}`}>
                      {task.priority === 'high' ? 'فوری' : task.priority === 'medium' ? 'متوسط' : 'عادی'}
                    </span>
                  </div>
                )}
              </For>
            </div>
          </Show>
        </div>

      </div>
    </div>
  );
};

export default DashboardPage;
