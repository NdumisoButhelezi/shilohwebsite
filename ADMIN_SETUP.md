# Admin Setup Guide

This guide explains how to set up admin users in your Firebase application.

## Automatic First Admin

**The first user to register is automatically granted super admin privileges.**

When a user signs up and no other admins exist in the system, they are automatically assigned the `super_admin` role.

## Manual Admin Creation

If you need to manually grant admin access to a user, you have two options:

### Option 1: Using the Setup Page (Recommended for Initial Setup)

1. Navigate to: `http://localhost:8080/setup-admin`
2. Get the user's UID from Firebase Console:
   - Go to Firebase Console → Authentication
   - Find the user in the list
   - Copy their UID
3. Paste the UID into the setup form
4. Click "Create Super Admin"

**Important:** Remove or protect the `/setup-admin` route in production for security.

### Option 2: Using Browser Console

1. Sign in as an existing admin
2. Open browser developer console (F12)
3. Run this command:
```javascript
import { createSuperAdmin } from '@/integrations/firebase/firestore/users';
createSuperAdmin('USER_UID_HERE');
```

Replace `USER_UID_HERE` with the actual user ID from Firebase Authentication.

## Admin Request Flow

For subsequent users who want admin access:

1. User signs up normally
2. User navigates to admin panel (will see "pending approval" screen)
3. An existing admin reviews and approves/denies the request from `/admin/admins`
4. If approved, user gains admin access

## User Roles

- **super_admin**: Full administrative privileges (can manage other admins)
- **admin**: Administrative privileges (can manage content)
- **user**: Regular user (no admin access)

## Security Notes

1. **First User Auto-Admin**: Ensure you're the first to register on a new Firebase project
2. **Remove Setup Page**: Delete or protect `/setup-admin` route after initial setup
3. **Firestore Security Rules**: Apply proper security rules to protect admin operations
4. **Review Requests**: Super admins should regularly review admin requests

## Firestore Collections

The admin system uses these collections:

- `users` - User profiles
- `user_roles` - Role assignments
- `admin_requests` - Pending admin access requests

## Testing Admin Setup

1. Clear all Firebase data (or use a new project)
2. Sign up a new user
3. Check Firestore - user should have `super_admin` role
4. Sign up another user
5. First user should see pending admin request in `/admin/admins`
