import { createSignal, createEffect, For, Show, onCleanup } from 'solid-js';
import type { Component } from 'solid-js';
import * as jalaali from 'jalaali-js';

const PERSIAN_DIGITS = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
const toPersian = (n: number): string => String(n).replace(/[0-9]/g, d => PERSIAN_DIGITS[+d]);

const MONTHS = [
  'فروردین', 'اردیبهشت', 'خرداد',
  'تیر', 'مرداد', 'شهریور',
  'مهر', 'آبان', 'آذر',
  'دی', 'بهمن', 'اسفند'
];

const WEEK_DAYS = ['ش', 'ی', 'د', 'س', 'چ', 'پ', 'ج'];

/** Days in a Jalali month (1-indexed). */
function jalaliMonthDays(jm: number, jy: number): number {
  if (jm <= 6) return 31;
  if (jm <= 11) return 30;
  return jalaali.isLeapJalaaliYear(jy) ? 30 : 29;
}

/** The weekday index (0=Saturday … 6=Friday) of the first day of a Jalali month. */
function firstDayOfMonthWeekday(jy: number, jm: number): number {
  const g = jalaali.toGregorian(jy, jm, 1);
  const d = new Date(g.gy, g.gm - 1, g.gd);
  // JS getDay(): 0=Sun … 6=Sat → remap so 0=Sat
  return (d.getDay() + 1) % 7;
}

interface JalaliDatePickerProps {
  /** Gregorian date string (YYYY-MM-DD) or empty. */
  value: string;
  /** Callback returning Gregorian date string (YYYY-MM-DD). */
  onChange: (gregorian: string) => void;
  placeholder?: string;
  disabled?: boolean;
}

