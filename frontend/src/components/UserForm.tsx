import { useState } from "react";
import { Field } from "@/components/Forms";
import type { User } from "@/lib/api";

export interface UserPayload {
  name: string;
  email: string;
  password?: string;
  interests: string[];
}
export function UserForm({
  initial,
  onSubmit,
  submitLabel,
}: {
  initial?: User;
  onSubmit: (data: UserPayload) => Promise<void>;
  submitLabel: string;
}) {
  const [name, setName] = useState(initial?.name || "");
  const [email, setEmail] = useState(initial?.email || "");
  const [password, setPassword] = useState("");
  const [interests, setInterests] = useState(initial?.interests.join(", ") || "");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!name || !email || (!initial && password.length < 8)) {
      setError("Enter a name, valid email, and a password of at least 8 characters.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      await onSubmit({
        name,
        email,
        ...(password ? { password } : {}),
        interests: interests
          .split(",")
          .map((value) => value.trim())
          .filter(Boolean),
      });
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to save user.");
    } finally {
      setSaving(false);
    }
  }
  return (
    <form className="form-stack" onSubmit={submit}>
      {error && <div className="error-line">{error}</div>}
      <Field label="Name" value={name} onChange={(event) => setName(event.target.value)} required />
      <Field
        label="Email"
        type="email"
        value={email}
        onChange={(event) => setEmail(event.target.value)}
        required
      />
      <Field
        label={`Password${initial ? " (leave blank to keep current)" : ""}`}
        type="password"
        value={password}
        onChange={(event) => setPassword(event.target.value)}
        required={!initial}
        minLength={initial ? undefined : 8}
      />
      <Field
        label="Interests"
        value={interests}
        onChange={(event) => setInterests(event.target.value)}
        placeholder="Reading, design"
      />
      <button className="button button-primary" disabled={saving}>
        {saving ? "Saving" : submitLabel}
      </button>
    </form>
  );
}
