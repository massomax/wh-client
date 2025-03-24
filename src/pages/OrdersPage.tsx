import React, { useState, useEffect } from 'react';
import { api } from '../api/client';
import { useNavigate } from 'react-router-dom';

interface Warehouse {
  _id: string;
  name: string;
}

type OrderStatus = 'Ожидает Заказа' | 'Заказано';

interface Order {
  _id: string;
  productName: string;
  warehouse: string; // ID склада
  status: OrderStatus;
  createdAt: string;
  statusChangedAt: string;
}

export default function OrdersPage() {
  const navigate = useNavigate();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Фильтры
  const [filterWarehouseId, setFilterWarehouseId] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  // Список складов для фильтрации и отображения названия склада
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);

  const fetchOrders = async () => {
    setLoading(true);
    setError('');
    try {
      const params: any = {};
      if (filterWarehouseId) params.warehouseId = filterWarehouseId;
      if (filterStatus) params.status = filterStatus;
      const response = await api.get('/api/orders', { params });
      setOrders(response.data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Ошибка получения заказов');
    } finally {
      setLoading(false);
    }
  };

  const fetchWarehouses = async () => {
    try {
      const response = await api.get('/api/warehouses');
      setWarehouses(response.data);
    } catch (err: any) {
      // Можно оставить список пустым
    }
  };

  useEffect(() => {
    fetchWarehouses();
    fetchOrders();
  }, []);

  const handleFilterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchOrders();
  };

  const handleUpdateStatus = async (order: Order) => {
    // Вместо prompt можно реализовать более удобный селект/модальное окно
    const newStatus = prompt('Введите новый статус заказа:', order.status);
    if (!newStatus || (newStatus !== 'Ожидает Заказа' && newStatus !== 'Заказано')) {
      alert('Допустимые значения: "Ожидает Заказа" или "Заказано"');
      return;
    }
    try {
      const response = await api.patch(
        `/api/orders/${order.warehouse}/${order._id}/status`,
        { newStatus }
      );
      setOrders(prev =>
        prev.map(o => (o._id === order._id ? response.data : o))
      );
    } catch (err: any) {
      alert(err.response?.data?.message || 'Ошибка обновления статуса заказа');
    }
  };

  const handleDeleteOrder = async (order: Order) => {
    if (!window.confirm('Вы уверены, что хотите удалить этот заказ?')) return;
    try {
      await api.delete(`/api/orders/${order.warehouse}/${order._id}`);
      setOrders(prev => prev.filter(o => o._id !== order._id));
    } catch (err: any) {
      alert(err.response?.data?.message || 'Ошибка удаления заказа');
    }
  };

  // Помощь в получении названия склада по его ID
  const getWarehouseName = (warehouseId: string) => {
    const warehouse = warehouses.find(w => w._id === warehouseId);
    return warehouse ? warehouse.name : warehouseId;
  };

  return (
    <div className="app-container orders-container">
      <h2>Список заказов</h2>
      <button className="button back-button" onClick={() => navigate(-1)}>
        Вернуться назад
      </button>

      <form className="orders-filter-form" onSubmit={handleFilterSubmit}>
        <div className="filter-group">
          <label htmlFor="warehouse-filter" className="label">Склад:</label>
          <select
            id="warehouse-filter"
            className="select"
            value={filterWarehouseId}
            onChange={(e) => setFilterWarehouseId(e.target.value)}
          >
            <option value="">Все склады</option>
            {warehouses.map((w) => (
              <option key={w._id} value={w._id}>
                {w.name}
              </option>
            ))}
          </select>
        </div>
        <div className="filter-group">
          <label htmlFor="status-filter" className="label">Статус:</label>
          <select
            id="status-filter"
            className="select"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="">Все статусы</option>
            <option value="Ожидает Заказа">Ожидает Заказа</option>
            <option value="Заказано">Заказано</option>
          </select>
        </div>
        <button type="submit" className="button">
          Применить фильтры
        </button>
      </form>

      {loading ? (
        <div>Загрузка заказов...</div>
      ) : error ? (
        <div className="error-text">{error}</div>
      ) : (
        <div className="orders-list">
          {orders.length === 0 ? (
            <div>Заказы не найдены</div>
          ) : (
            orders.map(order => (
              <div key={order._id} className="card order-card">
                <div><strong>Заказ ID:</strong> {order._id}</div>
                <div>
                  <strong>Товар:</strong> {order.productName || 'Неизвестно'}
                </div>
                <div>
                  <strong>Склад:</strong> {getWarehouseName(order.warehouse)}
                </div>
                <div><strong>Статус:</strong> {order.status}</div>
                <div>
                  <strong>Создан:</strong> {new Date(order.createdAt).toLocaleString()}
                </div>
                <div>
                  <strong>Изменен:</strong> {new Date(order.statusChangedAt).toLocaleString()}
                </div>
                <div className="order-actions">
                  <button className="button" onClick={() => handleUpdateStatus(order)}>
                    Обновить статус
                  </button>
                  <button className="button button-destructive" onClick={() => handleDeleteOrder(order)}>
                    Удалить заказ
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
