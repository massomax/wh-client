import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import LoginForm from '../components/LoginForm';
import Header from '../components/Header';

export default function LoginPage() {
  const location = useLocation();

  useEffect(() => {
    if (location.search.includes('sessionExpired')) {
      alert('Сессия истекла. Пожалуйста, войдите снова.');
    }

    const from = location.state?.from || '/';
    sessionStorage.setItem('returnPath', from);
  }, [location]);

  return (
    <div className="app-container login-page-container">
      <Header title="Вход в аккаунт" showBackButton={false} />
      <div className="card login-card">
        <LoginForm />
      </div>
    </div>
  );
}
