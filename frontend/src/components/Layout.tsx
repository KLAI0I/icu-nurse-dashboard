import React from "react";
import { Outlet, Link, useLocation } from "react-router-dom";
import { useAuth } from "../app/auth";

function NavLink({ to, label }: { to: string; label: string }) {
  const loc = useLocation();
  const active = loc.pathname === to || loc.pathname.startsWith(to + "/");
  return (
    <Link
      to={to}
      className={`block rounded-lg px-3 py-2 text-sm ${
        active ? "bg-slate-100 text-slate-900 font-medium" : "text-slate-700 hover:bg-slate-50"
      }`}
    >
      {label}
    </Link>
  );
}

export default function Layout() {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen bg-white text-slate-900">
      <div className="flex">
        <aside className="w-64 hidden md:block border-r min-h-screen p-4">
          <div className="text-lg font-semibold tracking-tight">ICU Nurse Dashboard</div>
          <div className="mt-6 space-y-1">
            {user?.role === "ADMIN" ? (
              <>
                <NavLink to="/admin" label="Dashboard" />
                <NavLink to="/admin/staff" label="Staff Management" />
                <NavLink to="/admin/users" label="Admin User Management" />
              </>
            ) : (
              <>
                <NavLink to="/me" label="My Profile" />
                <NavLink to="/me/documents" label="My Documents" />
              </>
            )}
          </div>
          <button onClick={logout} className="mt-8 w-full rounded-lg border px-3 py-2 text-sm hover:bg-slate-50">
            Logout
          </button>
        </aside>

        <main className="flex-1">
          <header className="sticky top-0 z-10 border-b bg-white/80 backdrop-blur">
            <div className="px-4 py-3 flex items-center justify-between gap-3">
              <div className="text-sm text-slate-600">
                {user?.role === "ADMIN" ? "Admin Panel (ICU Head)" : "Staff Panel"}
              </div>
              <div className="text-sm font-medium">{user?.email}</div>
            </div>
          </header>
          <div className="p-4">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
