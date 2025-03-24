import { useState, useEffect } from 'react';
import { Navigate, useParams } from 'react-router-dom';
import ProductPageSub from './ProductPageSub';
import ProductPageAdd from './ProductPageAdd';
import { api } from '../api/client';
import { Warehouse } from '../types/warehouse';
import LogoutButton from '../components/LogoutButton';
import Header from '../components/Header';

type Mode = 'sub' | 'add';

export default function ProductPage() {
  const { warehouseId } = useParams<{ warehouseId: string }>();
  const [mode] = useState<Mode>('sub');
  const [warehouseName, setWarehouseName] = useState('Загрузка...');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [productCategories, setProductCategories] = useState<string[]>([]);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    const fetchWarehouseData = async () => {
      try {
        const response = await api.get<Warehouse>(`/api/warehouses/${warehouseId}`);
        setWarehouseName(response.data.name);
        setNotFound(false);
      } catch (err: any) {
        setWarehouseName('Неизвестный склад');
        if (err.status === 404) {
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

  return (
    <div className="app-container">
      <LogoutButton />

      <Header title={warehouseName} />

      if (notFound) return <Navigate to="/404" />;

      {!notFound && (
        <>
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
        </>
      )}
    </div>
  );
}
