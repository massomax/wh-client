import { useState } from 'react';
import { api } from '../api/client';
import { useNavigate } from 'react-router-dom';

export default function WarehouseReport() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleDownloadReport = async () => {
    setError('');
    setLoading(true);
    try {
      // Запрос с указанием, что ожидается Blob-ответ
      const response = await api.get('/api/reports/products/export', {
        responseType: 'blob',
      });
      // Создаём URL для Blob
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'products_report.xlsx');
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Ошибка генерации отчёта');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app-container warehouse-report-container">
      <h2>Отчёт по всем складам</h2>
      <button type="button" className="button back-button" onClick={() => navigate(-1)}>
        Вернуться назад
      </button>
      <p>
        Нажмите кнопку ниже, чтобы сгенерировать и скачать Excel-отчёт по всем продуктам.
        Отчёт группирует товары по названию и суммирует их количество на всех складах.
      </p>
      {error && <div className="error-text">{error}</div>}
      <button type="button" className="button" onClick={handleDownloadReport} disabled={loading}>
        {loading ? 'Генерация отчёта...' : 'Скачать отчёт'}
      </button>
    </div>
  );
}
