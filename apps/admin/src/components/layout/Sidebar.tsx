import { NavLink, useMatch } from 'react-router-dom';
import { ChevronDown, X } from 'lucide-react';
import { SidebarProfile } from './SidebarProfile';

interface SidebarProps {
  /** Provided when rendered as a mobile drawer; shows a close (X) button in the header. */
  onClose?: () => void;
}

interface NavItemDef {
  to: string;
  label: string;
  end?: boolean;
  expandable?: boolean;
}

const NAV: NavItemDef[] = [
  { to: '/', label: 'Overview', end: true },
  { to: '/lessons', label: 'Lessons' },
  { to: '/users', label: 'Users' },
  { to: '/analytics', label: 'Analytics' },
  { to: '/cultural-content', label: 'Cultural content', expandable: true },
  { to: '/gamification', label: 'Gamification', expandable: true },
  { to: '/subscription', label: 'Subscription' },
  { to: '/reports', label: 'Reports' },
  { to: '/settings', label: 'Settings' },
];

function NavItem({ to, label, end, expandable }: NavItemDef) {
  const isActive = !!useMatch({ path: to, end });
  return (
    <li className="flex items-center gap-6">
      <span
        aria-hidden
        className={`h-15 w-2 rounded-r-sm transition ${isActive ? 'bg-primary' : 'bg-transparent'}`}
      />
      <NavLink
        to={to}
        end={end}
        className={`flex flex-1 items-center gap-3 rounded-md px-5 py-4 text-md font-semibold transition ${
          isActive
            ? 'bg-primary text-primary-foreground shadow-sm'
            : 'text-neutral hover:bg-neutral-soft'
        }`}
      >
        <span className="flex-1">{label}</span>
        {expandable ? <ChevronDown size={16} className="opacity-70" /> : null}
      </NavLink>
    </li>
  );
}

export function Sidebar({ onClose }: SidebarProps = {}) {
  return (
    <aside className="flex h-full w-72 flex-col border-r border-border bg-white">
      <div className="flex items-center justify-between px-8 pt-8 pb-10">
        <h1 className="font-display text-2xl font-extrabold text-neutral">LexiRoot</h1>
        {onClose ? (
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-1 text-neutral-variant hover:bg-neutral-soft hover:text-neutral"
            aria-label="Close menu"
          >
            <X size={20} />
          </button>
        ) : null}
      </div>

      <nav className="flex-1 pr-4">
        <ul className="flex flex-col gap-3">
          {NAV.map((item) => (
            <NavItem key={item.to} {...item} />
          ))}
        </ul>
      </nav>
      <div className=''>
        <SidebarProfile />
      </div>
    </aside>
  );
}
