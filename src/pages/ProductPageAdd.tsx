import { useEffect, useState, useRef } from 'react';
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

  // Количество для каждого продукта
  const [quantities, setQuantities] = useState<{ [key: string]: number }>({});

  // Флаги загрузки (true/false) для каждого продукта
  const [loadingProductIds, setLoadingProductIds] = useState<{ [key: string]: boolean }>({});

  // Флаг отключения ползунка во время скролла
  const [disableSlider, setDisableSlider] = useState(false);
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // ====== События скролла ======
  useEffect(() => {
    const handleScroll = () => {
      // При любом скролле отключаем ползунки
      setDisableSlider(true);
      // Сбрасываем предыдущий таймер
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
      // Через 200 мс после окончания скролла снова включаем
      scrollTimeoutRef.current = setTimeout(() => {
        setDisableSlider(false);
      }, 200);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, []);

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

  // Фильтрация
  useEffect(() => {
    const result = allProducts.filter(p => 
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
      (selectedCategory === 'all' || p.category === selectedCategory)
    );
    setFilteredProducts(result);
  }, [allProducts, searchQuery, selectedCategory]);

  // Изменение количества
  const handleQuantityChange = (productId: string, value: number) => {
    const newValue = Math.max(0, value);
    setQuantities(prev => ({ ...prev, [productId]: newValue }));
  };

  // Добавление
  const handleAdd = async (productId: string) => {
    if (loadingProductIds[productId]) return;
    const quantity = quantities[productId] || 0;
    if (quantity <= 0) return;

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

      // Сбрасываем поле ввода
      setQuantities(prev => ({ ...prev, [productId]: 0 }));
    } catch (err: any) {
      setError(err.response?.data?.message || err.message);
    } finally {
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
              
              <div style={{ marginTop: '8px' }}>
                {/* Кнопки +/- */}
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

                {/* Ползунок (range) */}
                <input
                  type="range"
                  className="range-slider"
                  min={0}
                  value={quantityValue}
                  onChange={(e) => handleQuantityChange(product._id, parseInt(e.target.value))}
                  aria-label="Слайдер количества"
                  disabled={isProductLoading || disableSlider}
                />

                {/* Кнопка Добавить */}
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
