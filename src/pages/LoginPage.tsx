import { useEffect } from 'react'
import LoginForm from '../components/LoginForm'
import {  useLocation } from 'react-router-dom'

export default function LoginPage() {
  const location = useLocation()
  
  // Сохраняем исходный путь для редиректа
  useEffect(() => {
    if (location.search.includes('sessionExpired')) {
      alert('Сессия истекла. Пожалуйста, войдите снова.')
    }
    
    const from = location.state?.from || '/'
    sessionStorage.setItem('returnPath', from)
  }, [location])
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">

        <h2 className="mt-6 text-center text-3xl font-bold text-gray-900">
          Вход в аккаунт
        </h2>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <LoginForm />
        </div>
      </div>
    </div>
  )
}