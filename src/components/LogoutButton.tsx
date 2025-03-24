import { useNavigate } from 'react-router-dom';

export default function LogoutButton() {
  const navigate = useNavigate();

  const handleLogout = () => {
    // Удаляем токен и, при необходимости, другие данные авторизации
    localStorage.removeItem('authToken');
    // Можно также удалить другие ключи, если они используются
    // localStorage.removeItem('userData');

    // При необходимости можно выполнить вызов API для выхода (logout)
    // await api.post('/auth/logout');

    // Перенаправляем пользователя на страницу логина
    navigate('/login', { replace: true });
  };

  return (
    <button className="button" onClick={handleLogout}>
      Выйти
    </button>
  );
}
