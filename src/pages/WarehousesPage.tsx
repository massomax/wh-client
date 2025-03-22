import { useEffect, useState, useMemo, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api/client';
import { Warehouse } from '../types/warehouse';
import { useLocalStorage } from '../hooks/useLocalStorage';
import debounce from 'lodash.debounce';

const CACHE_TTL = 5 * 60 * 1000;

/* Компонент карточки склада */
const WarehouseCard = ({ warehouse }: { warehouse: Warehouse }) => {
  const navigate = useNavigate();

  return (
    <div
      className="card"
      onClick={() => navigate(`/warehouses/${warehouse._id}`)}
      style={{ cursor: 'pointer' }}
    >
      <div className="card-title">{warehouse.name}</div>
      <div className="card-subtitle">{warehouse.address}</div>
      <div style={{ marginTop: '8px', color: 'var(--accent-text-color)' }}>
        {warehouse.category}
      </div>
    </div>
  );
};

export default function WarehousesPage() {
  const [warehouses, setWarehouses] = useLocalStorage<Warehouse[]>(
    'warehouses',
    [] as Warehouse[],
    CACHE_TTL
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const abortControllerRef = useRef<AbortController | null>(null);
  const isMountedRef = useRef(true);

  // Отслеживаем, смонтирован ли компонент
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const fetchWarehouses = useCallback(
    async (search = '') => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      const controller = new AbortController();
      abortControllerRef.current = controller;

      try {
        if (isMountedRef.current) {
          setIsLoading(true);
          setError('');
        }

        const response = await api.get('/api/warehouses', {
          params: { search },
          signal: controller.signal,
        });

        if (isMountedRef.current) {
          setWarehouses(response.data);
        }
      } catch (err: any) {
        if (isMountedRef.current && err.name !== 'CanceledError') {
          const errorMessage =
            err.response?.data?.message ||
            err.message ||
            'Ошибка соединения с сервером';
          setError(errorMessage);
          setWarehouses([]);
        }
      } finally {
        if (isMountedRef.current) {
          setIsLoading(false);
        }
      }
    },
    [setWarehouses]
  );

  const debouncedSearch = useMemo(
    () =>
      debounce((query: string) => {
        fetchWarehouses(query);
      }, 500),
    [fetchWarehouses]
  );

  useEffect(() => {
    fetchWarehouses('');
    return () => {
      abortControllerRef.current?.abort();
      debouncedSearch.cancel();
    };
  }, [fetchWarehouses, debouncedSearch]);

  useEffect(() => {
    if (searchQuery.trim()) {
      debouncedSearch(searchQuery);
    } else {
      fetchWarehouses('');
    }
  }, [searchQuery, debouncedSearch, fetchWarehouses]);

  const filteredWarehouses = useMemo(
    () =>
      warehouses.filter(
        (w) =>
          (selectedCategory === 'all' || w.category === selectedCategory) &&
          w.name.toLowerCase().includes(searchQuery.toLowerCase())
      ),
    [warehouses, selectedCategory, searchQuery]
  );

  const categories = useMemo(
    () =>
      Array.from(
        new Set(
          warehouses
            .map((w) => w.category)
            .filter((c): c is string => !!c)
        )
      ),
    [warehouses]
  );

  return (
    <div className="app-container">
      <input
        className="input"
        type="text"
        placeholder="Поиск по названию склада"
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        aria-label="Поиск складов"
      />

      <select
        className="select"
        value={selectedCategory}
        onChange={(e) => setSelectedCategory(e.target.value)}
        aria-label="Выбор категории склада"
      >
        <option value="all">Все категории</option>
        {categories.map((category: string) => (
          <option key={category} value={category}>
            {category}
          </option>
        ))}
      </select>

      {error && (
        <div className="error-text">
          {error}
          <button
            className="button"
            style={{ marginTop: 8 }}
            onClick={() => fetchWarehouses('')}
          >
            Повторить попытку
          </button>
        </div>
      )}

      <div>
        {filteredWarehouses.map((warehouse) => (
          <WarehouseCard key={warehouse._id} warehouse={warehouse} />
        ))}
      </div>

      {isLoading && (
        <div style={{ textAlign: 'center', padding: '16px' }}>
          <div className="spinner" />
        </div>
      )}

      {!isLoading && filteredWarehouses.length === 0 && !error && (
        <div
          style={{
            textAlign: 'center',
            padding: '16px',
            color: 'var(--hint-color)',
          }}
        >
          Склады не найдены
        </div>
      )}
    </div>
  );
}
