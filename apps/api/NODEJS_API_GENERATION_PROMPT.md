# 🚀 BUSINEXA NODE.JS API GENERATION PROMPT

## PROJECT OVERVIEW

**Businexa** is a QR Code Advertisement Platform connecting shop owners and customers with secure authentication, subscription management, and e-commerce capabilities.

**Tech Stack:**
- **Frontend:** React + Next.js (SEO optimized)
- **Mobile:** React Native
- **Backend:** Node.js + Express (THIS DOCUMENT)
- **Database:** MongoDB
- **Authentication:** Firebase Authentication (OTP login)
- **Payments:** Razorpay Integration

---

## 🗄️ DATABASE SCHEMA (MongoDB)

### 1. **Users Collection** (`users`)
```javascript
{
  _id: ObjectId,
  firebaseUid: String,        // Firebase UID
  mobileNumber: String,       // Unique, indexed
  email: String,              // Optional
  role: String,               // "buyer", "seller"
  fullName: String,
  profileImage: String,       // URL
  isVerified: Boolean,        // OTP verified
  preferences: {
    language: String,
    theme: String,            // "light", "dark"
    notifications: Boolean
  },
  createdAt: Date,
  updatedAt: Date
}
```

### 2. **OTP Verifications Collection** (`otp_verifications`)
```javascript
{
  _id: ObjectId,
  mobileNumber: String,       // Indexed
  otpHash: String,            // PBKDF2 hashed
  otpSalt: String,            // Crypto salt
  expiresAt: Date,            // 10 minutes
  verified: Boolean,
  attempts: Number,           // Rate limiting
  createdAt: Date
}
```

### 3. **Shops Collection** (`shops`)
```javascript
{
  _id: ObjectId,
  ownerId: ObjectId,          // Reference to User (seller)
  name: String,               // Shop name
  slug: String,               // Unique URL slug
  logoUrl: String,            // Shop logo image URL
  description: String,
  address: String,
  category: String,           // e.g., "Electronics", "Fashion"
  whatsappNumber: String,     // 10-digit number
  email: String,
  subscriptionPlan: String,   // "monthly", "quarterly", "half_yearly", "yearly"
  subscriptionExpiresAt: Date,
  isActive: Boolean,
  qrCodeUrl: String,          // Generated QR code URL
  metrics: {
    totalProducts: Number,
    qrScans: Number,
    views: Number
  },
  createdAt: Date,
  updatedAt: Date
}
```

### 4. **Products Collection** (`products`)
```javascript
{
  _id: ObjectId,
  shopId: ObjectId,           // Reference to Shop
  ownerId: ObjectId,          // Reference to User
  name: String,
  description: String,
  price: Decimal,
  category: String,
  imageUrl: String,           // Product image URL
  qrCodeUrl: String,          // QR for individual product
  isVisible: Boolean,
  metrics: {
    views: Number,
    clicks: Number
  },
  createdAt: Date,
  updatedAt: Date
}
```

### 5. **Subscriptions Collection** (`subscriptions`)
```javascript
{
  _id: ObjectId,
  userId: ObjectId,           // Reference to User
  shopId: ObjectId,           // Reference to Shop
  planType: String,           // "monthly", "quarterly", "half_yearly", "yearly"
  price: Decimal,
  status: String,             // "active", "cancelled", "expired"
  razorpayPaymentId: String,
  razorpayOrderId: String,
  razorpaySignature: String,  // For verification
  startsAt: Date,
  expiresAt: Date,
  createdAt: Date,
  updatedAt: Date
}
```

### 6. **Audit Logs Collection** (`audit_logs`)
```javascript
{
  _id: ObjectId,
  userId: ObjectId,           // Reference to User
  action: String,             // "create", "update", "delete"
  resourceType: String,       // "shop", "product", "subscription"
  resourceId: ObjectId,
  details: Object,            // Action-specific data
  ipAddress: String,
  createdAt: Date
}
```

### 7. **Notifications Collection** (`notifications`)
```javascript
{
  _id: ObjectId,
  userId: ObjectId,           // Reference to User
  type: String,               // "order", "subscription", "system"
  title: String,
  message: String,
  isRead: Boolean,
  data: Object,               // Link to related resource
  createdAt: Date
}
```

---

## 📊 API ENDPOINTS REQUIRED

### **A. AUTHENTICATION ENDPOINTS** (`/api/auth`)

#### 1. Send OTP
```
POST /api/auth/send-otp
Body: { mobileNumber: String, checkUserExists?: Boolean }
Response: { success: Boolean, message: String, expiresIn: Number }
Security: Rate limit 3 requests per 30 minutes per IP
```

