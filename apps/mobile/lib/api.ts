import axios from 'axios';
import { getStoredToken, setStoredToken } from './storage';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:5000/api';

export const apiClient = axios.create({
  baseURL: API_URL,
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' },
});

apiClient.interceptors.request.use(async (config) => {
  const token = await getStoredToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

apiClient.interceptors.response.use(
  (r) => r,
  async (err) => {
    if (err.response?.status === 401) await setStoredToken(null);
    return Promise.reject(err);
  }
);

export const sendOTP = (mobileNumber: string, checkUserExists?: boolean) =>
  apiClient.post('/auth/send-otp', { mobileNumber, checkUserExists });

export const verifyOTP = (mobileNumber: string, otp: string, role?: 'buyer' | 'seller') =>
  apiClient.post('/auth/verify-otp', { mobileNumber, otp, role });

export interface RegisterPasswordPayload {
  username: string;
  password: string;
  role: 'buyer' | 'seller';
  profile?: { fullName?: string; mobileNumber?: string };
  shop?: {
    name: string;
    address: string;
    category?: string;
    description?: string;
    email?: string;
    whatsappNumber?: string;
  };
}

export const registerPassword = (payload: RegisterPasswordPayload) =>
  apiClient.post('/auth/register', payload);

export const loginPassword = (username: string, password: string) =>
  apiClient.post('/auth/login', { username, password });

export const forgotPassword = (email: string) => apiClient.post('/auth/forgot-password', { email });

export const resetPassword = (token: string, password: string) =>
  apiClient.post('/auth/reset-password', { token, password });

export const getMe = () => apiClient.get('/auth/me');

export const logoutApi = () => apiClient.post('/auth/logout');

export const createShop = (data: Record<string, unknown>) => apiClient.post('/shops', data);
export const getMyShop = () => apiClient.get('/shops/my-shop');
export const updateShop = (shopId: string, data: Record<string, unknown>) =>
  apiClient.put(`/shops/${shopId}`, data);

export const getMyProducts = (page = 1, limit = 20) =>
  apiClient.get('/products/my-products', { params: { page, limit } });

export const createProductForm = (form: FormData) =>
  apiClient.post('/products', form, { headers: { 'Content-Type': 'multipart/form-data' } });
