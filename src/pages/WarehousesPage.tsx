import { useEffect, useState, useMemo, useRef } from 'react';
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
  
  // Храним текущий AbortController и флаг, что компонент смонтирован
  const abortControllerRef = useRef<AbortController | null>(null);
  const isMountedRef = useRef(true);

  // При размонтировании укажем, что компонент больше не смонтирован
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // Единственный эффект, который срабатывает при изменении searchQuery
  useEffect(() => {
    // Каждый раз перед новым запросом отменяем предыдущий
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const controller = new AbortController();
    abortControllerRef.current = controller;

    // Функция, делающая запрос
    const loadWarehouses = async (query: string) => {
      try {
        // Ставим загрузку
        if (isMountedRef.current) {
          setIsLoading(true);
          setError('');
        }

        // Делаем запрос
        const response = await api.get('/api/warehouses', {
          params: { search: query },
          signal: controller.signal,
        });

        // Если компонент ещё смонтирован, обновляем состояние
        if (isMountedRef.current) {
          setWarehouses(response.data);
        }
      } catch (err: any) {
        // Игнорируем ошибку, если запрос был отменён
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
    };

    // Дебаунсим вызов loadWarehouses
    const debouncedLoad = debounce((query: string) => {
      loadWarehouses(query);
    }, 500);

    // Запускаем с учётом текущего searchQuery (если пусто, вернёт все склады)
    debouncedLoad(searchQuery.trim());

    // При размонтировании / обновлении searchQuery отменяем
    return () => {
      debouncedLoad.cancel();
      controller.abort();
    };
  }, [searchQuery, setWarehouses]);

  // Фильтрация
  const filteredWarehouses = useMemo(() => {
    return warehouses.filter(
      (w) =>
        (selectedCategory === 'all' || w.category === selectedCategory) &&
        w.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [warehouses, selectedCategory, searchQuery]);

  // Формирование списка категорий
  const categories = useMemo(() => {
    return Array.from(
      new Set(
        warehouses
          .map((w) => w.category)
          .filter((c): c is string => !!c)
      )
    );
  }, [warehouses]);

  return (
    <div className="app-container">
      {/* Поле поиска */}
      <input
        className="input"
        type="text"
        placeholder="Поиск по названию склада"
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        aria-label="Поиск складов"
      />

      {/* Селект категорий */}
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

      {/* Ошибки */}
      {error && (
        <div className="error-text">
          {error}
          <button
            className="button"
            style={{ marginTop: 8 }}
            onClick={() => setSearchQuery('')} // Сбросим поиск, чтобы подгрузить все
          >
            Повторить попытку
          </button>
        </div>
      )}

      {/* Список складов */}
      <div>
        {filteredWarehouses.map((warehouse) => (
          <WarehouseCard key={warehouse._id} warehouse={warehouse} />
        ))}
      </div>

      {/* Индикатор загрузки */}
      {isLoading && (
        <div style={{ textAlign: 'center', padding: '16px' }}>
          <div className="spinner" />
        </div>
      )}

      {/* Пустой список */}
      {!isLoading && filteredWarehouses.length === 0 && !error && (
        <div
          style={{ textAlign: 'center', padding: '16px', color: 'var(--hint-color)' }}
        >
          Склады не найдены
        </div>
      )}
    </div>
  );
}
