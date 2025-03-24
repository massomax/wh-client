import React, { useState, useEffect } from 'react';
import { api } from '../api/client';

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

  // Состояния для формы добавления нового товара
  const [newProduct, setNewProduct] = useState({
    name: '',
    quantity: 0,
    criticalValue: 0,
    category: 'Общая',
    photo: null as File | null,
  });
  const [addError, setAddError] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  // Состояния для редактирования товара
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

  // Получение списка складов (например, из API /api/warehouses)
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

  // Получение списка товаров для выбранного склада
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

  // Функция для добавления нового товара
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
      // Добавляем созданный товар в список
      setProducts(prev => [...prev, response.data]);
      // Сбрасываем форму
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

  // Функция для удаления товара
  const handleDeleteProduct = async (productId: string) => {
    if (!window.confirm('Вы уверены, что хотите удалить этот товар?')) return;
    try {
      await api.delete(`/api/products/${selectedWarehouseId}/${productId}`);
      setProducts(prev => prev.filter(p => p._id !== productId));
    } catch (err: any) {
      alert(err.response?.data?.message || 'Ошибка удаления товара');
    }
  };

  // Функция для перехода в режим редактирования товара
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

  // Функция для сохранения изменений отредактированного товара
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
      <h2>Управление позициями складов</h2>

      {error && <div className="error-text">{error}</div>}

      {/* Выбор склада */}
      <div style={{ marginBottom: '16px' }}>
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

      {/* Форма добавления нового товара */}
      <h3>Добавить новый товар</h3>
      <form onSubmit={handleAddProduct} style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 24 }}>
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
        {addError && <div className="error-text">{addError}</div>}
        <button type="submit" className="button" disabled={isAdding}>
          {isAdding ? 'Создание...' : 'Создать товар'}
        </button>
      </form>

      {/* Список товаров */}
      <h3>Список товаров</h3>
      {loadingProducts ? (
        <div>Загрузка товаров...</div>
      ) : (
        <div>
          {products.length === 0 ? (
            <div>Товары не найдены</div>
          ) : (
            products.map((product) => (
              <div key={product._id} className="card" style={{ marginBottom: 12 }}>
                {editingProductId === product._id ? (
                  // Форма редактирования товара
                  <form onSubmit={handleEditProduct} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
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
                    {editError && <div className="error-text">{editError}</div>}
                    <div style={{ display: 'flex', gap: 8 }}>
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
                  // Отображение данных товара
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    <div><strong>{product.name}</strong></div>
                    <div>Количество: {product.quantity}</div>
                    <div>Критическое значение: {product.criticalValue}</div>
                    <div>Категория: {product.category}</div>
                    {product.photo && (
                      <img
                        src={product.photo.url}
                        alt={product.name}
                        style={{ width: 100, height: 100, objectFit: 'cover' }}
                      />
                    )}
                    <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
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
            ))
          )}
        </div>
      )}
    </div>
  );
}
