import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowRight, BarChart3, ShieldCheck, Users } from "lucide-react";
import { useEffect, useState } from "react";
import { Field } from "@/components/Forms";
import { useAuth } from "@/context/AuthContext";
import { adminApi, ApiError } from "@/lib/api";

export const Route = createFileRoute("/admin/setup")({ head: () => ({ meta: [{ title: "Set up the workspace — CipherNote" }, { name: "description", content: "Create the first administrator account for this CipherNote workspace." }, { property: "og:title", content: "Set up the workspace — CipherNote" }, { property: "og:description", content: "Create the first administrator account for this CipherNote workspace." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }] }), component: AdminSetup });

function AdminSetup() {
  const navigate = useNavigate();
  const { admin, adminLoading, adminSetup } = useAuth();
  const [checking, setChecking] = useState(true);
  const [required, setRequired] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [setupKey, setSetupKey] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    adminApi
      .setupStatus()
      .then(({ required: stillRequired }) => {
        setRequired(stillRequired);
        if (!stillRequired) void navigate({ to: "/admin/login", replace: true });
      })
      .finally(() => setChecking(false));
  }, [navigate]);

  useEffect(() => {
    if (!adminLoading && admin) void navigate({ to: "/admin/overview", replace: true });
  }, [navigate, admin, adminLoading]);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setError("");
    setSaving(true);
    try {
      await adminSetup({ name, email, password, setupKey });
      void navigate({ to: "/admin/overview", replace: true });
    } catch (cause) {
      setError(cause instanceof ApiError ? cause.message : "Unable to complete setup.");
    } finally {
      setSaving(false);
    }
  }

  if (checking || !required) return null;

  return <div className="auth-reframe admin-auth"><aside className="auth-showcase"><Link to="/" className="auth-logo"><span className="brand-mark">C</span>CIPHERNOTE <em>ADMIN</em></Link><div className="auth-showcase-copy"><span className="auth-kicker"><ShieldCheck size={14} /> First-time setup</span><h1>Create the first administrator.</h1><p>This workspace has no administrator yet. Set one up once, using the setup key from the server's environment.</p></div><div className="auth-stats"><div><BarChart3 size={18} /><strong>Live overview</strong><span>Notes and activity at a glance</span></div><div><Users size={18} /><strong>Member control</strong><span>Manage access with confidence</span></div></div></aside><section className="auth-form-side"><div className="auth-form-wrap"><span className="auth-form-label">WORKSPACE SETUP</span><h2>Create the administrator account</h2><p className="auth-intro">This runs once. After this the setup page turns itself off.</p><form className="form-stack auth-form" onSubmit={submit}>{error && <div className="error-line">{error}</div>}<Field label="Name" value={name} onChange={(event) => setName(event.target.value)} autoComplete="name" required/><Field label="Email address" type="email" value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="email" required/><Field label="Password" type="password" value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="new-password" minLength={8} required/><Field label="Setup key" type="password" value={setupKey} onChange={(event) => setSetupKey(event.target.value)} autoComplete="off" required/><button className="button button-primary auth-submit" disabled={saving}>{saving ? "Creating" : "Create administrator"} <ArrowRight size={17} /></button></form><p className="auth-switch"><Link to="/login" search={{ signedOut: undefined }}>Return to member sign in</Link></p></div></section></div>;
}
