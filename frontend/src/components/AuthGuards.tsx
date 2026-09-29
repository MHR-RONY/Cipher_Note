import { useNavigate } from "@tanstack/react-router";
import { useEffect, useState, type ReactNode } from "react";
import { demo } from "@/lib/demo";
import type { Role, User } from "@/lib/api";

export function useDemoUser() {
  const [user, setUser] = useState<User | null>(null);
  useEffect(() => { const sync = () => setUser(demo.session()); sync(); window.addEventListener("inkwell-session", sync); return () => window.removeEventListener("inkwell-session", sync); }, []);
  return user;
}

function Gate({ role, children }: { role: Role; children: ReactNode }) {
  const user = useDemoUser();
  const navigate = useNavigate();
  useEffect(() => {
    if (user?.role === role) return;
    void navigate({ to: role === "admin" ? "/admin/login" : "/login", search: { signedOut: user ? undefined : "1" }, replace: true });
  }, [navigate, role, user]);
  return user?.role === role ? <>{children}</> : null;
}

export function Protected({ children }: { children: ReactNode }) { return <Gate role="user">{children}</Gate>; }
export function AdminOnly({ children }: { children: ReactNode }) { return <Gate role="admin">{children}</Gate>; }
