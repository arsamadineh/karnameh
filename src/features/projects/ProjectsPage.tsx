import { createResource, For, Show, createSignal, createEffect } from 'solid-js';
import type { Component } from 'solid-js';
import { getProjects, createProject, updateProject, deleteProject, getClients, getTasks } from '../../lib/tauri';
import { formatPersianNumber, formatJalaliDate } from '../../lib/locale';
import { selectedProjectId, setSelectedProjectId, projectRefreshTrigger, triggerProjectRefresh, triggerTaskRefresh, triggerClientRefresh } from '../../store';
import { Modal } from '../../components/ui/Modal';
import { IconEdit, IconTrash, IconProjects } from '../../components/ui/Icons';
import { CustomSelect } from '../../components/ui/CustomSelect';
import { JalaliDatePicker } from '../../components/ui/JalaliDatePicker';

const ProjectsPage: Component = () => {
  // Sync resource refetching with global trigger signals
  const [projects, { refetch: refetchProjects }] = createResource<any[]>(async () => {
    projectRefreshTrigger(); // track trigger
    return await getProjects();
  });

  const [clients] = createResource<any[]>(getClients);
  const [tasks] = createResource<any[]>(getTasks);

  const [isAdding, setIsAdding] = createSignal(false);
  const [isEditing, setIsEditing] = createSignal(false);
  const [statusFilter, setStatusFilter] = createSignal('all');
  const [searchQuery, setSearchQuery] = createSignal('');
  const [projectToDelete, setProjectToDelete] = createSignal<string | null>(null);

  // Form Signals
  const [clientId, setClientId] = createSignal<string>('');
  const [title, setTitle] = createSignal('');
  const [description, setDescription] = createSignal('');
  const [status, setStatus] = createSignal('draft');
  const [priority, setPriority] = createSignal('medium');
  const [budget, setBudget] = createSignal<number>(0);
  const [spent, setSpent] = createSignal<number>(0);
  const [deadline, setDeadline] = createSignal('');
  const [color, setColor] = createSignal('#6366f1');

  // Predefined color palette
  const colors = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#ec4899', '#8b5cf6', '#06b6d4', '#f97316'];

  // Map clients to options format
  const clientOptions = () => {
    const list = clients() || [];
    return [
      { value: '', label: 'بدون مشتری (شخصی)' },
      ...list.map((c: any) => ({ value: c.id, label: c.name }))
    ];
  };

  // Selected project details
  const activeProject = () => {
    const id = selectedProjectId();
    if (!id) return null;
    return (projects() || []).find((p: any) => p.id === id) || null;
  };

  // Sync form inputs when active project changes
  createEffect(() => {
    const proj = activeProject();
    if (proj) {
      setClientId(proj.client_id || '');
      setTitle(proj.title || '');
      setDescription(proj.description || '');
      setStatus(proj.status || 'draft');
      setPriority(proj.priority || 'medium');
      setBudget(proj.budget || 0);
      setSpent(proj.spent || 0);
      setDeadline(proj.deadline ? proj.deadline.split('T')[0] : '');
      setColor(proj.color || '#6366f1');
    } else {
      clearForm();
    }
  });

  const clearForm = () => {
    setClientId('');
    setTitle('');
    setDescription('');
    setStatus('draft');
    setPriority('medium');
    setBudget(0);
    setSpent(0);
    setDeadline('');
    setColor('#6366f1');
  };

  const handleAddSubmit = async (e: Event) => {
    e.preventDefault();
    if (!title()) return;

    await createProject({
      client_id: clientId() || null,
      title: title(),
      description: description() || null,
      status: status(),
      priority: priority(),
      budget: budget() ? Number(budget()) : 0,
      deadline: deadline() || null,
      color: color()
    });

    clearForm();
    setIsAdding(false);
    refetchProjects();
    triggerProjectRefresh();
    triggerClientRefresh(); // client total budget updates
  };

  const handleEditSubmit = async (e: Event) => {
    e.preventDefault();
    const proj = activeProject();
    if (!proj || !title()) return;

    await updateProject({
      id: proj.id,
      title: title(),
      description: description() || '',
      status: status(),
      priority: priority(),
      budget: budget() ? Number(budget()) : 0,
      spent: spent() ? Number(spent()) : 0,
      deadline: deadline() || null,
      color: color()
    });

    setIsEditing(false);
    refetchProjects();
    triggerProjectRefresh();
    triggerClientRefresh();
    triggerTaskRefresh();
  };

  const openDeleteModal = (id: string) => setProjectToDelete(id);

  const handleDeleteConfirm = async () => {
    const id = projectToDelete();
    if (!id) return;
    await deleteProject(id);
    setSelectedProjectId(null);
    setProjectToDelete(null);
    refetchProjects();
    triggerProjectRefresh();
    triggerClientRefresh();
    triggerTaskRefresh();
  };

  // Associated client
  const projectClient = () => {
    const proj = activeProject();
    if (!proj || !proj.client_id) return null;
    return (clients() || []).find((c: any) => c.id === proj.client_id) || null;
  };

  // Associated tasks
  const projectTasks = () => {
    const proj = activeProject();
    if (!proj) return [];
    return (tasks() || []).filter((t: any) => t.project_id === proj.id);
  };

  // Filters projects
  const filteredProjects = () => {
    const query = searchQuery().toLowerCase().trim();
    const filter = statusFilter();
    let list = projects() || [];

    if (filter !== 'all') {
      list = list.filter((p: any) => p.status === filter);
    }

    if (query) {
      list = list.filter((p: any) => 
        p.title.toLowerCase().includes(query) || 
        p.description.toLowerCase().includes(query)
      );
    }

    return list;
  };

  const getStatusLabel = (s: string) => {
    switch (s) {
      case 'draft': return 'پیش‌نویس';
      case 'active': return 'فعال';
      case 'completed': return 'تکمیل‌شده';
      case 'closed': return 'بسته‌شده';
      default: return s;
    }
  };

  return (
    <div class="animate-fade-in" style={{ display: 'flex', height: '100%', gap: 'var(--space-6)' }}>
      
      {/* RIGHT SIDE: Projects List Panel */}
      <div style={{
        width: '320px',
        display: 'flex',
        'flex-direction': 'column',
        gap: 'var(--space-4)',
        'border-left': '1px solid var(--color-border)',
        'padding-left': 'var(--space-6)',
        'flex-shrink': 0
      }}>
        {/* Search & Add Button */}
        <div style={{ display: 'flex', 'flex-direction': 'column', gap: 'var(--space-3)' }}>
          <div style={{ display: 'flex', 'justify-content': 'space-between', 'align-items': 'center' }}>
            <h2 style={{ 'font-size': 'var(--text-h1-size)', 'font-weight': 700 }}>پروژه‌ها</h2>
            <button 
              onClick={() => {
                setIsAdding(true);
                setSelectedProjectId(null);
                clearForm();
              }}
              class="btn-primary"
              style={{ padding: '4px 10px', 'font-size': 'var(--text-sm-size)' }}
            >
              افزودن +
            </button>
          </div>
          
          <input 
            type="text" 
            placeholder="جستجو در پروژه‌ها..." 
            value={searchQuery()}
            onInput={(e) => setSearchQuery(e.currentTarget.value)}
            class="premium-input"
            style={{ padding: '8px 12px', 'font-size': 'var(--text-sm-size)' }}
          />
        </div>

        {/* Status Filter Tabs */}
        <div style={{
          display: 'flex',
          gap: '2px',
          padding: '2px',
          'background-color': 'rgba(255,255,255,0.02)',
          'border-radius': 'var(--radius-md)',
          border: '1px solid var(--color-border)'
        }}>
          <For each={['all', 'active', 'draft', 'completed']}>
            {(statusOpt) => (
              <button
                onClick={() => setStatusFilter(statusOpt)}
                style={{
                  flex: 1,
                  padding: '4px 0',
                  'font-size': 'var(--text-xs-size)',
                  'font-weight': statusFilter() === statusOpt ? 600 : 400,
                  'border-radius': 'var(--radius-sm)',
                  'background-color': statusFilter() === statusOpt ? 'var(--color-surface-hover)' : 'transparent',
                  color: statusFilter() === statusOpt ? 'var(--color-text)' : 'var(--color-text-muted)'
                }}
              >
                {statusOpt === 'all' ? 'همه' : getStatusLabel(statusOpt)}
              </button>
            )}
          </For>
        </div>

        {/* List Content */}
        <div style={{ flex: 1, 'overflow-y': 'auto', display: 'flex', 'flex-direction': 'column', gap: 'var(--space-2)' }}>
          <Show when={projects()} fallback={<p style={{ color: 'var(--color-text-muted)', 'font-size': 'var(--text-body-size)' }}>در حال بارگذاری...</p>}>
            <Show when={filteredProjects().length > 0} fallback={<p style={{ color: 'var(--color-text-muted)', 'font-size': 'var(--text-body-size)', 'text-align': 'center', 'padding-top': 'var(--space-8)' }}>پروژه‌ای یافت نشد</p>}>
              <For each={filteredProjects()}>
                {(proj) => {
                  const isSelected = () => selectedProjectId() === proj.id;
                  const clientName = () => (clients() || []).find((c: any) => c.id === proj.client_id)?.name || '';
                  return (
                    <button
                      onClick={() => {
                        setSelectedProjectId(proj.id);
                        setIsAdding(false);
                        setIsEditing(false);
                      }}
                      style={{
                        display: 'flex',
                        'flex-direction': 'column',
                        gap: 'var(--space-2)',
                        padding: 'var(--space-3)',
                        'border-radius': 'var(--radius-md)',
                        'background-color': isSelected() ? 'var(--color-primary-muted)' : 'transparent',
                        border: '1px solid transparent',
                        'border-color': isSelected() ? 'var(--color-border-glow)' : 'transparent',
                        width: '100%',
                        'text-align': 'right'
                      }}
                      onMouseEnter={(e) => {
                        if (!isSelected()) e.currentTarget.style.backgroundColor = 'var(--color-surface)';
                      }}
                      onMouseLeave={(e) => {
                        if (!isSelected()) e.currentTarget.style.backgroundColor = 'transparent';
                      }}
                    >
                      <div style={{ display: 'flex', 'justify-content': 'space-between', 'align-items': 'center', width: '100%' }}>
                        <div style={{ display: 'flex', 'align-items': 'center', gap: 'var(--space-2)' }}>
                          <div style={{ width: '8px', height: '8px', 'border-radius': '50%', 'background-color': proj.color || 'var(--color-primary)' }} />
                          <span style={{ 'font-weight': 600, 'font-size': 'var(--text-body-size)', color: isSelected() ? 'var(--color-primary)' : 'var(--color-text)' }}>
                            {proj.title}
                          </span>
                        </div>
                        <span class={`badge badge-${proj.status === 'active' ? 'in-progress' : proj.status === 'completed' ? 'done' : 'todo'}`} style={{ 'font-size': 'var(--text-xs-size)' }}>
                          {getStatusLabel(proj.status)}
                        </span>
                      </div>
                      
                      <div style={{ display: 'flex', 'justify-content': 'space-between', 'align-items': 'center', width: '100%', 'font-size': 'var(--text-xs-size)', color: 'var(--color-text-muted)' }}>
                        <span>مشتری: {clientName() || 'بدون مشتری'}</span>
                        <Show when={proj.deadline}>
                          <span>مهلت: {formatPersianNumber(formatJalaliDate(proj.deadline).split(' ')[0])} {formatJalaliDate(proj.deadline).split(' ')[1]}</span>
                        </Show>
                      </div>
                    </button>
                  );
                }}
              </For>
            </Show>
          </Show>
        </div>
      </div>

      {/* LEFT SIDE: Detail / Form Panel */}
      <div style={{ flex: 1, overflow: 'hidden', display: 'flex', 'flex-direction': 'column' }}>
        
        {/* CASE 1: Adding a Project */}
        <Show when={isAdding()}>
          <div class="premium-card animate-slide-up" style={{ 'max-width': '650px', display: 'flex', 'flex-direction': 'column', gap: 'var(--space-5)' }}>
            <h3 style={{ 'font-size': 'var(--text-h1-size)', 'font-weight': 700 }}>تعریف پروژه جدید</h3>
            
            <form onSubmit={handleAddSubmit} style={{ display: 'flex', 'flex-direction': 'column', gap: 'var(--space-4)' }}>
              <div style={{ display: 'grid', 'grid-template-columns': '1fr 1fr', gap: 'var(--space-4)' }}>
                <div style={{ display: 'flex', 'flex-direction': 'column', gap: 'var(--space-1)' }}>
                  <label style={{ 'font-size': 'var(--text-sm-size)', color: 'var(--color-text-muted)' }}>عنوان پروژه *</label>
                  <input type="text" value={title()} onInput={e => setTitle(e.currentTarget.value)} required class="premium-input" placeholder="طراحی وب‌سایت..." />
                </div>
                <div style={{ display: 'flex', 'flex-direction': 'column', gap: 'var(--space-1)' }}>
                  <label style={{ 'font-size': 'var(--text-sm-size)', color: 'var(--color-text-muted)' }}>مشتری مرتبط</label>
                  <CustomSelect
                    value={clientId()}
                    onChange={setClientId}
                    options={clientOptions()}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', 'grid-template-columns': '1fr 1fr', gap: 'var(--space-4)' }}>
                <div style={{ display: 'flex', 'flex-direction': 'column', gap: 'var(--space-1)' }}>
                  <label style={{ 'font-size': 'var(--text-sm-size)', color: 'var(--color-text-muted)' }}>بودجه (ریال)</label>
                  <input type="number" value={budget()} onInput={e => setBudget(Number(e.currentTarget.value))} class="premium-input" placeholder="بودجه کل به ریال..." />
                </div>
                <div style={{ display: 'flex', 'flex-direction': 'column', gap: 'var(--space-1)' }}>
                  <label style={{ 'font-size': 'var(--text-sm-size)', color: 'var(--color-text-muted)' }}>مهلت تحویل</label>
                  <JalaliDatePicker value={deadline()} onChange={setDeadline} placeholder="انتخاب مهلت تحویل..." />
                </div>
              </div>

              <div style={{ display: 'grid', 'grid-template-columns': '1fr 1fr', gap: 'var(--space-4)' }}>
                <div style={{ display: 'flex', 'flex-direction': 'column', gap: 'var(--space-1)' }}>
                  <label style={{ 'font-size': 'var(--text-sm-size)', color: 'var(--color-text-muted)' }}>اولویت</label>
                  <CustomSelect
                    value={priority()}
                    onChange={setPriority}
                    options={[
                      { value: 'low', label: 'کم' },
                      { value: 'medium', label: 'متوسط' },
                      { value: 'high', label: 'بالا (فوری)' }
                    ]}
                  />
                </div>
                <div style={{ display: 'flex', 'flex-direction': 'column', gap: 'var(--space-1)' }}>
                  <label style={{ 'font-size': 'var(--text-sm-size)', color: 'var(--color-text-muted)' }}>وضعیت پروژه</label>
                  <CustomSelect
                    value={status()}
                    onChange={setStatus}
                    options={[
                      { value: 'draft', label: 'پیش‌نویس' },
                      { value: 'active', label: 'فعال' },
                      { value: 'completed', label: 'تکمیل‌شده' },
                      { value: 'closed', label: 'بسته‌شده' }
                    ]}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', 'flex-direction': 'column', gap: 'var(--space-1)' }}>
                <label style={{ 'font-size': 'var(--text-sm-size)', color: 'var(--color-text-muted)' }}>رنگ نمایه</label>
                <div style={{ display: 'flex', gap: 'var(--space-2)', 'align-items': 'center', 'margin-top': '4px' }}>
                  <For each={colors}>
                    {(c) => (
                      <button 
                        type="button"
                        onClick={() => setColor(c)}
                        style={{
                          width: '24px', height: '24px', 'border-radius': 'var(--radius-round)',
                          'background-color': c, border: color() === c ? '2px solid white' : 'none',
                          'box-shadow': color() === c ? '0 0 4px rgba(0,0,0,0.5)' : 'none'
                        }}
                      />
                    )}
                  </For>
                </div>
              </div>

              <div style={{ display: 'flex', 'flex-direction': 'column', gap: 'var(--space-1)' }}>
                <label style={{ 'font-size': 'var(--text-sm-size)', color: 'var(--color-text-muted)' }}>توضیحات</label>
                <textarea value={description()} onInput={e => setDescription(e.currentTarget.value)} class="premium-input" style={{ height: '80px', resize: 'none' }} placeholder="شرح پروژه..." />
              </div>

              <div style={{ display: 'flex', gap: 'var(--space-3)', 'justify-content': 'end', 'margin-top': 'var(--space-2)' }}>
                <button type="button" onClick={() => setIsAdding(false)} class="btn-secondary">انصراف</button>
                <button type="submit" class="btn-primary">ایجاد پروژه</button>
              </div>
            </form>
          </div>
        </Show>

        {/* CASE 2: Editing a Project */}
        <Show when={isEditing() && activeProject()}>
          <div class="premium-card animate-slide-up" style={{ 'max-width': '650px', display: 'flex', 'flex-direction': 'column', gap: 'var(--space-5)' }}>
            <h3 style={{ 'font-size': 'var(--text-h1-size)', 'font-weight': 700 }}>ویرایش پروژه: {activeProject()?.title}</h3>
            
            <form onSubmit={handleEditSubmit} style={{ display: 'flex', 'flex-direction': 'column', gap: 'var(--space-4)' }}>
              <div style={{ display: 'grid', 'grid-template-columns': '1fr 1fr', gap: 'var(--space-4)' }}>
                <div style={{ display: 'flex', 'flex-direction': 'column', gap: 'var(--space-1)' }}>
                  <label style={{ 'font-size': 'var(--text-sm-size)', color: 'var(--color-text-muted)' }}>عنوان پروژه *</label>
                  <input type="text" value={title()} onInput={e => setTitle(e.currentTarget.value)} required class="premium-input" />
                </div>
                <div style={{ display: 'flex', 'flex-direction': 'column', gap: 'var(--space-1)' }}>
                  <label style={{ 'font-size': 'var(--text-sm-size)', color: 'var(--color-text-muted)' }}>اولویت</label>
                  <CustomSelect
                    value={priority()}
                    onChange={setPriority}
                    options={[
                      { value: 'low', label: 'کم' },
                      { value: 'medium', label: 'متوسط' },
                      { value: 'high', label: 'بالا' }
                    ]}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', 'grid-template-columns': '1fr 1fr', gap: 'var(--space-4)' }}>
                <div style={{ display: 'flex', 'flex-direction': 'column', gap: 'var(--space-1)' }}>
                  <label style={{ 'font-size': 'var(--text-sm-size)', color: 'var(--color-text-muted)' }}>بودجه (ریال)</label>
                  <input type="number" value={budget()} onInput={e => setBudget(Number(e.currentTarget.value))} class="premium-input" />
                </div>
                <div style={{ display: 'flex', 'flex-direction': 'column', gap: 'var(--space-1)' }}>
                  <label style={{ 'font-size': 'var(--text-sm-size)', color: 'var(--color-text-muted)' }}>هزینه شده (ریال)</label>
                  <input type="number" value={spent()} onInput={e => setSpent(Number(e.currentTarget.value))} class="premium-input" />
                </div>
              </div>

              <div style={{ display: 'grid', 'grid-template-columns': '1fr 1fr', gap: 'var(--space-4)' }}>
                <div style={{ display: 'flex', 'flex-direction': 'column', gap: 'var(--space-1)' }}>
                  <label style={{ 'font-size': 'var(--text-sm-size)', color: 'var(--color-text-muted)' }}>وضعیت</label>
                  <CustomSelect
                    value={status()}
                    onChange={setStatus}
                    options={[
                      { value: 'draft', label: 'پیش‌نویس' },
                      { value: 'active', label: 'فعال' },
                      { value: 'completed', label: 'تکمیل‌شده' },
                      { value: 'closed', label: 'بسته‌شده' }
                    ]}
                  />
                </div>
                <div style={{ display: 'flex', 'flex-direction': 'column', gap: 'var(--space-1)' }}>
                  <label style={{ 'font-size': 'var(--text-sm-size)', color: 'var(--color-text-muted)' }}>مهلت تحویل</label>
                  <JalaliDatePicker value={deadline()} onChange={setDeadline} placeholder="انتخاب مهلت تحویل..." />
                </div>
              </div>

              <div style={{ display: 'flex', 'flex-direction': 'column', gap: 'var(--space-1)' }}>
                <label style={{ 'font-size': 'var(--text-sm-size)', color: 'var(--color-text-muted)' }}>رنگ نمایه</label>
                <div style={{ display: 'flex', gap: 'var(--space-2)', 'align-items': 'center', 'margin-top': '4px' }}>
                  <For each={colors}>
                    {(c) => (
                      <button 
                        type="button"
                        onClick={() => setColor(c)}
                        style={{
                          width: '24px', height: '24px', 'border-radius': 'var(--radius-round)',
                          'background-color': c, 
                          border: color() === c ? '2px solid var(--color-bg)' : '2px solid transparent',
                          'box-shadow': color() === c ? `0 0 0 2px ${c}` : 'none',
                          transform: color() === c ? 'scale(1.15)' : 'scale(1)',
                          transition: 'transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.2s ease, border-color 0.2s ease'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.transform = color() === c ? 'scale(1.2)' : 'scale(1.1)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.transform = color() === c ? 'scale(1.15)' : 'scale(1)';
                        }}
                      />
                    )}
                  </For>
                </div>
              </div>

              <div style={{ display: 'flex', 'flex-direction': 'column', gap: 'var(--space-1)' }}>
                <label style={{ 'font-size': 'var(--text-sm-size)', color: 'var(--color-text-muted)' }}>توضیحات</label>
                <textarea value={description()} onInput={e => setDescription(e.currentTarget.value)} class="premium-input" style={{ height: '80px', resize: 'none' }} />
              </div>

              <div style={{ display: 'flex', gap: 'var(--space-3)', 'justify-content': 'end', 'margin-top': 'var(--space-2)' }}>
                <button type="button" onClick={() => setIsEditing(false)} class="btn-secondary">انصراف</button>
                <button type="submit" class="btn-primary">ذخیره تغییرات</button>
              </div>
            </form>
          </div>
        </Show>

        {/* CASE 3: View Selected Project Details */}
        <Show when={activeProject() && !isAdding() && !isEditing()}>
          {(() => {
            const proj = activeProject()!;
            return (
              <div class="animate-slide-up" style={{ display: 'flex', 'flex-direction': 'column', gap: 'var(--space-6)', 'overflow-y': 'auto', 'padding-left': 'var(--space-2)' }}>
                {/* Header card with name and actions */}
                <div class="premium-card" style={{ display: 'flex', 'justify-content': 'space-between', 'align-items': 'center' }}>
                  <div style={{ display: 'flex', 'align-items': 'center', gap: 'var(--space-4)' }}>
                    <div style={{
                      width: '16px', height: '16px', 'border-radius': '50%',
                      'background-color': proj.color || 'var(--color-primary)',
                      'box-shadow': '0 0 8px ' + proj.color
                    }} />
                    <div>
                      <h3 style={{ 'font-size': 'var(--text-h1-size)', 'font-weight': 700 }}>{proj.title}</h3>
                      <p style={{ 'font-size': 'var(--text-sm-size)', color: 'var(--color-text-muted)' }}>
                        مشتری: {projectClient()?.name || 'بدون مشتری (شخصی)'}
                      </p>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                    <button onClick={() => setIsEditing(true)} class="btn-secondary" style={{ padding: '6px 12px', 'font-size': 'var(--text-sm-size)' }}>
                      <IconEdit style={{ width: '16px', height: '16px' }} /> ویرایش
                    </button>
                    <button onClick={() => openDeleteModal(proj.id)} class="btn-secondary" style={{ padding: '6px 12px', 'font-size': 'var(--text-sm-size)', color: 'var(--color-danger)', 'border-color': 'rgba(239, 68, 68, 0.2)' }}>
                      <IconTrash style={{ width: '16px', height: '16px' }} /> حذف
                    </button>
                  </div>
                </div>

                {/* Details layout */}
                <div style={{ display: 'grid', 'grid-template-columns': '2fr 1fr', gap: 'var(--space-6)' }}>
                  
                  {/* Right side: Descriptions & Tasks */}
                  <div style={{ display: 'flex', 'flex-direction': 'column', gap: 'var(--space-6)' }}>
                    {/* Description card */}
                    <div class="premium-card" style={{ display: 'flex', 'flex-direction': 'column', gap: 'var(--space-3)' }}>
                      <h4 style={{ 'font-size': 'var(--text-h3-size)', 'font-weight': 600 }}>توضیحات پروژه</h4>
                      <p style={{ 'font-size': 'var(--text-body-size)', 'line-height': 1.6, color: proj.description ? 'var(--color-text)' : 'var(--color-text-muted)' }}>
                        {proj.description || 'توضیحاتی برای این پروژه ثبت نشده است.'}
                      </p>
                    </div>

                    {/* Tasks card list */}
                    <div class="premium-card" style={{ display: 'flex', 'flex-direction': 'column', gap: 'var(--space-4)' }}>
                      <h4 style={{ 'font-size': 'var(--text-h3-size)', 'font-weight': 600 }}>وظایف مرتبط</h4>
                      <Show 
                        when={projectTasks().length > 0} 
                        fallback={<p style={{ color: 'var(--color-text-muted)', 'font-size': 'var(--text-sm-size)' }}>هیچ وظیفه‌ای برای این پروژه تعریف نشده است.</p>}
                      >
                        <div style={{ display: 'flex', 'flex-direction': 'column', gap: 'var(--space-2)' }}>
                          <For each={projectTasks()}>
                            {(t) => (
                              <div style={{
                                display: 'flex', 'align-items': 'center', 'justify-content': 'space-between',
                                padding: 'var(--space-3)', 'border-radius': 'var(--radius-md)',
                                'background-color': 'rgba(255,255,255,0.01)', border: '1px solid var(--color-border)'
                              }}>
                                <span style={{ 'font-size': 'var(--text-body-size)', 'font-weight': 500 }}>{t.title}</span>
                                <span class={`badge badge-${t.status === 'done' ? 'done' : 'todo'}`}>
                                  {t.status === 'done' ? 'انجام شد' : 'در انتظار'}
                                </span>
                              </div>
                            )}
                          </For>
                        </div>
                      </Show>
                    </div>
                  </div>

                  {/* Left side: Budgets & Deadlines */}
                  <div style={{ display: 'flex', 'flex-direction': 'column', gap: 'var(--space-6)' }}>
                    {/* Financial card — وضعیت مالی */}
                    {(() => {
                      const budgetVal = proj.budget || 0;
                      const spentVal = proj.spent || 0;
                      const remaining = budgetVal - spentVal;
                      const pct = budgetVal > 0 ? Math.round((spentVal / budgetVal) * 100) : 0;
                      const isOverBudget = spentVal > budgetVal && budgetVal > 0;
                      const isOnTrack = pct <= 75;
                      const barColor = isOverBudget ? 'var(--color-danger)' : pct > 75 ? 'var(--color-warning)' : 'var(--color-success)';

                      return (
                        <div class="premium-card" style={{ display: 'flex', 'flex-direction': 'column', gap: 'var(--space-4)' }}>
                          <h4 style={{ 'font-size': 'var(--text-h3-size)', 'font-weight': 600, display: 'flex', 'align-items': 'center', gap: 'var(--space-2)' }}>
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--color-success)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                              <line x1="12" y1="1" x2="12" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                            </svg>
                            وضعیت مالی
                          </h4>
                          
                          {/* Summary row */}
                          <div style={{
                            display: 'grid',
                            'grid-template-columns': '1fr 1fr 1fr',
                            gap: 'var(--space-3)',
                            'text-align': 'center'
                          }}>
                            <div style={{
                              padding: 'var(--space-3)',
                              'background-color': 'rgba(34,197,94,0.06)',
                              border: '1px solid rgba(34,197,94,0.12)',
                              'border-radius': 'var(--radius-md)'
                            }}>
                              <span style={{ 'font-size': 'var(--text-xs-size)', color: 'var(--color-text-muted)', 'margin-bottom': '4px', display: 'block' }}>بودجه کل</span>
                              <span style={{ 'font-weight': 700, color: 'var(--color-success)', 'font-size': 'var(--text-body-size)' }}>
                                {formatPersianNumber(budgetVal.toLocaleString())}
                              </span>
                              <span style={{ 'font-size': 'var(--text-xs-size)', color: 'var(--color-text-muted)', display: 'block' }}>ریال</span>
                            </div>
                            <div style={{
                              padding: 'var(--space-3)',
                              'background-color': 'rgba(232,156,44,0.06)',
                              border: '1px solid rgba(232,156,44,0.12)',
                              'border-radius': 'var(--radius-md)'
                            }}>
                              <span style={{ 'font-size': 'var(--text-xs-size)', color: 'var(--color-text-muted)', 'margin-bottom': '4px', display: 'block' }}>هزینه شده</span>
                              <span style={{ 'font-weight': 700, color: 'var(--color-warning)', 'font-size': 'var(--text-body-size)' }}>
                                {formatPersianNumber(spentVal.toLocaleString())}
                              </span>
                              <span style={{ 'font-size': 'var(--text-xs-size)', color: 'var(--color-text-muted)', display: 'block' }}>ریال</span>
                            </div>
                            <div style={{
                              padding: 'var(--space-3)',
                              'background-color': isOverBudget ? 'rgba(239,68,68,0.06)' : 'rgba(20,93,162,0.06)',
                              border: `1px solid ${isOverBudget ? 'rgba(239,68,68,0.12)' : 'rgba(20,93,162,0.12)'}`,
                              'border-radius': 'var(--radius-md)'
                            }}>
                              <span style={{ 'font-size': 'var(--text-xs-size)', color: 'var(--color-text-muted)', 'margin-bottom': '4px', display: 'block' }}>{isOverBudget ? 'بیش‌ازحد' : 'باقیمانده'}</span>
                              <span style={{ 'font-weight': 700, color: isOverBudget ? 'var(--color-danger)' : 'var(--color-primary)', 'font-size': 'var(--text-body-size)' }}>
                                {formatPersianNumber(Math.abs(remaining).toLocaleString())}
                              </span>
                              <span style={{ 'font-size': 'var(--text-xs-size)', color: 'var(--color-text-muted)', display: 'block' }}>ریال</span>
                            </div>
                          </div>

                          {/* Progress bar */}
                          <div style={{ display: 'flex', 'flex-direction': 'column', gap: 'var(--space-2)' }}>
                            <div style={{ display: 'flex', 'justify-content': 'space-between', 'font-size': 'var(--text-xs-size)' }}>
                              <span style={{ color: 'var(--color-text-muted)' }}>درصد مصرف بودجه</span>
                              <span style={{ 'font-weight': 700, color: barColor }}>{formatPersianNumber(pct)}٪</span>
                            </div>
                            <div style={{ 
                              width: '100%', height: '8px', 'background-color': 'var(--color-surface-2)', 
                              'border-radius': 'var(--radius-round)', overflow: 'hidden'
                            }}>
                              <div style={{
                                height: '100%',
                                width: `${Math.min(100, pct)}%`,
                                'background-color': barColor,
                                'border-radius': 'var(--radius-round)',
                                transition: 'width 0.6s cubic-bezier(0.16, 1, 0.3, 1), background-color 0.3s ease',
                                'box-shadow': `0 0 8px ${barColor}`
                              }} />
                            </div>
                          </div>

                          {/* Status indicator */}
                          <div style={{
                            display: 'flex',
                            'align-items': 'center',
                            gap: 'var(--space-2)',
                            padding: 'var(--space-2) var(--space-3)',
                            'border-radius': 'var(--radius-md)',
                            'background-color': isOverBudget ? 'var(--color-danger-muted)' : isOnTrack ? 'var(--color-success-muted)' : 'var(--color-warning-muted)',
                            border: `1px solid ${isOverBudget ? 'var(--color-danger)' : isOnTrack ? 'var(--color-success)' : 'var(--color-warning)'}20`
                          }}>
                            <div style={{
                              width: '8px', height: '8px', 'border-radius': '50%',
                              'background-color': isOverBudget ? 'var(--color-danger)' : isOnTrack ? 'var(--color-success)' : 'var(--color-warning)',
                              'box-shadow': `0 0 6px ${isOverBudget ? 'var(--color-danger)' : isOnTrack ? 'var(--color-success)' : 'var(--color-warning)'}`
                            }} />
                            <span style={{
                              'font-size': 'var(--text-xs-size)',
                              'font-weight': 600,
                              color: isOverBudget ? 'var(--color-danger)' : isOnTrack ? 'var(--color-success)' : 'var(--color-warning)'
                            }}>
                              {isOverBudget ? 'بودجه رد شده! هزینه بیش از بودجه تعیین‌شده است' : isOnTrack ? 'بودجه در مسیر صحیح قرار دارد' : 'هشدار: نزدیک به پایان بودجه'}
                            </span>
                          </div>
                        </div>
                      );
                    })()}

                    {/* Deadline card */}
                    <div class="premium-card" style={{ display: 'flex', 'flex-direction': 'column', gap: 'var(--space-4)' }}>
                      <h4 style={{ 'font-size': 'var(--text-h3-size)', 'font-weight': 600 }}>اطلاعات تحویل</h4>
                      
                      <div style={{ display: 'flex', 'flex-direction': 'column', gap: 'var(--space-3)' }}>
                        <div style={{ display: 'flex', 'justify-content': 'space-between', 'font-size': 'var(--text-body-size)' }}>
                          <span style={{ color: 'var(--color-text-muted)' }}>مهلت تحویل:</span>
                          <span style={{ 'font-weight': 600 }}>
                            {proj.deadline ? formatJalaliDate(proj.deadline) : 'مشخص نشده'}
                          </span>
                        </div>
                        <div style={{ display: 'flex', 'justify-content': 'space-between', 'font-size': 'var(--text-body-size)' }}>
                          <span style={{ color: 'var(--color-text-muted)' }}>اولویت پروژه:</span>
                          <span class={`badge badge-${proj.priority}`}>
                            {proj.priority === 'high' ? 'بالا (فوری)' : proj.priority === 'medium' ? 'متوسط' : 'کم'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                </div>
              </div>
            );
          })()}
        </Show>

        {/* CASE 4: Welcome state when no project selected */}
        <Show when={!activeProject() && !isAdding()}>
          <div style={{
            flex: 1, display: 'flex', 'flex-direction': 'column',
            'align-items': 'center', 'justify-content': 'center',
            color: 'var(--color-text-muted)', gap: 'var(--space-4)'
          }}>
            <IconProjects style={{ width: '64px', height: '64px', opacity: 0.5 }} />
            <p style={{ 'font-size': 'var(--text-h3-size)', 'font-weight': 500 }}>جهت مشاهده جزئیات، یک پروژه را از لیست انتخاب کنید یا پروژه جدید بسازید.</p>
          </div>
        </Show>

      </div>

      {/* Delete Confirmation Modal */}
      <Modal 
        isOpen={!!projectToDelete()} 
        onClose={() => setProjectToDelete(null)}
        title="حذف پروژه"
        footer={
          <>
            <button class="btn-secondary" onClick={() => setProjectToDelete(null)}>انصراف</button>
            <button class="btn-primary" style={{ 'background-color': 'var(--color-danger)' }} onClick={handleDeleteConfirm}>حذف دائمی</button>
          </>
        }
      >
        <p>آیا از حذف این پروژه اطمینان دارید؟ تمامی وظایف مرتبط با آن نیز حذف خواهند شد. این عملیات غیرقابل بازگشت است.</p>
      </Modal>

    </div>
  );
};

export default ProjectsPage;
