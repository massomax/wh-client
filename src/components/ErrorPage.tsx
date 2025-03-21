import { useRouteError } from 'react-router-dom'

export default function ErrorPage() {
  const error = useRouteError() as any
  
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-red-600 mb-4">
          {error.status || 'Ошибка'}
        </h1>
        <p className="text-xl text-gray-600 mb-4">
          {error.statusText || error.message}
        </p>
        <button
          onClick={() => window.location.reload()}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          Обновить страницу
        </button>
      </div>
    </div>
  )
}