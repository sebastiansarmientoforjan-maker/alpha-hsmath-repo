'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { auth } from '@/lib/firebase';

export function FirebaseDebug() {
  const { user } = useAuth();
  const [token, setToken] = useState<string | null>(null);
  const [tokenError, setTokenError] = useState<string | null>(null);

  useEffect(() => {
    const checkToken = async () => {
      try {
        if (auth.currentUser) {
          const idToken = await auth.currentUser.getIdToken();
          setToken(idToken.substring(0, 50) + '...');
          setTokenError(null);
        } else {
          setToken(null);
          setTokenError('No current user');
        }
      } catch (error: any) {
        setTokenError(error.message);
        setToken(null);
      }
    };

    checkToken();

    // Check every 5 seconds
    const interval = setInterval(checkToken, 5000);
    return () => clearInterval(interval);
  }, [user]);

  if (!user) return null;

  return (
    <div style={{
      position: 'fixed',
      bottom: '10px',
      right: '10px',
      background: 'white',
      border: '2px solid black',
      padding: '10px',
      fontSize: '12px',
      maxWidth: '400px',
      zIndex: 9999,
      fontFamily: 'monospace'
    }}>
      <div><strong>🔍 Firebase Debug</strong></div>
      <div>Email: {user.email || 'N/A'}</div>
      <div>UID: {user.uid?.substring(0, 10) || 'N/A'}...</div>
      <div>Token: {token ? '✅ Present' : '❌ Missing'}</div>
      {tokenError && <div style={{color: 'red'}}>Error: {tokenError}</div>}
      <div>Auth Domain: {process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || 'N/A'}</div>
      <div>Project ID: {process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'N/A'}</div>
    </div>
  );
}
