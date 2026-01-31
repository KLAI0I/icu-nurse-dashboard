import React from "react";
import { api } from "../../lib/api";

export default function AdminUsers() {
  const [users, setUsers] = React.useState<any[]>([]);
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [role, setRole] = React.useState<"ADMIN"|"STAFF">("STAFF");
  const [staffId, setStaffId] = React.useState("");
  const [err, setErr] = React.useState<string|null>(null);

  async function load() {
    const res = await api.get("/users");
    setUsers(res.data.items);
  }

  React.useEffect(() => { load(); }, []);

  async function createUser() {
    setErr(null);
    try {
      await api.post("/users", { email, password, role, staffId: staffId || null });
      setEmail(""); setPassword(""); setRole("STAFF"); setStaffId("");
      await load();
    } catch (e:any) {
      setErr(e?.response?.data?.message || "Failed");
    }
  }

  async function toggleActive(u:any) {
    await api.patch(`/users/${u.id}`, { isActive: !u.isActive });
    await load();
  }

  async function resetPassword(u:any) {
    const np = prompt("New password (min 8 chars):");
    if (!np) return;
    await api.post(`/users/${u.id}/reset-password`, { newPassword: np });
    alert("Password reset.");
  }

  return (
    <div className="space-y-3">
      <div>
        <div className="text-lg font-semibold">Admin User Management</div>
        <div className="text-sm text-slate-600">Create accounts, activate/deactivate, reset password, link to staff record.</div>
      </div>

      <div className="rounded-2xl border bg-white p-4">
        <div className="font-semibold">Create User</div>
        <div className="grid gap-2 md:grid-cols-4 mt-3">
          <input className="rounded-lg border px-3 py-2 text-sm" placeholder="email" value={email} onChange={e=>setEmail(e.target.value)} />
          <input className="rounded-lg border px-3 py-2 text-sm" placeholder="password" value={password} onChange={e=>setPassword(e.target.value)} />
          <select className="rounded-lg border px-3 py-2 text-sm" value={role} onChange={e=>setRole(e.target.value as any)}>
            <option value="STAFF">STAFF</option>
            <option value="ADMIN">ADMIN</option>
          </select>
          <input className="rounded-lg border px-3 py-2 text-sm" placeholder="staffId (optional link)" value={staffId} onChange={e=>setStaffId(e.target.value)} />
        </div>
        {err && <div className="text-sm text-red-600 mt-2">{err}</div>}
        <button onClick={createUser} className="mt-3 rounded-lg bg-slate-900 text-white px-3 py-2 text-sm hover:bg-slate-800">Create</button>
      </div>

      <div className="rounded-2xl border bg-white overflow-auto">
        <table className="min-w-[900px] w-full text-sm">
          <thead className="text-left text-slate-500">
            <tr>
              <th className="py-2 px-3">Email</th>
              <th className="py-2 px-3">Role</th>
              <th className="py-2 px-3">Active</th>
              <th className="py-2 px-3">Linked StaffId</th>
              <th className="py-2 px-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map(u => (
              <tr key={u.id} className="border-t">
                <td className="py-2 px-3">{u.email}</td>
                <td className="py-2 px-3">{u.role}</td>
                <td className="py-2 px-3">{u.isActive ? "Yes" : "No"}</td>
                <td className="py-2 px-3">{u.staffId || "-"}</td>
                <td className="py-2 px-3 flex gap-2">
                  <button className="rounded-lg border px-2 py-1 text-xs hover:bg-slate-50" onClick={() => toggleActive(u)}>
                    {u.isActive ? "Deactivate" : "Activate"}
                  </button>
                  <button className="rounded-lg border px-2 py-1 text-xs hover:bg-slate-50" onClick={() => resetPassword(u)}>
                    Reset Password
                  </button>
                </td>
              </tr>
            ))}
            {users.length === 0 && <tr><td colSpan={5} className="py-6 text-center text-slate-500">No users.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
