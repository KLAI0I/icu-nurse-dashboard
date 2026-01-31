import React from "react";
import { api } from "../../lib/api";
import { formatInTimeZone } from "date-fns-tz";

const TZ = import.meta.env.VITE_APP_TIMEZONE || "Asia/Riyadh";

export default function AdminDashboard() {
  const [items, setItems] = React.useState<any[]>([]);

  React.useEffect(() => {
    api.get("/staff").then(r => setItems(r.data.items));
  }, []);

  const total = items.length;
  const exp30 = items.filter(s => s.remainingContractDays <= 30 && s.remainingContractDays > 0).length;
  const exp60 = items.filter(s => s.remainingContractDays <= 60 && s.remainingContractDays > 0).length;
  const exp90 = items.filter(s => s.remainingContractDays <= 90 && s.remainingContractDays > 0).length;

  const alerts = items
    .filter(s => s.remainingContractDays <= 30)
    .sort((a,b) => a.remainingContractDays - b.remainingContractDays)
    .slice(0, 8);

  return (
    <div className="space-y-4">
      <div className="grid gap-3 md:grid-cols-4">
        <Card title="Total Staff" value={total} />
        <Card title="Expiring ≤ 30 days" value={exp30} />
        <Card title="Expiring ≤ 60 days" value={exp60} />
        <Card title="Expiring ≤ 90 days" value={exp90} />
      </div>

      <div className="rounded-2xl border bg-white p-4">
        <div className="flex items-center justify-between">
          <div className="font-semibold">Alerts: Expiry soon</div>
          <div className="text-xs text-slate-500">Timezone: {TZ}</div>
        </div>
        <div className="mt-3 overflow-auto">
          <table className="w-full text-sm">
            <thead className="text-left text-slate-500">
              <tr>
                <th className="py-2">Staff</th>
                <th>Contract Expire</th>
                <th>Remaining</th>
              </tr>
            </thead>
            <tbody>
              {alerts.map(a => (
                <tr key={a.id} className="border-t">
                  <td className="py-2">{a.staffName} <span className="text-xs text-slate-500">({a.idNo})</span></td>
                  <td>{formatInTimeZone(new Date(a.contractExpire), TZ, "yyyy-MM-dd")}</td>
                  <td><Badge days={a.remainingContractDays} /></td>
                </tr>
              ))}
              {alerts.length === 0 && (
                <tr><td className="py-4 text-slate-500" colSpan={3}>No urgent expiries.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function Card({ title, value }: { title: string; value: any }) {
  return (
    <div className="rounded-2xl border bg-white p-4 shadow-sm">
      <div className="text-xs text-slate-500">{title}</div>
      <div className="text-2xl font-semibold mt-1">{value}</div>
    </div>
  );
}

function Badge({ days }: { days: number }) {
  const cls =
    days <= 0 ? "bg-red-100 text-red-700" :
    days < 30 ? "bg-amber-100 text-amber-800" :
    days < 60 ? "bg-yellow-100 text-yellow-800" :
    "bg-emerald-100 text-emerald-700";
  return <span className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${cls}`}>{days} days</span>;
}