#### 2. Verify OTP & Login
```
POST /api/auth/verify-otp
Body: { mobileNumber: String, otp: String, role?: String }
Response: { 
  success: Boolean,
  firebaseToken: String,
  user: { userId, mobileNumber, role, isNewUser },
  sessionToken: String
}
Security: Verify OTP hash with salt, invalidate after verification
```

#### 3. Get Current User
```
GET /api/auth/me
Headers: { Authorization: "Bearer {firebaseToken}" }
Response: { user: User }
```

#### 4. Sign Out
```
POST /api/auth/logout
Headers: { Authorization: "Bearer {firebaseToken}" }
Response: { success: Boolean }
```

#### 5. Refresh Token
```
POST /api/auth/refresh
Body: { refreshToken: String }
Response: { firebaseToken: String, expiresIn: Number }
```

---

### **B. SHOP ENDPOINTS** (`/api/shops`)

#### 1. Create Shop
```
POST /api/shops
Headers: { Authorization: "Bearer {firebaseToken}" }
Body: {
  name: String,
  address: String,
  category: String,
  whatsappNumber: String,
  email: String
}
Response: { shop: Shop }
```

#### 2. Get User's Shop
```
GET /api/shops/my-shop
Headers: { Authorization: "Bearer {firebaseToken}" }
Response: { shop: Shop }
```

#### 3. Get Shop by ID/Slug (Public)
```
GET /api/shops/:shopIdOrSlug
Response: { shop: Shop }
Security: Public access, cache for 1 hour
```

#### 4. Update Shop
```
PUT /api/shops/:shopId
Headers: { Authorization: "Bearer {firebaseToken}" }
Body: { name?, description?, address?, whatsappNumber?, logoUrl? }
Response: { shop: Shop }
Authorization: Owner only
```

#### 5. Delete Shop
```
DELETE /api/shops/:shopId
Headers: { Authorization: "Bearer {firebaseToken}" }
Response: { success: Boolean }
Authorization: Owner only
```

#### 6. Generate QR Code
```
POST /api/shops/:shopId/generate-qr
Headers: { Authorization: "Bearer {firebaseToken}" }
Response: { qrCodeUrl: String }
Business Logic: Only for active subscriptions
```

#### 7. Get Shop Metrics
```
GET /api/shops/:shopId/metrics
Headers: { Authorization: "Bearer {firebaseToken}" }
Response: { metrics: { qrScans, views, totalProducts } }
```

---

### **C. PRODUCT ENDPOINTS** (`/api/products`)

#### 1. Create Product
```
POST /api/products
Headers: { Authorization: "Bearer {firebaseToken}", Content-Type: "multipart/form-data" }
Body: {
  name: String,
  description: String,
  price: Number,
  category: String,
  image: File
}
Response: { product: Product }
Business Logic: Upload image to cloud storage (AWS S3/Firebase Storage)
```

#### 2. Get Products by Shop
```
GET /api/products?shopId={shopId}&page={page}&limit={20}
Response: { products: Product[], total: Number, page: Number }
Security: Public access, paginated
```

#### 3. Get User's Products
```
GET /api/products/my-products?page={page}&limit={20}
Headers: { Authorization: "Bearer {firebaseToken}" }
Response: { products: Product[], total: Number }
```

#### 4. Get Product by ID
```
GET /api/products/:productId
Response: { product: Product }
Security: Public access
```

#### 5. Update Product
```
PUT /api/products/:productId
Headers: { Authorization: "Bearer {firebaseToken}" }
Body: { name?, description?, price?, category?, image? }
Response: { product: Product }
Authorization: Owner only
```

#### 6. Delete Product
```
DELETE /api/products/:productId
Headers: { Authorization: "Bearer {firebaseToken}" }
Response: { success: Boolean }
Authorization: Owner only
```

#### 7. Get Products by Category
```
GET /api/products/category/:category?shopId={shopId}
Response: { products: Product[] }
Security: Public access
```

#### 8. Search Products
```
GET /api/products/search?q={query}&shopId={shopId}
Response: { products: Product[] }
Security: Public access
```

---

### **D. SUBSCRIPTION ENDPOINTS** (`/api/subscriptions`)

#### 1. Get Available Plans
```
GET /api/subscriptions/plans
Response: {
  plans: [
    { id: "monthly", name: "Monthly", price: 99, duration: 30 },
    { id: "quarterly", name: "Quarterly", price: 279, duration: 90 },
    { id: "half_yearly", name: "Half-Yearly", price: 499, duration: 180 },
    { id: "yearly", name: "Yearly", price: 899, duration: 365 }
  ]
}
```

