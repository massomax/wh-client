import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import ProductPageSub from './ProductPageSub';
import ProductPageAdd from './ProductPageAdd';
import { api } from '../api/client';
import { Warehouse } from '../types/warehouse';

type Mode = 'sub' | 'add';

export default function ProductPage() {
  const { warehouseId } = useParams<{ warehouseId: string }>();
  const navigate = useNavigate();
  const [mode, setMode] = useState<Mode>('sub');
  const [warehouseName, setWarehouseName] = useState('Загрузка...');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [productCategories, setProductCategories] = useState<string[]>([]);

  // Загрузка данных склада
  useEffect(() => {
    const fetchWarehouseData = async () => {
      try {
        const response = await api.get<Warehouse>(`/api/warehouses/${warehouseId}`);
        setWarehouseName(response.data.name);
      } catch (err) {
        setWarehouseName('Неизвестный склад');
      }
    };
    fetchWarehouseData();
  }, [warehouseId]);

  // Загрузка категорий продуктов
  useEffect(() => {
    const fetchProductCategories = async () => {
      try {
        const response = await api.get(`/api/products/${warehouseId}`);
        const products = response.data || [];
        // Извлекаем уникальные непустые категории
        const categories: string[] = Array.from(
          new Set(
            products
              .map((p: any) => p.category)
              .filter((c: string): c is string => typeof c === 'string' && c.trim() !== '')
          )
        );
        setProductCategories(categories);
      } catch (err) {
        // При ошибке оставляем список категорий пустым
        setProductCategories([]);
      }
    };
    fetchProductCategories();
  }, [warehouseId]);

  return (
    <div className="app-container">
      {/* Шапка */}
      <div className="header">
        <button className="back-button" onClick={() => navigate(-1)}>
          ← Назад
        </button>
        <div className="header-title">{warehouseName}</div>
        <div className="button-group">
          <button
            className="button"
            style={{
              backgroundColor: mode === 'sub' ? 'var(--button-color)' : 'var(--section-separator-color)',
              color: mode === 'sub' ? 'var(--button-text-color)' : 'var(--text-color)',
            }}
            onClick={() => setMode('sub')}
          >
            Списать
          </button>
          <button
            className="button"
            style={{
              backgroundColor: mode === 'add' ? 'var(--button-color)' : 'var(--section-separator-color)',
              color: mode === 'add' ? 'var(--button-text-color)' : 'var(--text-color)',
            }}
            onClick={() => setMode('add')}
          >
            Добавить
          </button>
        </div>
      </div>

      {/* Фильтры */}
      <div style={{ margin: '16px 0' }}>
        <input
          className="input"
          type="text"
          placeholder="Поиск по названию..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          aria-label="Поиск"
        />
        <select
          className="select"
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          aria-label="Выбор категории"
        >
          <option value="all">Все категории</option>
          {productCategories.map((cat) => (
            <option key={cat} value={cat}>
              {cat}
            </option>
          ))}
        </select>
      </div>

      {/* Основной контент */}
      {mode === 'sub' ? (
        <ProductPageSub 
          warehouseId={warehouseId!}
          searchQuery={searchQuery}
          selectedCategory={selectedCategory}
        />
      ) : (
        <ProductPageAdd 
          warehouseId={warehouseId!}
          searchQuery={searchQuery}
          selectedCategory={selectedCategory}
        />
      )}
    </div>
  );
}
