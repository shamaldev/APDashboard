/**
 * Application Routes Configuration
 * Centralized route definitions with lazy loading
 */

import { lazy, Suspense } from 'react'
import { Navigate } from 'react-router-dom'
import { ROUTES } from '@shared/constants'
import { PrivateRoute } from '@features/auth'

// Lazy-loaded pages for code splitting
const LoginPage = lazy(() => import('@features/auth/pages/LoginPage'))
const SignUpPage = lazy(() => import('@features/auth/pages/SignUpPage'))
const DashboardPage = lazy(() => import('@features/dashboard/pages/DashboardPage'))

// Loading fallback component
const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center bg-slate-50">
    <div className="text-center">
      <div className="w-8 h-8 border-2 border-slate-300 border-t-slate-600 rounded-full animate-spin mx-auto mb-4" />
      <p className="text-slate-500 text-sm">Loading...</p>
    </div>
  </div>
)

// Suspense wrapper for lazy components
const LazyPage = ({ children }) => (
  <Suspense fallback={<PageLoader />}>
    {children}
  </Suspense>
)

/**
 * Route configuration array
 * Used by the router to generate routes
 */
export const routeConfig = [
  // Default redirect
  {
    path: ROUTES.HOME,
    element: <Navigate to={ROUTES.LOGIN} replace />,
  },

  // Public routes
  {
    path: ROUTES.LOGIN,
    element: <LazyPage><LoginPage /></LazyPage>,
  },
  {
    path: ROUTES.SIGNUP,
    element: <LazyPage><SignUpPage /></LazyPage>,
  },

  // Protected routes
  {
    element: <PrivateRoute />,
    children: [
      {
        path: ROUTES.DASHBOARD,
        element: <LazyPage><DashboardPage /></LazyPage>,
      },
      {
        path: ROUTES.AI_ASSISTANT,
        element: <LazyPage><DashboardPage /></LazyPage>,
      },
    ],
  },

  // 404 fallback
  {
    path: '*',
    element: <Navigate to={ROUTES.LOGIN} replace />,
  },
]

export default routeConfig
