import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { AppShell, PageTitle } from "@/components/AppShell";
import { UserForm, type UserPayload } from "@/components/UserForm";
import { demo } from "@/lib/demo";
import { AdminOnly } from "@/components/AuthGuards";

export const Route = createFileRoute("/admin/users/new")({ head: () => ({ meta: [{ title: "Add user — CipherNote" }, { name: "description", content: "Add a workspace user." }, { property: "og:title", content: "Add user — CipherNote" }, { property: "og:description", content: "Add a workspace user." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }] }), component: NewUser });
function NewUser() { const navigate = useNavigate(); return <AdminOnly><AppShell area="admin"><PageTitle title="Add user"/><UserForm submitLabel="Add user" onSubmit={async (data: UserPayload) => { await demo.createUser(data); void navigate({ to: "/admin/users" }); }}/></AppShell></AdminOnly>; }
