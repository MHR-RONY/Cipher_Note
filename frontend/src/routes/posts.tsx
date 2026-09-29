import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AppShell, ErrorLine, LoadingLine, PageTitle } from "@/components/AppShell";
import { Field, TextArea } from "@/components/Forms";
import { Pagination } from "@/components/Pagination";
import { userApi, ApiError } from "@/lib/api";
import type { PaginatedResponse, Post } from "@/lib/api";
import { Protected } from "@/components/AuthGuards";

export const Route = createFileRoute("/posts")({
  head: () => ({
    meta: [
      { title: "Posts — CipherNote" },
      { name: "description", content: "Share a post and browse what the community is writing." },
      { property: "og:title", content: "Posts — CipherNote" },
      {
        property: "og:description",
        content: "Share a post and browse what the community is writing.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Posts,
});

function Posts() {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [page, setPage] = useState(1);
  const [result, setResult] = useState<PaginatedResponse<Post> | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const load = () => {
    setLoading(true);
    userApi
      .posts(page)
      .then(setResult)
      .finally(() => setLoading(false));
  };
  useEffect(load, [page]);
  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!title.trim() || !body.trim()) {
      setError("A title and body are required.");
      return;
    }
    try {
      await userApi.createPost({ title, body });
      setTitle("");
      setBody("");
      setError("");
      setPage(1);
      load();
    } catch (cause) {
      setError(cause instanceof ApiError ? cause.message : "Unable to publish the post.");
    }
  }
  return (
    <Protected>
      <AppShell area="user">
        <PageTitle eyebrow="COMMUNITY" title="Posts" />
        <div className="posts-layout">
          <form className="post-composer" onSubmit={submit}>
            <div className="post-composer-heading">
              <div>
                <p className="panel-kicker">NEW POST</p>
                <h2>Share a thought</h2>
              </div>
              <span className="composer-status">Draft</span>
            </div>
            {error && <ErrorLine>{error}</ErrorLine>}
            <Field
              label="Title"
              placeholder="Give your post a clear title"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              required
            />
            <TextArea
              label="Write"
              placeholder="Start writing…"
              value={body}
              onChange={(event) => setBody(event.target.value)}
              required
              rows={8}
            />
            <div className="composer-actions">
              <span>Visible to everyone in the public feed</span>
              <button className="button button-primary">Publish post</button>
            </div>
          </form>
          <section className="post-panel">
            <div className="post-panel-heading">
              <div>
                <p className="panel-kicker">PUBLIC FEED</p>
                <h2>Everyone's posts</h2>
              </div>
              <span>{result?.pagination.total ?? 0} total</span>
            </div>
            {loading ? (
              <LoadingLine>Loading posts</LoadingLine>
            ) : (
              <>
                {result?.data.length ? (
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
                        {post.author && <span className="post-author">by {post.author.name}</span>}
                      </article>
                    ))}
                  </div>
                ) : (
                  <p className="empty-state">No posts yet. Be the first to share something.</p>
                )}
                {result && <Pagination pagination={result.pagination} onPage={setPage} />}
              </>
            )}
          </section>
        </div>
      </AppShell>
    </Protected>
  );
}
