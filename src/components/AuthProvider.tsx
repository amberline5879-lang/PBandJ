import React, { createContext, useContext, useState } from 'react';

interface AuthContextType {
  user: any;
  loading: boolean;
  signIn: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<any>({
    uid: 'local-user',
    email: 'user@local.app',
    displayName: 'User',
    photoURL: null,
    isAnonymous: true
  });
  const [loading, setLoading] = useState(false);

  return (
    <AuthContext.Provider value={{ user, loading, signIn: async () => {}, signOut: async () => {} }}>
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
