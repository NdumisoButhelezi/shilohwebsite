// Helper functions for Firebase client-side operations
import { auth } from './client';

/**
 * Delete a user (calls Netlify function)
 * This is a client-side helper that calls our Netlify serverless function
 */
export const deleteUser = async (userId: string): Promise<{ success: boolean; error?: string }> => {
  try {
    // Get current user's ID token
    const currentUser = auth.currentUser;
    if (!currentUser) {
      throw new Error('No authenticated user');
    }

    const token = await currentUser.getIdToken();

    // Call Netlify function
    const response = await fetch('/.netlify/functions/delete-user', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ userId }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Failed to delete user');
    }

    return { success: true };
  } catch (error) {
    console.error('Error deleting user:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
};
