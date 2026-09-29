import { createFileRoute, Link, Outlet, useRouterState } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AppShell, LoadingLine, PageTitle } from "@/components/AppShell";
import { Pagination } from "@/components/Pagination";
import { adminApi } from "@/lib/api";
import type { PaginatedResponse, User } from "@/lib/api";
import { Pencil, Trash2 } from "lucide-react";
import { AdminOnly } from "@/components/AuthGuards";

export const Route = createFileRoute("/admin/users")({
  head: () => ({
    meta: [
      { title: "Users — CipherNote" },
      { name: "description", content: "Manage workspace users." },
      { property: "og:title", content: "Users — CipherNote" },
      { property: "og:description", content: "Manage workspace users." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Users,
});
function Users() {
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const [page, setPage] = useState(1);
  const [result, setResult] = useState<PaginatedResponse<User> | null>(null);
  const [loading, setLoading] = useState(true);
  const isUsersIndex = pathname === "/admin/users";
  const load = () => {
    setLoading(true);
    adminApi
      .users(page)
      .then(setResult)
      .finally(() => setLoading(false));
  };
  useEffect(load, [page, isUsersIndex]);
  async function remove(id: string) {
    if (window.confirm("Delete this user, their notes, and their posts?")) {
      await adminApi.deleteUser(id);
      load();
    }
  }
  if (!isUsersIndex)
    return (
      <AdminOnly>
        <AppShell area="admin">
          <Outlet />
        </AppShell>
      </AdminOnly>
    );
  return (
    <AdminOnly>
      <AppShell area="admin">
        <PageTitle
          eyebrow="PEOPLE"
          title="Members"
          action={
            <Link to="/admin/users/new" className="button button-primary">
              Add member
            </Link>
          }
        />
        {loading ? (
          <LoadingLine>Loading users</LoadingLine>
        ) : (
          result && (
            <section className="admin-panel admin-list-panel">
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Email</th>
                      <th>Interests</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.data.map((user) => (
                      <tr key={user._id}>
                        <td>{user.name}</td>
                        <td>{user.email}</td>
                        <td>{user.interests.join(", ") || "—"}</td>
                        <td className="table-actions">
                          <Link
                            to="/admin/users/$id/posts"
                            params={{ id: user._id }}
                            className="text-link"
                          >
                            Posts
                          </Link>
                          <Link
                            className="icon-button"
                            to="/admin/users/$id/edit"
                            params={{ id: user._id }}
                            title="Edit"
                            aria-label={`Edit ${user.name}`}
                          >
                            <Pencil size={15} strokeWidth={1.5} />
                          </Link>
                          <button
                            className="icon-button danger-action"
                            type="button"
                            title="Delete"
                            aria-label={`Delete ${user.name}`}
                            onClick={() => remove(user._id)}
                          >
                            <Trash2 size={15} strokeWidth={1.5} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <Pagination pagination={result.pagination} onPage={setPage} />
            </section>
          )
        )}
      </AppShell>
    </AdminOnly>
  );
}
