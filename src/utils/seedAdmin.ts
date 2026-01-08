// Seed Admin User Script
// Run this once to create the initial admin account

import { signUpWithEmail } from '@/integrations/firebase/auth';
import { setUserRole } from '@/integrations/firebase/firestore/users';

const ADMIN_EMAIL = 'shilointercessionmountain@gmail.com';
const ADMIN_PASSWORD = 'Repentorperish01';
const ADMIN_DISPLAY_NAME = 'Shiloh Admin';

/**
 * Create the initial admin user
 * Call this function from browser console or a setup page
 */
export const seedAdmin = async (): Promise<void> => {
  try {
    console.log('Creating admin user...');
    
    // Sign up the admin user
    const { user, error } = await signUpWithEmail(
      ADMIN_EMAIL,
      ADMIN_PASSWORD,
      ADMIN_DISPLAY_NAME
    );

    if (error) {
      console.error('Error creating admin user:', error);
      throw error;
    }

    if (!user) {
      throw new Error('User creation failed');
    }

    console.log('Admin user created:', user.uid);
    
    // Grant super admin role
    await setUserRole(user.uid, 'super_admin', 'system');
    
    console.log('✅ Admin user seeded successfully!');
    console.log(`Email: ${ADMIN_EMAIL}`);
    console.log(`UID: ${user.uid}`);
    
    return;
  } catch (error: any) {
    // If user already exists, that's okay
    if (error.code === 'auth/email-already-in-use') {
      console.log('ℹ️ Admin user already exists');
      return;
    }
    
    console.error('❌ Failed to seed admin:', error);
    throw error;
  }
};

// Make it available globally for console access
if (typeof window !== 'undefined') {
  (window as any).seedAdmin = seedAdmin;
}
