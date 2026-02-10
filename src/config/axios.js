import axios from 'axios';
import Cookies from 'js-cookie';
import env from './env';

/**
 * Axios Instance Configuration
 * Centralized HTTP client with interceptors for auth and error handling
 */
const axiosInstance = axios.create({
    baseURL: env.API_BASE_URL,
    timeout: env.API_TIMEOUT,
    headers: {
        'Content-Type': 'application/json',
        'ngrok-skip-browser-warning': 'true'
    }
});

// Add a request interceptor
axiosInstance.interceptors.request.use(
    (config) => {
        // Get the token from cookies
        const token = Cookies.get('access_token');
      
        // If token exists, add it to the headers
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Add a response interceptor
axiosInstance.interceptors.response.use(
    (response) => response,
    async (error) => {
        // Handle 401 (Unauthorized) responses
        if (error.response?.status === 401) {
            // Clear the token
            Cookies.remove('access_token');
            
            // Redirect to login page
            window.location.href = '/login';
        }
        
        return Promise.reject(error);
}
);

export const API_BASE_URL = axiosInstance.defaults.baseURL;
export default axiosInstance;