import React from "react";
import { useAuth } from "../app/auth";
import { useNavigate } from "react-router-dom";

export default function LoginPage() {
  const { login, user } = useAuth();
  const nav = useNavigate();
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [err, setErr] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (user) nav(user.role === "ADMIN" ? "/admin" : "/me", { replace: true });
  }, [user]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    try {
      await login(email, password);
    } catch (e: any) {
      setErr(e?.response?.data?.message || "Login failed");
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md rounded-2xl border bg-white p-6 shadow-sm">
        <h1 className="text-xl font-semibold">ICU Nurse Staff Dashboard</h1>
        <p className="text-sm text-slate-600 mt-1">Sign in to continue</p>

        <form onSubmit={onSubmit} className="mt-6 space-y-3">
          <div>
            <label className="text-sm font-medium">Email</label>
            <input value={email} onChange={(e) => setEmail(e.target.value)} type="email"
              className="mt-1 w-full rounded-lg border px-3 py-2 text-sm" required />
          </div>
          <div>
            <label className="text-sm font-medium">Password</label>
            <input value={password} onChange={(e) => setPassword(e.target.value)} type="password"
              className="mt-1 w-full rounded-lg border px-3 py-2 text-sm" required />
          </div>

          {err && <div className="text-sm text-red-600">{err}</div>}

          <button className="w-full rounded-lg bg-slate-900 text-white px-3 py-2 text-sm hover:bg-slate-800">
            Login
          </button>

          <button type="button" className="w-full rounded-lg border px-3 py-2 text-sm hover:bg-slate-50"
            onClick={() => alert("Forgot/Reset is stubbed in backend. Implement email later.")}>
            Forgot password
          </button>

          <div className="text-xs text-slate-500 mt-2">
            Demo: admin@icu.local / Admin@12345 — staff0@icu.local / Staff@12345
          </div>
        </form>
      </div>
    </div>
  );
}
