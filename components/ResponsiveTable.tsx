'use client';

import { useState, type ReactNode } from 'react';

export type ResponsiveTableColumn = {
  id: string;
  header: string;
  /** Shown in collapsed mobile row (default: first column only) */
  mobileSummary?: boolean;
};

export type ResponsiveTableRow = {
  id: string;
  cells: Record<string, ReactNode>;
  /** Optional custom collapsed line on mobile */
  mobileSummary?: ReactNode;
};

type ResponsiveTableProps = {
  columns: ResponsiveTableColumn[];
  rows: ResponsiveTableRow[];
  empty?: ReactNode;
  tableClassName?: string;
};

function defaultSummary(columns: ResponsiveTableColumn[], row: ResponsiveTableRow) {
  const summaryCols = columns.filter((c) => c.mobileSummary);
  const cols = summaryCols.length > 0 ? summaryCols : columns.slice(0, 1);
  return (
    <span className="responsive-table__summary-text">
      {cols.map((col, i) => (
        <span key={col.id}>
          {i > 0 ? <span className="responsive-table__summary-sep"> · </span> : null}
          {row.cells[col.id]}
        </span>
      ))}
    </span>
  );
}

export function ResponsiveTable({
  columns,
  rows,
  empty,
  tableClassName = 'data-table',
}: ResponsiveTableProps) {
  const [openId, setOpenId] = useState<string | null>(null);

  if (rows.length === 0 && empty) {
    return <div className="responsive-table responsive-table--empty">{empty}</div>;
  }

  return (
    <div className="responsive-table">
      <div className="responsive-table__desktop table-scroll">
        <table className={tableClassName}>
          <thead>
            <tr>
              {columns.map((col) => (
                <th key={col.id}>{col.header}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id}>
                {columns.map((col) => (
                  <td key={col.id}>{row.cells[col.id]}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <ul className="responsive-table__mobile" role="list">
        {rows.map((row) => {
          const open = openId === row.id;
          return (
            <li key={row.id} className={`responsive-table__card${open ? ' is-open' : ''}`}>
              <button
                type="button"
                className="responsive-table__summary"
                aria-expanded={open}
                onClick={() => setOpenId(open ? null : row.id)}
              >
                {row.mobileSummary ?? defaultSummary(columns, row)}
                <span className="responsive-table__caret" aria-hidden="true">
                  {open ? '▴' : '▾'}
                </span>
              </button>
              {open ? (
                <dl className="responsive-table__details">
                  {columns.map((col) => (
                    <div key={col.id} className="responsive-table__field">
                      <dt>{col.header}</dt>
                      <dd>{row.cells[col.id]}</dd>
                    </div>
                  ))}
                </dl>
              ) : null}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
