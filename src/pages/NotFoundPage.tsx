import Header from '../components/Header';

export default function NotFoundPage() {
  return (
    <div className="app-container error-page">
      <Header title="Страница не найдена" showBackButton={false} />
      <div className="error-content">
        <h1 className="error-title">404</h1>
        <p className="error-message">Такой страницы не существует.</p>
        <a href="/" className="button">На главную</a>
      </div>
    </div>
  );
}
