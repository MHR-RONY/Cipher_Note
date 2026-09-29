import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { PageTitle } from "@/components/AppShell";
import { UserForm, type UserPayload } from "@/components/UserForm";
import { adminApi } from "@/lib/api";

export const Route = createFileRoute("/admin/users/new")({
  head: () => ({
    meta: [
      { title: "Add user — CipherNote" },
      { name: "description", content: "Add a workspace user." },
      { property: "og:title", content: "Add user — CipherNote" },
      { property: "og:description", content: "Add a workspace user." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: NewUser,
});
function NewUser() {
  const navigate = useNavigate();
  return (
    <>
      <PageTitle title="Add user" />
      <UserForm
        submitLabel="Add user"
        onSubmit={async (data: UserPayload) => {
          await adminApi.createUser({
            name: data.name,
            email: data.email,
            password: data.password ?? "",
            interests: data.interests,
          });
          void navigate({ to: "/admin/users" });
        }}
      />
    </>
  );
}
