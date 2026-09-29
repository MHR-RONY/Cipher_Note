import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { FileText, Users } from "lucide-react";
import { AdminOnly } from "@/components/AuthGuards";
import { AppShell, LoadingLine, PageTitle } from "@/components/AppShell";
import { adminApi } from "@/lib/api";
import type { Note, User } from "@/lib/api";

export const Route = createFileRoute("/admin/overview")({
  head: () => ({
    meta: [
      { title: "Admin overview — CipherNote" },
      { name: "description", content: "Workspace activity and management overview." },
      { property: "og:title", content: "Admin overview — CipherNote" },
      { property: "og:description", content: "Workspace activity and management overview." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Overview,
});

function Overview() {
  const [members, setMembers] = useState<User[] | null>(null);
  const [memberTotal, setMemberTotal] = useState(0);
  const [recentNotes, setRecentNotes] = useState<Note[] | null>(null);
  const [noteTotal, setNoteTotal] = useState(0);

  useEffect(() => {
    adminApi.users(1).then(({ data, pagination }) => {
      setMembers(data);
      setMemberTotal(pagination.total);
    });
    adminApi.notes(1).then(({ data, pagination }) => {
      setRecentNotes(data);
      setNoteTotal(pagination.total);
    });
  }, []);

  if (!members || !recentNotes)
    return (
      <AdminOnly>
        <AppShell area="admin">
          <LoadingLine>Loading workspace</LoadingLine>
        </AppShell>
      </AdminOnly>
    );

  const metrics = [
    { label: "Workspace members", value: memberTotal, detail: "Registered accounts", icon: Users },
    { label: "Published notes", value: noteTotal, detail: "Across the workspace", icon: FileText },
  ];

  return (
    <AdminOnly>
      <AppShell area="admin">
        <PageTitle
          eyebrow="WORKSPACE"
          title="Overview"
          action={
            <Link className="button button-primary" to="/admin/users/new">
              Add member
            </Link>
          }
        />
        <section className="admin-metrics">
          {metrics.map(({ label, value, detail, icon: Icon }) => (
            <article className="admin-metric" key={label}>
              <span className="metric-icon">
                <Icon size={17} />
              </span>
              <p>{label}</p>
              <strong>{value}</strong>
              <small>{detail}</small>
            </article>
          ))}
        </section>
        <section className="admin-overview-grid">
          <article className="admin-panel">
            <div className="panel-heading">
              <div>
                <p className="panel-kicker">RECENT ACTIVITY</p>
                <h2>Recently updated notes</h2>
              </div>
              <Link to="/admin/notes" className="panel-link">
                View all
              </Link>
            </div>
            <div className="recent-notes">
              {recentNotes.map((note) => (
                <div key={note._id} className="recent-note">
                  <div>
                    <strong>{note.title}</strong>
                    <p>{note.content}</p>
                  </div>
                  <span>{note.owner?.name ?? "Unknown"}</span>
                </div>
              ))}
            </div>
          </article>
          <article className="admin-panel">
            <div className="panel-heading">
              <div>
                <p className="panel-kicker">PEOPLE</p>
                <h2>Members</h2>
              </div>
              <Link to="/admin/users" className="panel-link">
                Manage
              </Link>
            </div>
            <div className="member-list">
              {members.map((member) => (
                <div key={member._id} className="member-row">
                  <span className="member-avatar">{member.name.slice(0, 1)}</span>
                  <div>
                    <strong>{member.name}</strong>
                    <small>{member.email}</small>
                  </div>
                  <span className="member-interest-count">{member.interests.length} interests</span>
                </div>
              ))}
            </div>
          </article>
        </section>
      </AppShell>
    </AdminOnly>
  );
}
