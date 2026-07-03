import { createSignal, onCleanup, For } from 'solid-js';
import type { Component, JSX } from 'solid-js';
import { IconChevronDown } from './Icons';

interface Option {
  value: string;
  label: string;
}

interface CustomSelectProps {
  value: string;
  onChange: (value: string) => void;
  options: Option[];
  placeholder?: string;
  class?: string;
  style?: string | JSX.CSSProperties;
}

export const CustomSelect: Component<CustomSelectProps> = (props) => {
  const [isOpen, setIsOpen] = createSignal(false);
  let containerRef: HTMLDivElement | undefined;

  const currentLabel = () => {
    const opt = props.options.find(o => o.value === props.value);
    return opt ? opt.label : props.placeholder || 'انتخاب کنید...';
  };

  const handleToggle = (e: MouseEvent) => {
    e.stopPropagation();
    setIsOpen(!isOpen());
  };

  const handleSelect = (val: string, e: MouseEvent) => {
    e.stopPropagation();
    props.onChange(val);
    setIsOpen(false);
  };

  // Close when clicking outside
  const clickOutside = (e: MouseEvent) => {
    if (containerRef && !containerRef.contains(e.target as Node)) {
      setIsOpen(false);
    }
  };

  if (typeof window !== 'undefined') {
    window.addEventListener('click', clickOutside);
    onCleanup(() => {
      window.removeEventListener('click', clickOutside);
    });
  }

  return (
    <div 
      ref={containerRef}
      class={`custom-select-container ${props.class || ''}`}
      style={{
        position: 'relative',
        width: '100%',
        ...(typeof props.style === 'object' ? props.style : {})
      }}
    >
      {/* Select Trigger Button */}
      <button
        type="button"
        onClick={handleToggle}
        class="premium-input"
        style={{
          display: 'flex',
          'align-items': 'center',
          'justify-content': 'space-between',
          padding: 'var(--space-3) var(--space-4)',
          width: '100%',
          'text-align': 'right',
          cursor: 'pointer',
          'background-color': 'rgba(255, 255, 255, 0.02)',
          border: '1px solid var(--color-border)',
          'border-radius': 'var(--radius-md)',
          color: 'var(--color-text)',
          outline: 'none'
        }}
      >
        <span>{currentLabel()}</span>
        <IconChevronDown 
          style={{
            width: '16px',
            height: '16px',
            transition: 'transform var(--transition-normal)',
            transform: isOpen() ? 'rotate(180deg)' : 'rotate(0deg)',
            color: 'var(--color-text-muted)'
          }}
        />
      </button>

      {/* Select Dropdown Menu */}
      <div
        class="custom-select-menu"
        style={{
          position: 'absolute',
          top: 'calc(100% + 4px)',
          left: 0,
          right: 0,
          'background-color': 'var(--color-surface)',
          border: '1px solid var(--color-border)',
          'border-radius': 'var(--radius-md)',
          'box-shadow': 'var(--shadow-lg)',
          'z-index': 1050,
          'max-height': '220px',
          'overflow-y': 'auto',
          transition: 'opacity var(--transition-spring), transform var(--transition-spring)',
          'transform-origin': 'top center',
          transform: isOpen() ? 'scale(1) translateY(0)' : 'scale(0.95) translateY(-8px)',
          opacity: isOpen() ? 1 : 0,
          'pointer-events': isOpen() ? 'auto' : 'none',
          padding: '4px'
        }}
      >
        <For each={props.options}>
          {(opt) => {
            const isSelected = () => opt.value === props.value;
            return (
              <button
                type="button"
                onClick={(e) => handleSelect(opt.value, e)}
                style={{
                  display: 'block',
                  width: '100%',
                  padding: 'var(--space-2) var(--space-3)',
                  'text-align': 'right',
                  'font-size': 'var(--text-body-size)',
                  'border-radius': 'var(--radius-sm)',
                  color: isSelected() ? 'var(--color-primary)' : 'var(--color-text)',
                  'background-color': isSelected() ? 'rgba(255, 255, 255, 0.05)' : 'transparent',
                  transition: 'background-color var(--transition-fast), color var(--transition-fast)'
                }}
                onMouseEnter={(e) => {
                  if (!isSelected()) {
                    e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.03)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isSelected()) {
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }
                }}
              >
                {opt.label}
              </button>
            );
          }}
        </For>
      </div>
    </div>
  );
};
export default CustomSelect;
