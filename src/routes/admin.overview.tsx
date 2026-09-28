import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { FileText, Tags, Users } from "lucide-react";
import { AdminOnly } from "@/components/AuthGuards";
import { AppShell, LoadingLine, PageTitle } from "@/components/AppShell";
import { demo, type DemoWorkspace } from "@/lib/demo";

export const Route = createFileRoute("/admin/overview")({
  head: () => ({ meta: [{ title: "Admin overview — CipherNote" }, { name: "description", content: "Workspace activity and management overview." }, { property: "og:title", content: "Admin overview — CipherNote" }, { property: "og:description", content: "Workspace activity and management overview." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }] }),
  component: Overview,
});

function Overview() {
  const [workspace, setWorkspace] = useState<DemoWorkspace | null>(null);
  useEffect(() => { demo.workspace().then(setWorkspace); }, []);
  if (!workspace) return <AdminOnly><AppShell area="admin"><LoadingLine>Loading workspace</LoadingLine></AppShell></AdminOnly>;
  const recentNotes = [...workspace.notes].sort((a, b) => +new Date(b.updatedAt) - +new Date(a.updatedAt)).slice(0, 4);
  const activeMembers = workspace.users.filter((user) => user.role === "user");
  const interestCount = new Set(workspace.users.flatMap((user) => user.interests)).size;
  const metrics = [{ label: "Workspace members", value: workspace.users.length, detail: `${activeMembers.length} member accounts`, icon: Users }, { label: "Published notes", value: workspace.notes.length, detail: "Across the workspace", icon: FileText }, { label: "Interest areas", value: interestCount, detail: "Shared by members", icon: Tags }, { label: "Weekly activity", value: `${workspace.notes.filter((note) => Date.now() - +new Date(note.updatedAt) < 7 * 86400000).length}`, detail: "Notes updated this week", icon: FileText }];
  return <AdminOnly><AppShell area="admin"><PageTitle eyebrow="WORKSPACE" title="Overview" action={<Link className="button button-primary" to="/admin/users/new">Add member</Link>}/><section className="admin-metrics">{metrics.map(({ label, value, detail, icon: Icon }) => <article className="admin-metric" key={label}><span className="metric-icon"><Icon size={17} /></span><p>{label}</p><strong>{value}</strong><small>{detail}</small></article>)}</section><section className="admin-overview-grid"><article className="admin-panel"><div className="panel-heading"><div><p className="panel-kicker">RECENT ACTIVITY</p><h2>Recently updated notes</h2></div><Link to="/admin/notes" className="panel-link">View all</Link></div><div className="recent-notes">{recentNotes.map((note) => <div key={note._id} className="recent-note"><div><strong>{note.title}</strong><p>{note.content}</p></div><span>{note.owner?.name ?? "Unknown"}</span></div>)}</div></article><article className="admin-panel"><div className="panel-heading"><div><p className="panel-kicker">PEOPLE</p><h2>Members</h2></div><Link to="/admin/users" className="panel-link">Manage</Link></div><div className="member-list">{activeMembers.map((member) => <div key={member._id} className="member-row"><span className="member-avatar">{member.name.slice(0, 1)}</span><div><strong>{member.name}</strong><small>{member.email}</small></div><span className="member-interest-count">{member.interests.length} interests</span></div>)}</div></article></section></AppShell></AdminOnly>;
}