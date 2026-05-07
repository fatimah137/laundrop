import { Navigate } from 'react-router-dom';
import { useRole } from '../context/RoleContext';

export default function ProtectedRoute({ children, allowedRoles }) {
  const { currentUser, role } = useRole();

  if (!currentUser) return <Navigate to="/login" replace />;
  if (!allowedRoles.includes(role)) return <Navigate to="/login" replace />;

  return children;
}