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

    // Загрузка данных склада
    useEffect(() => {
        const fetchWarehouseData = async () => {
            try {
                const response = await api.get<Warehouse>(`/api/warehouses/${warehouseId}`);
                setWarehouseName(response.data.name);
                console.log(response.data)
            } catch (err) {
                setWarehouseName('Неизвестный склад');
            }
        };

        fetchWarehouseData();
    }, [warehouseId]);

    return (
        <div className="p-4 max-w-3xl mx-auto">
            {/* Фиксированная шапка */}
            <div className="sticky top-0 bg-white z-10 pt-4 pb-2 border-b shadow-sm">
                <div className="flex flex-col gap-4">
                    {/* Верхняя строка */}
                    <div className="flex justify-between items-center">
                        <button 
                            onClick={() => navigate(-1)}
                            className="text-blue-600 hover:text-blue-700 text-sm md:text-base"
                        >
                            ← Назад
                        </button>
                        
                        <h1 className="text-xl font-semibold text-center mx-2">
                            {warehouseName}
                        </h1>

                        <div className="flex gap-2">
                            <button
                                onClick={() => setMode('sub')}
                                className={`px-3 py-1 md:px-4 md:py-2 rounded-lg text-sm md:text-base ${
                                    mode === 'sub' 
                                    ? 'bg-blue-500 text-white' 
                                    : 'bg-gray-200 hover:bg-gray-300'
                                }`}
                            >
                                Списать
                            </button>
                            <button
                                onClick={() => setMode('add')}
                                className={`px-3 py-1 md:px-4 md:py-2 rounded-lg text-sm md:text-base ${
                                    mode === 'add' 
                                    ? 'bg-green-500 text-white' 
                                    : 'bg-gray-200 hover:bg-gray-300'
                                }`}
                            >
                                Добавить
                            </button>
                        </div>
                    </div>

                    {/* Фильтры */}
                    <div className="flex flex-col md:flex-row gap-2 mb-2">
                        <input
                            type="text"
                            placeholder="Поиск по названию..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="p-2 border rounded-lg flex-grow text-sm md:text-base"
                        />
                        
                        <select
                            value={selectedCategory}
                            onChange={(e) => setSelectedCategory(e.target.value)}
                            className="p-2 border rounded-lg md:w-48 text-sm md:text-base"
                        >
                            <option value="all">Все категории</option>
                            {/* Категории будут добавлены динамически */}
                        </select>
                    </div>
                </div>
            </div>

            {/* Основной контент */}
            <div className="mt-4">
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
        </div>
    );
}