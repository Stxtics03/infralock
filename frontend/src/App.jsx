import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Nodes from './pages/Nodes';
import Incidents from './pages/Incidents';
import SLAs from './pages/SLAs';
import Vault from './pages/Vault';
import VerifyMfa from './components/VerifyMfa';
import SecuritySettings from './components/SecuritySettings';
import ProtectedRoute from './components/ProtectedRoute';
import Navbar from './components/Navbar';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/verify-mfa" element={<VerifyMfa />} />
        <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/nodes" element={<ProtectedRoute><Nodes /></ProtectedRoute>} />
        <Route path="/incidents" element={<ProtectedRoute><Incidents /></ProtectedRoute>} />
        <Route path="/slas" element={<ProtectedRoute><SLAs /></ProtectedRoute>} />
        <Route path="/vault" element={<ProtectedRoute><Vault /></ProtectedRoute>} />
        <Route path="/settings" element={
          <ProtectedRoute>
            <div className="min-h-screen bg-gray-100">
              <Navbar />
              <main className="max-w-3xl mx-auto px-4 py-8">
                <h1 className="text-2xl font-bold text-gray-900 mb-6">Settings</h1>
                <SecuritySettings />
              </main>
            </div>
          </ProtectedRoute>
        } />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </BrowserRouter>
  );
}