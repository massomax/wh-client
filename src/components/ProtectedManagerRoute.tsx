import { Navigate, useLocation } from 'react-router-dom';
import { JSX } from 'react';
import { useAuth } from '../hooks/useAuth';

const ProtectedManagerRoute = ({ children }: { children: JSX.Element }) => {
  const { isLoggedIn, isManager } = useAuth();
  const location = useLocation();

  return isLoggedIn && isManager
    ? children
    : <Navigate to="/login" replace state={{ from: location }} />;
};

export default ProtectedManagerRoute;
