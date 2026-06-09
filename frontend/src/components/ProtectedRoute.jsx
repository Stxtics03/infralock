import useStore from "../store";
import { Navigate } from "react-router-dom";

function parseJwt(token) {
  try {
    return JSON.parse(atob(token.split(".")[1]));
  } catch {
    return null;
  }
}

export default function ProtectedRoute({ children }) {
  const token = useStore(s => s.token);
  if (!token) return <Navigate to="/login" />;
  const decoded = parseJwt(token);
  if (decoded?.mfa_required && !decoded?.mfa_verified) {
    return <Navigate to="/verify-mfa" />;
  }
  return children;
}
