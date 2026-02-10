/**
 * App Router
 * Main routing component using React Router v7
 */

import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import routeConfig from './routes'

const router = createBrowserRouter(routeConfig)

export const AppRouter = () => {
  return <RouterProvider router={router} />
}

export default AppRouter