#### 2. Create Razorpay Order
```
POST /api/subscriptions/create-order
Headers: { Authorization: "Bearer {firebaseToken}" }
Body: { planId: String, shopId: ObjectId }
Response: { 
  orderId: String,
  amount: Number,
  currency: String,
  razorpayKeyId: String
}
Security: Verify subscription doesn't already exist
```

#### 3. Verify Payment
```
POST /api/subscriptions/verify-payment
Headers: { Authorization: "Bearer {firebaseToken}" }
Body: {
  orderId: String,
  paymentId: String,
  signature: String,
  shopId: ObjectId,
  planId: String
}
Response: { subscription: Subscription }
Business Logic: Verify Razorpay signature server-side, activate subscription
```

#### 4. Get User's Subscriptions
```
GET /api/subscriptions
Headers: { Authorization: "Bearer {firebaseToken}" }
Response: { subscriptions: Subscription[] }
```

#### 5. Get Shop's Active Subscription
```
GET /api/subscriptions/shop/:shopId
Headers: { Authorization: "Bearer {firebaseToken}" }
Response: { subscription: Subscription }
Business Logic: Return null if expired
```

#### 6. Cancel Subscription
```
POST /api/subscriptions/:subscriptionId/cancel
Headers: { Authorization: "Bearer {firebaseToken}" }
Response: { success: Boolean }
Authorization: Owner only
```

#### 7. Razorpay Webhook
```
POST /api/subscriptions/webhook/razorpay
Headers: { Content-Type: "application/json" }
Body: Razorpay webhook payload
Response: { status: "ok" }
Security: Verify webhook signature with RAZORPAY_SECRET
Business Logic: Create audit log, send notification
```

---

### **E. USER ENDPOINTS** (`/api/users`)

#### 1. Get User Profile
```
GET /api/users/profile
Headers: { Authorization: "Bearer {firebaseToken}" }
Response: { user: User }
```

#### 2. Update User Profile
```
PUT /api/users/profile
Headers: { Authorization: "Bearer {firebaseToken}" }
Body: { fullName?, email?, profileImage? }
Response: { user: User }
```

#### 3. Update User Preferences
```
PUT /api/users/preferences
Headers: { Authorization: "Bearer {firebaseToken}" }
Body: { language?, theme?, notifications? }
Response: { preferences: Object }
```

#### 4. Get User Notifications
```
GET /api/users/notifications?page={page}&limit={10}
Headers: { Authorization: "Bearer {firebaseToken}" }
Response: { notifications: Notification[], total: Number }
```

#### 5. Mark Notification as Read
```
PUT /api/users/notifications/:notificationId/read
Headers: { Authorization: "Bearer {firebaseToken}" }
Response: { success: Boolean }
```

#### 6. Delete User Account
```
DELETE /api/users/account
Headers: { Authorization: "Bearer {firebaseToken}" }
Response: { success: Boolean }
Business Logic: Delete all user data, shops, products, subscriptions
```

---

### **F. QR CODE & TRACKING ENDPOINTS** (`/api/qr`)

#### 1. Track QR Code Scan
```
POST /api/qr/track/:shopId
Body: { userAgent: String, ipAddress: String, referer?: String }
Response: { success: Boolean }
Business Logic: Increment shop metrics, create audit log (no auth required)
```

#### 2. Get QR Code Data
```
GET /api/qr/:shopId
Response: { 
  shopId: String,
  shopName: String,
  logoUrl: String,
  publicUrl: String
}
Security: Public access
```

#### 3. Track Product Click
```
POST /api/qr/product/:productId/track
Body: { userAgent: String, ipAddress: String }
Response: { success: Boolean }
```

---

### **G. ANALYTICS ENDPOINTS** (`/api/analytics`)

#### 1. Dashboard Analytics
```
GET /api/analytics/dashboard
Headers: { Authorization: "Bearer {firebaseToken}" }
Query: { from?: Date, to?: Date }
Response: {
  totalShops: Number,
  totalProducts: Number,
  activeSubscriptions: Number,
  revenue: Number,
  trends: { qrScans: [], views: [] }
}
```

#### 2. Shop Analytics
```
GET /api/analytics/shops/:shopId
Headers: { Authorization: "Bearer {firebaseToken}" }
Response: {
  metrics: { scans, views, conversions },
  topProducts: Product[],
  dailyData: []
}
Authorization: Owner only
```

---

## 🔐 AUTHENTICATION & SECURITY

### **Authentication Flow:**
1. Frontend calls `/api/auth/send-otp` → Server generates OTP, hashes with salt using PBKDF2
2. Frontend calls `/api/auth/verify-otp` → Server verifies OTP hash, creates Firebase custom token
3. Firebase custom token exchanged with Firebase for ID token
4. All subsequent requests use ID token in `Authorization: Bearer {token}` header

