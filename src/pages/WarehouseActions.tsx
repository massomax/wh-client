import React, { useState, useEffect } from 'react';
import { api } from '../api/client';
import { useNavigate } from 'react-router-dom';

interface Warehouse {
  _id: string;
  name: string;
  address?: string;
}

interface Log {
  _id: string;
  warehouse: string; // ID склада
  productId: string;
  action: 'set' | 'add' | 'sub';
  oldQuantity: number;
  newQuantity: number;
  user: {
    username: string;
    role: string;
  };
  timestamp: string;
}

export default function WarehouseActions() {
  const navigate = useNavigate();
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [selectedWarehouseId, setSelectedWarehouseId] = useState<string>('');
  const [employeeFilter, setEmployeeFilter] = useState('');
  const [logs, setLogs] = useState<Log[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Определяем роль текущего пользователя и его имя, если они сохранены
  const currentUserRole = localStorage.getItem('userRole'); // "Менеджер" или "Сотрудник"
  const currentUsername = localStorage.getItem('username') || '';

  // Получение списка складов
  const fetchWarehouses = async () => {
    try {
      const response = await api.get('/api/warehouses');
      setWarehouses(response.data);
      if (response.data.length > 0) {
        setSelectedWarehouseId(response.data[0]._id);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Ошибка получения складов');
    }
  };

  // Получение логов для выбранного склада
  const fetchLogs = async () => {
    if (!selectedWarehouseId) return;
    setLoading(true);
    setError('');
    try {
      const response = await api.get(`/api/logs/${selectedWarehouseId}`);
      let fetchedLogs: Log[] = response.data;
      // Если роль сотрудника, API возвращает только его логи,
      // но на всякий случай фильтруем по username.
      if (currentUserRole === 'Сотрудник' && currentUsername) {
        fetchedLogs = fetchedLogs.filter(log => log.user.username === currentUsername);
      }
      // Если введен фильтр по сотруднику, применяем его (для менеджера)
      if (employeeFilter.trim()) {
        fetchedLogs = fetchedLogs.filter(log =>
          log.user.username.toLowerCase().includes(employeeFilter.toLowerCase())
        );
      }
      setLogs(fetchedLogs);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Ошибка получения логов');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWarehouses();
  }, []);

  useEffect(() => {
    if (selectedWarehouseId) {
      fetchLogs();
    }
  }, [selectedWarehouseId]);

  const handleFilterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchLogs();
  };

  // Функция для получения названия склада по ID
  const getWarehouseName = (warehouseId: string) => {
    const warehouse = warehouses.find(w => w._id === warehouseId);
    return warehouse ? warehouse.name : warehouseId;
  };

  return (
    <div className="app-container warehouse-actions-container">
      <h2>Просмотр действий на складах</h2>
      <button type="button" className="button back-button" onClick={() => navigate(-1)}>
        Вернуться назад
      </button>

      <form className="logs-filter-form" onSubmit={handleFilterSubmit}>
        <div className="filter-group">
          <label htmlFor="warehouse-select" className="label">Склад:</label>
          <select
            id="warehouse-select"
            className="select"
            value={selectedWarehouseId}
            onChange={(e) => setSelectedWarehouseId(e.target.value)}
          >
            {warehouses.map(w => (
              <option key={w._id} value={w._id}>
                {w.name}
              </option>
            ))}
          </select>
        </div>
        <div className="filter-group">
          <label htmlFor="employee-filter" className="label">Сотрудник:</label>
          <input
            id="employee-filter"
            type="text"
            className="input"
            placeholder="Введите имя сотрудника"
            value={employeeFilter}
            onChange={(e) => setEmployeeFilter(e.target.value)}
            disabled={currentUserRole === 'Сотрудник'}
          />
        </div>
        <button type="submit" className="button">Применить фильтры</button>
      </form>

      {loading ? (
        <div>Загрузка логов...</div>
      ) : error ? (
        <div className="error-text">{error}</div>
      ) : (
        <div className="logs-list">
          {logs.length === 0 ? (
            <div>Логи не найдены</div>
          ) : (
            logs.map((log) => (
              <div key={log._id} className="card log-card">
                <div><strong>Склад:</strong> {getWarehouseName(log.warehouse)}</div>
                <div><strong>ID товара:</strong> {log.productId}</div>
                <div><strong>Действие:</strong> {log.action}</div>
                <div><strong>Было:</strong> {log.oldQuantity}</div>
                <div><strong>Стало:</strong> {log.newQuantity}</div>
                <div>
                  <strong>Пользователь:</strong> {log.user.username} ({log.user.role})
                </div>
                <div><strong>Время:</strong> {new Date(log.timestamp).toLocaleString()}</div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
