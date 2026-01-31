import React from "react";
import { useAuth } from "../../app/auth";
import { api } from "../../lib/api";

export default function StaffMyProfile() {
  const { user } = useAuth();
  const [staff, setStaff] = React.useState<any>(null);
  const [saving, setSaving] = React.useState(false);
  const staffId = user?.staffId;

  async function load() {
    if (!staffId) return;
    const res = await api.get(`/staff/${staffId}`);
    setStaff(res.data);
  }

  React.useEffect(() => { load(); }, [staffId]);

  async function saveSelf(patch:any) {
    setSaving(true);
    await api.patch(`/staff/${staffId}/self`, patch);
    await load();
    setSaving(false);
  }

  if (!staffId) return <div className="text-slate-500">No linked staff record. Ask admin to link your account.</div>;
  if (!staff) return <div className="text-slate-500">Loading…</div>;

  return (
    <div className="space-y-3">
      <div>
        <div className="text-lg font-semibold">My Profile</div>
        <div className="text-sm text-slate-600">You can edit: Mobile No, Personal Email, Care Email, and upload documents.</div>
      </div>

      <div className="rounded-2xl border bg-white p-4">
        <div className="grid gap-3 md:grid-cols-3">
          <ReadOnly label="ID No." value={staff.idNo} />
          <ReadOnly label="Staff Name" value={staff.staffName} />
          <ReadOnly label="Area / Post" value={`${staff.currentArea} • ${staff.currentPost}`} />
          <ReadOnly label="Nationality" value={staff.nationality} />
          <ReadOnly label="Contract Status" value={staff.contractStatus} />
          <ReadOnly label="Contract Expire" value={String(staff.contractExpire).slice(0,10)} />
        </div>
      </div>

      <div className="rounded-2xl border bg-white p-4">
        <div className="font-semibold">Editable Info</div>
        <div className="grid gap-3 md:grid-cols-3 mt-3">
          <Editable label="Mobile No" value={staff.mobileNo} saving={saving} onSave={(v)=>saveSelf({ mobileNo: v })} />
          <Editable label="Personal Email" value={staff.personalEmail} saving={saving} onSave={(v)=>saveSelf({ personalEmail: v })} />
          <Editable label="Care Email" value={staff.careEmail} saving={saving} onSave={(v)=>saveSelf({ careEmail: v })} />
        </div>
      </div>
    </div>
  );
}

function ReadOnly({ label, value }:{label:string; value:string}) {
  return (
    <div className="rounded-xl border p-3">
      <div className="text-xs text-slate-500">{label}</div>
      <div className="text-sm font-medium mt-1">{value}</div>
    </div>
  );
}

function Editable({ label, value, onSave, saving }:{label:string; value:string; onSave:(v:string)=>Promise<void>|void; saving:boolean}) {
  return (
    <div className="rounded-xl border p-3">
      <div className="text-xs text-slate-500">{label}</div>
      <div className="mt-1 flex gap-2">
        <input className="w-full rounded-lg border px-2 py-1.5 text-sm" defaultValue={value} id={label} />
        <button disabled={saving} className="rounded-lg border px-2 py-1.5 text-xs hover:bg-slate-50 disabled:opacity-50"
          onClick={async()=>{
            const el = document.getElementById(label) as HTMLInputElement;
            await onSave(el.value);
          }}>
          Save
        </button>
      </div>
    </div>
  );
}