export const JalaliDatePicker: Component<JalaliDatePickerProps> = (props) => {
  const [isOpen, setIsOpen] = createSignal(false);
  let containerRef: HTMLDivElement | undefined;

  // Derive the initial Jalali view from the value prop
  const getInitialView = () => {
    if (props.value) {
      const d = new Date(props.value);
      if (!isNaN(d.getTime())) {
        const j = jalaali.toJalaali(d.getFullYear(), d.getMonth() + 1, d.getDate());
        return { jy: j.jy, jm: j.jm };
      }
    }
    const now = new Date();
    const j = jalaali.toJalaali(now.getFullYear(), now.getMonth() + 1, now.getDate());
    return { jy: j.jy, jm: j.jm };
  };

  const initial = getInitialView();
  const [viewYear, setViewYear] = createSignal(initial.jy);
  const [viewMonth, setViewMonth] = createSignal(initial.jm); // 1-12

  // Selected Jalali date derived from value prop
  const selectedJalali = () => {
    if (!props.value) return null;
    const d = new Date(props.value);
    if (isNaN(d.getTime())) return null;
    return jalaali.toJalaali(d.getFullYear(), d.getMonth() + 1, d.getDate());
  };

  // Today in Jalali
  const today = (() => {
    const n = new Date();
    return jalaali.toJalaali(n.getFullYear(), n.getMonth() + 1, n.getDate());
  })();

  // Generate calendar grid (6 rows x 7 cols max)
  const calendarDays = (): (number | null)[] => {
    const days: (number | null)[] = [];
    const offset = firstDayOfMonthWeekday(viewYear(), viewMonth());
    const totalDays = jalaliMonthDays(viewMonth(), viewYear());

    // Fill leading blanks
    for (let i = 0; i < offset; i++) days.push(null);
    // Fill actual days
    for (let d = 1; d <= totalDays; d++) days.push(d);
    // Pad to full rows of 7
    while (days.length % 7 !== 0) days.push(null);

    return days;
  };

  const handlePrevMonth = () => {
    if (viewMonth() === 1) {
      setViewMonth(12);
      setViewYear(viewYear() - 1);
    } else {
      setViewMonth(viewMonth() - 1);
    }
  };

  const handleNextMonth = () => {
    if (viewMonth() === 12) {
      setViewMonth(1);
      setViewYear(viewYear() + 1);
    } else {
      setViewMonth(viewMonth() + 1);
    }
  };

  const handleToday = () => {
    const now = new Date();
    const j = jalaali.toJalaali(now.getFullYear(), now.getMonth() + 1, now.getDate());
    setViewYear(j.jy);
    setViewMonth(j.jm);
    selectDay(j.jy, j.jm, j.jd);
  };

  const selectDay = (jy: number, jm: number, jd: number) => {
    const g = jalaali.toGregorian(jy, jm, jd);
    const gregorian = `${g.gy}-${String(g.gm).padStart(2, '0')}-${String(g.gd).padStart(2, '0')}`;
    props.onChange(gregorian);
    setIsOpen(false);
  };

  const isSelected = (day: number | null): boolean => {
    if (!day) return false;
    const sel = selectedJalali();
    return sel !== null && sel.jy === viewYear() && sel.jm === viewMonth() && sel.jd === day;
  };

  const isToday = (day: number | null): boolean => {
    if (!day) return false;
    return today.jy === viewYear() && today.jm === viewMonth() && today.jd === day;
  };

  // Format display value
  const displayValue = (): string => {
    if (!props.value) return '';
    const d = new Date(props.value);
    if (isNaN(d.getTime())) return '';
    const j = jalaali.toJalaali(d.getFullYear(), d.getMonth() + 1, d.getDate());
    return `${toPersian(j.jd)} ${MONTHS[j.jm - 1]} ${toPersian(j.jy)}`;
  };

  // Close on click outside
  const handleClickOutside = (e: MouseEvent) => {
    if (containerRef && !containerRef.contains(e.target as Node)) {
      setIsOpen(false);
    }
  };

  // Close on Escape key
  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Escape' && isOpen()) {
      setIsOpen(false);
      e.preventDefault();
    }
  };

  if (typeof window !== 'undefined') {
    window.addEventListener('mousedown', handleClickOutside);
    window.addEventListener('keydown', handleKeyDown);
    onCleanup(() => {
      window.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('keydown', handleKeyDown);
    });
  }

  // Reset view when value changes externally
  createEffect(() => {
    const v = props.value;
    if (v) {
      const d = new Date(v);
      if (!isNaN(d.getTime())) {
        const j = jalaali.toJalaali(d.getFullYear(), d.getMonth() + 1, d.getDate());
        setViewYear(j.jy);
        setViewMonth(j.jm);
      }
    }
  });

  return (
    <div
      ref={containerRef}
      style={{ position: 'relative', width: '100%' }}
    >
      {/* Trigger Input */}
      <button
        type="button"
        onClick={() => { if (!props.disabled) setIsOpen(!isOpen()); }}
        class="premium-input"
        style={{
          display: 'flex',
          'align-items': 'center',
          'justify-content': 'space-between',
          width: '100%',
          cursor: props.disabled ? 'default' : 'pointer',
          opacity: props.disabled ? '0.6' : '1',
        }}
      >
        <span style={{ color: displayValue() ? 'var(--color-text)' : 'var(--color-text-muted)' }}>
          {displayValue() || props.placeholder || 'انتخاب تاریخ...'}
        </span>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style={{ 'flex-shrink': 0, color: 'var(--color-text-muted)' }}>
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
          <line x1="16" y1="2" x2="16" y2="6" />
          <line x1="8" y1="2" x2="8" y2="6" />
          <line x1="3" y1="10" x2="21" y2="10" />
        </svg>
      </button>

      {/* Calendar Dropdown */}
      <Show when={isOpen()}>
        <div
          class="animate-slide-up"
          style={{
            position: 'absolute',
            top: 'calc(100% + 6px)',
            left: 0,
            right: 0,
            'z-index': 1100,
            'background-color': 'var(--color-surface-1)',
            border: '1px solid var(--color-border)',
            'border-radius': 'var(--radius-xl)',
            'box-shadow': 'var(--shadow-4)',
            padding: 'var(--space-4)',
            'min-width': '300px',
            direction: 'rtl',
          }}
        >
          {/* Month/Year Header */}
          <div style={{
            display: 'flex',
            'align-items': 'center',
            'justify-content': 'space-between',
            'margin-bottom': 'var(--space-3)',
            'padding-bottom': 'var(--space-3)',
            'border-bottom': '1px solid var(--color-border)',
          }}>
            <button
              type="button"
              onClick={handleNextMonth}
              style={{
                width: '32px', height: '32px',
                'border-radius': 'var(--radius-md)',
                display: 'flex', 'align-items': 'center', 'justify-content': 'center',
                'background-color': 'transparent',
                color: 'var(--color-text-secondary)',
                transition: 'all var(--transition-fast)',
              }}
              onMouseEnter={e => { e.currentTarget.style.backgroundColor = 'var(--color-surface-2)'; e.currentTarget.style.color = 'var(--color-text)'; }}
              onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = 'var(--color-text-secondary)'; }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6" /></svg>
            </button>

            <button
              type="button"
              onClick={handleToday}
              style={{
                display: 'flex',
                'flex-direction': 'column',
                'align-items': 'center',
                gap: '2px',
                'border-radius': 'var(--radius-md)',
                padding: 'var(--space-1) var(--space-3)',
                transition: 'all var(--transition-fast)',
              }}
              onMouseEnter={e => { e.currentTarget.style.backgroundColor = 'var(--color-surface-2)'; }}
              onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent'; }}
            >
              <span style={{
                'font-size': 'var(--text-h3-size)',
                'font-weight': 700,
                color: 'var(--color-text)',
                'letter-spacing': '-0.02em',
              }}>
                {MONTHS[viewMonth() - 1]} {toPersian(viewYear())}
              </span>
            </button>

            <button
              type="button"
              onClick={handlePrevMonth}
              style={{
                width: '32px', height: '32px',
                'border-radius': 'var(--radius-md)',
                display: 'flex', 'align-items': 'center', 'justify-content': 'center',
                'background-color': 'transparent',
                color: 'var(--color-text-secondary)',
                transition: 'all var(--transition-fast)',
              }}
              onMouseEnter={e => { e.currentTarget.style.backgroundColor = 'var(--color-surface-2)'; e.currentTarget.style.color = 'var(--color-text)'; }}
              onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = 'var(--color-text-secondary)'; }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6" /></svg>
            </button>
          </div>

          {/* Weekday Headers */}
          <div style={{
            display: 'grid',
            'grid-template-columns': 'repeat(7, 1fr)',
            'margin-bottom': 'var(--space-1)',
          }}>
            <For each={WEEK_DAYS}>
              {(wd) => (
                <div style={{
                  'text-align': 'center',
                  'font-size': 'var(--text-xs-size)',
                  'font-weight': 600,
                  color: 'var(--color-text-muted)',
                  padding: 'var(--space-1) 0',
                  'letter-spacing': '0.03em',
                }}>
                  {wd}
                </div>
              )}
            </For>
          </div>

          {/* Day Grid */}
          <div style={{
            display: 'grid',
            'grid-template-columns': 'repeat(7, 1fr)',
            gap: '2px',
          }}>
            <For each={calendarDays()}>
              {(day) => {
                const selected = () => isSelected(day);
                const todayCell = () => isToday(day);

                return (
                  <button
                    type="button"
                    disabled={!day}
                    onClick={() => day && selectDay(viewYear(), viewMonth(), day)}
                    style={{
                      width: '100%',
                      'aspect-ratio': '1',
                      'border-radius': 'var(--radius-md)',
                      display: 'flex',
                      'align-items': 'center',
                      'justify-content': 'center',
                      'font-size': 'var(--text-sm-size)',
                      'font-weight': selected() ? 700 : todayCell() ? 600 : 400,
                      color: !day
                        ? 'transparent'
                        : selected()
                        ? '#fff'
                        : todayCell()
                        ? 'var(--color-secondary)'
                        : 'var(--color-text)',
                      'background-color': selected()
                        ? 'var(--color-primary)'
                        : todayCell()
                        ? 'var(--color-secondary-muted)'
                        : 'transparent',
                      'box-shadow': selected() ? '0 2px 8px var(--color-primary-glow)' : 'none',
                      transition: 'all var(--transition-fast)',
                      cursor: day ? 'pointer' : 'default',
                      position: 'relative',
                      'min-height': '36px',
                    }}
                    onMouseEnter={e => {
                      if (day && !selected()) {
                        e.currentTarget.style.backgroundColor = 'var(--color-surface-2)';
                      }
                    }}
                    onMouseLeave={e => {
                      if (day && !selected()) {
                        e.currentTarget.style.backgroundColor = todayCell() ? 'var(--color-secondary-muted)' : 'transparent';
                      }
                    }}
                  >
                    {day ? toPersian(day) : ''}
                    {/* Today dot indicator */}
                    <Show when={todayCell() && !selected()}>
                      <div style={{
                        position: 'absolute',
                        bottom: '3px',
                        width: '4px',
                        height: '4px',
                        'border-radius': '50%',
                        'background-color': 'var(--color-secondary)',
                      }} />
                    </Show>
                  </button>
                );
              }}
            </For>
          </div>

          {/* Today Button Footer */}
          <div style={{
            'margin-top': 'var(--space-3)',
            'padding-top': 'var(--space-3)',
            'border-top': '1px solid var(--color-border)',
            display: 'flex',
            'justify-content': 'center',
          }}>
            <button
              type="button"
              onClick={handleToday}
              style={{
                'font-size': 'var(--text-xs-size)',
                'font-weight': 600,
                color: 'var(--color-primary)',
                padding: 'var(--space-1) var(--space-3)',
                'border-radius': 'var(--radius-round)',
                background: 'var(--color-primary-muted)',
                transition: 'all var(--transition-fast)',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = 'var(--color-primary)'; e.currentTarget.style.color = '#fff'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'var(--color-primary-muted)'; e.currentTarget.style.color = 'var(--color-primary)'; }}
            >
              برو به امروز
            </button>
          </div>
        </div>
      </Show>
    </div>
  );
};

export default JalaliDatePicker;
