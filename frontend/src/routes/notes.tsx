import { createFileRoute, Link, Outlet, useRouterState } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AppShell, LoadingLine, PageTitle } from "@/components/AppShell";
import { NoteRows } from "@/components/Notes";
import { Pagination } from "@/components/Pagination";
import { userApi } from "@/lib/api";
import type { Note, PaginatedResponse } from "@/lib/api";
import { Protected } from "@/components/AuthGuards";

export const Route = createFileRoute("/notes")({
  head: () => ({
    meta: [
      { title: "Notes — CipherNote" },
      { name: "description", content: "Review and edit your personal CipherNote notes." },
      { property: "og:title", content: "Notes — CipherNote" },
      { property: "og:description", content: "Review and edit your personal CipherNote notes." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Notes,
});

function Notes() {
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const [page, setPage] = useState(1);
  const [result, setResult] = useState<PaginatedResponse<Note> | null>(null);
  const [loading, setLoading] = useState(true);
  const [notePendingDelete, setNotePendingDelete] = useState<Note | null>(null);
  const [deleting, setDeleting] = useState(false);
  const load = () => {
    setLoading(true);
    userApi
      .notes(page)
      .then(setResult)
      .finally(() => setLoading(false));
  };
  const isNotesIndex = pathname === "/notes";
  useEffect(load, [page, isNotesIndex]);
  async function remove() {
    if (!notePendingDelete) return;
    setDeleting(true);
    await userApi.deleteNote(notePendingDelete._id);
    setNotePendingDelete(null);
    setDeleting(false);
    load();
  }
  return (
    <Protected>
      <AppShell area="user">
        {!isNotesIndex ? (
          <Outlet />
        ) : (
          <>
            <PageTitle
              eyebrow="PERSONAL SPACE"
              title="Notes"
              action={
                <Link className="button button-primary" to="/notes/new">
                  New note
                </Link>
              }
            />
            {loading ? (
              <LoadingLine>Loading notes</LoadingLine>
            ) : (
              result && (
                <>
                  <NoteRows
                    notes={result.data}
                    onDelete={(id) =>
                      setNotePendingDelete(result.data.find((note) => note._id === id) ?? null)
                    }
                  />
                  <Pagination pagination={result.pagination} onPage={setPage} />
                </>
              )
            )}
            {notePendingDelete && (
              <div className="confirm-backdrop" role="presentation">
                <section
                  className="confirm-dialog"
                  role="alertdialog"
                  aria-modal="true"
                  aria-labelledby="delete-note-title"
                  aria-describedby="delete-note-description"
                >
                  <p className="panel-kicker">REMOVE NOTE</p>
                  <h2 id="delete-note-title">Delete “{notePendingDelete.title}”?</h2>
                  <p id="delete-note-description">
                    This permanently removes the note from your private workspace.
                  </p>
                  <div className="confirm-actions">
                    <button
                      className="button button-secondary"
                      type="button"
                      onClick={() => setNotePendingDelete(null)}
                      disabled={deleting}
                    >
                      Keep note
                    </button>
                    <button
                      className="button button-danger"
                      type="button"
                      onClick={remove}
                      disabled={deleting}
                    >
                      {deleting ? "Deleting…" : "Delete note"}
                    </button>
                  </div>
                </section>
              </div>
            )}
          </>
        )}
      </AppShell>
    </Protected>
  );
}
