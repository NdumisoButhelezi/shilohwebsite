// Firebase Admin functions - Cloud Functions equivalent
// This file contains admin-only operations that would typically run on Firebase Cloud Functions

import { auth } from './client';
import { 
  deleteUser as firebaseDeleteUser,
  getAuth 
} from 'firebase/auth';
import {
  deleteDoc,
  doc,
  getDocs,
  collection,
  query,
  where,
  writeBatch
} from 'firebase/firestore';
import { db } from './client';
import { isUserAdmin } from './firestore/users';

/**
 * Delete user and all associated data
 * NOTE: This requires Firebase Admin SDK for full functionality
 * For production, implement this as a Firebase Cloud Function
 * 
 * @param userId - User ID to delete
 * @param requestingUserId - ID of user performing the deletion (must be admin)
 */
export const deleteUserAccount = async (
  userId: string,
  requestingUserId: string
): Promise<{ success: boolean; error?: string }> => {
  try {
    // Verify requesting user is admin
    const isAdmin = await isUserAdmin(requestingUserId);
    if (!isAdmin) {
      return { success: false, error: 'Only admins can delete users' };
    }

    // Prevent self-deletion
    if (userId === requestingUserId) {
      return { success: false, error: 'Cannot delete your own account' };
    }

    const batch = writeBatch(db);

    // Delete from user_roles
    const roleRef = doc(db, 'user_roles', userId);
    batch.delete(roleRef);

    // Delete from admin_requests
    const requestRef = doc(db, 'admin_requests', userId);
    batch.delete(requestRef);

    // Delete from profiles
    const profileRef = doc(db, 'users', userId);
    batch.delete(profileRef);

    // Commit batch
    await batch.commit();

    // NOTE: Deleting from Firebase Auth requires Admin SDK or Cloud Function
    // For client-side, you can only delete the current user
    // Implement this in a Cloud Function for production:
    console.warn('Auth user deletion should be done via Firebase Cloud Function');
    
    return { 
      success: true, 
      error: 'User data deleted. Note: Auth account requires Cloud Function for full deletion' 
    };
  } catch (error) {
    console.error('Error deleting user:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to delete user' 
    };
  }
};

/**
 * Batch delete users
 */
export const batchDeleteUsers = async (
  userIds: string[],
  requestingUserId: string
): Promise<{ success: boolean; deletedCount: number; errors: string[] }> => {
  const errors: string[] = [];
  let deletedCount = 0;

  for (const userId of userIds) {
    const result = await deleteUserAccount(userId, requestingUserId);
    if (result.success) {
      deletedCount++;
    } else {
      errors.push(`${userId}: ${result.error}`);
    }
  }

  return {
    success: errors.length === 0,
    deletedCount,
    errors
  };
};

/**
 * Get all users (admin only)
 */
export const getAllUsers = async (requestingUserId: string) => {
  try {
    const isAdmin = await isUserAdmin(requestingUserId);
    if (!isAdmin) {
      throw new Error('Only admins can view all users');
    }

    const usersRef = collection(db, 'users');
    const snapshot = await getDocs(usersRef);
    
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('Error getting all users:', error);
    throw error;
  }
};

/**
 * Cloud Function Template for User Deletion
 * 
 * Deploy this to Firebase Cloud Functions for full user deletion:
 * 
 * ```typescript
 * import * as functions from 'firebase-functions';
 * import * as admin from 'firebase-admin';
 * 
 * admin.initializeApp();
 * 
 * export const deleteUser = functions.https.onCall(async (data, context) => {
 *   // Verify requesting user is admin
 *   if (!context.auth) {
 *     throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
 *   }
 * 
 *   const requestingUserId = context.auth.uid;
 *   const userIdToDelete = data.userId;
 * 
 *   // Check if requesting user is admin
 *   const roleDoc = await admin.firestore()
 *     .collection('user_roles')
 *     .doc(requestingUserId)
 *     .get();
 *   
 *   if (!roleDoc.exists || !['admin', 'super_admin'].includes(roleDoc.data()?.role)) {
 *     throw new functions.https.HttpsError('permission-denied', 'Only admins can delete users');
 *   }
 * 
 *   // Prevent self-deletion
 *   if (userIdToDelete === requestingUserId) {
 *     throw new functions.https.HttpsError('invalid-argument', 'Cannot delete your own account');
 *   }
 * 
 *   try {
 *     const batch = admin.firestore().batch();
 * 
 *     // Delete from user_roles
 *     batch.delete(admin.firestore().collection('user_roles').doc(userIdToDelete));
 * 
 *     // Delete from admin_requests
 *     batch.delete(admin.firestore().collection('admin_requests').doc(userIdToDelete));
 * 
 *     // Delete from users
 *     batch.delete(admin.firestore().collection('users').doc(userIdToDelete));
 * 
 *     await batch.commit();
 * 
 *     // Delete from Firebase Auth
 *     await admin.auth().deleteUser(userIdToDelete);
 * 
 *     return { success: true, message: 'User deleted successfully' };
 *   } catch (error) {
 *     throw new functions.https.HttpsError('internal', 'Failed to delete user', error);
 *   }
 * });
 * ```
 */
