import { useNavigate } from 'react-router-dom';

export default function LogoutButton() {
  const navigate = useNavigate();

  const handleLogout = () => {

    localStorage.removeItem('authToken');

    navigate('/login', { replace: true });
  };

  return (
    <button className="button" onClick={handleLogout}>
      Выйти
    </button>
  );
}
