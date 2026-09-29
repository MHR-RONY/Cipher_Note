import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AppShell, LoadingLine, PageTitle } from "@/components/AppShell";
import { adminApi } from "@/lib/api";
import type { InterestGroup } from "@/lib/api";
import { AdminOnly } from "@/components/AuthGuards";

export const Route = createFileRoute("/admin/interests")({
  head: () => ({
    meta: [
      { title: "Interests — CipherNote" },
      { name: "description", content: "Browse users grouped by interests." },
      { property: "og:title", content: "Interests — CipherNote" },
      { property: "og:description", content: "Browse users grouped by interests." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Interests,
});
function Interests() {
  const [groups, setGroups] = useState<InterestGroup[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    adminApi
      .interestGroups()
      .then(({ data }) => setGroups(data))
      .finally(() => setLoading(false));
  }, []);
  const totalAssignments = groups.reduce((total, group) => total + group.count, 0);
  return (
    <AdminOnly>
      <AppShell area="admin">
        <PageTitle eyebrow="DISCOVERY" title="Interest categories" />
        {loading ? (
          <LoadingLine>Loading interests</LoadingLine>
        ) : groups.length ? (
          <>
            <section className="admin-metrics interest-metrics">
              <article className="admin-metric">
                <p>Total categories</p>
                <strong>{groups.length}</strong>
                <small>Across the workspace</small>
              </article>
              <article className="admin-metric">
                <p>Interest selections</p>
                <strong>{totalAssignments}</strong>
                <small>Member preferences</small>
              </article>
              <article className="admin-metric">
                <p>Most followed</p>
                <strong>{groups[0]?.interest}</strong>
                <small>{groups[0]?.count} members</small>
              </article>
            </section>
            <section className="admin-panel interests-panel">
              <div className="panel-heading">
                <div>
                  <p className="panel-kicker">CATEGORY DIRECTORY</p>
                  <h2>Interest membership</h2>
                </div>
              </div>
              <div className="interest-groups">
                {groups.map((group) => (
                  <section key={group.interest}>
                    <div className="interest-group-heading">
                      <h2>{group.interest}</h2>
                      <span>
                        {group.count} {group.count === 1 ? "member" : "members"}
                      </span>
                    </div>
                    <ul>
                      {group.users.map((user) => (
                        <li key={user._id}>
                          <span className="member-avatar">{user.name.slice(0, 1)}</span>
                          <div>
                            <strong>{user.name}</strong>
                            <small>{user.email}</small>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </section>
                ))}
              </div>
            </section>
          </>
        ) : (
          <p className="empty-state">No interests found.</p>
        )}
      </AppShell>
    </AdminOnly>
  );
}
