type SectionDividerProps = {
  /** 1-based section index — renders as #01, #02, … */
  index?: number;
  className?: string;
};

export function SectionDivider({ index, className }: SectionDividerProps) {
  const indexLabel =
    index != null ? `#${String(index).padStart(2, '0')}` : null;

  return (
    <div
      className={[
        'section-divider',
        indexLabel ? 'section-divider--indexed' : '',
        className ?? '',
      ]
        .filter(Boolean)
        .join(' ')}
      aria-hidden="true"
    >
      {indexLabel ? <span className="section-divider__index">{indexLabel}</span> : null}
      <span className="section-divider__line" />
    </div>
  );
}
