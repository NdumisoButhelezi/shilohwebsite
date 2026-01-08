// Firebase initialization and client setup
import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { getAuth, Auth, browserLocalPersistence, browserSessionPersistence } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';
import { getStorage, FirebaseStorage, ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { firebaseConfig } from './config';

// Initialize Firebase app (singleton pattern)
let app: FirebaseApp;
let auth: Auth;
let db: Firestore;
let storage: FirebaseStorage;

if (!getApps().length) {
  app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  db = getFirestore(app);
  storage = getStorage(app);
  
  // Set default persistence to local (Remember Me by default)
  auth.setPersistence(browserLocalPersistence).catch((error) => {
    console.error("Error setting persistence:", error);
  });
} else {
  app = getApps()[0];
  auth = getAuth(app);
  db = getFirestore(app);
  storage = getStorage(app);
}

// Export Firebase services
export { app, auth, db, storage, browserLocalPersistence, browserSessionPersistence };

/**
 * Upload a file to Firebase Storage
 * @param path - The path where the file should be stored (e.g., 'avatars/userId/avatar.jpg')
 * @param file - The file or blob to upload
 * @param contentType - Optional content type (e.g., 'image/jpeg')
 * @returns The download URL of the uploaded file
 */
export const uploadFile = async (
  path: string,
  file: File | Blob,
  contentType?: string
): Promise<string> => {
  try {
    const storageRef = ref(storage, path);
    const metadata = contentType ? { contentType } : undefined;
    const snapshot = await uploadBytes(storageRef, file, metadata);
    const downloadURL = await getDownloadURL(snapshot.ref);
    return downloadURL;
  } catch (error) {
    console.error('Error uploading file:', error);
    throw error;
  }
};

/**
 * Delete a file from Firebase Storage
 * @param path - The path of the file to delete
 */
export const deleteFile = async (path: string): Promise<void> => {
  try {
    const storageRef = ref(storage, path);
    await deleteObject(storageRef);
  } catch (error) {
    // If file doesn't exist, ignore the error
    if ((error as any)?.code === 'storage/object-not-found') {
      return;
    }
    console.error('Error deleting file:', error);
    throw error;
  }
};
