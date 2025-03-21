// src/pages/WarehousesPage.tsx
import { useEffect, useState, useMemo, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom'; // 1. Добавляем навигацию
import { api } from '../api/client';
import { Warehouse } from '../types/warehouse';
import { useLocalStorage } from '../hooks/useLocalStorage';
import debounce from 'lodash.debounce';

const CACHE_TTL = 5 * 60 * 1000;

// 2. Создаем отдельный компонент для карточки склада
const WarehouseCard = ({ warehouse }: { warehouse: Warehouse }) => {
  const navigate = useNavigate();

  return (
    <div
      onClick={() => navigate(`/warehouses/${warehouse._id}`)} // Исправленный путь
      className="p-4 bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow cursor-pointer"
    >
      <h3 className="font-semibold text-xl mb-2">{warehouse.name}</h3>
      <p className="text-gray-600 mb-2">{warehouse.address}</p>
      <div className="flex gap-2">
        <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
          {warehouse.category}
        </span>
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

  const fetchWarehouses = useCallback(
    async (search = '') => {
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

        setWarehouses(response.data);
      } catch (err: any) {
        if (err.name !== 'CanceledError' && !controller.signal.aborted) {
          const errorMessage =
            err.response?.data?.message ||
            err.message ||
            'Ошибка соединения с сервером';
          setError(errorMessage);
          setWarehouses([]);
        }
      } finally {
        if (!controller.signal.aborted) {
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
  }, []);

  useEffect(() => {
    if (searchQuery.trim()) {
      debouncedSearch(searchQuery);
    } else {
      fetchWarehouses('');
    }
  }, [searchQuery]);

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
    <div className="p-4 max-w-3xl mx-auto">
      <div className="mb-6">
        <input
          type="text"
          placeholder="Поиск по названию склада"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        <div>
          <label className="block text-sm font-medium mb-2">Категория:</label>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="w-full p-2.5 border rounded-lg"
          >
            <option value="all">Все категории</option>
            {categories.map((category: string) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-600">{error}</p>
          <button
            onClick={() => fetchWarehouses('')}
            className="mt-2 text-red-600 hover:text-red-700"
          >
            Повторить попытку
          </button>
        </div>
      )}

      {/* 4. Заменяем div на компонент WarehouseCard */}
      <div className="space-y-4 mb-8">
        {filteredWarehouses.map((warehouse) => (
          <WarehouseCard 
            key={warehouse._id} 
            warehouse={warehouse} 
          />
        ))}
      </div>

      {isLoading && (
        <div className="flex justify-center p-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500" />
        </div>
      )}

      {!isLoading && filteredWarehouses.length === 0 && !error && (
        <div className="text-center py-8 text-gray-500">
          Склады не найдены
        </div>
      )}
    </div>
  );
}