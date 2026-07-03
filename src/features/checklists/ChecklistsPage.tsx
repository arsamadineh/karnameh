import { createResource, For, Show, createSignal, createEffect, createMemo } from 'solid-js';
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

// ── Circular Progress Ring ──────────────────────────────────────────────────
const ProgressRing: Component<{ pct: number; size?: number; stroke?: number }> = (props) => {
  const sz    = () => props.size   ?? 100;
  const sw    = () => props.stroke ?? 8;
  const r     = () => (sz() - sw()) / 2;
  const circ  = () => 2 * Math.PI * r();
  const dash  = () => circ() * (1 - props.pct / 100);
  const isComplete = () => props.pct >= 100;

  return (
    <svg
      width={sz()}
      height={sz()}
      viewBox={`0 0 ${sz()} ${sz()}`}
      style={{ transform: 'rotate(-90deg)', 'flex-shrink': 0 }}
    >
      {/* Track */}
      <circle
        cx={sz() / 2} cy={sz() / 2} r={r()}
        fill="none"
        stroke="rgba(255,255,255,0.05)"
        stroke-width={sw()}
      />
      {/* Progress */}
      <circle
        cx={sz() / 2} cy={sz() / 2} r={r()}
        fill="none"
        stroke={isComplete() ? 'var(--color-success)' : 'var(--color-primary)'}
        stroke-width={sw()}
        stroke-linecap="round"
        stroke-dasharray={String(circ())}
        stroke-dashoffset={dash()}
        style={{
          transition: 'stroke-dashoffset 0.6s var(--ease-spring), stroke 0.4s var(--ease-spring)',
          filter: isComplete() ? '0 0 12px var(--color-success-glow)' : 'none'
        }}
      />
    </svg>
  );
};

// ── Stroke-draw SVG Checkmark ───────────────────────────────────────────────
const Checkmark: Component<{ done: boolean; color?: string }> = (props) => (
  <svg
    viewBox="0 0 24 24"
    width="14"
    height="14"
    style={{ overflow: 'visible', display: 'block' }}
    aria-hidden="true"
  >
    <polyline
      points="4,13 9,18 20,7"
      fill="none"
      stroke={props.color ?? 'white'}
      stroke-width="2.5"
      stroke-linecap="round"
      stroke-linejoin="round"
      stroke-dasharray="24"
      stroke-dashoffset={props.done ? '0' : '24'}
      style={{
        transition: 'stroke-dashoffset 0.35s var(--ease-spring)',
      }}
    />
  </svg>
);

// ── Big Circular Checkbox ───────────────────────────────────────────────────
const CircleCheckbox: Component<{ done: boolean; onToggle: () => void }> = (props) => {
  const [pressed, setPressed] = createSignal(false);

  return (
    <button
      onClick={props.onToggle}
      onMouseDown={() => setPressed(true)}
      onMouseUp={() => setPressed(false)}
      onMouseLeave={() => setPressed(false)}
      aria-pressed={props.done}
      style={{
        width: '32px',
        height: '32px',
        'border-radius': '50%',
        border: `2px solid ${props.done ? 'var(--color-success)' : 'rgba(255,255,255,0.18)'}`,
        background: props.done
          ? 'linear-gradient(135deg, var(--color-success), #16a34a)'
          : 'transparent',
        display: 'flex',
        'align-items': 'center',
        'justify-content': 'center',
        cursor: 'pointer',
        flex: '0 0 32px',
        transition: 'border-color 0.25s var(--ease-spring), background 0.25s var(--ease-spring), transform 0.15s var(--ease-spring), box-shadow 0.25s var(--ease-spring)',
        transform: pressed() ? 'scale(0.88)' : props.done ? 'scale(1.05)' : 'scale(1)',
        'box-shadow': props.done ? '0 0 0 4px var(--color-success-muted), 0 2px 8px rgba(34,197,94,0.3)' : '0 0 0 0px transparent',
        outline: 'none',
        position: 'relative',
        overflow: 'visible',
      }}
    >
      <Checkmark done={props.done} />
    </button>
  );
};

