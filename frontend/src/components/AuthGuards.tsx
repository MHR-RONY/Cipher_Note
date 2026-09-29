import { useNavigate } from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";
import { useAuth } from "@/context/AuthContext";

export function Protected({ children }: { children: ReactNode }) {
  const { user, userLoading } = useAuth();
  const navigate = useNavigate();
  useEffect(() => {
    if (userLoading || user) return;
    void navigate({ to: "/login", search: { signedOut: "1" }, replace: true });
  }, [navigate, user, userLoading]);
  if (userLoading) return null;
  return user ? <>{children}</> : null;
}

export function AdminOnly({ children }: { children: ReactNode }) {
  const { admin, adminLoading } = useAuth();
  const navigate = useNavigate();
  useEffect(() => {
    if (adminLoading || admin) return;
    void navigate({ to: "/admin/login", replace: true });
  }, [navigate, admin, adminLoading]);
  if (adminLoading) return null;
  return admin ? <>{children}</> : null;
}
