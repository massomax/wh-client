import { useState } from 'react';
import { api } from '../api/client';
import Header from '../components/Header';
import LogoutButton from '../components/LogoutButton';
import ErrorBlock from '../components/ui/ErrorBlock';

export default function WarehouseReport() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleDownloadReport = async () => {
    setError('');
    setLoading(true);
    try {
      const response = await api.get('/api/reports/products/export', {
        responseType: 'blob',
      });
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
      <Header title="Отчёт по всем складам" />
      <LogoutButton />

      <p className="report-description">
        Нажмите кнопку ниже, чтобы сгенерировать и скачать Excel-отчёт по всем продуктам.
        Отчёт группирует товары по названию и суммирует их количество на всех складах.
      </p>

      {error && <ErrorBlock message={error} />}

      <button
        type="button"
        className="button download-button"
        onClick={handleDownloadReport}
        disabled={loading}
      >
        {loading ? 'Генерация отчёта...' : 'Скачать отчёт'}
      </button>
    </div>
  );
}
