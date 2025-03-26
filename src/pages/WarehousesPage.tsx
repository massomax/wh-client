import { useEffect, useState, useMemo, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api/client';
import { Warehouse } from '../types/warehouse';
import { useLocalStorage } from '../hooks/useLocalStorage';
import debounce from 'lodash.debounce';
import LogoutButton from '../components/LogoutButton';
import Header from '../components/Header';
import Loader from '../components/ui/Loader';
import ErrorBlock from '../components/ui/ErrorBlock';
import EmptyState from '../components/ui/EmptyState';

const CACHE_TTL = 5 * 60 * 1000;

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

  /**
   * lastSearchRef: хранит последний поисковый запрос,
   * по которому реально делали запрос на сервер.
   * Изначально null, чтобы при первом рендере запрос выполнился,
   * даже если searchQuery === ''.
   */
  const lastSearchRef = useRef<string | null>(null);

  /**
   * lastDataRef: хранит данные, которые мы получили с сервера в последний раз.
   * Если у нас уже есть данные и поиск не меняется, повторный запрос не нужен.
   */
  const lastDataRef = useRef<Warehouse[] | null>(null);

  // AbortController для отмены предыдущих запросов
  const abortControllerRef = useRef<AbortController | null>(null);

  const fetchWarehouses = useCallback(
    async (search: string) => {
      // 1. Если поисковый запрос не изменился
      //    и у нас уже есть какие-то данные, — не делаем новый запрос.
      if (search === lastSearchRef.current && lastDataRef.current) {
        return;
      }

      // 2. Запоминаем, что мы запросили именно этот поисковый запрос
      lastSearchRef.current = search;

      // Отменяем предыдущий запрос, если он не завершён
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      const controller = new AbortController();
      abortControllerRef.current = controller;

      try {
        setIsLoading(true);
        setError('');

        const response = await api.get('/api/warehouses', {
          params: { search },
          signal: controller.signal,
        });

        // Успешно загрузили данные
        const newData: Warehouse[] = response.data;
        setWarehouses(newData);
        lastDataRef.current = newData;
      } catch (err: any) {
        // Если запрос был отменён, не показываем ошибку
        if (err.name !== 'CanceledError' && !controller.signal.aborted) {
          const errorMessage =
            err.response?.data?.message || err.message || 'Ошибка соединения с сервером';
          setError(errorMessage);
          setWarehouses([]);
          lastDataRef.current = null;
        }
      } finally {
        setIsLoading(false);
      }
    },
    [setWarehouses]
  );

  // Дебаунс-функция: вызывает fetchWarehouses с задержкой 500 мс
  const debouncedSearch = useMemo(
    () =>
      debounce((query: string) => {
        fetchWarehouses(query);
      }, 500),
    [fetchWarehouses]
  );

  /**
   * При каждом изменении searchQuery (или при первом рендере) мы:
   * - Если поле поиска пустое (''), сразу грузим все склады
   * - Иначе ждём 500 мс и делаем запрос с searchQuery
   */
  useEffect(() => {
    if (!searchQuery.trim()) {
      // Отменяем возможный отложенный вызов
      debouncedSearch.cancel();
      // Грузим все склады (search === '')
      fetchWarehouses('');
    } else {
      // Делаем дебаунс-поиск
      debouncedSearch(searchQuery.trim());
    }

    return () => {
      abortControllerRef.current?.abort();
      debouncedSearch.cancel();
    };
  }, [searchQuery, debouncedSearch, fetchWarehouses]);

  // Фильтрация складов по категории и названию (на клиенте)
  const filteredWarehouses = useMemo(() => {
    return warehouses.filter(
      (w) =>
        (selectedCategory === 'all' || w.category === selectedCategory) &&
        w.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [warehouses, selectedCategory, searchQuery]);

  // Список категорий
  const categories = useMemo(() => {
    return Array.from(
      new Set(
        warehouses.map((w) => w.category).filter((c): c is string => !!c)
      )
    );
  }, [warehouses]);

  return (
    <div className="app-container">
      <LogoutButton />
      <Header title="Список складов" showBackButton={false} />

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

      {isLoading && <Loader />}
      {error && <ErrorBlock message={error} />}

      {/* Если мы не грузимся и нет ошибки, но складов нет */}
      {!isLoading && !error && filteredWarehouses.length === 0 && (
        <EmptyState message="Склады не найдены" />
      )}

      {/* Отображаем найденные склады */}
      {!isLoading &&
        !error &&
        filteredWarehouses.map((warehouse) => (
          <WarehouseCard key={warehouse._id} warehouse={warehouse} />
        ))}
    </div>
  );
}
