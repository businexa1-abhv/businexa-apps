# 🎯 CURSOR PROMPT GUIDE - FRONTEND DEVELOPMENT

## 📄 Files Created

1. **NODEJS_API_GENERATION_PROMPT.md** - Backend API specification
2. **FRONTEND_APP_GENERATION_PROMPT.md** - Frontend apps specification (NEW)

---

## 🚀 HOW TO USE IN CURSOR

### **Method 1: Generate Next.js Web App**

#### **Step 1: Create Next.js Project**
```bash
# In Cursor Terminal
npx create-next-app@latest businexa-web --typescript --tailwind --eslint
cd businexa-web
```

#### **Step 2: Open Cursor Chat**
Press `Cmd+L` (Mac) or `Ctrl+L` (Windows)

#### **Step 3: Paste This Prompt**
```
You are a Next.js/React expert. I need you to build a complete web application 
for Businexa QR Code Advertisement Platform.

Here's the complete specification:
[PASTE ENTIRE CONTENT FROM FRONTEND_APP_GENERATION_PROMPT.md]

FOCUS: Next.js Web App section

Start by:
1. Creating folder structure exactly as specified
2. Setting up TypeScript types
3. Creating UI components in components/ui/
4. Creating layout components
5. Setting up authentication context and hooks
6. Creating all pages in app/ directory
7. Implementing API integration layer
8. Adding form validation
9. Implementing error handling
10. Creating tests

Work step-by-step. Generate one module at a time and ask for confirmation before next step.
```

---

### **Method 2: Generate React Native Mobile App**

#### **Step 1: Create Expo Project**
```bash
# In Cursor Terminal
npx create-expo-app businexa-mobile --template
cd businexa-mobile
npm install expo-router
```

#### **Step 2: Open Cursor Chat**
Press `Cmd+L`

#### **Step 3: Paste This Prompt**
```
You are a React Native/Expo expert. I need you to build a complete mobile application 
for Businexa QR Code Advertisement Platform.

Here's the complete specification:
[PASTE ENTIRE CONTENT FROM FRONTEND_APP_GENERATION_PROMPT.md]

FOCUS: React Native Mobile App section

Start by:
1. Creating folder structure with Expo Router
2. Setting up navigation (auth stack + app stack)
3. Creating reusable UI components (matching web)
4. Creating screens in app/ directory
5. Setting up authentication context
6. Implementing API integration layer
7. Adding AsyncStorage for token persistence
8. Creating custom hooks
9. Implementing error handling
10. Adding bottom tab navigation

Work iteratively. After each major component, ask if I want to continue or make changes.
```

---

### **Method 3: Generate Both Apps (Automatic - Recommended)**

#### **In Cursor Agent Mode**

Press `Ctrl+I` to open **Agents**

Then paste:
```
Generate both Next.js web app and React Native mobile app for Businexa platform.

Reference specification: @FRONTEND_APP_GENERATION_PROMPT.md

Create:
1. Next.js project structure with all components, pages, and hooks
2. React Native project structure with all screens and components
3. Shared hooks and utilities
4. API integration layer for both
5. Authentication system
6. Form validation
7. Error handling
8. Tests

Generate in this order:
- Next.js structure & setup
- React Native structure & setup
- Shared hooks & utilities
- UI components (both)
- Authentication context & pages
- Product management pages & screens
- Shop & subscription pages & screens
- Tests & documentation

After each major section, verify the code before moving to next section.
```

**Cursor will autonomously generate the entire codebase!**

---

## 💡 SPECIFIC PROMPT EXAMPLES

### **Generate Single Component**

**For Web Component:**
```
Create a NextJS component at components/products/ProductCard.tsx that displays:
- Product image
- Product name and price
- Category badge
- Edit/delete buttons
- Click handler for navigation

Use TypeScript with proper interfaces from types/api.ts
Include responsive Tailwind styling
Add proper error boundaries
```

**For Mobile Component:**
```
Create a React Native component at components/products/ProductCard.tsx that displays:
- Product image
- Product name and price
- Category badge
- Edit/delete buttons
- Touch handler for navigation

Use React Native StyleSheet
Make it responsive for all screen sizes
Add proper TypeScript types
Include loading and error states
```

