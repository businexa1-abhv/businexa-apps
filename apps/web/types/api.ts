export type UserRole = 'buyer' | 'seller' | 'admin';

/** Buyer Plus: 24h trial after signup, then paid membership for catalog + QR. */
export interface BuyerAccess {
  canAccessPremium: boolean;
  inTrial: boolean;
  trialEndsAt: string | null;
  hasActiveSubscription: boolean;
  subscriptionExpiresAt?: string | null;
  role?: string | null;
}

export interface AuthUser {
  userId: string;
  /** Firebase Auth uid — sellers need this for Firestore `products` and Storage. */
  firebaseUid?: string;
  username?: string;
  mobileNumber?: string;
  fullName?: string;
  email?: string;
  role: UserRole;
  isNewUser?: boolean;
  /** Seller: from Firestore `users/{uid}.businessType` (via GET /auth/me). */
  businessType?: string;
  /** Present when `role === 'buyer'` (from GET /auth/me). */
  buyerAccess?: BuyerAccess;
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
    /** Preferred; `category` accepted for backward compatibility. */
    businessType?: string;
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
  /** Canonical business vertical (one per shop). */
  businessType?: string;
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
  /** Shop vertical for buyer filters (matches shop.businessType). */
  businessType?: string;
  imageUrl?: string;
  isVisible?: boolean;
  /** Firestore products use stock flag (also mapped from `isVisible` in API). */
  inStock?: boolean;
  /** Firestore `sellerId` (Firebase uid), distinct from Mongo `ownerId` when both exist. */
  sellerId?: string;
  createdAt?: string;
  updatedAt?: string;
}

/** Normalized Firestore product document (`products/{id}`). */
export type FirestoreProduct = Product & {
  id: string;
  inStock: boolean;
};

export interface SubscriptionPlan {
  id: 'monthly' | 'quarterly' | 'half_yearly' | 'yearly';
  name: string;
  price: number;
  duration: number;
}

/** Buyer membership (Razorpay) — monthly, half-yearly, yearly. */
export interface BuyerPlan {
  id: 'buyer_monthly' | 'buyer_half_yearly' | 'buyer_yearly';
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
