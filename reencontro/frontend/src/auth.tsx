import { createContext, ReactNode, useCallback, useContext, useEffect, useState } from 'react';
import { api } from './api';
import { User } from './types';

interface Ctx {
  user: User | null; loading: boolean;
  login(email: string, password: string): Promise<void>;
  register(data: Record<string, unknown>): Promise<{ pendingApproval?: boolean; message?: string }>;
  logout(): void; refresh(): Promise<void>;
}
const AuthCtx = createContext<Ctx>(null as any);
export const useAuth = () => useContext(AuthCtx);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!localStorage.getItem('token')) { setUser(null); return; }
    try { setUser((await api.get('/auth/me')).data); } catch { localStorage.removeItem('token'); setUser(null); }
  }, []);
  useEffect(() => { refresh().finally(() => setLoading(false)); }, [refresh]);

  const login = async (email: string, password: string) => {
    const { data } = await api.post('/auth/login', { email, password });
    localStorage.setItem('token', data.token); setUser(data.user);
  };
  const register = async (payload: Record<string, unknown>) => {
    const { data } = await api.post('/auth/register', payload);
    if (data.token) { localStorage.setItem('token', data.token); setUser(data.user); }
    return data;
  };
  const logout = () => { localStorage.removeItem('token'); setUser(null); };
  return <AuthCtx.Provider value={{ user, loading, login, register, logout, refresh }}>{children}</AuthCtx.Provider>;
}
