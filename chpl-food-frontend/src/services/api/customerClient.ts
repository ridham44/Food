import axios from 'axios';
import { useCustomerAuthStore } from '@/stores/customerAuthStore';

/**
 * Separate axios instance (and separate persisted store) from the tenant
 * dashboard's apiClient/authStore. Customer and tenant JWTs are both plain
 * Bearer tokens and could otherwise collide in the same browser — an
 * expired/invalid customer token must never log out a tenant session that
 * happens to be open in another tab, or vice versa.
 */
export const customerApiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

customerApiClient.interceptors.request.use((config) => {
  const token = useCustomerAuthStore.getState().accessToken;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

customerApiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 || error.response?.status === 403) {
      useCustomerAuthStore.getState().logout();
    }
    return Promise.reject(error);
  }
);
