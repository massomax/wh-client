import axios from 'axios';
import { Warehouse } from '../types/warehouse';

export const api = axios.create({
  baseURL: 'https://wh-inv-production.up.railway.app',
  headers: {
    'Content-Type': 'application/json',
  },
});

let isRedirecting = false;

// Интерцептор запроса: добавление токена
api.interceptors.request.use(config => {
  const token = localStorage.getItem('authToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Универсальный интерцептор ответа
api.interceptors.response.use(
  (response) => {
    if (response.data?.items) {
      response.data.items = response.data.items.map((item: any) => ({
        _id: String(item._id),
        name: String(item.name),
        address: String(item.address),
        category: String(item.category),
      } as Warehouse));
    }
    return response;
  },
  (error) => {
    if (error.response?.status === 401 && !isRedirecting) {
      isRedirecting = true;
      localStorage.removeItem('authToken');
      localStorage.removeItem('userRole');
      localStorage.removeItem('username');
      window.location.href = '/login?sessionExpired=true';
    }

    if (error.response) {
      return Promise.reject({
        status: error.response.status,
        message: error.response.data?.message || 'Произошла ошибка',
        errors: error.response.data?.errors,
      });
    }

    return Promise.reject({ message: 'Нет соединения с сервером' });
  }
);