import { createResource, For, Show, createSignal, createEffect } from 'solid-js';
import type { Component } from 'solid-js';
import { 
  getChecklistByDate, 
  getChecklistItems, 
  createChecklist, 
  addChecklistItem, 
  toggleChecklistItem 
} from '../../lib/tauri';
import { formatPersianNumber, formatJalaliDate, getLocalDateString } from '../../lib/locale';
import { checklistRefreshTrigger, triggerChecklistRefresh } from '../../store';
import { IconChecklists, IconLightning, IconChevronRight, IconChevronLeft } from '../../components/ui/Icons';

const ChecklistsPage: Component = () => {
  // Current active date selection
  const [activeDate, setActiveDate] = createSignal<string>(getLocalDateString());
  const [newItemText, setNewItemText] = createSignal('');

  // Fetch checklist for selected date
  const [checklist, { refetch: refetchChecklist }] = createResource(
    () => ({ date: activeDate(), trigger: checklistRefreshTrigger() }),
    async ({ date }) => {
      return await getChecklistByDate(date);
    }
  );

  // Fetch items once checklist is loaded
  const [items, { refetch: refetchItems }] = createResource(
    () => {
      const cl = checklist();
      return cl ? { id: cl.id, trigger: checklistRefreshTrigger() } : null;
    },
    async ({ id }) => {
      return await getChecklistItems(id);
    }
  );

  // Auto-refetch when date changes
  createEffect(() => {
    activeDate();
    refetchChecklist();
  });

  const handleCreateChecklist = async () => {
    const dateStr = activeDate();
    
    // Format display title (e.g. چک‌لیست ۱۵ تیر)
    const displayDate = formatJalaliDate(new Date(dateStr));
    const title = `چک‌لیست روزانه ${displayDate.split(' ')[0]} ${displayDate.split(' ')[1]}`;

    await createChecklist({
      title,
      date: dateStr,
      notes: ''
    });

    refetchChecklist();
    triggerChecklistRefresh();
  };

  const handleAddItem = async (e: Event) => {
    e.preventDefault();
    const cl = checklist();
    if (!cl || !newItemText().trim()) return;

    await addChecklistItem({
      checklist_id: cl.id,
      text: newItemText().trim()
    });

    setNewItemText('');
    refetchItems();
    triggerChecklistRefresh();
  };

  const handleToggleItem = async (itemId: string, currentDone: boolean) => {
    await toggleChecklistItem(itemId, !currentDone);
    refetchItems();
    triggerChecklistRefresh();
  };

  // Date Nav helpers
  const handlePrevDay = () => {
    const d = new Date(activeDate());
    d.setDate(d.getDate() - 1);
    setActiveDate(getLocalDateString(d));
  };

  const handleNextDay = () => {
    const d = new Date(activeDate());
    d.setDate(d.getDate() + 1);
    setActiveDate(getLocalDateString(d));
  };

  const handleGoToToday = () => {
    setActiveDate(getLocalDateString());
  };

  // Progress calculator
  const progressPercent = () => {
    const list = items() || [];
    if (list.length === 0) return 0;
    const completed = list.filter(item => item.done).length;
    return Math.round((completed / list.length) * 100);
  };

  return (
    <div class="animate-fade-in" style={{ display: 'flex', 'flex-direction': 'column', 'align-items': 'center', gap: 'var(--space-6)', padding: 'var(--space-2) 0' }}>
      
      {/* Date Navigation Widget */}
      <div class="premium-card" style={{
        display: 'flex',
        'align-items': 'center',
        gap: 'var(--space-4)',
        width: '100%',
        'max-width': '550px',
        'justify-content': 'space-between',
        padding: 'var(--space-3) var(--space-5)'
      }}>
        <button onClick={handlePrevDay} class="btn-secondary" style={{ padding: '6px 12px', 'font-size': '0.9rem' }}>
          <IconChevronRight style={{ width: '16px', height: '16px' }} /> روز قبل
        </button>

        <div style={{ display: 'flex', 'flex-direction': 'column', 'align-items': 'center', gap: '4px' }}>
          <span style={{ 'font-weight': 700, 'font-size': '1.1rem', color: 'var(--color-primary)' }}>
            {formatJalaliDate(activeDate())}
          </span>
          <Show when={activeDate() !== getLocalDateString()}>
            <button onClick={handleGoToToday} style={{ 'font-size': '0.75rem', color: 'var(--color-text-muted)', 'text-decoration': 'underline' }}>
              بازگشت به امروز
            </button>
          </Show>
        </div>

        <button onClick={handleNextDay} class="btn-secondary" style={{ padding: '6px 12px', 'font-size': '0.9rem' }}>
          روز بعد <IconChevronLeft style={{ width: '16px', height: '16px' }} />
        </button>
      </div>

      {/* Main Checklist Card */}
      <div class="premium-card" style={{
        width: '100%',
        'max-width': '550px',
        'min-height': '300px',
        display: 'flex',
        'flex-direction': 'column',
        gap: 'var(--space-5)',
        padding: 'var(--space-6)'
      }}>
        <Show 
          when={checklist()} 
          fallback={
            <div style={{
              flex: 1, display: 'flex', 'flex-direction': 'column',
              'align-items': 'center', 'justify-content': 'center',
              gap: 'var(--space-4)', padding: 'var(--space-8) 0'
            }}>
              <IconChecklists style={{ width: '64px', height: '64px', color: 'var(--color-text-muted)' }} />
              <p style={{ 'font-size': '0.95rem', color: 'var(--color-text-muted)', 'text-align': 'center' }}>
                لیست کارهای روزانه‌ای برای این تاریخ ساخته نشده است.
              </p>
              <button onClick={handleCreateChecklist} class="btn-primary">
                ایجاد چک‌لیست روزانه <IconLightning style={{ width: '16px', height: '16px' }} />
              </button>
            </div>
          }
        >
          {/* Header Progress Info */}
          <div style={{ display: 'flex', 'flex-direction': 'column', gap: 'var(--space-3)' }}>
            <div style={{ display: 'flex', 'justify-content': 'space-between', 'align-items': 'center' }}>
              <h3 style={{ 'font-weight': 700, 'font-size': '1.1rem' }}>{checklist()?.title}</h3>
              <span style={{ 'font-size': '0.9rem', 'font-weight': 'bold', color: 'var(--color-success)' }}>
                {formatPersianNumber(progressPercent())}٪ انجام شده
              </span>
            </div>
            
            {/* Progress Bar */}
            <div style={{
              width: '100%', height: '8px', 'background-color': 'rgba(255,255,255,0.02)',
              'border-radius': 'var(--radius-round)', border: '1px solid var(--color-border)', overflow: 'hidden'
            }}>
              <div style={{
                height: '100%',
                width: '100%',
                'background-color': 'var(--color-success)',
                'border-radius': 'var(--radius-round)',
                'transform-origin': 'right',
                transform: `scaleX(${progressPercent() / 100})`,
                transition: 'transform var(--transition-normal)'
              }} />
            </div>
          </div>

          {/* Add New Item Input */}
          <form onSubmit={handleAddItem} style={{ display: 'flex', gap: 'var(--space-2)' }}>
            <input 
              type="text" 
              placeholder="کار جدیدی اضافه کنید..."
              value={newItemText()}
              onInput={e => setNewItemText(e.currentTarget.value)}
              class="premium-input"
              style={{ padding: '8px 12px', 'font-size': '0.9rem' }}
              required
            />
            <button type="submit" class="btn-primary" style={{ padding: '0 var(--space-4)', 'font-size': '0.85rem' }}>
              افزودن
            </button>
          </form>

          {/* Items Checklist List */}
          <div style={{ display: 'flex', 'flex-direction': 'column', gap: 'var(--space-2)', 'margin-top': 'var(--space-2)' }}>
            <Show 
              when={items() && items()!.length > 0} 
              fallback={
                <p style={{ color: 'var(--color-text-muted)', 'font-size': '0.85rem', 'text-align': 'center', padding: 'var(--space-4) 0' }}>
                  هیچ کاری برای امروز تعریف نشده است. یک مورد اضافه کنید!
                </p>
              }
            >
              <For each={items()}>
                {(item) => (
                  <div 
                    onClick={() => handleToggleItem(item.id, item.done)}
                    style={{
                      display: 'flex',
                      'align-items': 'center',
                      gap: 'var(--space-3)',
                      padding: 'var(--space-3)',
                      'border-radius': 'var(--radius-md)',
                      'background-color': 'rgba(255,255,255,0.01)',
                      border: '1px solid var(--color-border)',
                      cursor: 'pointer',
                      transition: 'all var(--transition-fast)'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'}
                    onMouseLeave={(e) => e.currentTarget.style.borderColor = 'var(--color-border)'}
                  >
                    {/* Fake Checkbox */}
                    <div style={{
                      width: '20px',
                      height: '20px',
                      'border-radius': 'var(--radius-xs)',
                      border: `1.5px solid ${item.done ? 'var(--color-success)' : 'var(--color-text-muted)'}`,
                      'background-color': item.done ? 'var(--color-success-muted)' : 'transparent',
                      display: 'flex',
                      'align-items': 'center',
                      'justify-content': 'center',
                      color: 'var(--color-success)',
                      'font-size': '0.8rem',
                      'font-weight': 'bold',
                      transition: 'transform var(--transition-spring), border-color var(--transition-fast), background-color var(--transition-fast)',
                      transform: item.done ? 'scale(1.05)' : 'scale(1)'
                    }}>
                      <span style={{ 
                        display: 'inline-block',
                        transition: 'transform var(--transition-spring), opacity var(--transition-fast)',
                        transform: item.done ? 'scale(1)' : 'scale(0.5)',
                        opacity: item.done ? 1 : 0
                      }}>✓</span>
                    </div>

                    <span style={{
                      'font-size': '0.95rem',
                      color: item.done ? 'var(--color-text-muted)' : 'var(--color-text)',
                      'text-decoration': item.done ? 'line-through' : 'none',
                      transition: 'all var(--transition-fast)'
                    }}>
                      {item.text}
                    </span>
                  </div>
                )}
              </For>
            </Show>
          </div>
        </Show>
      </div>

    </div>
  );
};

export default ChecklistsPage;
