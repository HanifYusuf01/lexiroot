import { useEffect, useState } from 'react';
import { NavLink, useLocation, useMatch } from 'react-router-dom';
import { ChevronDown, X } from 'lucide-react';
import { SidebarProfile } from './SidebarProfile';
import { useAppSelector } from '../../store/hooks';
import { canAccessPath } from '../../utils/permissions';

interface SidebarProps {
  /** Provided when rendered as a mobile drawer; shows a close (X) button in the header. */
  onClose?: () => void;
}

interface SubNavItem {
  to: string;
  label: string;
  end?: boolean;
}

interface NavItemDef {
  to: string;
  label: string;
  end?: boolean;
  children?: SubNavItem[];
}

const NAV: NavItemDef[] = [
  { to: '/', label: 'Overview', end: true },
  { to: '/lessons', label: 'Lessons' },
  { to: '/users', label: 'Users' },
  { to: '/analytics', label: 'Analytics' },
  {
    to: '/cultural-content',
    label: 'Cultural Content',
    children: [
      { to: '/cultural-content', label: 'All Content', end: true },
      { to: '/cultural-content/folktales', label: 'Folktales' },
      { to: '/cultural-content/proverbs', label: 'Proverbs' },
      { to: '/cultural-content/stories', label: 'Stories' },
    ],
  },
  { to: '/gamification', label: 'Gamification' },
  // { to: '/reports', label: 'Reports' },
  { to: '/admin-management', label: 'Admin Management' },
  { to: '/settings', label: 'Settings' },
];

function NavItem({ to, label, end, children }: NavItemDef) {
  const { pathname } = useLocation();
  const isActive = !!useMatch({ path: to, end });
  const sectionActive = children
    ? children.some((c) => (c.end ? pathname === c.to : pathname.startsWith(c.to)))
    : isActive;

  const [open, setOpen] = useState(sectionActive);
  useEffect(() => {
    if (sectionActive) setOpen(true);
  }, [sectionActive]);

  if (children) {
    return (
      <li>
        <div className="flex items-center gap-6">
          <span
            aria-hidden
            className={`h-15 w-2 rounded-r-sm transition ${
              sectionActive ? 'bg-primary' : 'bg-transparent'
            }`}
          />
          <button
            type="button"
            onClick={() => setOpen((o) => !o)}
            className={`flex flex-1 items-center gap-3 rounded-md px-5 py-4 text-md font-semibold transition ${
              sectionActive
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'text-neutral hover:bg-neutral-soft'
            }`}
          >
            <span className="flex-1 text-left">{label}</span>
            <ChevronDown
              size={16}
              className={`opacity-70 transition-transform ${open ? 'rotate-180' : ''}`}
            />
          </button>
        </div>
        {open ? (
          <ul className="ml-8 mt-1 flex flex-col gap-1 border-l border-border pl-3">
            {children.map((child) => (
              <SubNavLink key={child.to} {...child} />
            ))}
          </ul>
        ) : null}
      </li>
    );
  }

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
      </NavLink>
    </li>
  );
}

function SubNavLink({ to, label, end }: SubNavItem) {
  const isActive = !!useMatch({ path: to, end });
  return (
    <li className="flex items-center gap-3">
      <span
        aria-hidden
        className={`h-1.5 w-1.5 rounded-full ${isActive ? 'bg-primary' : 'bg-transparent'}`}
      />
      <NavLink
        to={to}
        end={end}
        className={`flex-1 rounded-md px-3 py-2 text-sm font-semibold transition ${
          isActive ? 'text-primary' : 'text-neutral-variant hover:text-neutral'
        }`}
      >
        {label}
      </NavLink>
    </li>
  );
}

export function Sidebar({ onClose }: SidebarProps = {}) {
  const role = useAppSelector((s) => s.auth.user?.role);
  // Instructors only see the sections they can actually open.
  const items = NAV.filter((item) => canAccessPath(role, item.to));

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

      <nav className="flex-1 overflow-y-auto pr-4 pb-6">
        <ul className="flex flex-col gap-3">
          {items.map((item) => (
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
