import React, { useState, useEffect } from 'react';
import { api } from '../api/client';
import ErrorBlock from '../components/ui/ErrorBlock';
import EmptyState from '../components/ui/EmptyState';
import Loader from '../components/ui/Loader';
import LogoutButton from '../components/LogoutButton';
import Header from '../components/Header';

interface Warehouse {
  _id: string;
  name: string;
}

interface Product {
  _id: string;
  name: string;
  quantity: number;
  criticalValue: number;
  category: string;
  photo?: {
    url: string;
  };
}

export default function WarehousePositions() {
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [selectedWarehouseId, setSelectedWarehouseId] = useState<string>('');
  const [products, setProducts] = useState<Product[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [error, setError] = useState('');

  const [newProduct, setNewProduct] = useState({
    name: '',
    quantity: 0,
    criticalValue: 0,
    category: 'Общая',
    photo: null as File | null,
  });
  const [addError, setAddError] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [editProduct, setEditProduct] = useState<{
    name: string;
    quantity: number;
    criticalValue: number;
    category: string;
    photo: File | null;
  }>({
    name: '',
    quantity: 0,
    criticalValue: 0,
    category: 'Общая',
    photo: null,
  });
  const [editError, setEditError] = useState('');
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
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
    fetchWarehouses();
  }, []);

  useEffect(() => {
    if (!selectedWarehouseId) return;
    const fetchProducts = async () => {
      try {
        setLoadingProducts(true);
        const response = await api.get(`/api/products/${selectedWarehouseId}`);
        setProducts(response.data);
      } catch (err: any) {
        setError(err.response?.data?.message || 'Ошибка получения товаров');
      } finally {
        setLoadingProducts(false);
      }
    };
    fetchProducts();
  }, [selectedWarehouseId]);

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddError('');
    setIsAdding(true);
    try {
      const formData = new FormData();
      formData.append('name', newProduct.name);
      formData.append('quantity', String(newProduct.quantity));
      formData.append('criticalValue', String(newProduct.criticalValue));
      formData.append('category', newProduct.category || 'Общая');
      if (newProduct.photo) {
        formData.append('photo', newProduct.photo);
      }
      const response = await api.post(`/api/products/${selectedWarehouseId}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setProducts(prev => [...prev, response.data]);
      setNewProduct({
        name: '',
        quantity: 0,
        criticalValue: 0,
        category: 'Общая',
        photo: null,
      });
    } catch (err: any) {
      setAddError(err.response?.data?.message || 'Ошибка создания товара');
    } finally {
      setIsAdding(false);
    }
  };

  const handleDeleteProduct = async (productId: string) => {
    if (!window.confirm('Вы уверены, что хотите удалить этот товар?')) return;
    try {
      await api.delete(`/api/products/${selectedWarehouseId}/${productId}`);
      setProducts(prev => prev.filter(p => p._id !== productId));
    } catch (err: any) {
      alert(err.response?.data?.message || 'Ошибка удаления товара');
    }
  };

  const startEditing = (product: Product) => {
    setEditingProductId(product._id);
    setEditProduct({
      name: product.name,
      quantity: product.quantity,
      criticalValue: product.criticalValue,
      category: product.category,
      photo: null,
    });
    setEditError('');
  };

  const handleEditProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProductId) return;
    setEditError('');
    setIsEditing(true);
    try {
      const formData = new FormData();
      formData.append('name', editProduct.name);
      formData.append('quantity', String(editProduct.quantity));
      formData.append('criticalValue', String(editProduct.criticalValue));
      formData.append('category', editProduct.category || 'Общая');
      if (editProduct.photo) {
        formData.append('photo', editProduct.photo);
      }
      const response = await api.put(`/api/products/${selectedWarehouseId}/${editingProductId}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setProducts(prev => prev.map(p => p._id === editingProductId ? response.data : p));
      setEditingProductId(null);
    } catch (err: any) {
      setEditError(err.response?.data?.message || 'Ошибка обновления товара');
    } finally {
      setIsEditing(false);
    }
  };

  return (
    <div className="app-container">
      <Header title="Управление позициями складов" />
      <LogoutButton />
  
      {error && <ErrorBlock message={error} />}
  
      <div className="select-container">
        <label htmlFor="warehouse-select" className="label">Выберите склад:</label>
        <select
          id="warehouse-select"
          className="select"
          value={selectedWarehouseId}
          onChange={(e) => setSelectedWarehouseId(e.target.value)}
        >
          {warehouses.map((w) => (
            <option key={w._id} value={w._id}>
              {w.name}
            </option>
          ))}
        </select>
      </div>
  
      <h3>Добавить новый товар</h3>
      <form onSubmit={handleAddProduct} className="form-add-product">
        <input
          className="input"
          type="text"
          placeholder="Название товара"
          value={newProduct.name}
          onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
          required
        />
        <input
          className="input"
          type="number"
          placeholder="Количество"
          value={newProduct.quantity}
          onChange={(e) => setNewProduct({ ...newProduct, quantity: Number(e.target.value) })}
          required
        />
        <input
          className="input"
          type="number"
          placeholder="Критическое значение"
          value={newProduct.criticalValue}
          onChange={(e) => setNewProduct({ ...newProduct, criticalValue: Number(e.target.value) })}
          required
        />
        <input
          className="input"
          type="text"
          placeholder="Категория (по умолчанию Общая)"
          value={newProduct.category}
          onChange={(e) => setNewProduct({ ...newProduct, category: e.target.value })}
        />
        <input
          className="input"
          type="file"
          accept="image/*"
          onChange={(e) => setNewProduct({ ...newProduct, photo: e.target.files ? e.target.files[0] : null })}
        />
        {addError && <ErrorBlock message={addError} />}
        <button type="submit" className="button" disabled={isAdding}>
          {isAdding ? 'Создание...' : 'Создать товар'}
        </button>
      </form>
  
      <h3>Список товаров</h3>
      {loadingProducts && <Loader />}
      {!loadingProducts && products.length === 0 && <EmptyState message="Товары не найдены" />}
  
      {!loadingProducts && products.map((product) => (
        <div key={product._id} className="card product-card">
          {editingProductId === product._id ? (
            <form onSubmit={handleEditProduct} className="form-edit-product">
              <input
                className="input"
                type="text"
                value={editProduct.name}
                onChange={(e) => setEditProduct({ ...editProduct, name: e.target.value })}
                required
              />
              <input
                className="input"
                type="number"
                value={editProduct.quantity}
                onChange={(e) => setEditProduct({ ...editProduct, quantity: Number(e.target.value) })}
                required
              />
              <input
                className="input"
                type="number"
                value={editProduct.criticalValue}
                onChange={(e) => setEditProduct({ ...editProduct, criticalValue: Number(e.target.value) })}
                required
              />
              <input
                className="input"
                type="text"
                value={editProduct.category}
                onChange={(e) => setEditProduct({ ...editProduct, category: e.target.value })}
              />
              <input
                className="input"
                type="file"
                accept="image/*"
                onChange={(e) => setEditProduct({ ...editProduct, photo: e.target.files ? e.target.files[0] : null })}
              />
              {editError && <ErrorBlock message={editError} />}
              <div className="product-actions">
                <button type="submit" className="button" disabled={isEditing}>
                  {isEditing ? 'Сохранение...' : 'Сохранить'}
                </button>
                <button
                  type="button"
                  className="button button-destructive"
                  onClick={() => setEditingProductId(null)}
                >
                  Отмена
                </button>
              </div>
            </form>
          ) : (
            <div className="product-details">
              <div><strong>{product.name}</strong></div>
              <div>Количество: {product.quantity}</div>
              <div>Критическое значение: {product.criticalValue}</div>
              <div>Категория: {product.category}</div>
              {product.photo && (
                <img
                  src={product.photo.url}
                  alt={product.name}
                  className="product-image"
                />
              )}
              <div className="product-actions">
                <button className="button" onClick={() => startEditing(product)}>
                  Редактировать
                </button>
                <button className="button button-destructive" onClick={() => handleDeleteProduct(product._id)}>
                  Удалить
                </button>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
