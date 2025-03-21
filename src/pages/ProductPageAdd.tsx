import { useEffect, useState } from 'react';
import { Product } from '../types/product';
import { api } from '../api/client';

type Props = {
    warehouseId: string;
    searchQuery: string;
    selectedCategory: string;
};

export default function ProductPageAdd({ 
    warehouseId,
    searchQuery,
    selectedCategory
}: Props) {
    const [allProducts, setAllProducts] = useState<Product[]>([]);
    const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    const [quantities, setQuantities] = useState<{ [key: string]: number }>({});

    // Загрузка продуктов
    useEffect(() => {
        const fetchProducts = async () => {
            try {
                setIsLoading(true);
                const response = await api.get(`/api/products/${warehouseId}`);
                setAllProducts(response.data || []);
            } catch (err: any) {
                setError(err.response?.data?.message || err.message);
            } finally {
                setIsLoading(false);
            }
        };
        fetchProducts();
    }, [warehouseId]);

    // Фильтрация продуктов
    useEffect(() => {
        let result = allProducts.filter(p => 
            p.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
            (selectedCategory === 'all' || p.category === selectedCategory)
        );
        setFilteredProducts(result);
    }, [allProducts, searchQuery, selectedCategory]);

    // Обработчик изменения количества
    const handleQuantityChange = (productId: string, value: number) => {
        const newValue = Math.max(0, value);
        setQuantities(prev => ({ ...prev, [productId]: newValue }));
    };

    // Обработчик добавления
    const handleAdd = async (productId: string) => {
        const quantity = quantities[productId] || 0;
        if (quantity <= 0) return;

        try {
            await api.patch(`/api/products/${productId}/quantity`, {
                action: 'add',
                value: quantity,
                warehouseId,
            });
            
            const updatedProducts = allProducts.map(p => 
                p._id === productId ? { ...p, quantity: p.quantity + quantity } : p
            );
            
            setAllProducts(updatedProducts);
            setQuantities(prev => ({ ...prev, [productId]: 0 }));
        } catch (err: any) {
            setError(err.response?.data?.message || err.message);
        }
    };

    return (
        <div className="space-y-4">
            {/* Сообщения об ошибках */}
            {error && (
                <div className="p-3 bg-red-50 text-red-600 rounded-lg">
                    {error}
                </div>
            )}

            {/* Список продуктов */}
            {filteredProducts.map(product => (
                <div key={product._id} className="p-4 bg-white rounded-lg shadow">
                    <div className="flex items-center gap-4">
                        {product.photo?.url && (
                            <img 
                                src={product.photo.url}
                                alt={product.name}
                                className="w-20 h-20 object-cover rounded"
                            />
                        )}
                        
                        <div className="flex-grow">
                            <h3 className="text-lg font-semibold">{product.name}</h3>
                            
                            <div className="mt-2 space-y-2">
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => handleQuantityChange(product._id, (quantities[product._id] || 0) - 1)}
                                        className="px-3 py-1 bg-gray-100 rounded hover:bg-gray-200"
                                    >
                                        -
                                    </button>
                                    
                                    <input
                                        type="number"
                                        value={quantities[product._id] || 0}
                                        onChange={(e) => 
                                            handleQuantityChange(product._id, parseInt(e.target.value))
                                        }
                                        className="w-20 px-2 py-1 border rounded text-center"
                                        min="0"
                                    />
                                    
                                    <button
                                        onClick={() => handleQuantityChange(product._id, (quantities[product._id] || 0) + 1)}
                                        className="px-3 py-1 bg-gray-100 rounded hover:bg-gray-200"
                                    >
                                        +
                                    </button>
                                </div>

                                <input
                                    type="range"
                                    min="0"
                                    value={quantities[product._id] || 0}
                                    onChange={(e) => 
                                        handleQuantityChange(product._id, parseInt(e.target.value))
                                    }
                                    className="w-full range-slider"
                                />

                                <button
                                    onClick={() => handleAdd(product._id)}
                                    className="w-full py-2 bg-green-500 text-white rounded hover:bg-green-600"
                                >
                                    Добавить ({quantities[product._id] || 0} ед.)
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            ))}

            {/* Индикаторы загрузки */}
            {isLoading && <div className="text-center py-4">Загрузка...</div>}
            {!isLoading && filteredProducts.length === 0 && (
                <div className="text-center py-4 text-gray-500">
                    Товары не найдены
                </div>
            )}
        </div>
    );
}