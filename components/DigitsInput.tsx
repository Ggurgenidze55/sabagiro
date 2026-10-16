'use client';

import { useEffect, useState } from 'react';

type DigitsInputProps = {
  value: string;
  onChange: (value: string) => void;
  maxLength?: number;
  min?: number;
  max?: number;
  required?: boolean;
  className?: string;
  placeholder?: string;
};

/** Free-form numeric string (e.g. age) — clearable while typing; optional min/max on blur. */
export function DigitsInput({
  value,
  onChange,
  maxLength = 3,
  min,
  max,
  required,
  className,
  placeholder,
}: DigitsInputProps) {
  const [focused, setFocused] = useState(false);
  const [draft, setDraft] = useState(value);

  useEffect(() => {
    if (!focused) setDraft(value);
  }, [value, focused]);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const digits = e.target.value.replace(/\D/g, '').slice(0, maxLength);
    setDraft(digits);
    onChange(digits);
  }

  function handleBlur() {
    setFocused(false);
    let digits = draft.replace(/\D/g, '');
    if (digits === '') {
      onChange('');
      setDraft('');
      return;
    }
    let num = parseInt(digits, 10);
    if (Number.isNaN(num)) {
      onChange('');
      setDraft('');
      return;
    }
    if (min !== undefined) num = Math.max(min, num);
    if (max !== undefined) num = Math.min(max, num);
    const next = String(num);
    onChange(next);
    setDraft(next);
  }

  return (
    <input
      type="text"
      inputMode="numeric"
      pattern="[0-9]*"
      className={className}
      value={focused ? draft : value}
      onFocus={() => {
        setFocused(true);
        setDraft(value);
      }}
      onChange={handleChange}
      onBlur={handleBlur}
      required={required}
      placeholder={placeholder}
      autoComplete="off"
    />
  );
}