### **Security Middleware:**
- ✅ Rate limiting: OTP (3 per 30 mins), Login (5 per 15 mins)
- ✅ JWT verification: Verify token signature with Firebase public keys
- ✅ CORS: Allow only frontend domains
- ✅ Input validation: Sanitize all inputs with Joi/Zod
- ✅ SQL injection prevention: Use MongoDB parameterized queries
- ✅ HTTPS: Enforce in production
- ✅ Helmet: Security headers
- ✅ CSRF protection: Token validation for state-changing operations

### **Role-Based Access Control (RBAC):**
- **buyer:** Can view shops, products, purchase subscriptions
- **seller:** Can create/manage shop, products, subscriptions

---

## 📦 PROJECT STRUCTURE

```
businexa-api/
├── src/
│   ├── config/
│   │   ├── mongodb.js           # MongoDB connection
│   │   ├── firebase.js          # Firebase Admin SDK
│   │   └── razorpay.js          # Razorpay configuration
│   │
│   ├── controllers/
│   │   ├── authController.js
│   │   ├── shopController.js
│   │   ├── productController.js
│   │   ├── subscriptionController.js
│   │   ├── userController.js
│   │   ├── qrController.js
│   │   └── analyticsController.js
│   │
│   ├── models/
│   │   ├── User.js
│   │   ├── OTPVerification.js
│   │   ├── Shop.js
│   │   ├── Product.js
│   │   ├── Subscription.js
│   │   ├── AuditLog.js
│   │   └── Notification.js
│   │
│   ├── routes/
│   │   ├── auth.js
│   │   ├── shops.js
│   │   ├── products.js
│   │   ├── subscriptions.js
│   │   ├── users.js
│   │   ├── qr.js
│   │   └── analytics.js
│   │
│   ├── middleware/
│   │   ├── authMiddleware.js       # JWT verification
│   │   ├── errorHandler.js         # Global error handler
│   │   ├── rateLimiter.js          # Rate limiting
│   │   └── validators.js           # Input validation
│   │
│   ├── services/
│   │   ├── authService.js          # Auth business logic
│   │   ├── shopService.js          # Shop operations
│   │   ├── productService.js       # Product operations
│   │   ├── subscriptionService.js  # Subscription logic
│   │   ├── otpService.js           # OTP generation/verification
│   │   ├── qrService.js            # QR code generation
│   │   └── emailService.js         # Email notifications
│   │
│   ├── utils/
│   │   ├── cryptoUtils.js          # Hashing, encryption
│   │   ├── validators.js           # Input validators
│   │   ├── logger.js               # Logging
│   │   └── cloudStorage.js         # AWS S3/Firebase Storage
│   │
│   └── app.js                       # Express app setup
│
├── .env.example
├── .env.local
├── package.json
├── server.js                        # Entry point
└── README.md
```

---

## 🚀 TECH STACK & DEPENDENCIES

```json
{
  "dependencies": {
    "express": "^4.18.2",
    "mongoose": "^8.0.0",
    "firebase-admin": "^12.0.0",
    "razorpay": "^2.9.1",
    "dotenv": "^16.3.1",
    "cors": "^2.8.5",
    "helmet": "^7.1.0",
    "express-rate-limit": "^7.1.5",
    "joi": "^17.11.0",
    "jsonwebtoken": "^9.1.2",
    "bcryptjs": "^2.4.3",
    "crypto-js": "^4.2.0",
    "axios": "^1.6.2",
    "qrcode": "^1.5.3",
    "aws-sdk": "^2.1500.0",
    "cloudinary": "^1.33.0",
    "nodemailer": "^6.9.7",
    "winston": "^3.11.0"
  },
  "devDependencies": {
    "nodemon": "^3.0.2",
    "jest": "^29.7.0",
    "supertest": "^6.3.3",
    "prettier": "^3.1.0"
  }
}
```

---

## 🔧 ENVIRONMENT VARIABLES

