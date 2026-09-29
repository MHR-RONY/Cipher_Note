import type { Note, PaginatedResponse, Post, Role, User } from "@/lib/api";

const STORE_KEY = "inkwell_demo_workspace";
const SESSION_KEY = "inkwell_demo_session";
const now = new Date();
const iso = (daysAgo: number) => new Date(now.getTime() - daysAgo * 86400000).toISOString();

export interface DemoWorkspace { users: User[]; notes: Note[]; posts: Post[]; }

const initialWorkspace: DemoWorkspace = {
  users: [
    { _id: "u-ada", name: "Ada Morgan", email: "ada@inkwell.demo", role: "admin", interests: ["Product design", "Reading"], createdAt: iso(90) },
    { _id: "u-lee", name: "Lee Chen", email: "lee@inkwell.demo", role: "user", interests: ["Research", "Photography"], createdAt: iso(63) },
    { _id: "u-maya", name: "Maya Patel", email: "maya@inkwell.demo", role: "user", interests: ["Writing", "Product design"], createdAt: iso(48) },
    { _id: "u-jon", name: "Jon Bell", email: "jon@inkwell.demo", role: "user", interests: ["Music", "Reading"], createdAt: iso(22) },
  ],
  notes: [
    { _id: "n-1", title: "Monday field notes", content: "Keep the interview prompts open-ended. The most useful insight arrived after the last prepared question.", owner: { _id: "u-ada", name: "Ada Morgan" }, createdAt: iso(1), updatedAt: iso(1) },
    { _id: "n-2", title: "Things to protect", content: "A calm start to the week, long walks without a destination, and enough margin around the work that matters.", owner: { _id: "u-ada", name: "Ada Morgan" }, createdAt: iso(3), updatedAt: iso(3) },
    { _id: "n-3", title: "Research thread: onboarding", content: "New people should feel oriented before they are asked to make a decision. Start with context, then offer a clear next step.", owner: { _id: "u-lee", name: "Lee Chen" }, createdAt: iso(5), updatedAt: iso(5) },
    { _id: "n-4", title: "A small writing ritual", content: "Write one imperfect page before checking messages. It keeps the day from being defined by other people’s priorities.", owner: { _id: "u-maya", name: "Maya Patel" }, createdAt: iso(8), updatedAt: iso(8) },
    { _id: "n-5", title: "Photo walk checklist", content: "One familiar street. One color to follow. No pressure to make anything useful from it yet.", owner: { _id: "u-lee", name: "Lee Chen" }, createdAt: iso(11), updatedAt: iso(11) },
    { _id: "n-6", title: "The album sequence", content: "The middle needs a little more air. Move the instrumental before the final two tracks and listen again tomorrow.", owner: { _id: "u-jon", name: "Jon Bell" }, createdAt: iso(15), updatedAt: iso(15) },
  ],
  posts: [
    { _id: "p-1", title: "What I’m noticing", body: "People remember the moments a product made them feel capable. Small clarity is never a small thing.", author: { _id: "u-ada", name: "Ada Morgan" }, createdAt: iso(2) },
    { _id: "p-2", title: "A note on quiet research", body: "The answers that arrive after a pause are often the ones worth carrying into the next round.", author: { _id: "u-lee", name: "Lee Chen" }, createdAt: iso(6) },
    { _id: "p-3", title: "Keep a commonplace book", body: "Collect sentences that make you slow down. They become a useful map when you need to begin again.", author: { _id: "u-maya", name: "Maya Patel" }, createdAt: iso(9) },
  ],
};

const clone = <T,>(value: T): T => JSON.parse(JSON.stringify(value)) as T;
const getWorkspace = (): DemoWorkspace => {
  if (typeof window === "undefined") return clone(initialWorkspace);
  const saved = window.localStorage.getItem(STORE_KEY);
  if (!saved) return clone(initialWorkspace);
  try { return JSON.parse(saved) as DemoWorkspace; } catch { return clone(initialWorkspace); }
};
const saveWorkspace = (workspace: DemoWorkspace) => window.localStorage.setItem(STORE_KEY, JSON.stringify(workspace));
const paginate = <T,>(items: T[], page = 1, limit = 4): PaginatedResponse<T> => {
  const total = items.length;
  const totalPages = Math.max(1, Math.ceil(total / limit));
  const safePage = Math.min(Math.max(page, 1), totalPages);
  return { data: items.slice((safePage - 1) * limit, safePage * limit), pagination: { page: safePage, limit, total, totalPages } };
};
const delay = <T,>(value: T) => new Promise<T>((resolve) => window.setTimeout(() => resolve(value), 120));
const person = (workspace: DemoWorkspace, id: string) => workspace.users.find((user) => user._id === id);
const noteOwnerId = (note: Note) => note.owner?._id ?? "u-ada";

