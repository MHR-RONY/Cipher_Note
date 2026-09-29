import { Link, useNavigate } from "@tanstack/react-router";
import { ArrowRight, BookOpen, LockKeyhole, Sparkles } from "lucide-react";
import { useState } from "react";
import { Field } from "@/components/Forms";
import { useAuth } from "@/context/AuthContext";
import { ApiError } from "@/lib/api";

export function LoginPage({ signedOut }: { signedOut?: string | undefined }) {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setError("");
    try {
      await login(email, password);
      void navigate({ to: "/notes" });
    } catch (cause) {
      setError(
        cause instanceof ApiError
          ? cause.message
          : "Check your email and password, then try again.",
      );
    }
  }
  return (
    <div className="auth-reframe">
      <aside className="auth-showcase">
        <Link to="/" className="auth-logo">
          <span className="brand-mark">C</span>CIPHERNOTE
        </Link>
        <div className="auth-showcase-copy">
          <span className="auth-kicker">
            <Sparkles size={14} /> A private workspace
          </span>
          <h1>Make room for your best thinking.</h1>
          <p>
            Your notebook is a quiet space for rough ideas, small observations, and the work you
            want to return to.
          </p>
        </div>
        <div className="auth-feature-list">
          <span>
            <BookOpen size={16} /> Your notes, organised simply
          </span>
          <span>
            <LockKeyhole size={16} /> Only you can see your work
          </span>
        </div>
      </aside>
      <section className="auth-form-side">
        <div className="auth-form-wrap">
          <span className="auth-form-label">MEMBER ACCESS</span>
          <h2>Welcome back</h2>
          <p className="auth-intro">Sign in to continue to your private notebook.</p>
          {signedOut && (
            <div className="auth-alert" role="alert">
              <span>Signed out</span>
              <p>Sign in again to continue to CipherNote.</p>
            </div>
          )}
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
              Enter CipherNote <ArrowRight size={17} />
            </button>
          </form>
          <p className="auth-switch">
            New to CipherNote? <Link to="/register">Create your account</Link>
          </p>
        </div>
      </section>
    </div>
  );
}
