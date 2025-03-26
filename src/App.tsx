import { createBrowserRouter, Navigate, RouterProvider, useLocation } from 'react-router-dom';
import WarehousesPage from './pages/WarehousesPage';
import ProductsPage from './pages/ProductPage';
import ErrorPage from './components/ErrorPage';
import LoginPage from './pages/LoginPage';
import ManagerDashboard from './pages/ManagerDashboard';
import RegisterEmployee from './pages/RegisterEmployee';
import WarehousePositions from './pages/WarehousePositions';
import OrdersPage from './pages/OrdersPage';
import WarehouseActions from './pages/WarehouseActions';
import WarehouseReport from './pages/WarehouseReport';
import ProtectedManagerRoute from './components/ProtectedManagerRoute';
import { JSX } from 'react';
import { useAuth } from './hooks/useAuth';
import NotFoundPage from './pages/NotFoundPage';
import './telegramTheme.css';

// Новый компонент, который определяет, какую страницу показывать
const HomePage = () => {
  const { isManager } = useAuth();
  return isManager ? <ManagerDashboard /> : <WarehousesPage />;
};

const ProtectedRoute = ({ children }: { children: JSX.Element }) => {
  const { isLoggedIn } = useAuth();
  const location = useLocation();

  return isLoggedIn
    ? children
    : <Navigate to="/login" replace state={{ from: location }} />;
};

const router = createBrowserRouter([
  {
    path: '/',
    element: <ProtectedRoute><HomePage /></ProtectedRoute>,
    errorElement: <ErrorPage />
  },
  {
    path: '/warehouses/:warehouseId',
    element: <ProtectedRoute><ProductsPage /></ProtectedRoute>,
    errorElement: <ErrorPage />
  },
  {
    path: '/manager',
    element: <ProtectedManagerRoute><ManagerDashboard /></ProtectedManagerRoute>,
    errorElement: <ErrorPage />
  },
  {
    path: '/register-employee',
    element: <ProtectedManagerRoute><RegisterEmployee /></ProtectedManagerRoute>,
    errorElement: <ErrorPage />
  },
  {
    path: '/warehouse-positions',
    element: <ProtectedManagerRoute><WarehousePositions /></ProtectedManagerRoute>,
    errorElement: <ErrorPage />
  },
  {
    path: '/orders',
    element: <ProtectedManagerRoute><OrdersPage /></ProtectedManagerRoute>,
    errorElement: <ErrorPage />
  },
  {
    path: '/warehouse-actions',
    element: <ProtectedManagerRoute><WarehouseActions /></ProtectedManagerRoute>,
    errorElement: <ErrorPage />
  },
  {
    path: '/warehouse-report',
    element: <ProtectedManagerRoute><WarehouseReport /></ProtectedManagerRoute>,
    errorElement: <ErrorPage />
  },
  {
    path: '/login',
    element: <LoginPage />,
    errorElement: <ErrorPage />
  },
  {
    path: '*',
    element: <NotFoundPage />
  }
]);

export default function App() {
  return <RouterProvider router={router} />;
}
