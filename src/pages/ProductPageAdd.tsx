import { useEffect, useState, useRef } from 'react';
import { Product } from '../types/product';
import { api } from '../api/client';
import ErrorBlock from '../components/ui/ErrorBlock';
import Loader from '../components/ui/Loader';
import EmptyState from '../components/ui/EmptyState';
import '../productCard.css';

type Props = {
  warehouseId: string;
  searchQuery: string;
  selectedCategory: string;
};

export default function ProductPageAdd({
  warehouseId,
  searchQuery,
  selectedCategory,
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

  // Логика загрузки фото
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [photoUploadProductId, setPhotoUploadProductId] = useState<string | null>(null);

  const handlePhotoClick = (productId: string) => {
    setPhotoUploadProductId(productId);
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!photoUploadProductId) return;

    const file = e.target.files?.[0];
    if (!file) return;

    setLoadingProductIds((prev) => ({ ...prev, [photoUploadProductId]: true }));

    try {
      const formData = new FormData();
      formData.append('photo', file);

      await api.put(`/api/products/${warehouseId}/${photoUploadProductId}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      // Обновляем фото в allProducts, приводя объект к типу Product
      const updatedProducts = allProducts.map((p) => {
        if (p._id === photoUploadProductId) {
          return ({
            ...p,
            photo: { url: URL.createObjectURL(file) }
          } as Product);
        }
        return p;
      });
      setAllProducts(updatedProducts);
    } catch (err: any) {
      setError(err.response?.data?.message || err.message);
    } finally {
      setLoadingProductIds((prev) => ({ ...prev, [photoUploadProductId!]: false }));
      setPhotoUploadProductId(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // Отключаем слайдер на время скролла
  useEffect(() => {
    const handleScroll = () => {
      setDisableSlider(true);
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
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
    const result = allProducts.filter(
      (p) =>
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
        (selectedCategory === 'all' || p.category === selectedCategory)
    );
    setFilteredProducts(result);
  }, [allProducts, searchQuery, selectedCategory]);

  // Изменение количества
  const handleQuantityChange = (productId: string, value: number) => {
    const newValue = Math.max(0, value);
    setQuantities((prev) => ({ ...prev, [productId]: newValue }));
  };

  // Добавление (PATCH с action=add)
  const handleAdd = async (productId: string) => {
    if (loadingProductIds[productId]) return;
    const quantity = quantities[productId] || 0;
    if (quantity <= 0) return;

    setLoadingProductIds((prev) => ({ ...prev, [productId]: true }));

    try {
      await api.patch(`/api/products/${productId}/quantity`, {
        action: 'add',
        value: quantity,
        warehouseId,
      });

      const updatedProducts = allProducts.map((p) =>
        p._id === productId ? { ...p, quantity: p.quantity + quantity } : p
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

      {/* Скрытый input для загрузки фото */}
      <input
        type="file"
        ref={fileInputRef}
        style={{ display: 'none' }}
        accept="image/*"
        onChange={handleFileChange}
      />

      {!isLoading &&
        !error &&
        filteredProducts.map((product) => {
          const quantityValue = quantities[product._id] || 0;
          const isProductLoading = !!loadingProductIds[product._id];

          return (
            <div key={product._id} className="card product-card">
              <div className="product-card-container">
                {/* Фото слева */}
                <div
                  className="product-image-container"
                  style={{ cursor: 'pointer', position: 'relative' }}
                >
                  {isProductLoading && (
                    <div
                      style={{
                        position: 'absolute',
                        top: '50%',
                        left: '50%',
                        transform: 'translate(-50%, -50%)',
                        backgroundColor: 'rgba(255,255,255,0.7)',
                        padding: '6px 12px',
                        borderRadius: '8px',
                        fontSize: '13px',
                        color: '#000'
                      }}
                    >
                      Загрузка...
                    </div>
                  )}
                  {product.photo?.url ? (
                    <img
                      src={product.photo.url}
                      alt={product.name}
                      className="product-thumb-large"
                      onClick={() => handlePhotoClick(product._id)}
                    />
                  ) : (
                    <div
                      onClick={() => handlePhotoClick(product._id)}
                      style={{
                        width: 120,
                        height: 120,
                        border: '1px dashed #ccc',
                        borderRadius: 8,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '13px',
                        color: '#666'
                      }}
                    >
                      Нажмите, чтобы загрузить
                    </div>
                  )}
                </div>

                {/* Три ряда справа */}
                <div className="product-details">
                  {/* Верхний ряд: название + остаток */}
                  <div className="product-top-row">
                    <div className="product-name">{product.name}</div>
                    <div className="product-qty">Остаток: {product.quantity}</div>
                  </div>

                  {/* Средний ряд: кнопки + поле + "Добавить" */}
                  <div className="product-middle-row">
                    <div className="product-controls">
                      <button
                        onClick={() => handleQuantityChange(product._id, quantityValue - 1)}
                        disabled={isProductLoading}
                        className="circle-btn"
                      >
                        −
                      </button>
                      <input
                        type="number"
                        value={quantityValue}
                        onChange={(e) =>
                          handleQuantityChange(product._id, parseInt(e.target.value))
                        }
                        className="small-input"
                        min={0}
                        aria-label="Количество для добавления"
                        disabled={isProductLoading}
                      />
                      <button
                        onClick={() => handleQuantityChange(product._id, quantityValue + 1)}
                        disabled={isProductLoading}
                        className="circle-btn"
                      >
                        +
                      </button>
                    </div>
                    <button
                      className="button compact-action"
                      onClick={() => handleAdd(product._id)}
                      disabled={isProductLoading || quantityValue === 0}
                    >
                      {isProductLoading ? 'Загрузка...' : `Добавить ${quantityValue} ед.`}
                    </button>
                  </div>

                  {/* Нижний ряд: слайдер */}
                  <div className="product-bottom-row">
                    <input
                      type="range"
                      className="long-slider"
                      min={0}
                      max={500}
                      value={quantityValue}
                      onChange={(e) =>
                        handleQuantityChange(product._id, parseInt(e.target.value))
                      }
                      aria-label="Слайдер количества"
                      disabled={isProductLoading || disableSlider}
                    />
                  </div>
                </div>
              </div>
            </div>
          );
        })}
    </div>
  );
}
