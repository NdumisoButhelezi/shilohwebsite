# Firebase Cloud Functions Setup Guide

## Overview

This guide explains how to set up Firebase Cloud Functions to replace Supabase Edge Functions, particularly for admin operations like user deletion.

## Prerequisites

- Firebase project set up
- Node.js installed
- Firebase CLI installed: `npm install -g firebase-tools`

## Setup Steps

### 1. Initialize Firebase Functions

```bash
# Navigate to project root
cd c:\Users\CARBON\Shiloh\shilohwebsite

# Login to Firebase
firebase login

# Initialize functions
firebase init functions
```

Select:
- TypeScript
- ESLint (optional)
- Install dependencies

### 2. Install Required Packages

```bash
cd functions
npm install firebase-admin firebase-functions
```

### 3. Create Delete User Function

Create file: `functions/src/index.ts`

```typescript
import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

admin.initializeApp();

/**
 * Delete user and all associated data
 * Only admins can call this function
 */
export const deleteUser = functions.https.onCall(async (data, context) => {
  // Verify user is authenticated
  if (!context.auth) {
    throw new functions.https.HttpsError(
      'unauthenticated',
      'User must be authenticated'
    );
  }

  const requestingUserId = context.auth.uid;
  const userIdToDelete = data.userId;

  if (!userIdToDelete) {
    throw new functions.https.HttpsError(
      'invalid-argument',
      'User ID is required'
    );
  }

  // Check if requesting user is admin
  const roleDoc = await admin.firestore()
    .collection('user_roles')
    .doc(requestingUserId)
    .get();
  
  if (!roleDoc.exists || !['admin', 'super_admin'].includes(roleDoc.data()?.role)) {
    throw new functions.https.HttpsError(
      'permission-denied',
      'Only admins can delete users'
    );
  }

  // Prevent self-deletion
  if (userIdToDelete === requestingUserId) {
    throw new functions.https.HttpsError(
      'invalid-argument',
      'Cannot delete your own account'
    );
  }

  try {
    const batch = admin.firestore().batch();

    // Delete from user_roles
    const roleRef = admin.firestore().collection('user_roles').doc(userIdToDelete);
    batch.delete(roleRef);

    // Delete from admin_requests
    const requestRef = admin.firestore().collection('admin_requests').doc(userIdToDelete);
    batch.delete(requestRef);

    // Delete from users
    const userRef = admin.firestore().collection('users').doc(userIdToDelete);
    batch.delete(userRef);

    // Commit batch
    await batch.commit();

    // Delete from Firebase Auth
    await admin.auth().deleteUser(userIdToDelete);

    return { 
      success: true, 
      message: 'User deleted successfully' 
    };
  } catch (error) {
    console.error('Error deleting user:', error);
    throw new functions.https.HttpsError(
      'internal',
      'Failed to delete user',
      error
    );
  }
});

/**
 * Batch delete users
 */
export const batchDeleteUsers = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
  }

  const requestingUserId = context.auth.uid;
  const userIds: string[] = data.userIds || [];

  // Check if requesting user is admin
  const roleDoc = await admin.firestore()
    .collection('user_roles')
    .doc(requestingUserId)
    .get();
  
  if (!roleDoc.exists || !['admin', 'super_admin'].includes(roleDoc.data()?.role)) {
    throw new functions.https.HttpsError('permission-denied', 'Only admins can delete users');
  }

  const results = {
    success: [] as string[],
    failed: [] as { userId: string; error: string }[]
  };

  for (const userId of userIds) {
    try {
      if (userId === requestingUserId) {
        results.failed.push({ userId, error: 'Cannot delete your own account' });
        continue;
      }

      const batch = admin.firestore().batch();
      batch.delete(admin.firestore().collection('user_roles').doc(userId));
      batch.delete(admin.firestore().collection('admin_requests').doc(userId));
      batch.delete(admin.firestore().collection('users').doc(userId));
      await batch.commit();
      await admin.auth().deleteUser(userId);
      
      results.success.push(userId);
    } catch (error: any) {
      results.failed.push({ userId, error: error.message });
    }
  }

  return results;
});

/**
 * Send email notification on new admin request
 */
export const onAdminRequestCreated = functions.firestore
  .document('admin_requests/{requestId}')
  .onCreate(async (snap, context) => {
    const request = snap.data();
    
    // Get all admins
    const adminsSnapshot = await admin.firestore()
      .collection('user_roles')
      .where('role', 'in', ['admin', 'super_admin'])
      .get();

    // TODO: Send email to admins
    console.log('New admin request:', request.email);
    console.log('Notify admins:', adminsSnapshot.size);
    
    // Implement email sending here using SendGrid, Mailgun, etc.
    
    return null;
  });

/**
 * Clean up user data on account deletion
 */
export const onUserDeleted = functions.auth.user().onDelete(async (user) => {
  const userId = user.uid;
  
  try {
    const batch = admin.firestore().batch();
    
    // Delete all user-related documents
    batch.delete(admin.firestore().collection('users').doc(userId));
    batch.delete(admin.firestore().collection('user_roles').doc(userId));
    batch.delete(admin.firestore().collection('admin_requests').doc(userId));
    
    await batch.commit();
    
    console.log(`Cleaned up data for deleted user: ${userId}`);
  } catch (error) {
    console.error('Error cleaning up user data:', error);
  }
  
  return null;
});
```

