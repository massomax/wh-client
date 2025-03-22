import React, { useState, useEffect } from 'react';
import { api } from '../api/client';
import { useLocation, useNavigate } from 'react-router-dom';

export default function LoginForm() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<{ username?: string; password?: string; server?: string }>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isFormValid, setIsFormValid] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  // Валидация username
  const validateUsername = (value: string) => {
    const trimmed = value.trim();
    if (!trimmed) return 'Имя пользователя обязательно';
    if (trimmed.length < 3) return 'Минимум 3 символа';
    if (!/^[a-zA-Z0-9_\-@.]+$/.test(trimmed)) {
      return 'Допустимы: буквы, цифры, -, _, @, .';
    }
    return '';
  };

  // Валидация пароля
  const validatePassword = (value: string) => {
    const pwd = value.trim();
    if (!pwd) return 'Пароль обязателен';
    if (pwd.length < 8) return 'Минимум 8 символов';
    if (!/[A-Z]/.test(pwd)) return 'Должна быть заглавная буква';
    if (!/\d/.test(pwd)) return 'Должна быть хотя бы одна цифра';
    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(pwd)) {
      return 'Добавьте специальный символ';
    }
    return '';
  };

  // Проверка валидности формы при изменении полей
  useEffect(() => {
    const usernameError = validateUsername(username);
    const passwordError = validatePassword(password);
    setIsFormValid(!usernameError && !passwordError);
  }, [username, password]);

  // Обработчик изменений
  const handleFieldChange = (field: 'username' | 'password', value: string) => {
    if (field === 'username') {
      setUsername(value);
      setErrors((prev) => ({ ...prev, username: validateUsername(value) }));
    } else {
      setPassword(value);
      setErrors((prev) => ({ ...prev, password: validatePassword(value) }));
    }
  };

  // Отправка формы
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFormValid) return;

    setIsLoading(true);
    setErrors({});

    try {
      const response = await api.post('/auth/login', { 
        username: username.trim(),
        password: password.trim()
      });
      
      // 1. Сохраняем токен
      localStorage.setItem('authToken', response.data.token);
      
      // 2. Получаем путь для редиректа
      const returnTo = location.state?.from?.pathname || '/';
      
      // 3. Делаем навигацию без перезагрузки страницы
      navigate(returnTo, { replace: true });

    } catch (err: any) {
      if (err.response?.status === 400) {
        const serverErrors = err.response.data?.errors || {};
        setErrors({
          username: serverErrors.username?.[0],
          password: serverErrors.password?.[0],
          server: err.response.data?.message,
        });
      } else {
        setErrors({ 
          server: err.response?.status === 401 
            ? 'Неверные учетные данные' 
            : 'Ошибка соединения с сервером' 
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Подсчёт "силы" пароля (для наглядности)
  const passwordStrengthLevel = (pwd: string) => {
    // Условно каждые 2 символа считаем за 1 уровень
    // Можно добавить дополнительные критерии
    return Math.min(4, Math.floor(pwd.length / 2));
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Поле для имени пользователя */}
      <div>
        <label htmlFor="username" className="label">
          Имя пользователя
        </label>
        <input
          id="username"
          type="text"
          value={username}
          onChange={(e) => handleFieldChange('username', e.target.value)}
          onBlur={() => setErrors((prev) => ({ ...prev, username: validateUsername(username) }))}
          onKeyUp={(e) => {
            // Можно оставить, но учтите, что e.preventDefault() в keyUp не блокирует ввод
            if (!/[a-zA-Z0-9_\-@.]/.test(e.key)) {
              // e.preventDefault(); // не всегда корректно
            }
          }}
          className={`input ${errors.username ? 'input-error' : ''}`}
          autoComplete="username"
          aria-label="Имя пользователя"
        />
        {errors.username && <p className="error-text">{errors.username}</p>}
      </div>

      {/* Поле для пароля */}
      <div>
        <label htmlFor="password" className="label">
          Пароль
        </label>
        <input
          id="password"
          type="password"
          value={password}
          onChange={(e) => handleFieldChange('password', e.target.value)}
          onBlur={() => setErrors((prev) => ({ ...prev, password: validatePassword(password) }))}
          className={`input ${errors.password ? 'input-error' : ''}`}
          autoComplete="current-password"
          aria-label="Пароль"
        />

        {/* Полоски силы пароля */}
        <div className="password-strength">
          {[1, 2, 3, 4].map((level) => (
            <div
              key={level}
              className={`strength-bar ${
                passwordStrengthLevel(password) >= level ? 'strength-bar-active' : ''
              }`}
            />
          ))}
        </div>

        {errors.password && <p className="error-text">{errors.password}</p>}
      </div>

      {/* Ошибка с сервера */}
      {errors.server && (
        <div className="error-text" style={{ border: '1px solid var(--destructive-text-color)', padding: 8 }}>
          {errors.server}
        </div>
      )}

      {/* Кнопка отправки */}
      <button
        type="submit"
        disabled={!isFormValid || isLoading}
        className="button"
        style={{ width: '100%', justifyContent: 'center' }}
      >
        {isLoading ? 'Вход...' : 'Войти'}
      </button>
    </form>
  );
}
