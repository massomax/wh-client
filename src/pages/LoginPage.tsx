import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import LoginForm from '../components/LoginForm';

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
    <div className="app-container" style={{ maxWidth: 400, margin: 'auto' }}>
      <div className="card">
        <h2 className="card-title" style={{ textAlign: 'center' }}>
          Вход в аккаунт
        </h2>
        <LoginForm />
      </div>
    </div>
  );
}
