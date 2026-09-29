import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import {
  adminApi,
  clearAdminSession,
  clearUserSession,
  getStoredAdmin,
  getStoredAdminToken,
  getStoredUser,
  getStoredUserToken,
  saveAdminSession,
  saveUserSession,
  userApi,
  type Admin,
  type User,
} from "@/lib/api";

interface AuthContextValue {
  user: User | null;
  userLoading: boolean;
  login: (email: string, password: string) => Promise<User>;
  register: (data: {
    name: string;
    email: string;
    password: string;
    interests: string[];
  }) => Promise<User>;
  logout: () => void;
  admin: Admin | null;
  adminLoading: boolean;
  adminLogin: (email: string, password: string) => Promise<Admin>;
  adminSetup: (data: { name: string; email: string; password: string; setupKey: string }) => Promise<Admin>;
  adminLogout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [userLoading, setUserLoading] = useState(true);
  const [admin, setAdmin] = useState<Admin | null>(null);
  const [adminLoading, setAdminLoading] = useState(true);

  useEffect(() => {
    setUser(getStoredUser());
    const token = getStoredUserToken();
    if (!token) {
      setUserLoading(false);
      return;
    }
    userApi
      .me()
      .then(({ user: restored }) => {
        setUser(restored);
        saveUserSession(token, restored);
      })
      .catch(() => {
        clearUserSession();
        setUser(null);
      })
      .finally(() => setUserLoading(false));
  }, []);

  useEffect(() => {
    setAdmin(getStoredAdmin());
    const token = getStoredAdminToken();
    if (!token) {
      setAdminLoading(false);
      return;
    }
    adminApi
      .me()
      .then(({ admin: restored }) => {
        setAdmin(restored);
        saveAdminSession(token, restored);
      })
      .catch(() => {
        clearAdminSession();
        setAdmin(null);
      })
      .finally(() => setAdminLoading(false));
  }, []);

  async function authenticateUser(action: Promise<{ token: string; user: User }>) {
    const session = await action;
    saveUserSession(session.token, session.user);
    setUser(session.user);
    return session.user;
  }

  async function authenticateAdmin(action: Promise<{ token: string; admin: Admin }>) {
    const session = await action;
    saveAdminSession(session.token, session.admin);
    setAdmin(session.admin);
    return session.admin;
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        userLoading,
        login: (email, password) => authenticateUser(userApi.login(email, password)),
        register: (data) => authenticateUser(userApi.register(data)),
        logout: () => {
          clearUserSession();
          setUser(null);
        },
        admin,
        adminLoading,
        adminLogin: (email, password) => authenticateAdmin(adminApi.login(email, password)),
        adminSetup: (data) => authenticateAdmin(adminApi.setup(data)),
        adminLogout: () => {
          clearAdminSession();
          setAdmin(null);
        },
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
}
