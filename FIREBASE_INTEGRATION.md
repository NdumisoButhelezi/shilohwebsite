# Firebase Integration Guide

## Overview

This document provides a comprehensive guide for the Firebase integration in the Shiloh Intercession Mountain website. The integration includes:

- **Firebase Authentication**: Email/password and Google OAuth sign-in
- **Firestore Database**: NoSQL database for church data
- **Firebase Storage**: For images and media files (configured, ready to use)

## Table of Contents

1. [Setup Instructions](#setup-instructions)
2. [Authentication System](#authentication-system)
3. [Firestore Database Schema](#firestore-database-schema)
4. [Security Rules](#security-rules)
5. [Integration Guide](#integration-guide)
6. [Migration from Supabase](#migration-from-supabase)

---

## Setup Instructions

### Step 1: Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Add project" or select existing project
3. Follow the setup wizard

### Step 2: Enable Authentication

1. In Firebase Console, navigate to **Authentication** > **Sign-in method**
2. Enable the following providers:
   - **Email/Password**: Click Enable
   - **Google**: Click Enable, add project support email

### Step 3: Create Firestore Database

1. Navigate to **Firestore Database**
2. Click **Create database**
3. Choose **Production mode** (we'll add security rules)
4. Select a location (choose closest to your users)

### Step 4: Get Firebase Configuration

1. Go to **Project Settings** (gear icon)
2. Scroll to "Your apps" section
3. Click **Web** icon (</>) to register a web app
4. Copy the configuration object

### Step 5: Configure Environment Variables

Create or update `.env` file in the project root:

```env
# Firebase Configuration
VITE_FIREBASE_API_KEY=your_api_key_here
VITE_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
VITE_FIREBASE_MEASUREMENT_ID=your_measurement_id
```

### Step 6: Install Dependencies

```bash
# Using Bun
bun add firebase

# Using npm
npm install firebase

# Using yarn
yarn add firebase
```

### Step 7: Deploy Security Rules

Copy the security rules from `firebase-security-rules.txt` and paste them in:
- Firebase Console > Firestore Database > Rules

---

## Authentication System

### Features

✅ **Email/Password Authentication**
- User registration with email verification
- Secure password storage
- Password reset functionality

✅ **Google OAuth Sign-In**
- One-click Google authentication
- Automatic profile creation

✅ **Session Management**
- "Remember Me" functionality
- Persistent sessions (localStorage)
- Session-only login (sessionStorage)

✅ **Role-Based Access Control (RBAC)**
- User roles: `user`, `admin`, `super_admin`
- Admin approval workflow
- Protected admin routes

### Usage Examples

#### Sign In with Email/Password

```typescript
import { useFirebaseAuth } from '@/hooks/useFirebaseAuth';

function LoginComponent() {
  const { signIn } = useFirebaseAuth();
  
  const handleLogin = async () => {
    const { error } = await signIn(
      'user@example.com',
      'password123',
      true // rememberMe
    );
    
    if (error) {
      console.error('Login failed:', error.message);
    }
  };
}
```

#### Sign In with Google

```typescript
const { signInWithGoogle } = useFirebaseAuth();

const handleGoogleSignIn = async () => {
  const { error } = await signInWithGoogle(true);
  
  if (error) {
    console.error('Google sign-in failed:', error.message);
  }
};
```

#### Sign Up

```typescript
const { signUp } = useFirebaseAuth();

const handleSignUp = async () => {
  const { error, userId } = await signUp(
    'newuser@example.com',
    'securePassword123',
    'John Doe' // displayName
  );
  
  if (error) {
    console.error('Sign up failed:', error.message);
  } else {
    console.log('User created:', userId);
  }
};
```

#### Check User Status

```typescript
const { user, isAdmin, isLoading } = useFirebaseAuth();

if (isLoading) {
  return <LoadingSpinner />;
}

if (user && isAdmin) {
  return <AdminDashboard />;
}

return <PublicPage />;
```

---

## Firestore Database Schema

### Collections Overview

1. **users** - User profiles
2. **user_roles** - User role assignments
3. **admin_requests** - Admin access requests
4. **events** - Church events
5. **videos** - YouTube videos
6. **contact_submissions** - Contact form submissions
7. **church_info** - Church information (single document)
8. **service_times** - Service schedules
9. **gallery_albums** - Photo gallery albums
10. **gallery_images** - Gallery images

### Detailed Schema

#### users Collection

```typescript
{
  uid: string;              // Firebase Auth UID (document ID)
  email: string;
  displayName: string;
  photoURL?: string;
  firstName?: string;
  lastName?: string;
  title?: string;           // Mr, Mrs, Ms, Dr
  phoneNumber?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

#### user_roles Collection

```typescript
{
  userId: string;           // Document ID = user UID
  role: 'user' | 'admin' | 'super_admin';
  assignedBy: string;       // UID of admin who assigned role
  assignedAt: Timestamp;
}
```

#### admin_requests Collection

```typescript
{
  userId: string;           // Document ID = user UID
  email: string;
  status: 'pending' | 'approved' | 'rejected';
  reviewedBy?: string;      // UID of reviewing admin
  createdAt: Timestamp;
  reviewedAt?: Timestamp;
}
```

#### events Collection

```typescript
{
  id: string;               // Auto-generated
  title: string;
  description?: string;
  eventDate: Timestamp;
  startTime: string;        // Format: "HH:MM"
  endTime?: string;
  location?: string;
  eventType?: string;       // 'general', 'special', 'youth', etc.
  isActive: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

#### videos Collection

```typescript
{
  id: string;
  title: string;
  youtubeVideoId: string;
  description?: string;
  displayOrder: number;
  isActive: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

#### contact_submissions Collection

```typescript
{
  id: string;
  name: string;
  email: string;
  message: string;
  isRead: boolean;
  createdAt: Timestamp;
}
```

#### church_info Collection

```typescript
{
  id: string;               // Single document
  churchName: string;
  address?: string;
  phone?: string;
  email?: string;
  missionStatement?: string;
  visionStatement?: string;
  youtubeChannelUrl?: string;
  facebookUrl?: string;
  instagramUrl?: string;
  googleMapsEmbedUrl?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

#### service_times Collection

```typescript
{
  id: string;
  serviceName: string;
  dayOfWeek: string;
  startTime: string;
  endTime?: string;
  displayOrder: number;
  isActive: boolean;
  createdAt: Timestamp;
}
```

#### gallery_albums Collection

```typescript
{
  id: string;
  title: string;
  description?: string;
  coverImageUrl?: string;
  displayOrder: number;
  isActive: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

#### gallery_images Collection

```typescript
{
  id: string;
  albumId: string;          // Reference to album
  imageUrl: string;
  thumbnailUrl?: string;
  title?: string;
  description?: string;
  displayOrder: number;
  uploadedBy?: string;      // UID of uploader
  createdAt: Timestamp;
}
```

---

## Security Rules

Firestore security rules are implemented to ensure:
- Public read access for active content
- Admin-only write access for most data
- User-specific access for profiles and requests

See `firebase-security-rules.txt` for the complete rules.

Key security principles:
1. **Authenticated reads**: Anyone can read active public data
2. **Admin writes**: Only admins can create/update/delete most data
3. **User-specific data**: Users can only access their own profiles and requests
4. **Validation**: Data structure validation on writes

---

## Integration Guide

### Using Authentication in Components

```typescript
import { useFirebaseAuth } from '@/hooks/useFirebaseAuth';

function MyComponent() {
  const { user, isAdmin, signOut } = useFirebaseAuth();
  
  if (!user) {
    return <LoginPrompt />;
  }
  
  return (
    <div>
      <p>Welcome, {user.displayName}!</p>
      {isAdmin && <AdminPanel />}
      <button onClick={signOut}>Sign Out</button>
    </div>
  );
}
```

### Using Firestore Services

```typescript
import { 
  getActiveEvents, 
  createEvent,
  updateEvent 
} from '@/integrations/firebase/firestore/church';

// Get events
async function loadEvents() {
  const events = await getActiveEvents();
  console.log(events);
}

// Create event (admin only)
async function addEvent() {
  const eventId = await createEvent({
    title: 'Sunday Service',
    description: 'Weekly worship service',
    eventDate: new Date('2026-01-15'),
    startTime: '09:00',
    endTime: '12:00',
    location: 'Main Sanctuary',
    eventType: 'weekly',
    isActive: true
  });
  
  console.log('Created event:', eventId);
}

// Update event
async function modifyEvent(eventId: string) {
  await updateEvent(eventId, {
    title: 'Updated Title'
  });
}
```

### Protecting Routes

```typescript
import { useFirebaseAuth } from '@/hooks/useFirebaseAuth';
import { Navigate } from 'react-router-dom';

function ProtectedAdminRoute({ children }) {
  const { user, isAdmin, isLoading } = useFirebaseAuth();
  
  if (isLoading) {
    return <LoadingSpinner />;
  }
  
  if (!user || !isAdmin) {
    return <Navigate to="/auth" replace />;
  }
  
  return children;
}
```

### Updating App.tsx

Replace the Supabase `AuthProvider` with Firebase:

```typescript
import { FirebaseAuthProvider } from "@/hooks/useFirebaseAuth";

const App = () => (
  <QueryClientProvider client={queryClient}>
    <FirebaseAuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            {/* Your routes */}
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </FirebaseAuthProvider>
  </QueryClientProvider>
);
```

---

## Migration from Supabase

### Step-by-Step Migration

1. **Keep Both Systems Running** (Optional)
   - Firebase files are in separate folder
   - Can run parallel during transition

2. **Replace Auth Provider**
   - Update `App.tsx` to use `FirebaseAuthProvider`
   - Change imports from `useAuth` to `useFirebaseAuth`

3. **Update Auth Page**
   - Replace current Auth.tsx with FirebaseAuth.tsx
   - Update route in App.tsx

4. **Migrate Data**
   - Export data from Supabase
   - Import into Firestore using admin SDK or scripts
   - Scripts available in `scripts/migrate-data.ts`

5. **Update Admin Pages**
   - Replace Supabase queries with Firestore functions
   - Update imports to use Firebase services

6. **Test Thoroughly**
   - Test authentication flows
   - Test data CRUD operations
   - Test admin approval workflow

### Data Migration Script Template

```typescript
// scripts/migrate-data.ts
import { supabase } from './old-supabase-client';
import { 
  createEvent, 
  createVideo 
} from '@/integrations/firebase/firestore/church';

async function migrateEvents() {
  // Fetch from Supabase
  const { data: events } = await supabase
    .from('events')
    .select('*');
  
  // Insert into Firebase
  for (const event of events || []) {
    await createEvent({
      title: event.title,
      description: event.description,
      eventDate: new Date(event.event_date),
      startTime: event.start_time,
      endTime: event.end_time,
      location: event.location,
      eventType: event.event_type,
      isActive: event.is_active
    });
  }
}
```

---

## Admin Approval Workflow

### How It Works

1. **User Signs Up**
   - Creates Firebase Auth account
   - Profile created in `users` collection
   - Admin request created in `admin_requests` collection with status: `pending`

2. **Admin Reviews Request**
   - Admin logs into dashboard
   - Sees pending requests
   - Can approve or reject

3. **Approval**
   - Admin clicks "Approve"
   - User role updated to `admin` in `user_roles` collection
   - Request status updated to `approved`
   - User gains admin access on next login

4. **Rejection**
   - Admin clicks "Reject"
   - Request status updated to `rejected`
   - User remains as regular user

### Creating First Super Admin

Run this in Firebase Console > Firestore:

1. Create document in `user_roles` collection:
   - Document ID: `[your-firebase-uid]`
   - Fields:
     ```
     userId: [your-firebase-uid]
     role: "super_admin"
     assignedBy: "system"
     assignedAt: [current timestamp]
     ```

2. Sign in with that account - you're now super admin!

---

## Best Practices

### Security

- ✅ Never expose Firebase config in public repos (use env variables)
- ✅ Always validate user input on client AND server
- ✅ Use security rules to restrict database access
- ✅ Regularly review Firebase Console > Usage
- ✅ Enable App Check for additional security

### Performance

- ✅ Use indexes for frequently queried fields
- ✅ Limit query results with `limit()`
- ✅ Cache data when possible (React Query)
- ✅ Use pagination for large datasets
- ✅ Optimize images before uploading to Storage

### Code Organization

- ✅ Keep Firebase services in separate files
- ✅ Use TypeScript interfaces for type safety
- ✅ Create reusable hooks for common operations
- ✅ Handle errors gracefully with try/catch
- ✅ Show user-friendly error messages

---

## Troubleshooting

### Common Issues

**Issue**: "Firebase: Error (auth/popup-blocked)"
- **Solution**: User's browser is blocking popups. Use redirect method instead or instruct users to allow popups.

**Issue**: "Missing or insufficient permissions"
- **Solution**: Check Firestore security rules. Ensure user has proper role.

**Issue**: "Firebase: Error (auth/email-already-in-use)"
- **Solution**: Email is already registered. Direct user to sign-in page.

**Issue**: Environment variables not loading
- **Solution**: Restart dev server after updating `.env`. Vite only reads env vars on startup.

### Getting Help

- [Firebase Documentation](https://firebase.google.com/docs)
- [Firebase Support](https://firebase.google.com/support)
- [Stack Overflow](https://stackoverflow.com/questions/tagged/firebase)

---

## Next Steps

1. ✅ Complete Firebase setup
2. ✅ Deploy security rules
3. ✅ Create first admin account
4. ✅ Test authentication flows
5. ✅ Migrate existing data
6. ✅ Update all components to use Firebase
7. ✅ Test admin approval workflow
8. ✅ Deploy to production

---

## Support

For questions or issues with this integration, please contact the development team or refer to the Firebase documentation.

**Last Updated**: January 2026
