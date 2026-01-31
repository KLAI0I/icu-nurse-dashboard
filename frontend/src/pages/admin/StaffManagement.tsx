import React from "react";
import { api } from "../../lib/api";
import { useNavigate } from "react-router-dom";

export default function StaffManagement() {
  const nav = useNavigate();
  const [q, setQ] = React.useState("");
  const [area, setArea] = React.useState("");
  const [contractStatus, setContractStatus] = React.useState("");
  const [rows, setRows] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(false);

  async function load() {
    setLoading(true);
    const res = await api.get("/staff", { params: { q: q || undefined, area: area || undefined, contractStatus: contractStatus || undefined } });
    setRows(res.data.items);
    setLoading(false);
  }

  React.useEffect(() => { load(); }, []);

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
        <div>
          <div className="text-lg font-semibold">Staff Management</div>
          <div className="text-sm text-slate-600">Search, filter, open profiles, export CSV</div>
        </div>

        <div className="flex gap-2">
          <a className="rounded-lg border px-3 py-2 text-sm hover:bg-slate-50" href={`${import.meta.env.VITE_API_BASE}/staff/export/csv`}>
            Export CSV
          </a>
        </div>
      </div>

      <div className="rounded-2xl border bg-white p-3">
        <div className="grid gap-2 md:grid-cols-4">
          <div className="md:col-span-2">
            <label className="text-xs text-slate-500">Fast Search</label>
            <input value={q} onChange={(e)=>setQ(e.target.value)} className="mt-1 w-full rounded-lg border px-3 py-2 text-sm"
              placeholder="Search name, ID No, emails..." />
          </div>

          <div>
            <label className="text-xs text-slate-500">Area</label>
            <input value={area} onChange={(e)=>setArea(e.target.value)} className="mt-1 w-full rounded-lg border px-3 py-2 text-sm"
              placeholder="e.g., ICU A" />
          </div>

          <div>
            <label className="text-xs text-slate-500">Contract Status</label>
            <select value={contractStatus} onChange={(e)=>setContractStatus(e.target.value)}
              className="mt-1 w-full rounded-lg border px-3 py-2 text-sm">
              <option value="">All</option>
              <option value="ACTIVE">Active</option>
              <option value="ENDING_SOON">Ending Soon</option>
              <option value="EXPIRED">Expired</option>
              <option value="SUSPENDED">Suspended</option>
            </select>
          </div>
        </div>

        <div className="mt-3 flex flex-wrap gap-2">
          <Chip label="Expiring Contracts (≤ 60d)" onClick={() => setContractStatus("ENDING_SOON")} />
          <Chip label="Expired Contracts" onClick={() => setContractStatus("EXPIRED")} />
          <Chip label="Clear Filters" onClick={() => { setArea(""); setContractStatus(""); setQ(""); }} />
          <button onClick={load} className="ml-auto rounded-lg bg-slate-900 text-white px-3 py-2 text-sm hover:bg-slate-800">
            Apply
          </button>
        </div>
      </div>

      <div className="rounded-2xl border bg-white overflow-auto">
        <table className="min-w-[1100px] w-full text-sm">
          <thead className="text-left text-slate-500">
            <tr>
              <th className="py-2 px-3 sticky left-0 bg-white">ID No.</th>
              <th className="py-2 px-3 sticky left-[92px] bg-white">Staff Name</th>
              <th className="py-2 px-3">Area</th>
              <th className="py-2 px-3">Post</th>
              <th className="py-2 px-3">Nationality</th>
              <th className="py-2 px-3">Contract Expire</th>
              <th className="py-2 px-3">Remaining</th>
              <th className="py-2 px-3">Status</th>
              <th className="py-2 px-3">Mobile</th>
              <th className="py-2 px-3">Personal Email</th>
              <th className="py-2 px-3">Care Email</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(r => (
              <tr key={r.id} className="border-t hover:bg-slate-50 cursor-pointer" onClick={() => nav(`/admin/staff/${r.id}`)}>
                <td className="py-2 px-3 sticky left-0 bg-white font-medium">{r.idNo}</td>
                <td className="py-2 px-3 sticky left-[92px] bg-white">{r.staffName}</td>
                <td className="py-2 px-3">{r.currentArea}</td>
                <td className="py-2 px-3">{r.currentPost}</td>
                <td className="py-2 px-3">{r.nationality}</td>
                <td className="py-2 px-3">{String(r.contractExpire).slice(0,10)}</td>
                <td className="py-2 px-3"><Badge days={r.remainingContractDays} /></td>
                <td className="py-2 px-3">{r.contractStatus}</td>
                <td className="py-2 px-3">{r.mobileNo}</td>
                <td className="py-2 px-3">{r.personalEmail}</td>
                <td className="py-2 px-3">{r.careEmail}</td>
              </tr>
            ))}
            {loading && <tr><td colSpan={11} className="py-6 text-center text-slate-500">Loading…</td></tr>}
            {!loading && rows.length === 0 && <tr><td colSpan={11} className="py-6 text-center text-slate-500">No results.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Chip({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button onClick={onClick} className="rounded-full border px-3 py-1.5 text-xs hover:bg-slate-50">
      {label}
    </button>
  );
}

function Badge({ days }: { days: number }) {
  const cls =
    days <= 0 ? "bg-red-100 text-red-700" :
    days < 30 ? "bg-amber-100 text-amber-800" :
    days < 60 ? "bg-yellow-100 text-yellow-800" :
    "bg-emerald-100 text-emerald-700";
  return <span className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${cls}`}>{days}d</span>;
}
