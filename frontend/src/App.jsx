import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login          from './pages/Login';
import Dashboard      from './pages/Dashboard';
import Nodes          from './pages/Nodes';
import Incidents      from './pages/Incidents';
import SLAs           from './pages/SLAs';
import Vault          from './pages/Vault';
import Settings       from './pages/Settings';
import AuditLogPage   from './pages/AuditLogPage';
import NodeDetailPage from './pages/NodeDetailPage';
import Projects       from './pages/Projects';
import VerifyMfa      from './components/VerifyMfa';
import ProtectedRoute from './components/ProtectedRoute';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public */}
        <Route path="/login"      element={<Login />} />
        <Route path="/verify-mfa" element={<VerifyMfa />} />

        {/* Protected */}
        <Route path="/"           element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/nodes"      element={<ProtectedRoute><Nodes /></ProtectedRoute>} />
        <Route path="/nodes/:id"  element={<ProtectedRoute><NodeDetailPage /></ProtectedRoute>} />
        <Route path="/incidents"  element={<ProtectedRoute><Incidents /></ProtectedRoute>} />
        <Route path="/slas"       element={<ProtectedRoute><SLAs /></ProtectedRoute>} />
        <Route path="/vault"      element={<ProtectedRoute><Vault /></ProtectedRoute>} />
        <Route path="/settings"   element={<ProtectedRoute><Settings /></ProtectedRoute>} />
        <Route path="/audit-log"  element={<ProtectedRoute><AuditLogPage /></ProtectedRoute>} />
        <Route path="/projects"   element={<ProtectedRoute><Projects /></ProtectedRoute>} />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </BrowserRouter>
  );
}