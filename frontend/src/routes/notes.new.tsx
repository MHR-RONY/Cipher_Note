import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { AppShell, ErrorLine, PageTitle } from "@/components/AppShell";
import { Field, TextArea } from "@/components/Forms";
import { demo } from "@/lib/demo";
import { Protected } from "@/components/AuthGuards";

export const Route = createFileRoute("/notes/new")({ head: () => ({ meta: [{ title: "New note — CipherNote" }, { name: "description", content: "Create a new note." }, { property: "og:title", content: "New note — CipherNote" }, { property: "og:description", content: "Create a new note." }] }), component: CreateNotePage });
function CreateNotePage() { const navigate = useNavigate(); const [title, setTitle] = useState(""); const [content, setContent] = useState(""); const [error, setError] = useState(""); const [saving, setSaving] = useState(false); async function submit(event: React.FormEvent) { event.preventDefault(); if (!title.trim() || !content.trim()) { setError("A title and content are required."); return; } setSaving(true); await demo.createNote({ title, content }); void navigate({ to: "/notes" }); } return <Protected><AppShell area="user"><PageTitle title="New note"/><form className="form-stack editor-form" onSubmit={submit}>{error && <ErrorLine>{error}</ErrorLine>}<Field label="Title" value={title} onChange={(event) => setTitle(event.target.value)} required/><TextArea label="Content" value={content} onChange={(event) => setContent(event.target.value)} required rows={12}/><button className="button button-primary" disabled={saving}>{saving ? "Saving note" : "Save note"}</button></form></AppShell></Protected>; }
