import { NavLink, useNavigate } from 'react-router-dom';
import useStore from '../store';

const links = [
  { to: '/',          label: 'Dashboard' },
  { to: '/nodes',     label: 'Nodes'     },
  { to: '/incidents', label: 'Incidents' },
  { to: '/slas',      label: 'SLAs'      },
  { to: '/vault',     label: 'Vault'     },
  { to: '/audit-log', label: 'Audit Log' },
];

const active   = 'text-white bg-white/10 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors';
const inactive = 'text-gray-400 hover:text-white hover:bg-white/5 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors';

export default function Navbar() {
  const user      = useStore(s => s.user);
  const clearAuth = useStore(s => s.clearAuth);
  const navigate  = useNavigate();

  const handleLogout = () => {
    clearAuth();
    navigate('/login');
  };

  return (
    <nav className="bg-gray-900 border-b border-gray-800 px-6 py-3 flex items-center justify-between sticky top-0 z-40">
      {/* Brand + Links */}
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-2 mr-2">
          <span className="w-7 h-7 rounded-lg bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center">
            <svg className="w-4 h-4 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01" />
            </svg>
          </span>
          <span className="font-bold text-white text-sm tracking-wide">INFRAlock</span>
        </div>

        <div className="flex items-center gap-1">
          {links.map(l => (
            <NavLink
              key={l.to}
              to={l.to}
              end={l.to === '/'}
              className={({ isActive }) => isActive ? active : inactive}
            >
              {l.label}
            </NavLink>
          ))}
        </div>
      </div>

      {/* Right side */}
      <div className="flex items-center gap-3">
        {user && (
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-cyan-600/20 border border-cyan-600/30 flex items-center justify-center">
              <span className="text-xs font-bold text-cyan-400">
                {(user.email ?? user.full_name ?? '?')[0].toUpperCase()}
              </span>
            </div>
            <span className="text-sm text-gray-400 hidden sm:block">
              {user.email ?? user.full_name}
            </span>
          </div>
        )}
        <NavLink
          to="/settings"
          className={({ isActive }) => isActive ? active : inactive}
        >
          Settings
        </NavLink>
        <button
          onClick={handleLogout}
          className="text-sm bg-gray-800 hover:bg-gray-700 border border-gray-700 px-3 py-1.5 rounded-lg text-gray-300 hover:text-white transition-colors"
        >
          Logout
        </button>
      </div>
    </nav>
  );
}