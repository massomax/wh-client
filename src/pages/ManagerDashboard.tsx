import { useNavigate } from 'react-router-dom';
import LogoutButton from '../components/LogoutButton';
import Header from '../components/Header';

export default function ManagerDashboard() {
  const navigate = useNavigate();

  return (
    <div className="app-container">
      <LogoutButton />

      <Header title="Панель менеджера" showBackButton={false} />

      <div className="button-group" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <button className="button" onClick={() => navigate('/register-employee')}>
          Зарегистрировать нового сотрудника
        </button>
        <button className="button" onClick={() => navigate('/warehouse-positions')}>
          Управление позициями складов
        </button>
        <button className="button" onClick={() => navigate('/orders')}>
          Просмотр списка заказов
        </button>
        <button className="button" onClick={() => navigate('/warehouse-actions')}>
          Просмотр действий на складах
        </button>
        <button className="button" onClick={() => navigate('/warehouse-report')}>
          Отчёт по всем складам
        </button>
      </div>
    </div>
  );
}