export const demo = {
  session: () => {
    if (typeof window === "undefined") return null;
    const userId = window.localStorage.getItem(SESSION_KEY);
    return userId ? person(getWorkspace(), userId) ?? null : null;
  },
  login: (email: string, password: string, role: Role) => {
    const user = getWorkspace().users.find((candidate) => candidate.email.toLowerCase() === email.trim().toLowerCase() && candidate.role === role);
    if (!user || password !== (role === "admin" ? "admin123" : "member123")) return delay(null);
    window.localStorage.setItem(SESSION_KEY, user._id);
    window.dispatchEvent(new Event("inkwell-session"));
    return delay(user);
  },
  register: (data: { name: string; email: string; password: string }) => {
    const workspace = getWorkspace();
    const email = data.email.trim().toLowerCase();
    if (workspace.users.some((user) => user.email.toLowerCase() === email)) return delay({ user: null, error: "An account already exists for this email address." });
    const user: User = { _id: `u-${Date.now()}`, name: data.name.trim(), email, role: "user", interests: [], createdAt: new Date().toISOString() };
    workspace.users.push(user);
    saveWorkspace(workspace);
    window.localStorage.setItem(SESSION_KEY, user._id);
    window.dispatchEvent(new Event("inkwell-session"));
    return delay({ user, error: "" });
  },
  logout: () => { if (typeof window !== "undefined") { window.localStorage.removeItem(SESSION_KEY); window.dispatchEvent(new Event("inkwell-session")); } },
  currentUser: () => demo.session(),
  notes: (page = 1) => { const current = demo.session(); return delay(paginate(current ? getWorkspace().notes.filter((note) => noteOwnerId(note) === current._id).sort((a, b) => +new Date(b.updatedAt) - +new Date(a.updatedAt)) : [], page)); },
  allNotes: (page = 1, userId = "") => delay(paginate(getWorkspace().notes.filter((note) => !userId || noteOwnerId(note) === userId).sort((a, b) => +new Date(b.updatedAt) - +new Date(a.updatedAt)), page)),
  note: (id: string) => { const current = demo.session(); return delay(current ? getWorkspace().notes.find((note) => note._id === id && noteOwnerId(note) === current._id) ?? null : null); },
  createNote: (data: { title: string; content: string }) => { const workspace = getWorkspace(); const current = demo.session(); if (!current) return delay(null); const note: Note = { _id: `n-${Date.now()}`, ...data, owner: { _id: current._id, name: current.name }, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }; workspace.notes.unshift(note); saveWorkspace(workspace); return delay(note); },
  updateNote: (id: string, data: { title: string; content: string }) => { const workspace = getWorkspace(); const current = demo.session(); const note = current ? workspace.notes.find((item) => item._id === id && noteOwnerId(item) === current._id) : undefined; if (!note) return delay(null); Object.assign(note, data, { updatedAt: new Date().toISOString() }); saveWorkspace(workspace); return delay(note); },
  deleteNote: (id: string) => { const workspace = getWorkspace(); const current = demo.session(); if (!current || !workspace.notes.some((note) => note._id === id && noteOwnerId(note) === current._id)) return delay(false); workspace.notes = workspace.notes.filter((note) => note._id !== id); saveWorkspace(workspace); return delay(true); },
  users: (page = 1) => delay(paginate(getWorkspace().users, page)),
  user: (id: string) => delay(getWorkspace().users.find((user) => user._id === id) ?? null),
  createUser: (data: { name: string; email: string; password?: string; role: Role; interests: string[] }) => { const workspace = getWorkspace(); const user: User = { _id: `u-${Date.now()}`, name: data.name, email: data.email, role: data.role, interests: data.interests, createdAt: new Date().toISOString() }; workspace.users.push(user); saveWorkspace(workspace); return delay(user); },
  updateUser: (id: string, data: Partial<Omit<User, "_id" | "createdAt">>) => { const workspace = getWorkspace(); const user = workspace.users.find((item) => item._id === id); if (!user) return delay(null); Object.assign(user, data); workspace.notes.forEach((note) => { if (noteOwnerId(note) === id) note.owner = { _id: id, name: user.name }; }); workspace.posts.forEach((post) => { if (post.author?._id === id) post.author = { _id: id, name: user.name }; }); saveWorkspace(workspace); return delay(user); },
  deleteUser: (id: string) => { const workspace = getWorkspace(); if (id === "u-ada") return delay(false); workspace.users = workspace.users.filter((user) => user._id !== id); workspace.notes = workspace.notes.filter((note) => noteOwnerId(note) !== id); workspace.posts = workspace.posts.filter((post) => post.author?._id !== id); saveWorkspace(workspace); return delay(true); },
  posts: (userId: string, page = 1) => delay(paginate(getWorkspace().posts.filter((post) => post.author?._id === userId).sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt)), page)),
  createPost: (data: { title: string; body: string }) => { const workspace = getWorkspace(); const current = demo.session(); if (!current) return delay(null); const post: Post = { _id: `p-${Date.now()}`, ...data, author: { _id: current._id, name: current.name }, createdAt: new Date().toISOString() }; workspace.posts.unshift(post); saveWorkspace(workspace); return delay(post); },
  interests: () => { const workspace = getWorkspace(); const groups = new Map<string, User[]>(); workspace.users.forEach((user) => user.interests.forEach((interest) => groups.set(interest, [...(groups.get(interest) ?? []), user]))); return delay({ data: [...groups.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([interest, users]) => ({ interest, count: users.length, users: users.map(({ _id, name, email }) => ({ _id, name, email })) })) }); },
  reset: () => { if (typeof window !== "undefined") window.localStorage.removeItem(STORE_KEY); },
  ownerName: (id: string) => person(getWorkspace(), id)?.name ?? "Unknown",
  workspace: () => delay(getWorkspace()),
};
