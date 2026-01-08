# Firebase Integration - Quick Start Guide

## 🚀 Get Started in 5 Minutes

### 1. Install Firebase Package

```bash
bun add firebase
# or
npm install firebase
# or
yarn add firebase
```

### 2. Setup Firebase Project

1. Go to https://console.firebase.google.com/
2. Create new project (or use existing)
3. Enable Authentication:
   - Go to Authentication > Sign-in method
   - Enable "Email/Password"
   - Enable "Google"
4. Create Firestore Database:
   - Go to Firestore Database
   - Create database (Production mode)
5. Get your config:
   - Project Settings > General
   - Scroll to "Your apps" > Web app
   - Copy config values

### 3. Configure Environment Variables

Create `.env` file in project root:

```env
VITE_FIREBASE_API_KEY=AIzaSy...
VITE_FIREBASE_AUTH_DOMAIN=myproject.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=myproject
VITE_FIREBASE_STORAGE_BUCKET=myproject.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abc123
VITE_FIREBASE_MEASUREMENT_ID=G-ABC123
```

### 4. Deploy Security Rules

Copy contents from `firebase-security-rules.txt` and paste into:
- Firebase Console > Firestore Database > Rules tab
- Click "Publish"

### 5. Update Your App

Replace Supabase imports with Firebase:

**Before (Supabase):**
```typescript
import { useAuth } from "@/hooks/useAuth";
```

**After (Firebase):**
```typescript
import { useFirebaseAuth } from "@/hooks/useFirebaseAuth";
```

Update `App.tsx`:

```typescript
import { FirebaseAuthProvider } from "@/hooks/useFirebaseAuth";

const App = () => (
  <QueryClientProvider client={queryClient}>
    <FirebaseAuthProvider>  {/* Changed from AuthProvider */}
      {/* Your app content */}
    </FirebaseAuthProvider>
  </QueryClientProvider>
);
```

### 6. Update Auth Route

In your routes, use the new Firebase auth page:

```typescript
import FirebaseAuth from "./pages/FirebaseAuth";

// In your Routes:
<Route path="/auth" element={<FirebaseAuth />} />
```

### 7. Create First Admin

After signing up, manually set admin role in Firestore:

1. Firebase Console > Firestore Database
2. Find your UID in Authentication > Users
3. Create document in `user_roles` collection:
   - Document ID: `[your-uid]`
   - Fields:
     ```
     userId: [your-uid]
     role: "super_admin"
     assignedBy: "system"
     assignedAt: [current timestamp]
     ```

### 8. Test Everything

1. Start dev server: `bun run dev`
2. Navigate to `/auth`
3. Sign up with email/password
4. Test Google sign-in
5. Test admin dashboard access

## 🎯 What's Included

✅ **Authentication**
- Email/password sign in/up
- Google OAuth
- Session management (Remember Me)
- Admin approval workflow

✅ **Firestore Services**
- Users & roles management
- Events management
- Videos management
- Contact form submissions
- Church info & settings
- Gallery albums & images
- Service times

✅ **Security**
- Row-level security rules
- Role-based access control
- Protected admin routes

✅ **TypeScript Support**
- Full type definitions
- IntelliSense support

## 📁 File Structure

```
src/
  integrations/
    firebase/
      config.ts              # Firebase config
      client.ts              # Firebase initialization
      auth.ts                # Auth service functions
      firestore/
        users.ts             # User & role management
        church.ts            # Church data operations
  hooks/
    useFirebaseAuth.tsx      # Auth context & hook
  pages/
    FirebaseAuth.tsx         # Auth page component
```

## 🔗 Important Links

- [Full Documentation](./FIREBASE_INTEGRATION.md)
- [Security Rules](./firebase-security-rules.txt)
- [Firebase Console](https://console.firebase.google.com/)
- [Firebase Docs](https://firebase.google.com/docs)

## 🆘 Common Issues

**Issue**: Environment variables not loading
- **Fix**: Restart dev server after updating `.env`

**Issue**: "Missing permissions" error
- **Fix**: Deploy security rules from `firebase-security-rules.txt`

**Issue**: Google sign-in popup blocked
- **Fix**: Allow popups in browser settings

**Issue**: Can't access admin features
- **Fix**: Manually set admin role in Firestore (see Step 7)

## 📚 Next Steps

1. Read full documentation: `FIREBASE_INTEGRATION.md`
2. Customize security rules for your needs
3. Update admin pages to use Firebase services
4. Migrate existing data from Supabase
5. Test all features thoroughly
6. Deploy to production

## 💡 Pro Tips

- Use React Query for data caching
- Implement error boundaries
- Add loading states for better UX
- Use Firebase Emulator for local development
- Enable Firebase Analytics for insights
- Set up Firebase Cloud Functions for backend logic

---

**Need Help?** Check the full documentation or Firebase support resources.
