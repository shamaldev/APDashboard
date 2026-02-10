/**
 * Route Constants
 * Single source of truth for all route paths
 */

export const ROUTES = {
  // Public routes
  LOGIN: '/login',
  SIGNUP: '/signup',
  FORGOT_PASSWORD: '/forgot-password',

  // Protected routes
  HOME: '/',
  DASHBOARD: '/ssbi',
  AI_ASSISTANT: '/ai-assistant',

  // Legal
  TERMS: '/terms',
  PRIVACY: '/privacy',
}

export const PUBLIC_ROUTES = [
  ROUTES.LOGIN,
  ROUTES.SIGNUP,
  ROUTES.FORGOT_PASSWORD,
]

export const PROTECTED_ROUTES = [
  ROUTES.DASHBOARD,
  ROUTES.AI_ASSISTANT,
]

export default ROUTES
