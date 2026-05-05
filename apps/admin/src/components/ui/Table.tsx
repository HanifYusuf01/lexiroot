import { ReactNode, ThHTMLAttributes, TdHTMLAttributes, HTMLAttributes } from 'react';

interface TableProps extends HTMLAttributes<HTMLTableElement> {
  /** Optional minimum width to enforce horizontal scroll on small viewports. */
  minWidth?: string | number;
}

export function Table({ className = '', minWidth, style, children, ...rest }: TableProps) {
  return (
    <div className="overflow-x-auto">
      <table
        className={`w-full text-xs ${className}`}
        style={{ minWidth, ...style }}
        {...rest}
      >
        {children}
      </table>
    </div>
  );
}

interface ContainerProps {
  children: ReactNode;
  className?: string;
}

export function TableContainer({ children, className = '' }: ContainerProps) {
  return (
    <div className={`rounded-2xl border border-border bg-white ${className}`}>{children}</div>
  );
}

export function TableHead({ children, className = '' }: ContainerProps) {
  return (
    <thead
      className={`bg-primary-soft text-left text-[11px] font-semibold uppercase tracking-wide text-neutral ${className}`}
    >
      {children}
    </thead>
  );
}

export function TableBody({ children, className = '' }: ContainerProps) {
  return <tbody className={`divide-y divide-border ${className}`}>{children}</tbody>;
}

interface RowProps extends HTMLAttributes<HTMLTableRowElement> {
  children: ReactNode;
}

export function TableRow({ className = '', ...rest }: RowProps) {
  return <tr className={`hover:bg-neutral-soft/30 ${className}`} {...rest} />;
}

interface HeaderCellProps extends ThHTMLAttributes<HTMLTableCellElement> {
  children?: ReactNode;
}

export function TableHeaderCell({ className = '', ...rest }: HeaderCellProps) {
  return <th className={`whitespace-nowrap px-4 py-5 ${className}`} {...rest} />;
}

interface CellProps extends TdHTMLAttributes<HTMLTableCellElement> {
  children?: ReactNode;
}

export function TableCell({ className = '', ...rest }: CellProps) {
  return <td className={`whitespace-nowrap px-4 py-3 ${className}`} {...rest} />;
}

interface FooterProps {
  children: ReactNode;
  className?: string;
}

/** Pagination / summary row that lives below the scroll area. */
export function TableFooter({ children, className = '' }: FooterProps) {
  return (
    <div
      className={`flex flex-col items-start justify-between gap-3 border-t border-border px-4 py-6 text-sm text-black sm:flex-row sm:items-center ${className}`}
    >
      {children}
    </div>
  );
}
