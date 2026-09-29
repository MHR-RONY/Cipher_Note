import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AppShell, LoadingLine, PageTitle } from "@/components/AppShell";
import { Field } from "@/components/Forms";
import { NoteRows } from "@/components/Notes";
import { Pagination } from "@/components/Pagination";
import { adminApi } from "@/lib/api";
import type { Note, PaginatedResponse } from "@/lib/api";
import { AdminOnly } from "@/components/AuthGuards";

export const Route = createFileRoute("/admin/notes")({
  head: () => ({
    meta: [
      { title: "All notes — CipherNote" },
      { name: "description", content: "Review notes across the workspace." },
      { property: "og:title", content: "All notes — CipherNote" },
      { property: "og:description", content: "Review notes across the workspace." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AdminNotes,
});
function AdminNotes() {
  const [filter, setFilter] = useState("");
  const [activeFilter, setActiveFilter] = useState("");
  const [page, setPage] = useState(1);
  const [result, setResult] = useState<PaginatedResponse<Note> | null>(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    setLoading(true);
    adminApi
      .notes(page, activeFilter || undefined)
      .then(setResult)
      .finally(() => setLoading(false));
  }, [page, activeFilter]);
  return (
    <AdminOnly>
      <AppShell area="admin">
        <PageTitle eyebrow="CONTENT" title="All notes" />
        <section className="admin-panel admin-list-panel">
          <form
            className="filter-row"
            onSubmit={(event) => {
              event.preventDefault();
              setActiveFilter(filter);
              setPage(1);
            }}
          >
            <Field
              label="Filter by user ID"
              value={filter}
              onChange={(event) => setFilter(event.target.value)}
              placeholder="User ID"
            />
            <button className="button button-secondary">Filter</button>
          </form>
          {loading ? (
            <LoadingLine>Loading notes</LoadingLine>
          ) : (
            result && (
              <>
                <NoteRows notes={result.data} admin />
                <Pagination pagination={result.pagination} onPage={setPage} />
              </>
            )
          )}
        </section>
      </AppShell>
    </AdminOnly>
  );
}
