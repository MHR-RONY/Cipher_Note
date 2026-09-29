import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AppShell, ErrorLine, LoadingLine, PageTitle } from "@/components/AppShell";
import { UserForm, type UserPayload } from "@/components/UserForm";
import { demo } from "@/lib/demo";
import type { User } from "@/lib/api";
import { AdminOnly } from "@/components/AuthGuards";

export const Route = createFileRoute("/admin/users/$id/edit")({ head: () => ({ meta: [{ title: "Edit user — CipherNote" }, { name: "description", content: "Edit a workspace user." }, { property: "og:title", content: "Edit user — CipherNote" }, { property: "og:description", content: "Edit a workspace user." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }] }), component: EditUser });
function EditUser() { const { id } = Route.useParams(); const navigate = useNavigate(); const [user, setUser] = useState<User | null>(null); useEffect(() => { demo.user(id).then(setUser); }, [id]); return <AdminOnly><AppShell area="admin"><PageTitle title="Edit user"/>{user ? <UserForm initial={user} submitLabel="Save user" onSubmit={async (data: UserPayload) => { await demo.updateUser(id, data); void navigate({ to: "/admin/users" }); }}/> : <><ErrorLine>User not found.</ErrorLine><LoadingLine>Loading user</LoadingLine></>}</AppShell></AdminOnly>; }
