import { useEffect, useState, useMemo, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../api/client';
import { Product } from '../types/product';

export default function ProductsPage() {
    const { warehouseId } = useParams<{ warehouseId: string }>();
    const navigate = useNavigate();
    const [allProducts, setAllProducts] = useState<Product[]>([]); // Все продукты
    const [filteredProducts, setFilteredProducts] = useState<Product[]>([]); // Отфильтрованные продукты
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');

    // Загрузка всех продуктов при монтировании
    const fetchAllProducts = useCallback(async () => {
        try {
            if (!warehouseId) throw new Error('Склад не выбран');
            
            setIsLoading(true);
            setError('');

            const response = await api.get(`/api/products/${warehouseId}`);
            setAllProducts(response.data || []);
        } catch (err: any) {
            setError(err.response?.data?.message || err.message || 'Ошибка загрузки товаров');
            setAllProducts([]);
        } finally {
            setIsLoading(false);
        }
    }, [warehouseId]);

    // Фильтрация продуктов
    useEffect(() => {
        let result = [...allProducts];

        // Фильтр по категории
        if (selectedCategory !== 'all') {
            result = result.filter(p => p.category === selectedCategory);
        }

        // Фильтр по поиску
        const searchLower = searchQuery.toLowerCase();
        result = result.filter(p => 
            p.name.toLowerCase().includes(searchLower)
        );

        setFilteredProducts(result);
    }, [allProducts, selectedCategory, searchQuery]);

    // Получение уникальных категорий
    const categories = useMemo(() => {
        const uniqueCategories = new Set(allProducts.map(p => p.category));
        return Array.from(uniqueCategories).filter(c => c);
    }, [allProducts]);

    // Первоначальная загрузка данных
    useEffect(() => {
        fetchAllProducts();
    }, [fetchAllProducts]);

    return (
        <div className="p-4 max-w-3xl mx-auto">
            {/* Кнопка назад */}
            <button 
                onClick={() => navigate(-1)}
                className="mb-4 text-blue-600 hover:text-blue-700"
            >
                ← Назад к складам
            </button>

            {/* Фильтры */}
            <div className="mb-6 flex flex-col md:flex-row gap-4">
                <input
                    type="text"
                    placeholder="Поиск по названию"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="p-3 border rounded-lg flex-grow"
                />
                
                <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="p-2.5 border rounded-lg md:w-64"
                >
                    <option value="all">Все категории</option>
                    {categories.map(category => (
                        <option key={category} value={category}>
                            {category}
                        </option>
                    ))}
                </select>
            </div>

            {error && (
                <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-red-600">{error}</p>
                    <button
                        onClick={fetchAllProducts}
                        className="mt-2 text-red-600 hover:text-red-700"
                    >
                        Повторить попытку
                    </button>
                </div>
            )}

            <div className="grid grid-cols-1 gap-4">
                {filteredProducts.map(product => (
                    <div 
                        key={product._id}
                        className="p-4 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow"
                    >
                        <div className="flex gap-4">
                            {product.photo?.url && (
                                <img 
                                    src={product.photo.url} 
                                    alt={product.name}
                                    className="w-24 h-24 object-cover rounded-lg"
                                    loading="lazy"
                                />
                            )}
                            
                            <div className="flex-grow">
                                <h3 className="text-xl font-semibold mb-2">{product.name}</h3>
                                <div className="grid grid-cols-2 gap-2 text-sm">
                                    <div>
                                        <span className="text-gray-600">Количество:</span>{' '}
                                        <span className={
                                            product.quantity <= product.criticalValue 
                                                ? 'text-red-600 font-bold'
                                                : 'text-green-600'
                                        }>
                                            {product.quantity}
                                        </span>
                                    </div>
                                    <div>
                                        <span className="text-gray-600">Критический остаток:</span>{' '}
                                        {product.criticalValue}
                                    </div>
                                    <div>
                                        <span className="text-gray-600">Категория:</span>{' '}
                                        <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                                            {product.category}
                                        </span>
                                    </div>
                                    <div>
                                        <span className="text-gray-600">Дата добавления:</span>{' '}
                                        {new Date(product.createdAt).toLocaleDateString('ru-RU')}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {isLoading && (
                <div className="flex justify-center p-8">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500" />
                </div>
            )}

            {!isLoading && filteredProducts.length === 0 && !error && (
                <div className="text-center py-8 text-gray-500">
                    {searchQuery ? 'Товары по вашему запросу не найдены' : 'На складе нет товаров'}
                </div>
            )}
        </div>
    );
}