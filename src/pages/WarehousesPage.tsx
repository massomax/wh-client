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

  // Храним последний поисковый запрос, по которому реально делали запрос к серверу
  const lastSearchRef = useRef('');

  // Храним, какие данные пришли с сервера в прошлый раз, чтобы не делать setWarehouses,
  // если новые данные совпадают со старыми
  const lastDataRef = useRef<Warehouse[] | null>(null);

  // Отслеживаем AbortController, чтобы отменять предыдущие запросы при новом поиске
  const abortControllerRef = useRef<AbortController | null>(null);

  // Функция для запроса списков складов
  const fetchWarehouses = useCallback(
    async (search: string) => {
      // Если поисковый запрос не изменился — не делаем новый запрос
      if (search === lastSearchRef.current) {
        return;
      }
      lastSearchRef.current = search;

      // Отменяем предыдущий запрос, если он ещё не завершён
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

        // Сравниваем с последними сохранёнными данными
        const newData: Warehouse[] = response.data;
        if (lastDataRef.current) {
          // Если данные не изменились, не вызываем setWarehouses
          if (JSON.stringify(newData) === JSON.stringify(lastDataRef.current)) {
            return;
          }
        }

        // Данные отличаются — сохраняем в локальное хранилище
        setWarehouses(newData);
        // Обновляем ref
        lastDataRef.current = newData;
      } catch (err: any) {
        // Если запрос был отменён, не показываем ошибку
        if (err.name !== 'CanceledError' && !controller.signal.aborted) {
          const errorMessage =
            err.response?.data?.message || err.message || 'Ошибка соединения с сервером';
          setError(errorMessage);
          setWarehouses([]);
          lastDataRef.current = [];
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

  // Единый эффект для загрузки и поиска
  useEffect(() => {
    if (!searchQuery.trim()) {
      // Если поле поиска пустое — грузим все склады
      debouncedSearch.cancel(); // отменяем возможный отложенный вызов
      fetchWarehouses('');
    } else {
      // Иначе запускаем дебаунс-поиск
      debouncedSearch(searchQuery.trim());
    }

    // Очистка при размонтировании
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
      {!isLoading && !error && filteredWarehouses.length === 0 && (
        <EmptyState message="Склады не найдены" />
      )}

      {!isLoading &&
        !error &&
        filteredWarehouses.map((warehouse) => (
          <WarehouseCard key={warehouse._id} warehouse={warehouse} />
        ))}
    </div>
  );
}
