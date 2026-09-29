import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ErrorLine, LoadingLine, PageTitle } from "@/components/AppShell";
import { Pagination } from "@/components/Pagination";
import { adminApi } from "@/lib/api";
import type { PaginatedResponse, Post } from "@/lib/api";

export const Route = createFileRoute("/admin/users/$id/posts")({
  head: () => ({
    meta: [
      { title: "Member posts — CipherNote" },
      { name: "description", content: "Review one member's published posts." },
      { property: "og:title", content: "Member posts — CipherNote" },
      { property: "og:description", content: "Review one member's published posts." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: UserPosts,
});
function UserPosts() {
  const { id } = Route.useParams();
  const [page, setPage] = useState(1);
  const [result, setResult] = useState<({ name: string } & PaginatedResponse<Post>) | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    setLoading(true);
    adminApi
      .userPosts(id, page)
      .then(setResult)
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [id, page]);
  return (
    <>
      <PageTitle eyebrow="PEOPLE" title={result ? `${result.name}'s posts` : "Member posts"} />
      {notFound ? (
        <ErrorLine>That user could not be found.</ErrorLine>
      ) : loading ? (
        <LoadingLine>Loading posts</LoadingLine>
      ) : (
        result && (
          <section className="admin-panel admin-list-panel">
            {result.data.length ? (
              <div className="post-list">
                {result.data.map((post) => (
                  <article key={post._id}>
                    <div className="post-list-meta">
                      <span>POST</span>
                      <time>
                        {new Date(post.createdAt).toLocaleDateString(undefined, {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </time>
                    </div>
                    <h3>{post.title}</h3>
                    <p>{post.body}</p>
                  </article>
                ))}
              </div>
            ) : (
              <p className="empty-state">This member has not published any posts.</p>
            )}
            <Pagination pagination={result.pagination} onPage={setPage} />
          </section>
        )
      )}
      <p>
        <Link to="/admin/users" className="text-link">
          Back to members
        </Link>
      </p>
    </>
  );
}
