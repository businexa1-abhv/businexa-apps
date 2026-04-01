export type UserRole = 'buyer' | 'seller' | 'admin';

export interface AuthUser {
  userId: string;
  username?: string;
  mobileNumber?: string;
  fullName?: string;
  email?: string;
  role: UserRole;
  isNewUser?: boolean;
}

export interface RegisterPasswordPayload {
  /** Login id — must be a valid email (stored as username + email). */
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

export interface Shop {
  _id: string;
  ownerId: string;
  name: string;
  slug: string;
  logoUrl?: string;
  description?: string;
  address?: string;
  category?: string;
  whatsappNumber?: string;
  email?: string;
  qrCodeUrl?: string;
  isActive?: boolean;
  metrics?: {
    totalProducts?: number;
    qrScans?: number;
    views?: number;
  };
  publicUrl?: string;
  publicPath?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Product {
  _id: string;
  shopId: string;
  ownerId: string;
  name: string;
  description?: string;
  price?: unknown;
  priceNumber?: number;
  category?: string;
  imageUrl?: string;
  isVisible?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface SubscriptionPlan {
  id: 'monthly' | 'quarterly' | 'half_yearly' | 'yearly';
  name: string;
  price: number;
  duration: number;
}

export interface SubscriptionRecord {
  _id: string;
  shopId: string;
  planId: string;
  status: string;
  expiresAt?: string;
  createdAt?: string;
}

export interface ApiErrorPayload {
  success?: boolean;
  message?: string;
  code?: string;
}
