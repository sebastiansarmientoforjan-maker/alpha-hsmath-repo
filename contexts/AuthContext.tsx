import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import {
  User,
  signInWithPopup,
  signOut as firebaseSignOut,
  onAuthStateChanged,
} from 'firebase/auth';
import { auth, googleProvider } from '@/lib/firebase';
import { isAdmin as checkIsAdmin, isAuthorizedViewer } from '@/lib/stakeholderApproval';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  error: string | null;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  isAdmin: boolean;
  isViewer: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Sign in with Google using popup
  const signInWithGoogle = async () => {
    try {
      setError(null);
      setLoading(true);

      const result = await signInWithPopup(auth, googleProvider);
      const userEmail = result.user.email;

      // Validate email domain
      if (!userEmail || !isAuthorizedViewer(userEmail)) {
        await firebaseSignOut(auth);
        throw new Error(
          'Unauthorized: Only @alpha.school email addresses are allowed.'
        );
      }

      // User will be set by onAuthStateChanged
    } catch (err: any) {
      console.error('Sign in error:', err);
      if (err.message.includes('Unauthorized')) {
        setError(err.message);
      } else if (err.code === 'auth/popup-closed-by-user') {
        setError('Sign-in cancelled');
      } else if (err.code === 'auth/popup-blocked') {
        setError('Popup was blocked by browser. Please allow popups for this site.');
      } else {
        setError('Failed to sign in. Please try again.');
      }
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  // Sign out
  const signOut = async () => {
    try {
      setError(null);
      await firebaseSignOut(auth);
      setUser(null);
    } catch (err) {
      console.error('Sign out error:', err);
      setError('Failed to sign out');
    }
  };

  // Listen to auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setLoading(true);

      if (user) {
        // Validate email domain
        if (!user.email || !isAuthorizedViewer(user.email)) {
          await firebaseSignOut(auth);
          setError('Unauthorized: Only @alpha.school email addresses are allowed.');
          setUser(null);
          setLoading(false);
          return;
        }

        setUser(user);
      } else {
        setUser(null);
      }

      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const isAdmin = user?.email ? checkIsAdmin(user.email) : false;
  const isViewer = user?.email ? isAuthorizedViewer(user.email) : false;

  const value: AuthContextType = {
    user,
    loading,
    error,
    signInWithGoogle,
    signOut,
    isAdmin,
    isViewer,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
