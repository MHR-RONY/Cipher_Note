import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ErrorLine, LoadingLine, PageTitle } from "@/components/AppShell";
import { UserForm, type UserPayload } from "@/components/UserForm";
import { adminApi } from "@/lib/api";
import type { User } from "@/lib/api";

export const Route = createFileRoute("/admin/users/$id/edit")({
  head: () => ({
    meta: [
      { title: "Edit user — CipherNote" },
      { name: "description", content: "Edit a workspace user." },
      { property: "og:title", content: "Edit user — CipherNote" },
      { property: "og:description", content: "Edit a workspace user." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: EditUser,
});
function EditUser() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [notFound, setNotFound] = useState(false);
  useEffect(() => {
    adminApi
      .user(id)
      .then(({ user: found }) => setUser(found))
      .catch(() => setNotFound(true));
  }, [id]);
  return (
    <>
      <PageTitle title="Edit user" />
      {notFound ? (
        <ErrorLine>User not found.</ErrorLine>
      ) : user ? (
        <UserForm
          initial={user}
          submitLabel="Save user"
          onSubmit={async (data: UserPayload) => {
            await adminApi.updateUser(id, {
              name: data.name,
              email: data.email,
              interests: data.interests,
              ...(data.password ? { password: data.password } : {}),
            });
            void navigate({ to: "/admin/users" });
          }}
        />
      ) : (
        <LoadingLine>Loading user</LoadingLine>
      )}
    </>
  );
}
