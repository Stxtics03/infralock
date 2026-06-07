import useStore from '../store';
import { Navigate } from 'react-router-dom';

export default function ProtectedRoute({ children }) {
  const token = useStore(s => s.token);
  return token ? children : <Navigate to="/login" />;
}