---

### **Generate Complete Page/Screen**

**Web Page Example:**
```
Using @FRONTEND_APP_GENERATION_PROMPT.md section "Dashboard", 
create app/(app)/dashboard/page.tsx with:

1. Shop summary card
2. Analytics overview (QR scans, views, total products)
3. Recent products list (paginated)
4. Quick action buttons
5. Subscription status banner (conditional)
6. Responsive grid layout

Use components from components/ folder
Implement using useShop() and useProducts() hooks
Add loading skeleton states
Include error handling
Add SEO meta tags
```

**Mobile Screen Example:**
```
Using @FRONTEND_APP_GENERATION_PROMPT.md section "Dashboard",
create app/(app)/dashboard.tsx with:

1. Shop summary card
2. Analytics overview
3. Recent products list (scroll)
4. Quick action buttons
5. Subscription status banner
6. Pull-to-refresh functionality

Use React Native components
Implement using useShop() and useProducts() hooks
Add loading states
Single column responsive layout
```

---

### **Generate API Integration**

```
Create lib/api.ts with:
1. Axios instance configured for http://localhost:5000/api
2. Request interceptor to add Firebase token from localStorage
3. Response interceptor to handle 401 errors (redirect to login)
4. All API methods:
   - Auth: sendOTP, verifyOTP, logout, refreshToken
   - Shop: createShop, getMyShop, getPublicShop, updateShop
   - Products: createProduct, getProducts, deleteProduct, updateProduct
   - Subscriptions: getPlans, createOrder, verifyPayment

Use TypeScript with proper types
Include error handling
Add request timeout
```

---

### **Generate Custom Hooks**

```
Create hooks/useAuth.ts with:
- currentUser state (firebase user)
- isAuthenticated boolean
- isLoading state
- error state
- Functions: sendOTP(), verifyOTP(), logout()
- Auto-login on component mount
- Token persistence to localStorage/AsyncStorage

Use TypeScript with proper types
Handle error states gracefully
Include loading states
```

---

### **Generate Form with Validation**

```
Create components/auth/LoginForm.tsx with:
- Mobile number input with country code selector
- Form validation using Joi schema
- "Send OTP" button
- Rate limiting message (max 3 per 30 mins)
- Loading state
- Error messages display
- Responsive design

Use React Hook Form or similar
Integrate with useAuth() hook
Add accessibility attributes
```

---

## 📋 COMMON CURSOR COMMANDS

| Shortcut | Action |
|----------|--------|
| `Cmd+L` | Open Chat (reference files with @) |
| `Ctrl+K` | Command Palette |
| `Ctrl+I` | Open Agent Mode (automatic) |
| `Cmd+Shift+P` | Create new file |
| `@filename` | Reference file in chat |
| `#FunctionName` | Reference function/component |
| `#ClassName` | Reference class |

---

## 🔄 WORKFLOW STEPS

### **Step-by-Step Approach (Recommended for First Time)**

```
1. Create base structure (folders, tsconfig, env files)
2. Create TypeScript types (types/index.ts, types/api.ts)
3. Create UI components (components/ui/)
4. Create layout components (components/layout/)
5. Create authentication context
6. Create custom hooks
7. Create API integration layer
8. Create authentication pages
9. Create product management pages
10. Create subscription pages
11. Create settings pages
12. Add error handling throughout
13. Add form validation
14. Add tests
15. Deploy
```

### **Ask for Confirmation**
After each step, ask Cursor:
```
"Perfect! Now should I proceed to step 2: TypeScript types?"

OR

"Let me make a change here... [specify change]. After that, move to next step."
```

---

## 🧪 TESTING THE GENERATED CODE

### **Run Web App**
```bash
cd businexa-web
npm run dev
# Open http://localhost:3000
```

### **Run Mobile App**
```bash
cd businexa-mobile
npm run ios
# or
npm run android
```

### **Test Flow**
1. ✅ Homepage loads
2. ✅ Click "Get Started" → Goes to /login
3. ✅ Enter mobile number → Click "Send OTP"
4. ✅ Enter OTP → Click "Verify"
5. ✅ Redirected to Dashboard
6. ✅ Click "+ Add Product" → Product form loads
7. ✅ Fill form & upload image → Submit
8. ✅ Product appears in list
9. ✅ Click product → See details
10. ✅ Click edit/delete → Works correctly

