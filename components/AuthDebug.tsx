'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useEffect, useState } from 'react';
import { auth } from '@/lib/firebase';

export default function AuthDebug() {
  const { user, loading } = useAuth();
  const [token, setToken] = useState<string | null>(null);
  const [tokenLoading, setTokenLoading] = useState(true);

  useEffect(() => {
    const getToken = async () => {
      try {
        const currentUser = auth.currentUser;
        if (currentUser) {
          const idToken = await currentUser.getIdToken();
          setToken(idToken.substring(0, 50) + '...');
        } else {
          setToken(null);
        }
      } catch (error) {
        console.error('Error getting token:', error);
        setToken('ERROR');
      } finally {
        setTokenLoading(false);
      }
    };

    if (!loading) {
      getToken();
    }
  }, [loading, user]);

  return (
    <div className="fixed bottom-4 right-4 p-4 border-4 border-dark bg-white shadow-lg max-w-xs text-xs font-mono z-50">
      <h3 className="font-bold mb-2">🔍 Auth Debug</h3>
      <div className="space-y-1">
        <p><strong>Loading:</strong> {loading ? '⏳ Yes' : '✅ No'}</p>
        <p><strong>User:</strong> {user ? '✅ ' + user.email : '❌ None'}</p>
        <p><strong>Token:</strong> {tokenLoading ? '⏳...' : (token ? '✅ Present' : '❌ None')}</p>
        <p><strong>UID:</strong> {user?.uid?.substring(0, 8) || '❌'}</p>
      </div>
    </div>
  );
}
