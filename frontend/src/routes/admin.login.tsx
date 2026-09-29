import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowRight, BarChart3, ShieldCheck, Users } from "lucide-react";
import { useEffect, useState } from "react";
import { Field } from "@/components/Forms";
import { useAuth } from "@/context/AuthContext";
import { adminApi, ApiError } from "@/lib/api";

export const Route = createFileRoute("/admin/login")({
  head: () => ({
    meta: [
      { title: "Administrator sign in — CipherNote" },
      { name: "description", content: "Sign in to manage the CipherNote workspace." },
      { property: "og:title", content: "Administrator sign in — CipherNote" },
      { property: "og:description", content: "Sign in to manage the CipherNote workspace." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AdminLogin,
});

function AdminLogin() {
  const navigate = useNavigate();
  const { adminLogin } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [checked, setChecked] = useState(false);
  useEffect(() => {
    adminApi
      .setupStatus()
      .then(({ required }) => {
        if (required) void navigate({ to: "/admin/setup", replace: true });
      })
      .finally(() => setChecked(true));
  }, [navigate]);
  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setError("");
    try {
      await adminLogin(email, password);
      void navigate({ to: "/admin/overview" });
    } catch (cause) {
      setError(
        cause instanceof ApiError
          ? cause.message
          : "Check your administrator email and password, then try again.",
      );
    }
  }
  if (!checked) return null;
  return (
    <div className="auth-reframe admin-auth">
      <aside className="auth-showcase">
        <Link to="/" className="auth-logo">
          <span className="brand-mark">C</span>CIPHERNOTE <em>ADMIN</em>
        </Link>
        <div className="auth-showcase-copy">
          <span className="auth-kicker">
            <ShieldCheck size={14} /> Administration workspace
          </span>
          <h1>See the work. Keep it moving.</h1>
          <p>
            One focused place to review writing, understand the people in your workspace, and keep
            the system tidy.
          </p>
        </div>
        <div className="auth-stats">
          <div>
            <BarChart3 size={18} />
            <strong>Live overview</strong>
            <span>Notes and activity at a glance</span>
          </div>
          <div>
            <Users size={18} />
            <strong>Member control</strong>
            <span>Manage access with confidence</span>
          </div>
        </div>
      </aside>
      <section className="auth-form-side">
        <div className="auth-form-wrap">
          <span className="auth-form-label">ADMINISTRATOR ACCESS</span>
          <h2>Enter the console</h2>
          <p className="auth-intro">Use your administrator details to continue.</p>
          <form className="form-stack auth-form" onSubmit={submit}>
            {error && <div className="error-line">{error}</div>}
            <Field
              label="Email address"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              autoComplete="email"
              required
            />
            <Field
              label="Password"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete="current-password"
              required
            />
            <button className="button button-primary auth-submit">
              Open admin console <ArrowRight size={17} />
            </button>
          </form>
          <p className="auth-switch">
            <Link to="/login" search={{ signedOut: undefined }}>
              Return to member sign in
            </Link>
          </p>
        </div>
      </section>
    </div>
  );
}
