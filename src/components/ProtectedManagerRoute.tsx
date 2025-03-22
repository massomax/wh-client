import { Navigate, useLocation } from 'react-router-dom';
import { JSX } from 'react';

const ProtectedManagerRoute = ({ children }: { children: JSX.Element }) => {
  const token = localStorage.getItem('authToken');
  const role = localStorage.getItem('userRole');
  const location = useLocation();

  return token && role === 'Менеджер'
    ? children
    : <Navigate to="/login" replace state={{ from: location }} />;
};

export default ProtectedManagerRoute;
