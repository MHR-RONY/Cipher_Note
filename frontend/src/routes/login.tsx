import { createFileRoute } from "@tanstack/react-router";
import { LoginPage } from "@/components/LoginPage";

export const Route = createFileRoute("/login")({
  validateSearch: (search: Record<string, unknown>) => ({
    signedOut: search["signedOut"] === "1" ? "1" : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Member sign in — CipherNote" },
      { name: "description", content: "Sign in to your private CipherNote notes." },
      { property: "og:title", content: "Member sign in — CipherNote" },
      { property: "og:description", content: "Sign in to your private CipherNote notes." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Login,
});

function Login() {
  const { signedOut } = Route.useSearch();
  return <LoginPage signedOut={signedOut} />;
}
