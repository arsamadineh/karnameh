import { createResource, For, Show, createSignal } from 'solid-js';
import type { Component } from 'solid-js';
import { getTasks, createTask, updateTask, deleteTask, getProjects } from '../../lib/tauri';
import { formatPersianNumber } from '../../lib/locale';
import { taskRefreshTrigger, triggerTaskRefresh } from '../../store';
import { Modal } from '../../components/ui/Modal';
import { IconLightning, IconTrash } from '../../components/ui/Icons';
import { CustomSelect } from '../../components/ui/CustomSelect';

const TasksPage: Component = () => {
  // Sync resource refetching with global trigger signals
  const [tasks, { refetch: refetchTasks }] = createResource<any[]>(async () => {
    taskRefreshTrigger(); // track trigger
    return await getTasks();
  });

  const [projects] = createResource<any[]>(getProjects);

  const [isAdding, setIsAdding] = createSignal(false);
  const [selectedTask, setSelectedTask] = createSignal<any | null>(null);
  const [taskToDelete, setTaskToDelete] = createSignal<string | null>(null);

  // Map projects to options format
  const projectOptions = () => {
    const list = projects() || [];
    return [
      { value: '', label: 'بدون پروژه (شخصی)' },
      ...list.map((p: any) => ({ value: p.id, label: p.title }))
    ];
  };

  // Form Signals
  const [title, setTitle] = createSignal('');
  const [description, setDescription] = createSignal('');
  const [projectId, setProjectId] = createSignal('');
  const [status, setStatus] = createSignal('todo');
  const [priority, setPriority] = createSignal('medium');
  const [dueDate, setDueDate] = createSignal('');

  const clearForm = () => {
    setTitle('');
    setDescription('');
    setProjectId('');
    setStatus('todo');
    setPriority('medium');
    setDueDate('');
  };

  const handleCreateSubmit = async (e: Event) => {
    e.preventDefault();
    if (!title()) return;

    await createTask({
      project_id: projectId() || null,
      title: title(),
      description: description() || null,
      status: status(),
      priority: priority(),
      due_date: dueDate() || null
    });

    clearForm();
    setIsAdding(false);
    refetchTasks();
    triggerTaskRefresh();
  };

  const handleUpdateStatus = async (task: any, newStatus: string) => {
    await updateTask({
      id: task.id,
      status: newStatus
    });
    refetchTasks();
    triggerTaskRefresh();
  };

  const handleEditSubmit = async (e: Event) => {
    e.preventDefault();
    const task = selectedTask();
    if (!task || !title()) return;

    await updateTask({
      id: task.id,
      title: title(),
      description: description(),
      project_id: projectId() || null,
      status: status(),
      priority: priority(),
      due_date: dueDate() || null
    });

    setSelectedTask(null);
    refetchTasks();
    triggerTaskRefresh();
  };

  const openDeleteModal = (id: string) => setTaskToDelete(id);

  const handleDeleteConfirm = async () => {
    const id = taskToDelete();
    if (!id) return;
    await deleteTask(id);
    setSelectedTask(null);
    setTaskToDelete(null);
    refetchTasks();
    triggerTaskRefresh();
  };

  const getProjectName = (projId: string) => {
    const list = projects() || [];
    return list.find((p: any) => p.id === projId)?.title || 'بدون پروژه';
  };

  const tasksByStatus = (statusVal: string) => {
    return (tasks() || []).filter((t: any) => t.status === statusVal);
  };

  // Open edit modal for a task
  const openEdit = (task: any) => {
    setSelectedTask(task);
    setTitle(task.title || '');
    setDescription(task.description || '');
    setProjectId(task.project_id || '');
    setStatus(task.status || 'todo');
    setPriority(task.priority || 'medium');
    setDueDate(task.due_date ? task.due_date.split('T')[0] : '');
  };

  return (
    <div class="animate-fade-in" style={{ display: 'flex', 'flex-direction': 'column', height: '100%', gap: 'var(--space-5)' }}>
      {/* Page Header */}
      <div style={{ display: 'flex', 'justify-content': 'space-between', 'align-items': 'center' }}>
        <h2 style={{ 'font-size': '1.25rem', 'font-weight': 700 }}>مدیریت وظایف</h2>
        <button 
          onClick={() => {
            setIsAdding(true);
            clearForm();
          }}
          class="btn-primary"
        >
          افزودن وظیفه +
        </button>
      </div>

      {/* Kanban Board columns */}
      <div class="grid-kanban" style={{
        flex: 1,
        overflow: 'hidden'
      }}>
        {/* Column 1: TODO */}
        <div style={{ display: 'flex', 'flex-direction': 'column', gap: 'var(--space-4)', 'background-color': 'rgba(255,255,255,0.01)', border: '1px solid var(--color-border)', 'border-radius': 'var(--radius-lg)', padding: 'var(--space-4)', overflow: 'hidden' }}>
          <div style={{ display: 'flex', 'justify-content': 'space-between', 'align-items': 'center' }}>
            <h3 style={{ 'font-size': '0.95rem', 'font-weight': 700, display: 'flex', 'align-items': 'center', gap: 'var(--space-2)' }}>
              <span style={{ width: '8px', height: '8px', 'border-radius': '50%', 'background-color': 'var(--color-text-muted)' }} />
              در انتظار انجام
            </h3>
            <span style={{
              'font-size': '0.75rem', 'background-color': 'var(--color-surface-hover)',
              padding: '2px 8px', 'border-radius': 'var(--radius-round)', 'font-weight': 'bold'
            }}>
              {formatPersianNumber(tasksByStatus('todo').length)}
            </span>
          </div>

          <div style={{ flex: 1, 'overflow-y': 'auto', display: 'flex', 'flex-direction': 'column', gap: 'var(--space-3)' }}>
            <For each={tasksByStatus('todo')}>
              {(task) => (
                <div 
                  onClick={() => openEdit(task)}
                  class="premium-card" 
                  style={{ padding: 'var(--space-4)', cursor: 'pointer', display: 'flex', 'flex-direction': 'column', gap: 'var(--space-2)' }}
                >
                  <div style={{ display: 'flex', 'justify-content': 'space-between', 'align-items': 'start' }}>
                    <span style={{ 'font-weight': 600, 'font-size': '0.9rem' }}>{task.title}</span>
                    <span class={`badge badge-${task.priority}`} style={{ 'font-size': '0.65rem' }}>
                      {task.priority === 'high' ? 'فوری' : task.priority === 'medium' ? 'متوسط' : 'عادی'}
                    </span>
                  </div>
                  <p style={{ 'font-size': '0.8rem', color: 'var(--color-text-muted)', overflow: 'hidden', 'text-overflow': 'ellipsis', 'white-space': 'nowrap' }}>
                    {task.description || 'بدون توضیحات'}
                  </p>
                  <div style={{ display: 'flex', 'justify-content': 'space-between', 'align-items': 'center', 'font-size': '0.75rem', 'margin-top': 'var(--space-2)' }}>
                    <span style={{ color: 'var(--color-primary)', 'font-weight': 500 }}>
                      {getProjectName(task.project_id)}
                    </span>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        handleUpdateStatus(task, 'in_progress');
                      }}
                      style={{ color: 'var(--color-warning)', 'font-weight': 600, display: 'flex', 'align-items': 'center', gap: '4px' }}
                    >
                      شروع <IconLightning style={{ width: '12px', height: '12px' }} />
                    </button>
                  </div>
                </div>
              )}
            </For>
          </div>
        </div>

        {/* Column 2: IN PROGRESS */}
        <div style={{ display: 'flex', 'flex-direction': 'column', gap: 'var(--space-4)', 'background-color': 'rgba(255,255,255,0.01)', border: '1px solid var(--color-border)', 'border-radius': 'var(--radius-lg)', padding: 'var(--space-4)', overflow: 'hidden' }}>
          <div style={{ display: 'flex', 'justify-content': 'space-between', 'align-items': 'center' }}>
            <h3 style={{ 'font-size': '0.95rem', 'font-weight': 700, display: 'flex', 'align-items': 'center', gap: 'var(--space-2)' }}>
              <span style={{ width: '8px', height: '8px', 'border-radius': '50%', 'background-color': 'var(--color-warning)' }} />
              در حال انجام
            </h3>
            <span style={{
              'font-size': '0.75rem', 'background-color': 'var(--color-surface-hover)',
              padding: '2px 8px', 'border-radius': 'var(--radius-round)', 'font-weight': 'bold'
            }}>
              {formatPersianNumber(tasksByStatus('in_progress').length)}
            </span>
          </div>

          <div style={{ flex: 1, 'overflow-y': 'auto', display: 'flex', 'flex-direction': 'column', gap: 'var(--space-3)' }}>
            <For each={tasksByStatus('in_progress')}>
              {(task) => (
                <div 
                  onClick={() => openEdit(task)}
                  class="premium-card" 
                  style={{ padding: 'var(--space-4)', cursor: 'pointer', display: 'flex', 'flex-direction': 'column', gap: 'var(--space-2)' }}
                >
                  <div style={{ display: 'flex', 'justify-content': 'space-between', 'align-items': 'start' }}>
                    <span style={{ 'font-weight': 600, 'font-size': '0.9rem' }}>{task.title}</span>
                    <span class={`badge badge-${task.priority}`} style={{ 'font-size': '0.65rem' }}>
                      {task.priority === 'high' ? 'فوری' : task.priority === 'medium' ? 'متوسط' : 'عادی'}
                    </span>
                  </div>
                  <p style={{ 'font-size': '0.8rem', color: 'var(--color-text-muted)', overflow: 'hidden', 'text-overflow': 'ellipsis', 'white-space': 'nowrap' }}>
                    {task.description || 'بدون توضیحات'}
                  </p>
                  <div style={{ display: 'flex', 'justify-content': 'space-between', 'align-items': 'center', 'font-size': '0.75rem', 'margin-top': 'var(--space-2)' }}>
                    <span style={{ color: 'var(--color-primary)', 'font-weight': 500 }}>
                      {getProjectName(task.project_id)}
                    </span>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        handleUpdateStatus(task, 'done');
                      }}
                      style={{ color: 'var(--color-success)', 'font-weight': 600 }}
                    >
                      تکمیل ✓
                    </button>
                  </div>
                </div>
              )}
            </For>
          </div>
        </div>

        {/* Column 3: DONE */}
        <div style={{ display: 'flex', 'flex-direction': 'column', gap: 'var(--space-4)', 'background-color': 'rgba(255,255,255,0.01)', border: '1px solid var(--color-border)', 'border-radius': 'var(--radius-lg)', padding: 'var(--space-4)', overflow: 'hidden' }}>
          <div style={{ display: 'flex', 'justify-content': 'space-between', 'align-items': 'center' }}>
            <h3 style={{ 'font-size': '0.95rem', 'font-weight': 700, display: 'flex', 'align-items': 'center', gap: 'var(--space-2)' }}>
              <span style={{ width: '8px', height: '8px', 'border-radius': '50%', 'background-color': 'var(--color-success)' }} />
              انجام شده
            </h3>
            <span style={{
              'font-size': '0.75rem', 'background-color': 'var(--color-surface-hover)',
              padding: '2px 8px', 'border-radius': 'var(--radius-round)', 'font-weight': 'bold'
            }}>
              {formatPersianNumber(tasksByStatus('done').length)}
            </span>
          </div>

          <div style={{ flex: 1, 'overflow-y': 'auto', display: 'flex', 'flex-direction': 'column', gap: 'var(--space-3)' }}>
            <For each={tasksByStatus('done')}>
              {(task) => (
                <div 
                  onClick={() => openEdit(task)}
                  class="premium-card" 
                  style={{ padding: 'var(--space-4)', cursor: 'pointer', display: 'flex', 'flex-direction': 'column', gap: 'var(--space-2)', opacity: 0.65 }}
                >
                  <div style={{ display: 'flex', 'justify-content': 'space-between', 'align-items': 'start' }}>
                    <span style={{ 'font-weight': 600, 'font-size': '0.9rem', 'text-decoration': 'line-through' }}>{task.title}</span>
                    <span class={`badge badge-${task.priority}`} style={{ 'font-size': '0.65rem' }}>
                      {task.priority === 'high' ? 'فوری' : task.priority === 'medium' ? 'متوسط' : 'کم'}
                    </span>
                  </div>
                  <p style={{ 'font-size': '0.8rem', color: 'var(--color-text-muted)', overflow: 'hidden', 'text-overflow': 'ellipsis', 'white-space': 'nowrap' }}>
                    {task.description || 'بدون توضیحات'}
                  </p>
                  <div style={{ display: 'flex', 'justify-content': 'space-between', 'align-items': 'center', 'font-size': '0.75rem', 'margin-top': 'var(--space-2)' }}>
                    <span style={{ color: 'var(--color-primary)', 'font-weight': 500 }}>
                      {getProjectName(task.project_id)}
                    </span>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        handleUpdateStatus(task, 'todo');
                      }}
                      style={{ color: 'var(--color-text-muted)', 'font-weight': 600 }}
                    >
                      بازگرداندن ↩
                    </button>
                  </div>
                </div>
              )}
            </For>
          </div>
        </div>
      </div>

      {/* MODAL 1: Add Task Dialog */}
      <Show when={isAdding()}>
        <div 
          onClick={() => setIsAdding(false)}
          style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            'background-color': 'rgba(0,0,0,0.6)', 'backdrop-filter': 'var(--blur-md)',
            'z-index': 1000, display: 'flex', 'align-items': 'center', 'justify-content': 'center'
          }}
          class="animate-fade-in"
        >
          <div 
            onClick={e => e.stopPropagation()}
            class="premium-card animate-slide-up"
            style={{ width: '100%', 'max-width': '500px', display: 'flex', 'flex-direction': 'column', gap: 'var(--space-4)' }}
          >
            <h3 style={{ 'font-size': '1.1rem', 'font-weight': 700 }}>ایجاد وظیفه جدید</h3>
            
            <form onSubmit={handleCreateSubmit} style={{ display: 'flex', 'flex-direction': 'column', gap: 'var(--space-3)' }}>
              <div style={{ display: 'flex', 'flex-direction': 'column', gap: 'var(--space-1)' }}>
                <label style={{ 'font-size': '0.8rem', color: 'var(--color-text-muted)' }}>عنوان وظیفه *</label>
                <input type="text" value={title()} onInput={e => setTitle(e.currentTarget.value)} required class="premium-input" placeholder="عنوان کار..." />
              </div>

              <div style={{ display: 'flex', 'flex-direction': 'column', gap: 'var(--space-1)' }}>
                <label style={{ 'font-size': '0.8rem', color: 'var(--color-text-muted)' }}>پروژه مرتبط</label>
                <CustomSelect
                  value={projectId()}
                  onChange={setProjectId}
                  options={projectOptions()}
                />
              </div>

              <div style={{ display: 'grid', 'grid-template-columns': '1fr 1fr', gap: 'var(--space-3)' }}>
                <div style={{ display: 'flex', 'flex-direction': 'column', gap: 'var(--space-1)' }}>
                  <label style={{ 'font-size': '0.8rem', color: 'var(--color-text-muted)' }}>اولویت</label>
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
                <div style={{ display: 'flex', 'flex-direction': 'column', gap: 'var(--space-1)' }}>
                  <label style={{ 'font-size': '0.8rem', color: 'var(--color-text-muted)' }}>مهلت انجام</label>
                  <input type="date" value={dueDate()} onChange={e => setDueDate(e.currentTarget.value)} class="premium-input" style={{ 'color-scheme': 'dark' }} />
                </div>
              </div>

              <div style={{ display: 'flex', 'flex-direction': 'column', gap: 'var(--space-1)' }}>
                <label style={{ 'font-size': '0.8rem', color: 'var(--color-text-muted)' }}>توضیحات</label>
                <textarea value={description()} onInput={e => setDescription(e.currentTarget.value)} class="premium-input" style={{ height: '70px', resize: 'none' }} placeholder="توضیحات کار..." />
              </div>

              <div style={{ display: 'flex', gap: 'var(--space-3)', 'justify-content': 'end', 'margin-top': 'var(--space-3)' }}>
                <button type="button" onClick={() => setIsAdding(false)} class="btn-secondary">انصراف</button>
                <button type="submit" class="btn-primary">ایجاد</button>
              </div>
            </form>
          </div>
        </div>
      </Show>

      {/* MODAL 2: Edit Task Dialog */}
      <Show when={selectedTask()}>
        <div 
          onClick={() => setSelectedTask(null)}
          style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            'background-color': 'rgba(0,0,0,0.6)', 'backdrop-filter': 'var(--blur-md)',
            'z-index': 1000, display: 'flex', 'align-items': 'center', 'justify-content': 'center'
          }}
          class="animate-fade-in"
        >
          <div 
            onClick={e => e.stopPropagation()}
            class="premium-card animate-slide-up"
            style={{ width: '100%', 'max-width': '500px', display: 'flex', 'flex-direction': 'column', gap: 'var(--space-4)' }}
          >
            <div style={{ display: 'flex', 'justify-content': 'space-between', 'align-items': 'center' }}>
              <h3 style={{ 'font-size': '1.1rem', 'font-weight': 700 }}>ویرایش وظیفه</h3>
              <button 
                onClick={() => openDeleteModal(selectedTask().id)} 
                style={{ color: 'var(--color-danger)', 'font-size': '0.85rem', display: 'flex', 'align-items': 'center', gap: '4px' }}
              >
                <IconTrash style={{ width: '16px', height: '16px' }} /> حذف وظیفه
              </button>
            </div>
            
            <form onSubmit={handleEditSubmit} style={{ display: 'flex', 'flex-direction': 'column', gap: 'var(--space-3)' }}>
              <div style={{ display: 'flex', 'flex-direction': 'column', gap: 'var(--space-1)' }}>
                <label style={{ 'font-size': '0.8rem', color: 'var(--color-text-muted)' }}>عنوان وظیفه *</label>
                <input type="text" value={title()} onInput={e => setTitle(e.currentTarget.value)} required class="premium-input" />
              </div>

              <div style={{ display: 'flex', 'flex-direction': 'column', gap: 'var(--space-1)' }}>
                <label style={{ 'font-size': '0.8rem', color: 'var(--color-text-muted)' }}>پروژه مرتبط</label>
                <CustomSelect
                  value={projectId()}
                  onChange={setProjectId}
                  options={projectOptions()}
                />
              </div>

              <div style={{ display: 'grid', 'grid-template-columns': '1fr 1fr', gap: 'var(--space-3)' }}>
                <div style={{ display: 'flex', 'flex-direction': 'column', gap: 'var(--space-1)' }}>
                  <label style={{ 'font-size': '0.8rem', color: 'var(--color-text-muted)' }}>اولویت</label>
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
                <div style={{ display: 'flex', 'flex-direction': 'column', gap: 'var(--space-1)' }}>
                  <label style={{ 'font-size': '0.8' + 'rem', color: 'var(--color-text-muted)' }}>وضعیت</label>
                  <CustomSelect
                    value={status()}
                    onChange={setStatus}
                    options={[
                      { value: 'todo', label: 'در انتظار انجام' },
                      { value: 'in_progress', label: 'در حال انجام' },
                      { value: 'done', label: 'انجام شده' }
                    ]}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', 'flex-direction': 'column', gap: 'var(--space-1)' }}>
                <label style={{ 'font-size': '0.8rem', color: 'var(--color-text-muted)' }}>مهلت انجام</label>
                <input type="date" value={dueDate()} onChange={e => setDueDate(e.currentTarget.value)} class="premium-input" style={{ 'color-scheme': 'dark' }} />
              </div>

              <div style={{ display: 'flex', 'flex-direction': 'column', gap: 'var(--space-1)' }}>
                <label style={{ 'font-size': '0.8rem', color: 'var(--color-text-muted)' }}>توضیحات</label>
                <textarea value={description()} onInput={e => setDescription(e.currentTarget.value)} class="premium-input" style={{ height: '70px', resize: 'none' }} />
              </div>

              <div style={{ display: 'flex', gap: 'var(--space-3)', 'justify-content': 'end', 'margin-top': 'var(--space-3)' }}>
                <button type="button" onClick={() => setSelectedTask(null)} class="btn-secondary">انصراف</button>
                <button type="submit" class="btn-primary">ذخیره تغییرات</button>
              </div>
            </form>
          </div>
        </div>
      </Show>

      {/* Delete Confirmation Modal */}
      <Modal 
        isOpen={!!taskToDelete()} 
        onClose={() => setTaskToDelete(null)}
        title="حذف وظیفه"
        footer={
          <>
            <button class="btn-secondary" onClick={() => setTaskToDelete(null)}>انصراف</button>
            <button class="btn-primary" style={{ 'background-color': 'var(--color-danger)' }} onClick={handleDeleteConfirm}>حذف دائمی</button>
          </>
        }
      >
        <p>آیا از حذف این وظیفه اطمینان دارید؟ این عملیات غیرقابل بازگشت است.</p>
      </Modal>

    </div>
  );
};

export default TasksPage;
