// Firebase Authentication service functions
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithRedirect,
  getRedirectResult,
  GoogleAuthProvider,
  signOut as firebaseSignOut,
  sendPasswordResetEmail,
  updateProfile,
  updateEmail,
  updatePassword,
  EmailAuthProvider,
  reauthenticateWithCredential,
  User,
  UserCredential,
} from 'firebase/auth';
import { auth, browserLocalPersistence, browserSessionPersistence } from './client';
import { createUserProfile, getUserRole } from './firestore/users';
import { createAdminRequest, getAdminRequestStatus, isUserAdmin } from './firestore/users';

// Google provider for OAuth
const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: 'select_account'
});

/**
 * Sign up with email and password
 */
export const signUpWithEmail = async (
  email: string,
  password: string,
  displayName?: string
): Promise<{ user: User | null; error: Error | null }> => {
  try {
    const userCredential: UserCredential = await createUserWithEmailAndPassword(
      auth,
      email,
      password
    );
    
    // Update display name if provided
    if (displayName && userCredential.user) {
      await updateProfile(userCredential.user, { displayName });
    }
    
    // Create user profile in Firestore (this also auto-grants admin if first user)
    await createUserProfile(userCredential.user.uid, {
      email: userCredential.user.email || email,
      displayName: displayName || userCredential.user.displayName || '',
      createdAt: new Date(),
    });
    
    // Check if user was made admin (first user), if not create admin request
    const isAdmin = await isUserAdmin(userCredential.user.uid);
    if (!isAdmin) {
      await createAdminRequest(userCredential.user.uid, email);
      console.log('Admin request created for new user');
    }
    
    return { user: userCredential.user, error: null };
  } catch (error) {
    console.error('Error signing up:', error);
    return { user: null, error: error as Error };
  }
};

/**
 * Sign in with email and password
 */
export const signInWithEmail = async (
  email: string,
  password: string,
  rememberMe: boolean = true
): Promise<{ user: User | null; error: Error | null }> => {
  try {
    // Set persistence based on rememberMe
    await auth.setPersistence(
      rememberMe ? browserLocalPersistence : browserSessionPersistence
    );
    
    const userCredential: UserCredential = await signInWithEmailAndPassword(
      auth,
      email,
      password
    );
    
    return { user: userCredential.user, error: null };
  } catch (error) {
    console.error('Error signing in:', error);
    return { user: null, error: error as Error };
  }
};

/**
 * Sign in with Google OAuth (using redirect)
 */
export const signInWithGoogle = async (
  rememberMe: boolean = true
): Promise<void> => {
  try {
    // Set persistence based on rememberMe
    await auth.setPersistence(
      rememberMe ? browserLocalPersistence : browserSessionPersistence
    );
    
    // Redirect to Google sign-in
    await signInWithRedirect(auth, googleProvider);
  } catch (error) {
    console.error('Error initiating Google sign-in:', error);
    throw error;
  }
};

/**
 * Handle redirect result after Google OAuth
 * Call this on app initialization to handle returning from Google
 */
export const handleGoogleRedirect = async (): Promise<{ user: User | null; error: Error | null }> => {
  try {
    const userCredential = await getRedirectResult(auth);
    
    if (userCredential?.user) {
      // Check if user profile exists, if not create one
      const userRole = await getUserRole(userCredential.user.uid);
      if (!userRole) {
        await createUserProfile(userCredential.user.uid, {
          email: userCredential.user.email || '',
          displayName: userCredential.user.displayName || '',
          photoURL: userCredential.user.photoURL || '',
          createdAt: new Date(),
        });
        
        // After creating profile, check if user is admin
        // If not admin and no existing request, create an admin request
        const isAdmin = await isUserAdmin(userCredential.user.uid);
        if (!isAdmin) {
          const existingRequest = await getAdminRequestStatus(userCredential.user.uid);
          if (!existingRequest) {
            await createAdminRequest(
              userCredential.user.uid,
              userCredential.user.email || ''
            );
            console.log('Admin request created for Google sign-in user');
          }
        }
      }
      
      return { user: userCredential.user, error: null };
    }
    
    return { user: null, error: null };
  } catch (error) {
    console.error('Error handling Google redirect:', error);
    return { user: null, error: error as Error };
  }
};

/**
 * Sign out
 */
export const signOut = async (): Promise<{ error: Error | null }> => {
  try {
    await firebaseSignOut(auth);
    return { error: null };
  } catch (error) {
    console.error('Error signing out:', error);
    return { error: error as Error };
  }
};

/**
 * Send password reset email
 */
export const resetPassword = async (email: string): Promise<{ error: Error | null }> => {
  try {
    await sendPasswordResetEmail(auth, email);
    return { error: null };
  } catch (error) {
    console.error('Error sending password reset email:', error);
    return { error: error as Error };
  }
};

/**
 * Update user profile
 */
export const updateUserProfile = async (
  displayName?: string,
  photoURL?: string
): Promise<{ error: Error | null }> => {
  try {
    if (!auth.currentUser) {
      throw new Error('No user is currently signed in');
    }
    
    await updateProfile(auth.currentUser, {
      ...(displayName && { displayName }),
      ...(photoURL && { photoURL }),
    });
    
    return { error: null };
  } catch (error) {
    console.error('Error updating profile:', error);
    return { error: error as Error };
  }
};

/**
 * Update user email (requires recent authentication)
 */
export const updateUserEmail = async (newEmail: string): Promise<{ error: Error | null }> => {
  try {
    if (!auth.currentUser) {
      throw new Error('No user is currently signed in');
    }
    
    await updateEmail(auth.currentUser, newEmail);
    return { error: null };
  } catch (error) {
    console.error('Error updating email:', error);
    return { error: error as Error };
  }
};

/**
 * Update user password (requires recent authentication)
 */
export const updateUserPassword = async (
  currentPassword: string,
  newPassword: string
): Promise<{ error: Error | null }> => {
  try {
    if (!auth.currentUser || !auth.currentUser.email) {
      throw new Error('No user is currently signed in');
    }
    
    // Re-authenticate user before password change
    const credential = EmailAuthProvider.credential(
      auth.currentUser.email,
      currentPassword
    );
    await reauthenticateWithCredential(auth.currentUser, credential);
    
    // Update password
    await updatePassword(auth.currentUser, newPassword);
    return { error: null };
  } catch (error) {
    console.error('Error updating password:', error);
    return { error: error as Error };
  }
};

/**
 * Re-authenticate user (useful before sensitive operations)
 */
export const reauthenticateUser = async (
  password: string
): Promise<{ error: Error | null }> => {
  try {
    if (!auth.currentUser || !auth.currentUser.email) {
      throw new Error('No user is currently signed in');
    }
    
    const credential = EmailAuthProvider.credential(
      auth.currentUser.email,
      password
    );
    await reauthenticateWithCredential(auth.currentUser, credential);
    return { error: null };
  } catch (error) {
    console.error('Error re-authenticating:', error);
    return { error: error as Error };
  }
};
