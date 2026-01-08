// Firebase Authentication Context and Hook
import { useState, useEffect, createContext, useContext, ReactNode } from "react";
import { User, onAuthStateChanged } from "firebase/auth";
import { auth } from "@/integrations/firebase/client";
import {
  signInWithEmail as firebaseSignInWithEmail,
  signUpWithEmail as firebaseSignUpWithEmail,
  signInWithGoogle as firebaseSignInWithGoogle,
  handleGoogleRedirect,
  signOut as firebaseSignOut,
} from "@/integrations/firebase/auth";
import { getUserRole, isUserAdmin } from "@/integrations/firebase/firestore/users";

interface FirebaseAuthContextType {
  user: User | null;
  isAdmin: boolean;
  isLoading: boolean;
  signIn: (email: string, password: string, rememberMe?: boolean) => Promise<{ error: Error | null }>;
  signInWithGoogle: (rememberMe?: boolean) => Promise<void>;
  signUp: (email: string, password: string, displayName?: string) => Promise<{ error: Error | null; userId: string | null }>;
  signOut: () => Promise<void>;
}

const FirebaseAuthContext = createContext<FirebaseAuthContextType | undefined>(undefined);

export function FirebaseAuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const checkAdminRole = async (uid: string) => {
    try {
      const adminStatus = await isUserAdmin(uid);
      setIsAdmin(adminStatus);
    } catch (error) {
      console.error("Error checking admin status:", error);
      setIsAdmin(false);
    }
  };

  useEffect(() => {
    // Handle Google redirect result first
    handleGoogleRedirect().catch(error => {
      console.error("Error handling Google redirect:", error);
    });

    // Listen to auth state changes
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      
      if (firebaseUser) {
        // Check admin role when user signs in
        await checkAdminRole(firebaseUser.uid);
      } else {
        setIsAdmin(false);
      }
      
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signIn = async (email: string, password: string, rememberMe: boolean = true) => {
    const { error } = await firebaseSignInWithEmail(email, password, rememberMe);
    return { error };
  };

  const signInWithGoogle = async (rememberMe: boolean = true) => {
    await firebaseSignInWithGoogle(rememberMe);
    // No return value needed as redirect will happen
  };

  const signUp = async (email: string, password: string, displayName?: string) => {
    const { user: newUser, error } = await firebaseSignUpWithEmail(email, password, displayName);
    return { 
      error, 
      userId: newUser?.uid || null 
    };
  };

  const signOut = async () => {
    await firebaseSignOut();
    setUser(null);
    setIsAdmin(false);
  };

  return (
    <FirebaseAuthContext.Provider
      value={{
        user,
        isAdmin,
        isLoading,
        signIn,
        signInWithGoogle,
        signUp,
        signOut,
      }}
    >
      {children}
    </FirebaseAuthContext.Provider>
  );
}

export function useFirebaseAuth() {
  const context = useContext(FirebaseAuthContext);
  if (context === undefined) {
    throw new Error("useFirebaseAuth must be used within a FirebaseAuthProvider");
  }
  return context;
}
