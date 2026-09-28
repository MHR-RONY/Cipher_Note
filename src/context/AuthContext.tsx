import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { api, clearSession, getStoredToken, getStoredUser, saveSession, type User } from "@/lib/api";

interface AuthContextValue {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<User>;
  register: (data: { name: string; email: string; password: string; interests: string[] }) => Promise<User>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedToken = getStoredToken();
    setToken(storedToken);
    setUser(getStoredUser());
    if (!storedToken) { setLoading(false); return; }
    api.me().then(({ user: restored }) => { setUser(restored); saveSession(storedToken, restored); }).catch(() => { clearSession(); setToken(null); setUser(null); }).finally(() => setLoading(false));
  }, []);

  async function authenticate(action: Promise<{ token: string; user: User }>) {
    const session = await action;
    saveSession(session.token, session.user);
    setToken(session.token);
    setUser(session.user);
    return session.user;
  }

  return <AuthContext.Provider value={{ user, token, loading, login: (email, password) => authenticate(api.login(email, password)), register: (data) => authenticate(api.register(data)), logout: () => { clearSession(); setToken(null); setUser(null); } }}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
}
