/**
 * Environment Configuration
 * Centralizes all environment variables with validation
 */

const env = {
  // API Configuration
  API_BASE_URL: import.meta.env.VITE_API_BASE_URL || 'https://bc38-202-12-83-192.ngrok-free.app/api/v1',

  // App Configuration
  APP_NAME: import.meta.env.VITE_APP_NAME || 'AP Dashboard',

  // Feature Flags
  ENABLE_VOICE_INPUT: import.meta.env.VITE_ENABLE_VOICE_INPUT !== 'false',

  // Timeouts
  API_TIMEOUT: parseInt(import.meta.env.VITE_API_TIMEOUT || '30000', 10),
  TOKEN_CHECK_INTERVAL: parseInt(import.meta.env.VITE_TOKEN_CHECK_INTERVAL || '120000', 10),

  // Environment
  IS_DEV: import.meta.env.DEV,
  IS_PROD: import.meta.env.PROD,
  MODE: import.meta.env.MODE,
}

// Validation - ensure critical variables exist
const validateEnv = () => {
  const warnings = []

  if (!env.API_BASE_URL) {
    warnings.push('VITE_API_BASE_URL is not set, using default')
  }

  if (env.IS_DEV && warnings.length > 0) {
    console.warn('[ENV]', warnings.join('; '))
  }
}

validateEnv()

export default env
