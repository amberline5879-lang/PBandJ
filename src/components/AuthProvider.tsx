import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  onAuthStateChanged, 
  signOut as fbSignOut, 
  signInWithPopup, 
  GoogleAuthProvider
} from 'firebase/auth';
import { auth, googleProvider } from '../lib/firebase';

interface AuthContextType {
  user: any;
  loading: boolean;
  updateUser: (userInfo: any) => void;
  signOut: () => Promise<void>;
  googleSignIn: () => Promise<{ user: any; accessToken: string | null }>;
  accessToken: string | null;
  setAccessToken: (token: string | null) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Google Calendar scope is disabled
// googleProvider.addScope('https://www.googleapis.com/auth/calendar');

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<any>(() => {
    const saved = localStorage.getItem('serene_auth_user');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        // Fallback
      }
    }
    return {
      uid: 'local-user',
      email: 'user@local.app',
      displayName: 'Guest User',
      photoURL: null,
      isAnonymous: true,
      providerId: 'guest'
    };
  });
  
  const [loading, setLoading] = useState(true);
  const [accessToken, setAccessTokenState] = useState<string | null>(null);

  // In-memory token cache matching workspace-integration directive
  const setAccessToken = (token: string | null) => {
    setAccessTokenState(token);
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (fbUser) => {
      setLoading(true);
      if (fbUser) {
        const formattedUser = {
          uid: fbUser.uid,
          email: fbUser.email || 'user@local.app',
          displayName: fbUser.displayName || 'Guest User',
          photoURL: fbUser.photoURL,
          isAnonymous: fbUser.isAnonymous,
          providerId: fbUser.providerData[0]?.providerId || 'google.com'
        };
        setUser(formattedUser);
        localStorage.setItem('serene_auth_user', JSON.stringify(formattedUser));
      } else {
        const saved = localStorage.getItem('serene_auth_user');
        if (!saved) {
          setUser({
            uid: 'local-user',
            email: 'user@local.app',
            displayName: 'Guest User',
            photoURL: null,
            isAnonymous: true,
            providerId: 'guest'
          });
        }
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const updateUser = (userInfo: any) => {
    setUser(userInfo);
    if (userInfo) {
      localStorage.setItem('serene_auth_user', JSON.stringify(userInfo));
    } else {
      localStorage.removeItem('serene_auth_user');
    }
  };

  const googleSignIn = async () => {
    setLoading(true);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const credential = GoogleAuthProvider.credentialFromResult(result);
      const token = credential?.accessToken || null;
      if (token) {
        setAccessToken(token);
      }
      
      const fbUser = result.user;
      const formattedUser = {
        uid: fbUser.uid,
        email: fbUser.email,
        displayName: fbUser.displayName,
        photoURL: fbUser.photoURL,
        isAnonymous: fbUser.isAnonymous,
        providerId: 'google.com'
      };
      
      updateUser(formattedUser);
      return { user: formattedUser, accessToken: token };
    } catch (e) {
      console.error('Google Sign-In Error:', e);
      throw e;
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    setLoading(true);
    try {
      await fbSignOut(auth);
    } catch (err) {
      console.error('Firebase Auth Sign out error:', err);
    }
    setAccessToken(null);
    setUser({
      uid: 'local-user',
      email: 'user@local.app',
      displayName: 'Guest User',
      photoURL: null,
      isAnonymous: true,
      providerId: 'guest'
    });
    localStorage.removeItem('serene_auth_user');
    localStorage.removeItem('serene_has_onboarded');
    setLoading(false);
  };

  return (
    <AuthContext.Provider value={{ user, loading, updateUser, signOut, googleSignIn, accessToken, setAccessToken }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
