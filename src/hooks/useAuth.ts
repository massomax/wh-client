import { useMemo } from 'react';

export function useAuth() {
  const token = localStorage.getItem('authToken');
  const role = localStorage.getItem('userRole');
  const username = localStorage.getItem('username');

  const isLoggedIn = Boolean(token);
  const isManager = role === 'Менеджер';

  const logout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('userRole');
    localStorage.removeItem('username');
    window.location.href = '/login?sessionExpired=true';
  };

  return useMemo(() => ({
    token,
    role,
    username,
    isLoggedIn,
    isManager,
    logout,
  }), [token, role, username]);
}