---

## 🔐 ENVIRONMENT SETUP

### **Web App .env.local**
```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api
NEXT_PUBLIC_FIREBASE_API_KEY=xxxxx
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=xxxxx.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=xxxxx
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=xxxxx.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=xxxxx
NEXT_PUBLIC_FIREBASE_APP_ID=xxxxx
```

### **Mobile App .env.local**
```env
EXPO_PUBLIC_API_URL=http://localhost:5000/api
EXPO_PUBLIC_FIREBASE_API_KEY=xxxxx
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=xxxxx.firebaseapp.com
EXPO_PUBLIC_FIREBASE_PROJECT_ID=xxxxx
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=xxxxx.appspot.com
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=xxxxx
EXPO_PUBLIC_FIREBASE_APP_ID=xxxxx
```

---

## 📱 TESTING ON REAL DEVICES

### **iOS**
```bash
npm run ios
# Opens iOS Simulator or connects to real iPhone via Xcode
```

### **Android**
```bash
npm run android
# Installs on Android Emulator or connected device
```

### **Web (from Mobile App)**
```bash
npm run web
# Opens React Native Web on http://localhost:19006
```

---

## 🚀 DEPLOYMENT CHECKLIST

### **Before Deployment**
- [ ] All pages tested locally
- [ ] API integration working
- [ ] Authentication flow complete
- [ ] Form validation working
- [ ] Error handling implemented
- [ ] Loading states showing
- [ ] Images optimized
- [ ] Responsive design verified
- [ ] Performance optimized
- [ ] Environment variables configured for production

### **Deploy Web**
```bash
cd businexa-web
npm run build
vercel --prod
```

### **Deploy Mobile**
```bash
cd businexa-mobile
eas build --platform ios --auto-submit
eas build --platform android --auto-submit
```

---

## 💬 USEFUL CURSOR CHAT PROMPTS

### **For Code Review**
```
Review this component for:
1. Performance issues
2. TypeScript type safety
3. Accessibility (a11y)
4. Responsive design
5. Error handling
6. Security concerns
```

### **For Bug Fixes**
```
This feature isn't working correctly. Here's what happens:
[Describe the issue]

Can you debug and fix it? Show me the changes.
```

### **For Optimization**
```
Optimize this code for:
1. Bundle size
2. Runtime performance
3. Memory usage
4. Network requests

Show me before/after comparison.
```

### **For Testing**
```
Create unit tests for this component using Jest and React Testing Library.
Include test cases for:
- Rendering
- User interactions
- Error states
- Loading states
```

---

## 🎓 LEARNING TIPS

1. **Read Generated Code** - Understand why Cursor made specific choices
2. **Ask Questions** - "Why did you use Zustand instead of Redux?"
3. **Request Alternatives** - "Show me this using Context API instead"
4. **Iterate Slowly** - Build one feature at a time
5. **Test Everything** - Before moving to next feature

---

## 📞 TROUBLESHOOTING

### **Cursor Generated Code Has Errors**
```
The generated code has TypeScript errors in [file]. 
Please fix these errors and explain what was wrong.
```

### **Feature Not Working**
```
Feature [feature name] isn't working. 
It should [expected behavior] but instead [actual behavior].
Can you debug this?
```

### **Need Different Implementation**
```
I want to implement [feature] differently.
Instead of [current approach], use [desired approach].
Regenerate the component/page with this approach.
```

---

## ✅ FINAL CHECKLIST

Before considering the frontend complete:

- [ ] Web app fully functional
- [ ] Mobile app fully functional
- [ ] All pages/screens working
- [ ] Authentication complete
- [ ] API integration tested
- [ ] Forms validate correctly
- [ ] Error handling works
- [ ] Loading states display
- [ ] Responsive design verified
- [ ] Performance optimized
- [ ] Tests written & passing
- [ ] SEO optimized (web)
- [ ] Accessibility verified
- [ ] Deployed to staging
- [ ] Ready for production

---

**Ready to start generating? Pick a method above and begin!** 🚀

Need help with anything specific? Ask me!
