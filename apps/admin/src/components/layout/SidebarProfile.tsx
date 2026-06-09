import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Activity, ChevronDown, KeyRound, LogOut, UserCog } from 'lucide-react';
import { Avatar } from '../ui/Avatar';
import { LogoutModal } from '../features/auth/LogoutModal';
import { useClickOutside } from '../../hooks/useClickOutside';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { clearCredentials } from '../../store/slices/authSlice';
import { adminAuthStorage } from '../../utils/storage';

interface MenuItem {
  label: string;
  to?: string;
  icon: typeof UserCog;
  danger?: boolean;
  action?: 'logout';
}

const MENU: MenuItem[] = [
  { label: 'Manage Account', to: '/manage-account', icon: UserCog },
  { label: 'Change Password', to: '/change-password', icon: KeyRound },
  { label: 'Activity Log', to: '/activity-log', icon: Activity },
  { label: 'Log out', icon: LogOut, danger: true, action: 'logout' },
];

export function SidebarProfile() {
  const user = useAppSelector((s) => s.auth.user);
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [logoutOpen, setLogoutOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useClickOutside(containerRef, () => setMenuOpen(false), menuOpen);

  if (!user) return null;

  function handleLogout() {
    adminAuthStorage.clear();
    dispatch(clearCredentials());
    setLogoutOpen(false);
    navigate('/login', { replace: true });
  }

  function handleItemClick(item: MenuItem) {
    setMenuOpen(false);
    if (item.action === 'logout') {
      setLogoutOpen(true);
    } else if (item.to) {
      navigate(item.to);
    }
  }

  return (
    <>
      <div ref={containerRef} className="relative mx-4 mb-2 mt-4">
        {menuOpen ? (
          <div className="absolute bottom-full left-0 right-0 mb-2 rounded-xl border border-primary/40 bg-white p-2 shadow-lg">
            <ul className="flex flex-col">
              {MENU.map((item) => {
                const Icon = item.icon;
                return (
                  <li key={item.label}>
                    <button
                      type="button"
                      onClick={() => handleItemClick(item)}
                      className={`flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm font-semibold transition hover:bg-hover hover:text-primary ${
                        item.danger ? 'text-primary' : 'text-neutral'
                      }`}
                    >
                      <Icon size={16} className="opacity-80" />
                      {item.label}
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        ) : null}

        <button
          type="button"
          onClick={() => setMenuOpen((v) => !v)}
          className="flex w-full items-center gap-3 rounded-xl border border-primary p-3 text-left transition hover:bg-primary-soft"
          aria-haspopup="menu"
          aria-expanded={menuOpen}
        >
          <Avatar name={user.displayName} size={40} />
          <div className="min-w-0 flex-1">
            <div className="truncate text-sm font-bold text-neutral">{user.displayName}</div>
            <div className="text-xs capitalize text-neutral-variant">{user.role}</div>
          </div>
          <ChevronDown
            size={16}
            className={`text-neutral-variant transition ${menuOpen ? 'rotate-180' : ''}`}
          />
        </button>
      </div>

      <LogoutModal
        open={logoutOpen}
        onClose={() => setLogoutOpen(false)}
        onConfirm={handleLogout}
      />
    </>
  );
}
