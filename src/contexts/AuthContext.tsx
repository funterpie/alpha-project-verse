import React, { createContext, useContext, useState, useCallback } from 'react';
import { store, User } from '@/lib/store';

interface AuthContextType {
  user: User | null;
  login: (username: string, password: string) => boolean;
  logout: () => void;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('ao_currentUser');
    return saved ? JSON.parse(saved) : null;
  });

  const login = useCallback((username: string, password: string) => {
    const found = store.authenticate(username, password);
    if (found) {
      setUser(found);
      localStorage.setItem('ao_currentUser', JSON.stringify(found));
      store.addActivity({ userId: found.id, userName: found.displayName, action: 'Logged in' });
      return true;
    }
    return false;
  }, []);

  const logout = useCallback(() => {
    if (user) store.addActivity({ userId: user.id, userName: user.displayName, action: 'Logged out' });
    setUser(null);
    localStorage.removeItem('ao_currentUser');
  }, [user]);

  return (
    <AuthContext.Provider value={{ user, login, logout, isAdmin: user?.role === 'admin' }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