```env
# Server
NODE_ENV=development
PORT=5000
SERVER_URL=http://localhost:5000

# Database
MONGODB_URI=mongodb+srv://user:password@cluster.mongodb.net/businexa

# Firebase Admin SDK
FIREBASE_PROJECT_ID=businexa-project
FIREBASE_PRIVATE_KEY=-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----
FIREBASE_CLIENT_EMAIL=firebase-adminsdk@businexa-project.iam.gserviceaccount.com

# Razorpay
RAZORPAY_KEY_ID=rzp_live_xxxxx
RAZORPAY_SECRET=rzp_live_secret_xxxxx

# JWT
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRY=7d

# OTP
OTP_EXPIRY_MINUTES=10
OTP_LENGTH=6

# CORS
CORS_ORIGIN=http://localhost:3000,https://businexa.com

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Email
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=noreply@businexa.com
SMTP_PASSWORD=app-password

# Cloud Storage
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=xxxx
AWS_SECRET_ACCESS_KEY=xxxx
AWS_S3_BUCKET=businexa-products

# Cloudinary (Alternative)
CLOUDINARY_NAME=xxxxx
CLOUDINARY_API_KEY=xxxxx
CLOUDINARY_API_SECRET=xxxxx

# Frontend URL
FRONTEND_URL=http://localhost:3000
FRONTEND_MOBILE_URL=exp://localhost:19000

# Analytics
ENABLE_ANALYTICS=true
```

---

## 🧪 API TESTING EXAMPLES

### Test OTP Flow
```bash
# 1. Send OTP
curl -X POST http://localhost:5000/api/auth/send-otp \
  -H "Content-Type: application/json" \
  -d '{"mobileNumber": "9999999999"}'

# Response: { "success": true, "expiresIn": 600 }

# 2. Verify OTP (OTP is returned in dev mode)
curl -X POST http://localhost:5000/api/auth/verify-otp \
  -H "Content-Type: application/json" \
  -d '{"mobileNumber": "9999999999", "otp": "123456", "role": "seller"}'

# Response: { "firebaseToken": "...", "user": {...}, "sessionToken": "..." }
```

### Test Shop Creation
```bash
curl -X POST http://localhost:5000/api/shops \
  -H "Authorization: Bearer {firebaseToken}" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "My Shop",
    "address": "123 Main St",
    "category": "Electronics",
    "whatsappNumber": "9999999999",
    "email": "shop@example.com"
  }'
```

---

## 🎯 KEY BUSINESS LOGIC

1. **OTP Security:** Generate random 6-digit OTP, hash with PBKDF2+salt, store hash in DB, verify using constant-time comparison
2. **Subscription Validation:** Check if subscription is active before allowing QR access
3. **QR Code Generation:** Create unique QR for each shop linking to `https://businexa.com/shop/{slug}`
4. **Payment Verification:** Verify Razorpay signature using HMAC-SHA256
5. **Audit Logging:** Log all user actions for compliance
6. **Metrics Tracking:** Increment shop/product metrics on QR scan/click

---

## 📝 REQUIRED FEATURES

✅ OTP-based authentication with Firebase  
✅ Shop CRUD operations with slugs  
✅ Product management with image uploads  
✅ Subscription plans with Razorpay payments  
✅ QR code generation & tracking  
✅ User profiles & preferences  
✅ Email notifications  
✅ Admin analytics dashboard  
✅ Rate limiting & security headers  
✅ Comprehensive error handling  
✅ Audit logging  
✅ API documentation (Swagger/OpenAPI)  

---

## 📚 DELIVERABLES

1. ✅ Complete Express.js API server
2. ✅ MongoDB models & schemas
3. ✅ All endpoints implemented
4. ✅ Authentication middleware
5. ✅ Error handling & validation
6. ✅ Razorpay integration
7. ✅ Email service integration
8. ✅ File upload to cloud storage
9. ✅ Swagger API documentation
10. ✅ Unit & integration tests
11. ✅ Docker configuration
12. ✅ Production deployment guide

---

## 🔗 INTEGRATION WITH FRONTEND

**Next.js Frontend calls:**
```javascript
// Example: React hook for API
const apiClient = axios.create({
  baseURL: 'http://localhost:5000/api',
  headers: {
    'Authorization': `Bearer ${firebaseToken}`
  }
});

// Send OTP
await apiClient.post('/auth/send-otp', { mobileNumber });

// Create Product
const formData = new FormData();
formData.append('name', 'Product Name');
formData.append('price', 100);
formData.append('image', imageFile);
await apiClient.post('/products', formData);
```

---

## ⚡ PERFORMANCE REQUIREMENTS

- Response time: < 200ms for all endpoints
- Database indexes: On frequently queried fields
- Caching: Redis for shop data (1-hour TTL)
- Pagination: All list endpoints paginated (default 20 items)
- Image optimization: Compress before storage

---

**Ready to generate the API! This prompt contains all necessary details about:** 
✅ Database schemas  
✅ API endpoints  
✅ Authentication flow  
✅ Security requirements  
✅ Project structure  
✅ Business logic  
✅ Tech stack  

Use this prompt with any AI code generator or share with your development team.
