import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { LoginPage } from "@/components/LoginPage";
import { useAuth } from "@/context/AuthContext";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "CipherNote" },
      { name: "description", content: "Sign in to your private CipherNote notes." },
      { property: "og:title", content: "CipherNote" },
      { property: "og:description", content: "Sign in to your private CipherNote notes." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Home,
});

function Home() {
  const { user, userLoading } = useAuth();
  const navigate = useNavigate();
  useEffect(() => {
    if (!userLoading && user) void navigate({ to: "/notes", replace: true });
  }, [navigate, user, userLoading]);
  if (userLoading || user) return null;
  return <LoginPage />;
}
