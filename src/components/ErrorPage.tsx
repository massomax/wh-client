import { useRouteError } from 'react-router-dom';
import Header from '../components/Header';

export default function ErrorPage() {
  const error = useRouteError() as any;

  return (
    <div className="app-container error-page">
      <Header title="Ошибка" showBackButton={false} />

      <div className="error-content">
        <h1 className="error-title">{error.status || 'Ошибка'}</h1>
        <p className="error-message">
          {error.statusText || error.message || 'Произошла неизвестная ошибка'}
        </p>
        <button
          onClick={() => window.location.reload()}
          className="button"
        >
          Обновить страницу
        </button>
      </div>
    </div>
  );
}
