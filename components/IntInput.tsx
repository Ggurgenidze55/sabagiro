'use client';

import { useEffect, useState } from 'react';

type IntInputProps = {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  disabled?: boolean;
  required?: boolean;
  className?: string;
};

function formatDisplay(value: number, min?: number): string {
  if (value === 0 && (min === undefined || min <= 0)) return '';
  return String(value);
}

/** Integer text field — allows clearing while typing; clamps on blur. */
export function IntInput({
  value,
  onChange,
  min,
  max,
  disabled,
  required,
  className,
}: IntInputProps) {
  const [focused, setFocused] = useState(false);
  const [draft, setDraft] = useState(() => formatDisplay(value, min));

  useEffect(() => {
    if (!focused) {
      setDraft(formatDisplay(value, min));
    }
  }, [value, min, focused]);

  function handleFocus() {
    setFocused(true);
    setDraft(formatDisplay(value, min));
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const digits = e.target.value.replace(/\D/g, '');
    setDraft(digits);
    if (digits === '') return;
    let num = parseInt(digits, 10);
    if (Number.isNaN(num)) return;
    if (max !== undefined) num = Math.min(max, num);
    onChange(num);
  }

  function handleBlur() {
    setFocused(false);
    const digits = draft.replace(/\D/g, '');
    if (digits === '') {
      const fallback = min !== undefined && min > 0 ? min : 0;
      onChange(fallback);
      setDraft(formatDisplay(fallback, min));
      return;
    }
    let num = parseInt(digits, 10);
    if (Number.isNaN(num)) num = min !== undefined && min > 0 ? min : 0;
    if (min !== undefined) num = Math.max(min, num);
    if (max !== undefined) num = Math.min(max, num);
    onChange(num);
    setDraft(formatDisplay(num, min));
  }

  const showEmpty = !focused && value === 0 && (min === undefined || min <= 0);

  return (
    <input
      type="text"
      inputMode="numeric"
      pattern="[0-9]*"
      className={className}
      value={focused ? draft : showEmpty ? '' : String(value)}
      onFocus={handleFocus}
      onChange={handleChange}
      onBlur={handleBlur}
      disabled={disabled}
      required={required && !showEmpty && draft !== ''}
    />
  );
}
