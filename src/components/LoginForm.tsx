import { useState, useEffect } from 'react'
import { api } from '../api/client'
import { useLocation, useNavigate } from 'react-router-dom'

export default function LoginForm() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [errors, setErrors] = useState<{ username?: string; password?: string; server?: string }>({})
  const [isLoading, setIsLoading] = useState(false)
  const [isFormValid, setIsFormValid] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()

  // Валидация username
    const validateUsername = (value: string) => {
    const trimmed = value.trim()
    if (!trimmed) return 'Имя пользователя обязательно'
    if (trimmed.length < 3) return 'Минимум 3 символа'
    if (!/^[a-zA-Z0-9_\-@.]+$/.test(trimmed)) {
      return 'Допустимы: буквы, цифры, -, _, @, .'
    }
    return ''
  }

  // Валидация пароля
  const validatePassword = (value: string) => {
    const password = value.trim()
    if (!password) return 'Пароль обязателен'
    if (password.length < 8) return 'Минимум 8 символов'
    if (!/[A-Z]/.test(password)) return 'Должна быть заглавная буква'
    if (!/\d/.test(password)) return 'Должна быть хотя бы одна цифра'
    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
      return 'Добавьте специальный символ'
    }
    return ''
  }

  // Проверка валидности формы
  useEffect(() => {
    const usernameError = validateUsername(username)
    const passwordError = validatePassword(password)
    setIsFormValid(!usernameError && !passwordError)
  }, [username, password])

  // Обработчик изменений
  const handleFieldChange = (field: 'username' | 'password', value: string) => {
    if (field === 'username') {
      setUsername(value)
      setErrors(prev => ({ ...prev, username: validateUsername(value) }))
    } else {
      setPassword(value)
      setErrors(prev => ({ ...prev, password: validatePassword(value) }))
    }
  }

  // Отправка формы
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!isFormValid) return

    setIsLoading(true)
    setErrors({})

    try {
      const response = await api.post('/auth/login', { 
        username: username.trim(),
        password: password.trim()
      })
      
      // 1. Сохраняем токен
      localStorage.setItem('authToken', response.data.token)
      
      // 2. Получаем путь для редиректа
      const returnTo = location.state?.from?.pathname || '/'
      
      // 3. Делаем навигацию без перезагрузки страницы
      navigate(returnTo, { replace: true })

    } catch (err: any) {
      if (err.response?.status === 400) {
        const serverErrors = err.response.data?.errors || {}
        setErrors({
          username: serverErrors.username?.[0],
          password: serverErrors.password?.[0],
          server: err.response.data?.message
        })
      } else {
        setErrors({ 
          server: err.response?.status === 401 
            ? 'Неверные учетные данные' 
            : 'Ошибка соединения с сервером' 
        })
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="username" className="block text-sm font-medium text-gray-700">
          Имя пользователя
        </label>
        <input
          id="username"
          type="text"
          value={username}
          onChange={(e) => handleFieldChange('username', e.target.value)}
          onBlur={() => setErrors(prev => ({ ...prev, username: validateUsername(username) }))}
          onKeyUp={(e) => {
            if (!/[a-zA-Z0-9_\-@.]/.test(e.key)) {
              e.preventDefault()
            }
          }}
          className={`mt-1 block w-full rounded-md border ${
            errors.username ? 'border-red-500' : 'border-gray-300'
          } px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm`}
          autoComplete="username"
        />
        {errors.username && (
          <p className="mt-1 text-sm text-red-600">{errors.username}</p>
        )}
      </div>

      <div>
        <label htmlFor="password" className="block text-sm font-medium text-gray-700">
          Пароль
        </label>
        <input
          id="password"
          type="password"
          value={password}
          onChange={(e) => handleFieldChange('password', e.target.value)}
          onBlur={() => setErrors(prev => ({ ...prev, password: validatePassword(password) }))}
          className={`mt-1 block w-full rounded-md border ${
            errors.password ? 'border-red-500' : 'border-gray-300'
          } px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm`}
          autoComplete="current-password"
        />
         <div className="mt-2 flex gap-1">
            {[1,2,3,4].map((level) => (
              <div 
                key={level}
                className={`h-1 w-1/4 rounded ${
                password.length >= level * 2 ? 'bg-blue-500' : 'bg-gray-200'
                }`}
              />
           ))}
  </div>
        {errors.password && (
          <p className="mt-1 text-sm text-red-600">{errors.password}</p>
        )}
      </div>

      {errors.server && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-md">
          <p className="text-sm text-red-600">{errors.server}</p>
        </div>
      )}

      <button
        type="submit"
        disabled={!isFormValid || isLoading}
        className="w-full button-press flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isLoading ? 'Вход...' : 'Войти'}
      </button>
    </form>
  )
}