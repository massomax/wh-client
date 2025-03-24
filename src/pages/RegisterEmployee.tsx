import React, { useState } from 'react';
import { api } from '../api/client';
import Header from '../components/Header';
import LogoutButton from '../components/LogoutButton';
import ErrorBlock from '../components/ui/ErrorBlock';

export default function RegisterEmployee() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [role] = useState('Сотрудник');
  const [message, setMessage] = useState('');

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/auth/register', { username, password, role });
      setMessage('Сотрудник успешно зарегистрирован');
      setUsername('');
      setPassword('');
    } catch (err: any) {
      setMessage(err.response?.data?.message || 'Ошибка регистрации');
    }
  };

  return (
    <div className="app-container">
      <LogoutButton />
      <Header title="Регистрация сотрудника" />

      {message && <div className="error-text">{message}</div>}

      <form className="employee-form" onSubmit={handleRegister}>
        <input
          className="input"
          type="text"
          placeholder="Имя пользователя"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
        />
        <input
          className="input"
          type="password"
          placeholder="Пароль"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        {message && <ErrorBlock message={message} />}
        <button type="submit" className="button">Зарегистрировать</button>
      </form>
    </div>
  );
}
