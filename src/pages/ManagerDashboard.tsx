// ManagerDashboard.tsx
import { useNavigate } from 'react-router-dom';

export default function ManagerDashboard() {
  const navigate = useNavigate();

  return (
    <div className="app-container">
      <h2>Панель управления менеджера</h2>
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
          Отчет по всем складам
        </button>
      </div>
    </div>
  );
}
