import { createBrowserRouter, Navigate, RouterProvider, useLocation } from 'react-router-dom'
import WarehousesPage from './pages/WarehousesPage'
import ProductsPage from './pages/ProductPage'
import ErrorPage from './components/ErrorPage'
import LoginPage from './pages/LoginPage'
import { JSX } from 'react'
import './telegramTheme.css';

const ProtectedRoute = ({ children }: { children: JSX.Element }) => {
  const token = localStorage.getItem('authToken')
  const location = useLocation()

  return token 
    ? children 
    : <Navigate to="/login" replace state={{ from: location }} />
}

const router = createBrowserRouter([
  {
    path: '/',
    element: <ProtectedRoute><WarehousesPage /></ProtectedRoute>,
    errorElement: <ErrorPage />
  },
  {
    path: '/warehouses/:warehouseId',
    element: <ProtectedRoute><ProductsPage /></ProtectedRoute>,
    errorElement: <ErrorPage />
  },
  {
    path: '/login',
    element: <LoginPage />,
    errorElement: <ErrorPage />
  }
])

export default function App() {
  return <RouterProvider router={router} />
}