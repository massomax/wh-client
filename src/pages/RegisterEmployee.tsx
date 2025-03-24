import React, { useState } from 'react';
import { api } from '../api/client';

export default function RegisterEmployee() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [role] = useState('Сотрудник'); // По умолчанию регистрируется сотрудник
  const [message, setMessage] = useState('');

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/auth/register', { username, password, role });
      setMessage('Сотрудник успешно зарегистрирован');
    } catch (err: any) {
      setMessage(err.response?.data?.message || 'Ошибка регистрации');
    }
  };

  return (
    <div className="app-container">
      <h2>Регистрация нового сотрудника</h2>
      {message && <div className="error-text">{message}</div>}
      <form onSubmit={handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
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
        <button type="submit" className="button">Зарегистрировать</button>
      </form>
    </div>
  );
}
