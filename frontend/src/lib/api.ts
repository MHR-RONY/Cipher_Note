export interface User {
  _id: string;
  name: string;
  email: string;
  interests: string[];
  createdAt?: string;
}

export interface Admin {
  _id: string;
  name: string;
  email: string;
  createdAt?: string;
}

export interface Note {
  _id: string;
  title: string;
  content: string;
  owner?: { _id: string; name: string };
  createdAt: string;
  updatedAt: string;
}

export interface Post {
  _id: string;
  title: string;
  body: string;
  author?: { _id: string; name: string };
  createdAt: string;
}

export interface InterestGroup {
  interest: string;
  count: number;
  users: Pick<User, "_id" | "name" | "email">[];
}

export interface PaginationData {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: PaginationData;
}

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

const API_URL = import.meta.env["VITE_API_URL"] || "http://localhost:5000/api";

const params = (page?: number, limit = 10, extra: Record<string, string | undefined> = {}) => {
  const search = new URLSearchParams();
  if (page) search.set("page", String(page));
  search.set("limit", String(limit));
  Object.entries(extra).forEach(([key, value]) => {
    if (value) search.set(key, value);
  });
  return search.toString();
};

function createPanelClient<TAccount>(
  panel: "user" | "admin",
  tokenKey: string,
  accountKey: "user" | "admin",
) {
  const getToken = (): string | null =>
    typeof window === "undefined" ? null : localStorage.getItem(tokenKey);
  const getStoredAccount = (): TAccount | null => {
    if (typeof window === "undefined") return null;
    const value = localStorage.getItem(`${tokenKey}_account`);
    if (!value) return null;
    try {
      return JSON.parse(value) as TAccount;
    } catch {
      return null;
    }
  };
  const saveSession = (token: string, account: TAccount) => {
    localStorage.setItem(tokenKey, token);
    localStorage.setItem(`${tokenKey}_account`, JSON.stringify(account));
  };
  const clearSession = () => {
    if (typeof window === "undefined") return;
    localStorage.removeItem(tokenKey);
    localStorage.removeItem(`${tokenKey}_account`);
  };
  const loginPath = panel === "user" ? "/login" : "/admin/login";

  async function request<T>(path: string, options: RequestInit = {}, withAuth = true): Promise<T> {
    const headers = new Headers(options.headers);
    headers.set("Content-Type", "application/json");
    const token = getToken();
    if (withAuth && token) headers.set("Authorization", `Bearer ${token}`);

    let response: Response;
    try {
      response = await fetch(`${API_URL}/${panel}${path}`, { ...options, headers });
    } catch {
      throw new ApiError(
        "Unable to reach the API. Check that it is running and VITE_API_URL is correct.",
        0,
      );
    }

    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      if (response.status === 401) {
        clearSession();
        if (typeof window !== "undefined" && window.location.pathname !== loginPath)
          window.location.assign(loginPath);
      }
      const message = payload.message || payload.error || "The request could not be completed.";
      throw new ApiError(message, response.status);
    }
    return payload as T;
  }

  return { request, getToken, getStoredAccount, saveSession, clearSession };
}

const userClient = createPanelClient<User>("user", "user_token", "user");
const adminClient = createPanelClient<Admin>("admin", "admin_token", "admin");

export const getStoredUserToken = userClient.getToken;
export const getStoredUser = userClient.getStoredAccount;
export const saveUserSession = userClient.saveSession;
export const clearUserSession = userClient.clearSession;

export const getStoredAdminToken = adminClient.getToken;
export const getStoredAdmin = adminClient.getStoredAccount;
export const saveAdminSession = adminClient.saveSession;
export const clearAdminSession = adminClient.clearSession;

export const userApi = {
  register: (data: { name: string; email: string; password: string; interests: string[] }) =>
    userClient.request<{ token: string; user: User }>(
      "/auth/register",
      { method: "POST", body: JSON.stringify(data) },
      false,
    ),
  login: (email: string, password: string) =>
    userClient.request<{ token: string; user: User }>(
      "/auth/login",
      { method: "POST", body: JSON.stringify({ email, password }) },
      false,
    ),
  me: () => userClient.request<{ user: User }>("/auth/me"),
  notes: (page?: number) => userClient.request<PaginatedResponse<Note>>(`/notes?${params(page)}`),
  note: (id: string) => userClient.request<Note>(`/notes/${id}`),
  createNote: (data: { title: string; content: string }) =>
    userClient.request<Note>("/notes", { method: "POST", body: JSON.stringify(data) }),
  updateNote: (id: string, data: { title: string; content: string }) =>
    userClient.request<Note>(`/notes/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  deleteNote: (id: string) => userClient.request<void>(`/notes/${id}`, { method: "DELETE" }),
  createPost: (data: { title: string; body: string }) =>
    userClient.request<Post>("/posts", { method: "POST", body: JSON.stringify(data) }),
  posts: (page?: number) => userClient.request<PaginatedResponse<Post>>(`/posts?${params(page)}`),
};

export const adminApi = {
  setupStatus: () => adminClient.request<{ required: boolean }>("/setup/status", {}, false),
  setup: (data: { name: string; email: string; password: string; setupKey: string }) =>
    adminClient.request<{ token: string; admin: Admin }>(
      "/setup",
      { method: "POST", body: JSON.stringify(data) },
      false,
    ),
  login: (email: string, password: string) =>
    adminClient.request<{ token: string; admin: Admin }>(
      "/auth/login",
      { method: "POST", body: JSON.stringify({ email, password }) },
      false,
    ),
  me: () => adminClient.request<{ admin: Admin }>("/auth/me"),
  users: (page?: number) => adminClient.request<PaginatedResponse<User>>(`/users?${params(page)}`),
  user: (id: string) => adminClient.request<{ user: User }>(`/users/${id}`),
  createUser: (data: { name: string; email: string; password: string; interests: string[] }) =>
    adminClient.request<{ user: User }>("/users", { method: "POST", body: JSON.stringify(data) }),
  updateUser: (
    id: string,
    data: { name: string; email: string; interests: string[]; password?: string },
  ) =>
    adminClient.request<{ user: User }>(`/users/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),
  deleteUser: (id: string) => adminClient.request<void>(`/users/${id}`, { method: "DELETE" }),
  interestGroups: () =>
    adminClient.request<{ data: InterestGroup[] }>("/users/grouped-by-interests"),
  userPosts: (userId: string, page?: number) =>
    adminClient.request<{ name: string } & PaginatedResponse<Post>>(
      `/users/${userId}/posts?${params(page)}`,
    ),
  notes: (page?: number, userId?: string) =>
    adminClient.request<PaginatedResponse<Note>>(`/notes?${params(page, 10, { userId })}`),
};