### 4. Deploy Functions

```bash
# Deploy all functions
firebase deploy --only functions

# Or deploy specific function
firebase deploy --only functions:deleteUser
```

### 5. Update Client Code to Call Functions

Create file: `src/integrations/firebase/functions.ts`

```typescript
import { getFunctions, httpsCallable } from 'firebase/functions';
import { app } from './client';

const functions = getFunctions(app);

/**
 * Call deleteUser Cloud Function
 */
export const callDeleteUser = async (userId: string) => {
  const deleteUserFn = httpsCallable(functions, 'deleteUser');
  
  try {
    const result = await deleteUserFn({ userId });
    return result.data;
  } catch (error: any) {
    console.error('Error calling deleteUser function:', error);
    throw new Error(error.message || 'Failed to delete user');
  }
};

/**
 * Call batchDeleteUsers Cloud Function
 */
export const callBatchDeleteUsers = async (userIds: string[]) => {
  const batchDeleteFn = httpsCallable(functions, 'batchDeleteUsers');
  
  try {
    const result = await batchDeleteFn({ userIds });
    return result.data;
  } catch (error: any) {
    console.error('Error calling batchDeleteUsers function:', error);
    throw new Error(error.message || 'Failed to delete users');
  }
};
```

### 6. Update Admin Pages

In your admin pages (e.g., `Admins.tsx`):

```typescript
import { callDeleteUser } from '@/integrations/firebase/functions';

// In your delete handler
const handleDeleteUser = async (userId: string) => {
  try {
    const result = await callDeleteUser(userId);
    toast.success('User deleted successfully');
    // Refresh user list
  } catch (error) {
    toast.error('Failed to delete user');
  }
};
```

## Environment Variables

Set Firebase config in your Cloud Functions:

```bash
firebase functions:config:set app.environment="production"
firebase functions:config:set app.url="https://yourdomain.com"
```

## Testing Functions Locally

```bash
# Start Firebase emulators
firebase emulators:start

# Or just functions emulator
firebase emulators:start --only functions
```

Update your `.env` for local testing:
```env
VITE_USE_FIREBASE_EMULATOR=true
```

## Security Considerations

1. **Always verify admin status** in Cloud Functions
2. **Never trust client-side data** - validate everything
3. **Use Firebase Security Rules** in addition to Cloud Functions
4. **Log all admin actions** for audit trail
5. **Rate limit** Cloud Functions to prevent abuse

## Cost Optimization

- Cloud Functions are billed per invocation
- First 2 million invocations/month are free
- Use batching for bulk operations
- Cache frequently accessed data

## Monitoring

View function logs:
```bash
firebase functions:log
```

Or in Firebase Console:
- Functions → Logs
- Monitor invocations, errors, and performance

## Common Issues

**Issue**: "Permission denied"
- **Solution**: Verify user has admin role in Firestore

**Issue**: "Function timeout"
- **Solution**: Increase timeout in function config (max 540s)

**Issue**: "CORS error"
- **Solution**: Cloud Functions automatically handle CORS for httpsCallable

## Next Steps

1. Deploy basic functions
2. Test locally with emulators
3. Add more functions as needed:
   - Send emails
   - Process uploads
   - Scheduled tasks (cron jobs)
   - Database triggers

## Additional Resources

- [Firebase Functions Docs](https://firebase.google.com/docs/functions)
- [Cloud Functions Samples](https://github.com/firebase/functions-samples)
- [Best Practices](https://firebase.google.com/docs/functions/best-practices)

---

**Note**: The client-side `admin.ts` file provides a temporary solution, but **Cloud Functions are required** for full admin operations in production.
