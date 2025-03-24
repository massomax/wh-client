import React, { useState, useEffect } from 'react';
import { api } from '../api/client';
import Header from '../components/Header';
import LogoutButton from '../components/LogoutButton';
import Loader from '../components/ui/Loader';
import ErrorBlock from '../components/ui/ErrorBlock';
import EmptyState from '../components/ui/EmptyState';
import { useAuth } from '../hooks/useAuth';

interface Warehouse {
  _id: string;
  name: string;
  address?: string;
}

interface Log {
  _id: string;
  warehouse: string;
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
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [selectedWarehouseId, setSelectedWarehouseId] = useState<string>('');
  const [employeeFilter, setEmployeeFilter] = useState('');
  const [logs, setLogs] = useState<Log[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const { role, username } = useAuth();

  const fetchWarehouses = async () => {
    try {
      const response = await api.get('/api/warehouses');
      setWarehouses(response.data);
      if (response.data.length > 0) {
        setSelectedWarehouseId(response.data[0]._id);
      }
    } catch (err: any) {
      setError(err.response?.message || 'Ошибка получения складов');
    }
  };

  const fetchLogs = async () => {
    if (!selectedWarehouseId) return;
    setLoading(true);
    setError('');
    try {
      const response = await api.get(`/api/logs/${selectedWarehouseId}`);
      let fetchedLogs: Log[] = response.data;

      if (role === 'Сотрудник' && username) {
        fetchedLogs = fetchedLogs.filter(log => log.user.username === username);
      }

      if (employeeFilter.trim()) {
        fetchedLogs = fetchedLogs.filter(log =>
          log.user.username.toLowerCase().includes(employeeFilter.toLowerCase())
        );
      }

      setLogs(fetchedLogs);
    } catch (err: any) {
      setError(err.response?.message || 'Ошибка получения логов');
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

  const getWarehouseName = (warehouseId: string) => {
    const warehouse = warehouses.find(w => w._id === warehouseId);
    return warehouse ? warehouse.name : warehouseId;
  };

  return (
    <div className="app-container">
      <LogoutButton />
      <Header title="Действия на складах" />

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
            disabled={role === 'Сотрудник'}
          />
        </div>
        <button type="submit" className="button">Применить фильтры</button>
      </form>

      {loading && <Loader />}
      {!loading && error && <ErrorBlock message={error} />}
      {!loading && !error && logs.length === 0 && <EmptyState message="Логи не найдены" />}

      {!loading && !error && logs.length > 0 && (
        <div className="logs-list">
          {logs.map((log) => (
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
          ))}
        </div>
      )}
    </div>
  );
}
