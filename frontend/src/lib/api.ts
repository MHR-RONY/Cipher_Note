export type Role = "user" | "admin";

export interface User {
  _id: string;
  name: string;
  email: string;
  role: Role;
  interests: string[];
  createdAt?: string;
}

export interface Note {
  _id: string;
  title: string;
  content: string;
  owner?: User | { _id: string; name: string };
  createdAt: string;
  updatedAt: string;
}

export interface Post {
  _id: string;
  title: string;
  body: string;
  author?: User | { _id: string; name: string };
  createdAt: string;
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

export interface AuthResponse {
  token: string;
  user: User;
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
const TOKEN_KEY = "inkwell_token";
const USER_KEY = "inkwell_user";

export function getStoredToken() {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function getStoredUser(): User | null {
  if (typeof window === "undefined") return null;
  const value = localStorage.getItem(USER_KEY);
  if (!value) return null;
  try {
    return JSON.parse(value) as User;
  } catch {
    return null;
  }
}

export function saveSession(token: string, user: User) {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function clearSession() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

async function request<T>(path: string, options: RequestInit = {}, withAuth = true): Promise<T> {
  const headers = new Headers(options.headers);
  headers.set("Content-Type", "application/json");
  const token = getStoredToken();
  if (withAuth && token) headers.set("Authorization", `Bearer ${token}`);

  let response: Response;
  try {
    response = await fetch(`${API_URL}${path}`, { ...options, headers });
  } catch {
    throw new ApiError("Unable to reach the API. Check that it is running and VITE_API_URL is correct.", 0);
  }

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    if (response.status === 401) {
      clearSession();
      if (typeof window !== "undefined" && window.location.pathname !== "/login") window.location.assign("/login");
    }
    const message = payload.message || payload.error || "The request could not be completed.";
    throw new ApiError(message, response.status);
  }
  return payload as T;
}

const params = (page = 1, limit = 10, extra: Record<string, string | undefined> = {}) => {
  const search = new URLSearchParams({ page: String(page), limit: String(limit) });
  Object.entries(extra).forEach(([key, value]) => { if (value) search.set(key, value); });
  return search.toString();
};

export const api = {
  login: (email: string, password: string) => request<AuthResponse>("/auth/login", { method: "POST", body: JSON.stringify({ email, password }) }, false),
  register: (data: { name: string; email: string; password: string; interests: string[] }) => request<AuthResponse>("/auth/register", { method: "POST", body: JSON.stringify(data) }, false),
  me: () => request<{ user: User }>("/auth/me"),
  notes: (page?: number) => request<PaginatedResponse<Note>>(`/notes?${params(page)}`),
  note: (id: string) => request<Note>(`/notes/${id}`),
  createNote: (data: { title: string; content: string }) => request<Note>("/notes", { method: "POST", body: JSON.stringify(data) }),
  updateNote: (id: string, data: { title: string; content: string }) => request<Note>(`/notes/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  deleteNote: (id: string) => request<void>(`/notes/${id}`, { method: "DELETE" }),
  adminNotes: (page?: number, userId?: string) => request<PaginatedResponse<Note>>(`/admin/notes?${params(page, 10, { userId })}`),
  users: (page?: number) => request<PaginatedResponse<User>>(`/users?${params(page)}`),
  user: (id: string) => request<User>(`/users/${id}`),
  createUser: (data: Omit<User, "_id" | "createdAt"> & { password: string }) => request<User>("/users", { method: "POST", body: JSON.stringify(data) }),
  updateUser: (id: string, data: Partial<Omit<User, "_id" | "createdAt">> & { password?: string }) => request<User>(`/users/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  deleteUser: (id: string) => request<void>(`/users/${id}`, { method: "DELETE" }),
  interests: () => request<{ data: Array<{ interest: string; count: number; users: Pick<User, "_id" | "name" | "email">[] }> }>("/users/grouped-by-interests"),
  createPost: (data: { title: string; body: string }) => request<Post>("/posts", { method: "POST", body: JSON.stringify(data) }),
  posts: (userId: string, page?: number) => request<PaginatedResponse<Post>>(`/users/${userId}/posts?${params(page)}`),
};
