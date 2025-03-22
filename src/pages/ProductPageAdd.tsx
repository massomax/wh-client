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

  // Храним количество для каждого продукта
  const [quantities, setQuantities] = useState<{ [key: string]: number }>({});

  // Храним флаги загрузки (true/false) для каждого продукта
  const [loadingProductIds, setLoadingProductIds] = useState<{ [key: string]: boolean }>({});

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
    const result = allProducts.filter(p => 
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
    // Если уже идёт запрос по этому товару, выходим
    if (loadingProductIds[productId]) return;

    const quantity = quantities[productId] || 0;
    if (quantity <= 0) return;

    // Ставим флаг загрузки для этого товара
    setLoadingProductIds(prev => ({ ...prev, [productId]: true }));

    try {
      await api.patch(`/api/products/${productId}/quantity`, {
        action: 'add',
        value: quantity,
        warehouseId,
      });
      
      // Обновляем количество в списке
      const updatedProducts = allProducts.map(p => 
        p._id === productId ? { ...p, quantity: p.quantity + quantity } : p
      );
      setAllProducts(updatedProducts);

      // Сбрасываем поле ввода количества
      setQuantities(prev => ({ ...prev, [productId]: 0 }));
    } catch (err: any) {
      setError(err.response?.data?.message || err.message);
    } finally {
      // Снимаем флаг загрузки
      setLoadingProductIds(prev => ({ ...prev, [productId]: false }));
    }
  };

  return (
    <div>
      {error && <div className="error-text">{error}</div>}

      {filteredProducts.map(product => {
        const quantityValue = quantities[product._id] || 0;
        const isProductLoading = !!loadingProductIds[product._id];

        return (
          <div key={product._id} className="card product-item">
            {product.photo?.url && (
              <img
                src={product.photo.url}
                alt={product.name}
                aria-label={product.name}
              />
            )}
            <div className="product-item-content">
              <div className="card-title">{product.name}</div>
              
              {/* Блок изменения количества */}
              <div style={{ marginTop: '8px' }}>
                <div className="product-quantity-controls">
                  <button
                    className="button"
                    onClick={() => handleQuantityChange(product._id, quantityValue - 1)}
                    disabled={isProductLoading}
                  >
                    -
                  </button>

                  <input
                    type="number"
                    className="input"
                    style={{ width: 80, textAlign: 'center' }}
                    value={quantityValue}
                    onChange={(e) => handleQuantityChange(product._id, parseInt(e.target.value))}
                    min={0}
                    aria-label="Количество для добавления"
                    disabled={isProductLoading}
                  />

                  <button
                    className="button"
                    onClick={() => handleQuantityChange(product._id, quantityValue + 1)}
                    disabled={isProductLoading}
                  >
                    +
                  </button>
                </div>

                <input
                  type="range"
                  className="range-slider"
                  min={0}
                  value={quantityValue}
                  onChange={(e) => handleQuantityChange(product._id, parseInt(e.target.value))}
                  aria-label="Слайдер количества"
                  disabled={isProductLoading}
                />

                {/* Кнопка "Добавить" */}
                <button
                  className="button"
                  onClick={() => handleAdd(product._id)}
                  disabled={isProductLoading || quantityValue === 0}
                >
                  {isProductLoading ? 'Загрузка...' : `Добавить (${quantityValue} ед.)`}
                </button>
              </div>
            </div>
          </div>
        );
      })}

      {isLoading && <div style={{ textAlign: 'center', padding: '16px' }}>Загрузка...</div>}
      {!isLoading && filteredProducts.length === 0 && (
        <div style={{ textAlign: 'center', padding: '16px', color: 'var(--hint-color)' }}>
          Товары не найдены
        </div>
      )}
    </div>
  );
}
