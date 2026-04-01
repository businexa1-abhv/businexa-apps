import axios, { type AxiosError, type InternalAxiosRequestConfig } from 'axios';
import { getStoredToken, setStoredToken } from './storage';
import { getApiLoadingStore } from './apiLoadingStore';
import type { RegisterPasswordPayload } from '@/types/api';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

const SKIP_LOADER_HEADER = 'X-Skip-Global-Loader';

function shouldSkipGlobalLoader(config: InternalAxiosRequestConfig): boolean {
  const h = config.headers;
  if (!h) return false;
  const raw =
    typeof (h as { get?: (key: string) => unknown }).get === 'function'
      ? (h as { get: (key: string) => unknown }).get(SKIP_LOADER_HEADER)
      : (h as Record<string, unknown>)[SKIP_LOADER_HEADER] ??
        (h as Record<string, unknown>)['x-skip-global-loader'];
  return raw === 'true' || raw === true;
}

export const apiClient = axios.create({
  baseURL: API_URL,
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' },
});

apiClient.interceptors.request.use((config) => {
  const token = getStoredToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  if (!shouldSkipGlobalLoader(config)) {
    getApiLoadingStore().begin();
  }
  return config;
});

apiClient.interceptors.response.use(
  (res) => {
    if (!shouldSkipGlobalLoader(res.config)) {
      getApiLoadingStore().end();
    }
    return res;
  },
  (err: AxiosError) => {
    const cfg = err.config;
    if (cfg && !shouldSkipGlobalLoader(cfg)) {
      getApiLoadingStore().end();
    }
    if (err.response?.status === 401 && typeof window !== 'undefined') {
      setStoredToken(null);
      window.dispatchEvent(new CustomEvent('businexa:auth-expired'));
    }
    return Promise.reject(err);
  }
);

/** Pass as axios config to skip the global overlay for that call (e.g. silent refresh). */
export const skipGlobalLoaderConfig = {
  headers: { [SKIP_LOADER_HEADER]: 'true' },
} as const;

// —— Auth ——
export const sendOTP = (mobileNumber: string, checkUserExists?: boolean) =>
  apiClient.post('/auth/send-otp', { mobileNumber, checkUserExists });

export const verifyOTP = (mobileNumber: string, otp: string, role?: 'buyer' | 'seller') =>
  apiClient.post('/auth/verify-otp', { mobileNumber, otp, role });

/** Username + password → JWT. Sellers should include `shop` + optional `profile`. */
export const registerPassword = (payload: RegisterPasswordPayload) => apiClient.post('/auth/register', payload);

export const loginPassword = (username: string, password: string) =>
  apiClient.post('/auth/login', { username, password });

export const forgotPassword = (email: string) => apiClient.post('/auth/forgot-password', { email });

export const resetPassword = (token: string, password: string) =>
  apiClient.post('/auth/reset-password', { token, password });

export const getMe = () => apiClient.get('/auth/me');

export const logoutApi = () => apiClient.post('/auth/logout');

// —— Admin (Bearer; role admin) ——
export const adminListUsers = (params?: { page?: number; limit?: number; role?: string }) =>
  apiClient.get('/admin/users', { params });

export const adminGetUser = (userId: string) => apiClient.get(`/admin/users/${userId}`);

export type AdminCreateUserPayload = {
  username: string;
  password: string;
  role: 'buyer' | 'seller' | 'admin';
  fullName?: string;
  adminLevel?: 'super-admin' | 'moderator' | 'analyst' | 'support';
};

export const adminCreateUser = (payload: AdminCreateUserPayload) =>
  apiClient.post('/admin/users', payload);

export type AdminPatchUserPayload = {
  fullName?: string;
  isVerified?: boolean;
  profileImage?: string;
  email?: string;
};

export const adminPatchUser = (userId: string, payload: AdminPatchUserPayload) =>
  apiClient.patch(`/admin/users/${userId}`, payload);

export const adminDeleteUser = (userId: string) => apiClient.delete(`/admin/users/${userId}`);

export const adminPatchUserRole = (userId: string, role: string) =>
  apiClient.patch(`/admin/users/${userId}/role`, { role });

export const adminListShops = (params?: { page?: number; limit?: number }) =>
  apiClient.get('/admin/shops', { params });

export const adminStats = () => apiClient.get('/admin/stats');

/** Effective admin level + permission matrix (for UI). */
export const adminGetMe = () => apiClient.get('/admin/me');

export const adminAuditLogs = (params?: { page?: number; limit?: number }) =>
  apiClient.get('/admin/audit-logs', { params });

// —— Shops ——
export const createShop = (data: Record<string, unknown>) => apiClient.post('/shops', data);

export const getMyShop = () => apiClient.get('/shops/my-shop');

export const getPublicShop = (slug: string) => apiClient.get(`/shops/${encodeURIComponent(slug)}`);

export const updateShop = (shopId: string, data: Record<string, unknown>) =>
  apiClient.put(`/shops/${shopId}`, data);

export const getShopMetrics = (shopId: string) => apiClient.get(`/shops/${shopId}/metrics`);

export const generateShopQr = (shopId: string) => apiClient.post(`/shops/${shopId}/generate-qr`);

// —— Products ——
export const getMyProducts = (page = 1, limit = 20) =>
  apiClient.get('/products/my-products', { params: { page, limit } });

export const listProductsByShop = (shopId: string, page = 1, limit = 20) =>
  apiClient.get('/products', { params: { shopId, page, limit } });

export const getProduct = (productId: string) => apiClient.get(`/products/${productId}`);

export const searchProducts = (q: string, shopId?: string) =>
  apiClient.get('/products/search', { params: { q, shopId } });

export const createProductForm = (form: FormData) =>
  apiClient.post('/products', form, { headers: { 'Content-Type': 'multipart/form-data' } });

export const updateProductForm = (productId: string, form: FormData) =>
  apiClient.put(`/products/${productId}`, form, { headers: { 'Content-Type': 'multipart/form-data' } });

export const deleteProduct = (productId: string) => apiClient.delete(`/products/${productId}`);

// —— Subscriptions ——
export const getPlans = () => apiClient.get('/subscriptions/plans');

export const createOrder = (planId: string, shopId: string) =>
  apiClient.post('/subscriptions/create-order', { planId, shopId });

export const verifyPayment = (body: {
  orderId: string;
  paymentId: string;
  signature: string;
  shopId: string;
  planId: string;
}) => apiClient.post('/subscriptions/verify-payment', body);

export const listSubscriptions = () => apiClient.get('/subscriptions');

export const getShopSubscription = (shopId: string) => apiClient.get(`/subscriptions/shop/${shopId}`);

// —— Users ——
export const getProfile = () => apiClient.get('/users/profile');

export const updateProfile = (data: Record<string, unknown>) => apiClient.put('/users/profile', data);

export const updatePreferences = (data: Record<string, unknown>) => apiClient.put('/users/preferences', data);
