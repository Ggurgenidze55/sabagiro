'use client';

type IntInputProps = {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  disabled?: boolean;
  required?: boolean;
  className?: string;
};

/** Integer field without leading-zero quirks of type="number" (0 + 6 → 06). */
export function IntInput({
  value,
  onChange,
  min,
  max,
  disabled,
  required,
  className,
}: IntInputProps) {
  const showEmpty = value === 0 && (min === undefined || min <= 0);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const digits = e.target.value.replace(/\D/g, '');
    if (digits === '') {
      onChange(min !== undefined && min > 0 ? min : 0);
      return;
    }
    let num = parseInt(digits, 10);
    if (Number.isNaN(num)) return;
    if (min !== undefined) num = Math.max(min, num);
    if (max !== undefined) num = Math.min(max, num);
    onChange(num);
  }

  return (
    <input
      type="text"
      inputMode="numeric"
      pattern="[0-9]*"
      className={className}
      value={showEmpty ? '' : String(value)}
      onChange={handleChange}
      disabled={disabled}
      required={required && !showEmpty}
    />
  );
}
