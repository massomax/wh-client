import { useEffect, useState, useRef } from 'react';
import { Product } from '../types/product';
import { api } from '../api/client';
import ErrorBlock from '../components/ui/ErrorBlock';
import Loader from '../components/ui/Loader';
import EmptyState from '../components/ui/EmptyState';

type Props = {
  warehouseId: string;
  searchQuery: string;
  selectedCategory: string;
};

export default function ProductPageSub({
  warehouseId,
  searchQuery,
  selectedCategory,
}: Props) {
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [quantities, setQuantities] = useState<{ [key: string]: number }>({});
  const [loadingProductIds, setLoadingProductIds] = useState<{ [key: string]: boolean }>({});
  const [disableSlider, setDisableSlider] = useState(false);
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Отключаем слайдер на время скролла для лучшей отзывчивости
  useEffect(() => {
    const handleScroll = () => {
      setDisableSlider(true);
      if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current);
      scrollTimeoutRef.current = setTimeout(() => setDisableSlider(false), 200);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current);
    };
  }, []);

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

  useEffect(() => {
    const result = allProducts.filter(
      (p) =>
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
        (selectedCategory === 'all' || p.category === selectedCategory)
    );
    setFilteredProducts(result);
  }, [allProducts, searchQuery, selectedCategory]);

  const handleQuantityChange = (productId: string, newValue: number) => {
    const product = allProducts.find((p) => p._id === productId);
    if (!product) return;
    // Ограничиваем значение от 0 до текущего остатка
    if (newValue < 0) newValue = 0;
    if (newValue > product.quantity) newValue = product.quantity;
    setQuantities((prev) => ({ ...prev, [productId]: newValue }));
  };

  const handleSubtract = async (productId: string) => {
    const value = quantities[productId] || 0;
    if (value <= 0 || loadingProductIds[productId]) return;
    setLoadingProductIds((prev) => ({ ...prev, [productId]: true }));
    try {
      await api.patch(`/api/products/${productId}/quantity`, {
        action: 'sub',
        value: value,
        warehouseId,
      });
      const updatedProducts = allProducts.map((p) =>
        p._id === productId ? { ...p, quantity: p.quantity - value } : p
      );
      setAllProducts(updatedProducts);
      setQuantities((prev) => ({ ...prev, [productId]: 0 }));
    } catch (err: any) {
      setError(err.response?.data?.message || err.message);
    } finally {
      setLoadingProductIds((prev) => ({ ...prev, [productId]: false }));
    }
  };

  return (
    <div>
      {error && <ErrorBlock message={error} />}
      {isLoading && <Loader />}
      {!isLoading && !error && filteredProducts.length === 0 && (
        <EmptyState message="Товары не найдены" />
      )}

      {!isLoading &&
        !error &&
        filteredProducts.map((product) => {
          const value = quantities[product._id] || 0;
          const loading = !!loadingProductIds[product._id];

          return (
            <div key={product._id} className="card" style={{ marginBottom: '16px' }}>
              {/* Верхний ряд: Фото и информация о продукте */}
              <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                {product.photo?.url && (
                  <img
                    src={product.photo.url}
                    alt={product.name}
                    className="product-thumb"
                    style={{ width: '80px', height: '80px', objectFit: 'cover', borderRadius: '8px' }}
                  />
                )}
                <div style={{ flex: 1 }}>
                  <div className="product-name" style={{ fontSize: '16px', fontWeight: 'bold' }}>
                    {product.name}
                  </div>
                  <div className="product-qty" style={{ fontSize: '14px', color: 'var(--subtitle-text-color)' }}>
                    Остаток: {product.quantity}
                  </div>
                </div>
                <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  marginTop: '8px',
                  flexWrap: 'wrap',
                }}
              >
                <button
                  onClick={() => handleQuantityChange(product._id, value - 1)}
                  disabled={loading}
                  className="circle-btn"
                >
                  −
                </button>
                <input
                  type="number"
                  value={value}
                  onChange={(e) => handleQuantityChange(product._id, parseInt(e.target.value))}
                  className="small-input"
                  min={0}
                  max={product.quantity}
                  disabled={loading}
                />
                <button
                  onClick={() => handleQuantityChange(product._id, value + 1)}
                  disabled={loading}
                  className="circle-btn"
                >
                  +
                </button>
                <button
                  className="button button-destructive compact-action"
                  onClick={() => handleSubtract(product._id)}
                  disabled={loading || value === 0}
                  title="Списать со склада"
                >
                  {loading ? 'Загрузка...' : `Списать ${value} ед.`}
                </button>
              </div>
              <input
                type="range"
                className="long-slider"
                min={0}
                max={product.quantity}
                value={value}
                onChange={(e) => handleQuantityChange(product._id, parseInt(e.target.value))}
                disabled={loading || disableSlider}
                style={{ marginTop: '8px' }}
              />
              </div>

              {/* Средний ряд: Кнопки управления и ввод количества */}


              {/* Нижний ряд: Слайдер выбора количества */}
              <input
                type="range"
                className="long-slider"
                min={0}
                max={product.quantity}
                value={value}
                onChange={(e) => handleQuantityChange(product._id, parseInt(e.target.value))}
                disabled={loading || disableSlider}
                style={{ marginTop: '8px' }}
              />
            </div>
          );
        })}
    </div>
  );
}
