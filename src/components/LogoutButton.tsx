import { useAuth } from '../hooks/useAuth';

export default function LogoutButton() {
    const { logout } = useAuth();

  return (
    <button className="button" onClick={logout}>Выйти</button>
  );
}
