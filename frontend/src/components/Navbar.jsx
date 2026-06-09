import { Link, useNavigate, useLocation } from 'react-router-dom';
import useStore from '../store';

/* ── Icons (inline SVG, no external dep) ──────────────────────────────── */
const icons = {
  brand: (
    <svg viewBox="0 0 16 16" fill="none" strokeWidth="1.5" stroke="currentColor">
      <rect x="1" y="1" width="6" height="6" rx="1" />
      <rect x="9" y="1" width="6" height="6" rx="1" />
      <rect x="1" y="9" width="6" height="6" rx="1" />
      <path d="M9 12h6M12 9v6" strokeLinecap="round" />
    </svg>
  ),
  dashboard: (
    <svg viewBox="0 0 16 16" fill="none" strokeWidth="1.5" stroke="currentColor">
      <rect x="1" y="1" width="6" height="6" rx="1" />
      <rect x="9" y="1" width="6" height="6" rx="1" />
      <rect x="1" y="9" width="6" height="6" rx="1" />
      <rect x="9" y="9" width="6" height="6" rx="1" />
    </svg>
  ),
  nodes: (
    <svg viewBox="0 0 16 16" fill="none" strokeWidth="1.5" stroke="currentColor">
      <rect x="1" y="4" width="14" height="4" rx="1" />
      <rect x="1" y="10" width="14" height="4" rx="1" />
      <circle cx="12" cy="6" r="0.8" fill="currentColor" stroke="none" />
      <circle cx="12" cy="12" r="0.8" fill="currentColor" stroke="none" />
    </svg>
  ),
  incidents: (
    <svg viewBox="0 0 16 16" fill="none" strokeWidth="1.5" stroke="currentColor">
      <path d="M8 2L14 13H2L8 2Z" strokeLinejoin="round" />
      <path d="M8 6v3.5" strokeLinecap="round" />
      <circle cx="8" cy="11.5" r="0.5" fill="currentColor" stroke="none" />
    </svg>
  ),
  slas: (
    <svg viewBox="0 0 16 16" fill="none" strokeWidth="1.5" stroke="currentColor">
      <circle cx="8" cy="8" r="6" />
      <path d="M8 4.5V8l2.5 2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  vault: (
    <svg viewBox="0 0 16 16" fill="none" strokeWidth="1.5" stroke="currentColor">
      <rect x="1" y="3" width="14" height="11" rx="1" />
      <circle cx="8" cy="8.5" r="2" />
      <path d="M1 6h14" />
      <path d="M4.5 6V3.5M11.5 6V3.5" strokeLinecap="round" />
    </svg>
  ),
  settings: (
    <svg viewBox="0 0 16 16" fill="none" strokeWidth="1.5" stroke="currentColor">
      <circle cx="8" cy="8" r="2.5" />
      <path d="M8 1.5v2M8 12.5v2M1.5 8h2M12.5 8h2M3.2 3.2l1.4 1.4M11.4 11.4l1.4 1.4M3.2 12.8l1.4-1.4M11.4 4.6l1.4-1.4" strokeLinecap="round" />
    </svg>
  ),
  logout: (
    <svg viewBox="0 0 16 16" fill="none" strokeWidth="1.5" stroke="currentColor">
      <path d="M6 2H2a1 1 0 00-1 1v10a1 1 0 001 1h4" strokeLinecap="round" />
      <path d="M11 5l3 3-3 3M14 8H6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
};

const NAV_LINKS = [
  { to: '/',          label: 'Dashboard', icon: icons.dashboard },
  { to: '/nodes',     label: 'Nodes',     icon: icons.nodes },
  { to: '/incidents', label: 'Incidents', icon: icons.incidents },
  { to: '/slas',      label: 'SLAs',      icon: icons.slas },
  { to: '/vault',     label: 'Vault',     icon: icons.vault },
];

export default function Navbar() {
  const user       = useStore(s => s.user);
  const clearAuth  = useStore(s => s.clearAuth);
  const navigate   = useNavigate();
  const location   = useLocation();

  const handleLogout = () => {
    clearAuth();
    navigate('/login');
  };

  const isActive = (to) =>
    to === '/' ? location.pathname === '/' : location.pathname.startsWith(to);

  return (
    <nav className="nav" role="navigation" aria-label="Main navigation">
      {/* Brand */}
      <Link to="/" className="nav-brand">
        <span className="nav-brand-icon" aria-hidden="true">
          {icons.brand}
        </span>
        <span className="nav-brand-name">INFRAlock</span>
      </Link>

      {/* Primary links */}
      <ul className="nav-links" role="list">
        {NAV_LINKS.map(({ to, label, icon }) => (
          <li key={to}>
            <Link
              to={to}
              className={`nav-link${isActive(to) ? ' active' : ''}`}
              aria-current={isActive(to) ? 'page' : undefined}
            >
              {icon}
              {label}
            </Link>
          </li>
        ))}
      </ul>

      {/* Right cluster */}
      <div className="nav-right">
        {user && (
          <span className="nav-user" aria-label="Logged in as">
            {user.email ?? user.full_name}
          </span>
        )}

        <Link
          to="/settings"
          className={`nav-link${isActive('/settings') ? ' active' : ''}`}
          aria-label="Settings"
        >
          {icons.settings}
          Settings
        </Link>

        <button
          onClick={handleLogout}
          className="btn btn-ghost btn-sm"
          aria-label="Log out"
        >
          {icons.logout}
          Logout
        </button>
      </div>
    </nav>
  );
}
