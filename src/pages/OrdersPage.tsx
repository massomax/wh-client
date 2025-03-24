import React, { useState, useEffect } from 'react';
import { api } from '../api/client';
import Header from '../components/Header';
import LogoutButton from '../components/LogoutButton';
import Loader from '../components/ui/Loader';
import ErrorBlock from '../components/ui/ErrorBlock';
import EmptyState from '../components/ui/EmptyState';

interface Warehouse {
  _id: string;
  name: string;
  address?: string;
}

type OrderStatus = 'Ожидает Заказа' | 'Заказано';

interface Order {
  _id: string;
  productName: string;
  warehouse: string | Warehouse;
  status: OrderStatus;
  createdAt: string;
  statusChangedAt: string;
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [filterWarehouseId, setFilterWarehouseId] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);

  const [editingStatusOrderId, setEditingStatusOrderId] = useState<string | null>(null);
  const [newStatus, setNewStatus] = useState<OrderStatus>('Ожидает Заказа');

  useEffect(() => {
    fetchWarehouses();
    fetchOrders();
  }, []);

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
    } catch {}
  };

  const handleFilterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setEditingStatusOrderId(null);
    fetchOrders();
  };

  const handleSaveStatus = async (order: Order) => {
    try {
      const warehouseId =
        typeof order.warehouse === 'string' ? order.warehouse : order.warehouse._id;
      const response = await api.patch(
        `/api/orders/${warehouseId}/${order._id}/status`,
        { newStatus }
      );
      setOrders(prev => prev.map(o => (o._id === order._id ? response.data : o)));
      setEditingStatusOrderId(null);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Ошибка обновления статуса заказа');
    }
  };

  const handleCancelEdit = () => {
    setEditingStatusOrderId(null);
  };

  const handleDeleteOrder = async (order: Order) => {
    if (!window.confirm('Вы уверены, что хотите удалить этот заказ?')) return;
    try {
      const warehouseId = typeof order.warehouse === 'string' ? order.warehouse : order.warehouse._id;
      await api.delete(`/api/orders/${warehouseId}/${order._id}`);
      setOrders(prev => prev.filter(o => o._id !== order._id));
    } catch (err: any) {
      alert(err.response?.data?.message || 'Ошибка удаления заказа');
    }
  };

  const getWarehouseName = (warehouse: string | Warehouse) => {
    if (typeof warehouse === 'object' && warehouse !== null) {
      return warehouse.name;
    }
    const found = warehouses.find(w => w._id === warehouse);
    return found ? found.name : warehouse;
  };

  return (
    <div className="app-container">
      <LogoutButton />
      <Header title="Список заказов" />

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

      {loading && <Loader />}
      {!loading && error && <ErrorBlock message={error} />}
      {!loading && !error && orders.length === 0 && <EmptyState message="Заказы не найдены" />}

      {!loading && !error && orders.length > 0 && (
        <div className="orders-list">
          {orders.map(order => (
            <div key={order._id} className="card order-card">
              <div><strong>Заказ ID:</strong> {order._id}</div>
              <div><strong>Товар:</strong> {order.productName || 'Неизвестно'}</div>
              <div><strong>Склад:</strong> {getWarehouseName(order.warehouse)}</div>
              <div>
                <strong>Статус:</strong>{' '}
                {editingStatusOrderId === order._id ? (
                  <>
                    <select
                      className="select"
                      value={newStatus}
                      onChange={(e) => setNewStatus(e.target.value as OrderStatus)}
                    >
                      <option value="Ожидает Заказа">Ожидает Заказа</option>
                      <option value="Заказано">Заказано</option>
                    </select>
                    <div className="order-actions">
                      <button type="button" className="button" onClick={() => handleSaveStatus(order)}>
                        Сохранить
                      </button>
                      <button type="button" className="button button-destructive" onClick={handleCancelEdit}>
                        Отмена
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    {order.status}
                    <button
                      type="button"
                      className="button"
                      onClick={() => {
                        setEditingStatusOrderId(order._id);
                        setNewStatus(order.status);
                      }}
                      style={{ marginLeft: 8 }}
                    >
                      Обновить статус
                    </button>
                  </>
                )}
              </div>
              <div><strong>Создан:</strong> {new Date(order.createdAt).toLocaleString()}</div>
              <div><strong>Изменен:</strong> {new Date(order.statusChangedAt).toLocaleString()}</div>
              <div className="order-actions">
                <button type="button" className="button button-destructive" onClick={() => handleDeleteOrder(order)}>
                  Удалить заказ
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
