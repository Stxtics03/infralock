import { Link, useNavigate } from 'react-router-dom';
import useStore from '../store';

const links = [
  { to: '/', label: 'Dashboard' },
  { to: '/nodes', label: 'Nodes' },
  { to: '/incidents', label: 'Incidents' },
  { to: '/slas', label: 'SLAs' },
  { to: '/vault', label: 'Vault' },
];

export default function Navbar() {
  const user = useStore(s => s.user);
  const clearAuth = useStore(s => s.clearAuth);
  const navigate = useNavigate();

  const handleLogout = () => {
    clearAuth();
    navigate('/login');
  };

  return (
    <nav className="bg-gray-900 text-white px-6 py-3 flex items-center justify-between">
      <div className="flex items-center gap-6">
        <span className="font-semibold text-lg">INFRAlock</span>
        {links.map(l => (
          <Link key={l.to} to={l.to} className="text-sm text-gray-300 hover:text-white">
            {l.label}
          </Link>
        ))}
      </div>
      <div className="flex items-center gap-4">
        {user && <span className="text-sm text-gray-400">{user.email ?? user.full_name}</span>}
        <button onClick={handleLogout} className="text-sm bg-gray-700 px-3 py-1 rounded hover:bg-gray-600">
          Logout
        </button>
      </div>
    </nav>
  );
}
