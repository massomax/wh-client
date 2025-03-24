import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import ProductPageSub from './ProductPageSub';
import ProductPageAdd from './ProductPageAdd';
import { api } from '../api/client';
import { Warehouse } from '../types/warehouse';
import LogoutButton from '../components/LogoutButton';
import Header from '../components/Header';
import ErrorBlock from '../components/ui/ErrorBlock';

type Mode = 'sub' | 'add';

export default function ProductPage() {
  const { warehouseId } = useParams<{ warehouseId: string }>();
  const [mode, setMode] = useState<Mode>('sub');
  const [warehouseName, setWarehouseName] = useState('Загрузка...');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [productCategories, setProductCategories] = useState<string[]>([]);
  const [notFound, setNotFound] = useState(false);
  const [noAccess, setNoAccess] = useState(false);

  useEffect(() => {
    const fetchWarehouseData = async () => {
      try {
        const response = await api.get<Warehouse>(`/api/warehouses/${warehouseId}`);
        setWarehouseName(response.data.name);
        setNotFound(false);
        setNoAccess(false);
      } catch (err: any) {
        if (err.status === 404) {
          setNotFound(true);
        } else if (err.status === 403) {
          setNoAccess(true);
        } else {
          setNotFound(true);
        }
      }
    };
    fetchWarehouseData();
  }, [warehouseId]);

  useEffect(() => {
    const fetchProductCategories = async () => {
      try {
        const response = await api.get(`/api/products/${warehouseId}`);
        const products = response.data || [];
        const categories: string[] = Array.from(
          new Set(
            products
              .map((p: any) => p.category)
              .filter((c: string): c is string => typeof c === 'string' && c.trim() !== '')
          )
        );
        setProductCategories(categories);
      } catch (err) {
        setProductCategories([]);
      }
    };
    fetchProductCategories();
  }, [warehouseId]);

  if (notFound) {
    return (
      <div className="app-container">
        <Header title="Ошибка" showBackButton />
        <ErrorBlock message="Склад не найден или был удалён." />
      </div>
    );
  }

  if (noAccess) {
    return (
      <div className="app-container">
        <Header title="Нет доступа" showBackButton />
        <ErrorBlock message="У вас нет доступа к этому складу." />
      </div>
    );
  }

  return (
    <div className="app-container">
      <LogoutButton />
      <Header title={warehouseName} />

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

      <div className="button-group" style={{ marginBottom: 12 }}>
        <button
          className="button"
          style={{ opacity: mode === 'sub' ? 1 : 0.6 }}
          onClick={() => setMode('sub')}
        >
          Списать
        </button>
        <button
          className="button"
          style={{ opacity: mode === 'add' ? 1 : 0.6 }}
          onClick={() => setMode('add')}
        >
          Добавить
        </button>
      </div>

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
