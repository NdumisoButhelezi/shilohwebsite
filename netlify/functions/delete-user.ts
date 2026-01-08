// Netlify Function for deleting users
// Cost-effective alternative to Firebase Cloud Functions
import { Handler } from '@netlify/functions';
import * as admin from 'firebase-admin';

// Initialize Firebase Admin SDK
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    }),
  });
}

const db = admin.firestore();
const auth = admin.auth();

export const handler: Handler = async (event) => {
  // CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  };

  // Handle preflight
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  // Only allow POST
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  }

  try {
    // Get auth token from header
    const authHeader = event.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return {
        statusCode: 401,
        headers,
        body: JSON.stringify({ error: 'Unauthorized - No token provided' }),
      };
    }

    const token = authHeader.substring(7);
    
    // Verify the token and get requesting user
    const decodedToken = await auth.verifyIdToken(token);
    const requestingUserId = decodedToken.uid;

    // Check if requesting user is admin
    const roleDoc = await db.collection('user_roles').doc(requestingUserId).get();
    const role = roleDoc.data()?.role;
    
    if (role !== 'admin' && role !== 'super_admin') {
      return {
        statusCode: 403,
        headers,
        body: JSON.stringify({ error: 'Only admins can delete users' }),
      };
    }

    // Get user ID to delete from request body
    const body = JSON.parse(event.body || '{}');
    const { userId } = body;

    if (!userId) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'User ID is required' }),
      };
    }

    // Prevent self-deletion
    if (userId === requestingUserId) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Cannot delete your own account' }),
      };
    }

    // Delete from Firestore collections
    await Promise.all([
      db.collection('user_roles').doc(userId).delete(),
      db.collection('admin_requests').doc(userId).delete(),
      db.collection('users').doc(userId).delete(),
    ]);

    // Delete from Firebase Auth
    await auth.deleteUser(userId);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        message: 'User completely removed from system',
      }),
    };
  } catch (error) {
    console.error('Error deleting user:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: error instanceof Error ? error.message : 'Unknown error',
      }),
    };
  }
};
