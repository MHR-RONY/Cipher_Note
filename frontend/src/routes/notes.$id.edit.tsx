import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ErrorLine, LoadingLine, PageTitle } from "@/components/AppShell";
import { Field, TextArea } from "@/components/Forms";
import { userApi, ApiError } from "@/lib/api";

export const Route = createFileRoute("/notes/$id/edit")({
  head: () => ({
    meta: [
      { title: "Edit note — CipherNote" },
      { name: "description", content: "Edit a note in CipherNote." },
      { property: "og:title", content: "Edit note — CipherNote" },
      { property: "og:description", content: "Edit a note in CipherNote." },
    ],
  }),
  component: EditNote,
});
function EditNote() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  useEffect(() => {
    userApi
      .note(id)
      .then((note) => {
        setTitle(note.title);
        setContent(note.content);
      })
      .catch(() => setError("That note could not be found."))
      .finally(() => setLoading(false));
  }, [id]);
  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!title.trim() || !content.trim()) {
      setError("A title and content are required.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      await userApi.updateNote(id, { title, content });
      void navigate({ to: "/notes" });
    } catch (cause) {
      setError(cause instanceof ApiError ? cause.message : "Unable to save the note.");
    } finally {
      setSaving(false);
    }
  }
  return (
    <>
      <PageTitle title="Edit note" />
      {loading ? (
        <LoadingLine>Loading note</LoadingLine>
      ) : (
        <form className="form-stack editor-form" onSubmit={submit}>
          {error && <ErrorLine>{error}</ErrorLine>}
          <Field
            label="Title"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            required
          />
          <TextArea
            label="Content"
            value={content}
            onChange={(event) => setContent(event.target.value)}
            required
            rows={12}
          />
          <button className="button button-primary" disabled={saving || Boolean(error)}>
            {saving ? "Saving note" : "Save note"}
          </button>
        </form>
      )}
    </>
  );
}
