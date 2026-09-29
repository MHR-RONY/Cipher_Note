import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import {
  ChevronLeft,
  LayoutDashboard,
  LogOut,
  Menu,
  NotebookPen,
  Tags,
  Users,
  type LucideIcon,
} from "lucide-react";
import { useState, type ReactNode } from "react";
import { useAuth } from "@/context/AuthContext";

type Area = "user" | "admin";
type NavItem = {
  label: string;
  to: "/admin/overview" | "/admin/notes" | "/admin/users" | "/admin/interests";
  icon: LucideIcon;
};

const adminNavigation: NavItem[] = [
  { label: "Overview", to: "/admin/overview", icon: LayoutDashboard },
  { label: "All notes", to: "/admin/notes", icon: NotebookPen },
  { label: "People", to: "/admin/users", icon: Users },
  { label: "Interests", to: "/admin/interests", icon: Tags },
];

export function AppShell({ children, area }: { children: ReactNode; area: Area }) {
  const { user, admin, logout, adminLogout } = useAuth();
  const navigate = useNavigate();
  const isAdmin = area === "admin";
  const [collapsed, setCollapsed] = useState(false);
  const pathname = useRouterState({ select: (state) => state.location.pathname });

  if (!isAdmin)
    return (
      <div className="member-shell">
        <header className="member-topbar">
          <div className="site-nav">
            <Link to="/notes" className="brand">
              <span className="brand-mark">C</span>CipherNote
            </Link>
            <nav className="nav-links" aria-label="Main navigation">
              <Link to="/notes" activeProps={{ className: "nav-active" }}>
                Notes
              </Link>
              <Link to="/posts" activeProps={{ className: "nav-active" }}>
                Posts
              </Link>
            </nav>
            <div className="user-menu">
              <span className="member-avatar">{user?.name?.slice(0, 2).toUpperCase() ?? "ME"}</span>
              <span className="member-name">{user?.name}</span>
              <button
                className="member-signout"
                type="button"
                onClick={() => {
                  logout();
                  void navigate({ to: "/login", search: { signedOut: undefined } });
                }}
              >
                Sign out
              </button>
            </div>
          </div>
        </header>
        <main className="page-container">{children}</main>
      </div>
    );

  return (
    <div className={`admin-shell ${collapsed ? "admin-shell-collapsed" : ""}`}>
      <aside className="admin-sidebar" aria-label="Admin navigation">
        <div className="admin-brand">
          <Link to="/admin/overview" className="admin-brand-link">
            <span className="brand-mark">C</span>
            {!collapsed && <span>CIPHERNOTE</span>}
          </Link>
          <button
            className="sidebar-icon-button"
            type="button"
            onClick={() => setCollapsed((value) => !value)}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed ? <Menu size={18} /> : <ChevronLeft size={18} />}
          </button>
        </div>
        <nav className="admin-nav">
          {adminNavigation.map((item) => {
            const Icon = item.icon;
            const active = pathname === item.to;
            return (
              <Link
                key={item.to}
                to={item.to}
                className={`admin-nav-link ${active ? "admin-nav-active" : ""}`}
                title={collapsed ? item.label : undefined}
              >
                <Icon size={18} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
        <div className="admin-profile">
          <span className="admin-avatar">{admin?.name?.slice(0, 2).toUpperCase() ?? "AD"}</span>
          {!collapsed && (
            <div className="admin-profile-copy">
              <strong>{admin?.name ?? "Administrator"}</strong>
              <span>Administrator</span>
            </div>
          )}
          <button
            className="admin-signout"
            type="button"
            onClick={() => {
              adminLogout();
              void navigate({ to: "/admin/login" });
            }}
            aria-label="Sign out"
            title="Sign out"
          >
            <LogOut size={16} />
          </button>
        </div>
      </aside>
      <section className="admin-content">
        <header className="admin-topbar">
          <button
            className="sidebar-mobile-trigger"
            type="button"
            onClick={() => setCollapsed((value) => !value)}
            aria-label="Toggle sidebar"
          >
            <Menu size={18} />
          </button>
          <div>
            <p className="admin-topbar-eyebrow">ADMINISTRATION</p>
            <p className="admin-topbar-workspace">Workspace console</p>
          </div>
        </header>
        <main className="admin-main">{children}</main>
      </section>
    </div>
  );
}

export function PageTitle({
  title,
  action,
  eyebrow,
}: {
  title: string;
  action?: ReactNode;
  eyebrow?: string;
}) {
  return (
    <div className="page-heading">
      <div>
        {eyebrow && <p className="page-eyebrow">{eyebrow}</p>}
        <h1>{title}</h1>
      </div>
      {action}
    </div>
  );
}
export function LoadingLine({ children = "Loading" }: { children?: ReactNode }) {
  return <p className="page-state">{children}</p>;
}
export function ErrorLine({ children }: { children: ReactNode }) {
  return (
    <div className="error-line" role="alert">
      {children}
    </div>
  );
}