// ── Checklist Item Row ──────────────────────────────────────────────────────
const ChecklistItemRow: Component<{
  item: { id: string; text: string; done: boolean };
  onToggle: () => void;
  index: number;
}> = (props) => {
  const [hovered, setHovered] = createSignal(false);

  return (
    <div
      class="animate-slide-up"
      style={{
        'animation-delay': `${props.index * 45}ms`,
        display: 'flex',
        'align-items': 'center',
        gap: 'var(--space-4)',
        padding: 'var(--space-3) var(--space-4)',
        'border-radius': 'var(--radius-lg)',
        background: hovered()
          ? 'rgba(255,255,255,0.03)'
          : props.item.done
          ? 'rgba(34,197,94,0.04)'
          : 'transparent',
        border: `1px solid ${hovered() ? 'rgba(255,255,255,0.09)' : props.item.done ? 'rgba(34,197,94,0.12)' : 'transparent'}`,
        transition: 'background 0.2s var(--ease-spring), border-color 0.2s var(--ease-spring)',
        cursor: 'pointer',
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={props.onToggle}
    >
      <CircleCheckbox done={props.item.done} onToggle={props.onToggle} />

      <span
        style={{
          flex: 1,
          'font-size': 'var(--text-body-size)',
          'font-weight': '400',
          color: props.item.done ? 'var(--color-text-muted)' : 'var(--color-text)',
          'text-decoration': props.item.done ? 'line-through' : 'none',
          'text-decoration-color': 'var(--color-text-faint)',
          transition: 'color 0.25s var(--ease-spring), text-decoration 0.25s',
          'word-break': 'break-word',
        }}
      >
        {props.item.text}
      </span>

      <Show when={props.item.done}>
        <span style={{
          'font-size': 'var(--text-xs-size)',
          color: 'var(--color-success)',
          'font-weight': 600,
          opacity: 0.8,
          animation: 'fadeIn 0.3s var(--ease-spring) both'
        }}>
          انجام شد
        </span>
      </Show>
    </div>
  );
};

// ── Streak Badge ────────────────────────────────────────────────────────────
const StreakBadge: Component<{ count: number }> = (props) => (
  <div
    style={{
      display: 'inline-flex',
      'align-items': 'center',
      gap: 'var(--space-1-5)',
      background: 'linear-gradient(135deg, rgba(251,146,60,0.15), rgba(239,68,68,0.10))',
      border: '1px solid rgba(251,146,60,0.25)',
      'border-radius': 'var(--radius-round)',
      padding: '4px 12px',
      animation: props.count > 0 ? 'streakGlow 2.5s ease-in-out infinite' : 'none'
    }}
  >
    <svg width="14" height="14" viewBox="0 0 24 24" fill="var(--color-streak)">
      <path d="M12 2C9.5 6 8 8.5 8 12c0 2.5 1.3 4.7 3.3 6-.5-1.5-.3-3.2.7-4.5.5 2 2 3.5 3.5 4 0-1.5 0-3-.5-4 1.5 1 2.5 2.5 2.5 4.5 1.5-1.5 2.5-3.5 2.5-6 0-4-3-8.5-8-10z"/>
    </svg>
    <span style={{
      'font-size': 'var(--text-xs-size)',
      'font-weight': '700',
      color: 'var(--color-streak)',
      'letter-spacing': '0.02em'
    }}>
      {formatPersianNumber(props.count)} روز
    </span>
  </div>
);

// ── Main Page ───────────────────────────────────────────────────────────────
const ChecklistsPage: Component = () => {
  const [activeDate, setActiveDate] = createSignal<string>(getLocalDateString());
  const [newItemText, setNewItemText] = createSignal('');
  const [inputFocused, setInputFocused] = createSignal(false);

  const [checklist, { refetch: refetchChecklist }] = createResource(
    () => ({ date: activeDate(), trigger: checklistRefreshTrigger() }),
    async ({ date }) => getChecklistByDate(date)
  );

  const [items, { refetch: refetchItems }] = createResource(
    () => {
      const cl = checklist();
      return cl ? { id: cl.id, trigger: checklistRefreshTrigger() } : null;
    },
    async ({ id }) => getChecklistItems(id)
  );

  createEffect(() => { activeDate(); refetchChecklist(); });

  const completed   = createMemo(() => (items() ?? []).filter(i => i.done).length);
  const total       = createMemo(() => (items() ?? []).length);
  const pct         = createMemo(() => total() === 0 ? 0 : Math.round((completed() / total()) * 100));
  const isComplete  = createMemo(() => total() > 0 && pct() === 100);
  const isToday     = createMemo(() => activeDate() === getLocalDateString());
  const streak      = createMemo(() => isComplete() ? 3 : 0); // would be real from DB

  const handleCreateChecklist = async () => {
    const displayDate = formatJalaliDate(new Date(activeDate()));
    const parts = displayDate.split(' ');
    await createChecklist({ title: `چک‌لیست ${parts[0]} ${parts[1]}`, date: activeDate(), notes: '' });
    refetchChecklist();
    triggerChecklistRefresh();
  };

  const handleAddItem = async (e: Event) => {
    e.preventDefault();
    const cl = checklist();
    if (!cl || !newItemText().trim()) return;
    await addChecklistItem({ checklist_id: cl.id, text: newItemText().trim() });
    setNewItemText('');
    refetchItems();
    triggerChecklistRefresh();
  };

  const handleToggleItem = async (itemId: string, currentDone: boolean) => {
    await toggleChecklistItem(itemId, !currentDone);
    refetchItems();
    triggerChecklistRefresh();
  };

  const handlePrevDay = () => {
    const d = new Date(activeDate()); d.setDate(d.getDate() - 1);
    setActiveDate(getLocalDateString(d));
  };
  const handleNextDay = () => {
    const d = new Date(activeDate()); d.setDate(d.getDate() + 1);
    setActiveDate(getLocalDateString(d));
  };
  const handleGoToToday = () => setActiveDate(getLocalDateString());

  return (
    <div
      class="animate-fade-in"
      style={{
        display: 'flex',
        'flex-direction': 'column',
        'align-items': 'center',
        gap: 'var(--space-5)',
        padding: 'var(--space-4) 0 var(--space-8)',
        'overflow-y': 'auto',
      }}
    >
      {/* ─── Date Navigator ──────────────────────────────────────── */}
      <div
        style={{
          width: '100%',
          'max-width': '560px',
          display: 'flex',
          'align-items': 'center',
          'justify-content': 'space-between',
          gap: 'var(--space-3)',
          padding: 'var(--space-1) 0',
        }}
      >
        {/* Prev */}
        <button
          onClick={handlePrevDay}
          style={{
            width: '40px', height: '40px',
            'border-radius': '50%',
            background: 'var(--color-surface-2)',
            border: '1px solid var(--color-border)',
            display: 'flex', 'align-items': 'center', 'justify-content': 'center',
            color: 'var(--color-text-secondary)',
            transition: 'all var(--transition-fast)',
            'flex-shrink': 0,
          }}
          onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = 'var(--color-surface-3)'; (e.currentTarget as HTMLButtonElement).style.color = 'var(--color-text)'; }}
          onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'var(--color-surface-2)'; (e.currentTarget as HTMLButtonElement).style.color = 'var(--color-text-secondary)'; }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </button>

        {/* Date Center */}
        <div style={{ display: 'flex', 'flex-direction': 'column', 'align-items': 'center', gap: 'var(--space-1)', flex: 1 }}>
          <div style={{ display: 'flex', 'align-items': 'center', gap: 'var(--space-2)' }}>
            <Show when={isToday()}>
              <span style={{
                'font-size': 'var(--text-xs-size)',
                'font-weight': '600',
                color: 'var(--color-primary)',
                background: 'var(--color-primary-muted)',
                padding: '2px 8px',
                'border-radius': 'var(--radius-round)',
                'letter-spacing': '0.04em',
                'text-transform': 'uppercase'
              }}>
                امروز
              </span>
            </Show>
            <span style={{
              'font-size': 'var(--text-h2-size)',
              'font-weight': '700',
              'letter-spacing': 'var(--text-h2-tracking)',
              color: 'var(--color-text)',
            }}>
              {formatJalaliDate(activeDate())}
            </span>
          </div>
          <Show when={!isToday()}>
            <button
              onClick={handleGoToToday}
              style={{
                'font-size': 'var(--text-xs-size)',
                color: 'var(--color-primary)',
                'font-weight': 600,
                padding: '2px 8px',
                'border-radius': 'var(--radius-round)',
                background: 'var(--color-primary-muted)',
                transition: 'background var(--transition-fast)',
              }}
            >
              بازگشت به امروز
            </button>
          </Show>
          <Show when={streak() > 0 && isComplete()}>
            <StreakBadge count={streak()} />
          </Show>
        </div>

        {/* Next */}
        <button
          onClick={handleNextDay}
          style={{
            width: '40px', height: '40px',
            'border-radius': '50%',
            background: 'var(--color-surface-2)',
            border: '1px solid var(--color-border)',
            display: 'flex', 'align-items': 'center', 'justify-content': 'center',
            color: 'var(--color-text-secondary)',
            transition: 'all var(--transition-fast)',
            'flex-shrink': 0,
          }}
          onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = 'var(--color-surface-3)'; (e.currentTarget as HTMLButtonElement).style.color = 'var(--color-text)'; }}
          onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'var(--color-surface-2)'; (e.currentTarget as HTMLButtonElement).style.color = 'var(--color-text-secondary)'; }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>
      </div>

      {/* ─── Main Card ───────────────────────────────────────────── */}
      <div
        style={{
          width: '100%',
          'max-width': '560px',
          background: 'var(--color-surface-1)',
          border: `1px solid ${isComplete() ? 'rgba(34,197,94,0.2)' : 'var(--color-border)'}`,
          'border-radius': 'var(--radius-xl)',
          'box-shadow': isComplete()
            ? '0 8px 32px rgba(34,197,94,0.08), var(--shadow-3)'
            : 'var(--shadow-3)',
          overflow: 'hidden',
          transition: 'border-color 0.5s var(--ease-spring), box-shadow 0.5s var(--ease-spring)',
        }}
      >
        <Show
          when={checklist()}
          fallback={
            /* ─── Empty State ─── */
            <div style={{
              padding: 'var(--space-16) var(--space-8)',
              display: 'flex',
              'flex-direction': 'column',
              'align-items': 'center',
              gap: 'var(--space-5)',
              'text-align': 'center',
            }}>
              <div style={{
                width: '72px', height: '72px',
                'border-radius': '50%',
                background: 'var(--color-surface-2)',
                border: '1px solid var(--color-border)',
                display: 'flex', 'align-items': 'center', 'justify-content': 'center',
              }}>
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--color-text-faint)" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                  <rect x="3" y="3" width="18" height="18" rx="3"/><line x1="9" y1="12" x2="15" y2="12"/><line x1="12" y1="9" x2="12" y2="15"/>
                </svg>
              </div>
              <div>
                <p style={{ 'font-size': 'var(--text-h3-size)', 'font-weight': '600', color: 'var(--color-text)', 'margin-bottom': 'var(--space-2)' }}>
                  هنوز لیستی برای این روز نداری
                </p>
                <p style={{ 'font-size': 'var(--text-sm-size)', color: 'var(--color-text-muted)' }}>
                  یک چک‌لیست جدید بساز و روزت رو سازماندهی کن
                </p>
              </div>
              <button
                onClick={handleCreateChecklist}
                class="btn-primary"
                style={{ 'font-size': 'var(--text-body-size)', padding: 'var(--space-3) var(--space-7)' }}
              >
                ساخت چک‌لیست روزانه
              </button>
            </div>
          }
        >
          {/* ─── Progress Header ─── */}
          <div style={{
            padding: 'var(--space-6) var(--space-6) var(--space-5)',
            'border-bottom': '1px solid var(--color-border-subtle)',
            display: 'flex',
            'align-items': 'center',
            gap: 'var(--space-5)',
            background: isComplete()
              ? 'linear-gradient(to bottom, rgba(34,197,94,0.04), transparent)'
              : 'transparent',
          }}>
            {/* Ring */}
            <div style={{ position: 'relative', 'flex-shrink': 0 }}>
              <ProgressRing pct={pct()} size={88} stroke={7} />
              <div style={{
                position: 'absolute', inset: 0,
                display: 'flex', 'flex-direction': 'column',
                'align-items': 'center', 'justify-content': 'center',
              }}>
                <span style={{
                  'font-size': 'var(--text-h2-size)',
                  'font-weight': '700',
                  'letter-spacing': '-0.04em',
                  color: isComplete() ? 'var(--color-success)' : 'var(--color-text)',
                  'line-height': '1',
                  transition: 'color 0.4s var(--ease-spring)',
                }}>
                  {formatPersianNumber(pct())}
                </span>
                <span style={{ 'font-size': '10px', color: 'var(--color-text-muted)', 'font-weight': 500 }}>درصد</span>
              </div>
            </div>

            {/* Info */}
            <div style={{ flex: 1 }}>
              <p style={{
                'font-size': 'var(--text-h3-size)',
                'font-weight': '600',
                color: 'var(--color-text)',
                'margin-bottom': 'var(--space-1)',
              }}>
                {isComplete()
                  ? 'عالیه! همه کارها انجام شد'
                  : total() === 0
                  ? 'هنوز کاری اضافه نکردی'
                  : `${formatPersianNumber(completed())} از ${formatPersianNumber(total())} کار`
                }
              </p>
              <p style={{ 'font-size': 'var(--text-sm-size)', color: 'var(--color-text-muted)' }}>
                {isComplete()
                  ? 'امروز روز موفقی داشتی'
                  : total() === 0
                  ? 'اولین کارت رو پایین اضافه کن'
                  : `${formatPersianNumber(total() - completed())} کار باقی مانده`}
              </p>
              <Show when={isComplete()}>
                <div style={{ 'margin-top': 'var(--space-2)' }}>
                  <StreakBadge count={streak()} />
                </div>
              </Show>
            </div>
          </div>

          {/* ─── Items List ─── */}
          <div style={{ padding: 'var(--space-3) var(--space-4)' }}>
            <Show
              when={total() > 0}
              fallback={
                <p style={{
                  'text-align': 'center',
                  padding: 'var(--space-8) 0',
                  color: 'var(--color-text-muted)',
                  'font-size': 'var(--text-sm-size)',
                }}>
                  اولین کارت رو اضافه کن...
                </p>
              }
            >
              <div class="stagger-children" style={{ display: 'flex', 'flex-direction': 'column', gap: 'var(--space-1)' }}>
                {/* Pending items first, then done */}
                <For each={(items() ?? []).filter(i => !i.done)}>
                  {(item, idx) => (
                    <ChecklistItemRow
                      item={item}
                      index={idx()}
                      onToggle={() => handleToggleItem(item.id, item.done)}
                    />
                  )}
                </For>
                <Show when={(items() ?? []).some(i => i.done)}>
                  <div style={{
                    'font-size': 'var(--text-xs-size)',
                    color: 'var(--color-text-faint)',
                    'font-weight': 600,
                    'letter-spacing': '0.06em',
                    padding: 'var(--space-3) var(--space-4) var(--space-1)',
                    'text-transform': 'uppercase',
                  }}>
                    انجام‌شده‌ها
                  </div>
                </Show>
                <For each={(items() ?? []).filter(i => i.done)}>
                  {(item, idx) => (
                    <ChecklistItemRow
                      item={item}
                      index={idx() + 10}
                      onToggle={() => handleToggleItem(item.id, item.done)}
                    />
                  )}
                </For>
              </div>
            </Show>
          </div>

          {/* ─── Add Item Input ─── */}
          <div style={{
            padding: 'var(--space-4) var(--space-5)',
            'border-top': '1px solid var(--color-border-subtle)',
          }}>
            <form onSubmit={handleAddItem} style={{ display: 'flex', gap: 'var(--space-2)', 'align-items': 'center' }}>
              <div style={{
                flex: 1,
                display: 'flex',
                'align-items': 'center',
                background: inputFocused() ? 'var(--color-surface-3)' : 'var(--color-surface-2)',
                border: `1px solid ${inputFocused() ? 'var(--color-primary)' : 'var(--color-border)'}`,
                'border-radius': 'var(--radius-lg)',
                padding: 'var(--space-2-5) var(--space-4)',
                gap: 'var(--space-3)',
                transition: 'border-color var(--transition-fast), background var(--transition-fast), box-shadow var(--transition-fast)',
                'box-shadow': inputFocused() ? '0 0 0 3px var(--color-primary-muted)' : 'none',
              }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={inputFocused() ? 'var(--color-primary)' : 'var(--color-text-muted)'} stroke-width="2" stroke-linecap="round" style={{ transition: 'stroke 0.2s', 'flex-shrink': 0 }}>
                  <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/>
                </svg>
                <input
                  type="text"
                  placeholder="کار جدیدی اضافه کنید..."
                  value={newItemText()}
                  onInput={e => setNewItemText(e.currentTarget.value)}
                  onFocus={() => setInputFocused(true)}
                  onBlur={() => setInputFocused(false)}
                  style={{
                    flex: 1,
                    background: 'transparent',
                    border: 'none',
                    outline: 'none',
                    'font-size': 'var(--text-body-size)',
                    color: 'var(--color-text)',
                    'font-family': 'inherit',
                  }}
                />
              </div>
              <button
                type="submit"
                disabled={!newItemText().trim()}
                style={{
                  width: '42px', height: '42px',
                  'border-radius': '50%',
                  background: newItemText().trim() ? 'var(--color-primary)' : 'var(--color-surface-3)',
                  border: 'none',
                  display: 'flex', 'align-items': 'center', 'justify-content': 'center',
                  color: newItemText().trim() ? 'white' : 'var(--color-text-faint)',
                  transition: 'all var(--transition-fast)',
                  cursor: newItemText().trim() ? 'pointer' : 'default',
                  'flex-shrink': 0,
                  'box-shadow': newItemText().trim() ? '0 4px 12px var(--color-primary-glow)' : 'none',
                }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                  <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
                </svg>
              </button>
            </form>
          </div>
        </Show>
      </div>
    </div>
  );
};

export default ChecklistsPage;
