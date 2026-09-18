'use client';

import { ReactNode } from 'react';

export interface DataTableRow {
  id: string | number;
  [key: string]: ReactNode;
}

export interface DataTableColumn {
  key: string;
  label: string;
  className?: string;
  render?: (value: ReactNode) => ReactNode;
}

interface DataTableProps {
  columns: DataTableColumn[];
  rows: DataTableRow[];
  className?: string;
}

export function DataTable({ columns, rows, className = '' }: DataTableProps) {
  return (
    <div className={`overflow-x-auto ${className}`}>
      <table className="w-full min-w-fit text-left text-sm">
        <thead className="border-b border-slate-700 text-xs uppercase tracking-wide text-slate-500">
          <tr>
            {columns.map((col) => (
              <th key={col.key} className={`px-3 py-3 ${col.className ?? ''}`}>
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr
              key={row.id}
              className="border-b border-slate-700/70 text-slate-300 hover:bg-slate-700/30"
            >
              {columns.map((col) => (
                <td
                  key={`${row.id}-${col.key}`}
                  className={`px-3 py-3 ${col.className ?? ''}`}
                >
                  {col.render ? col.render(row[col.key]) : row[col.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
