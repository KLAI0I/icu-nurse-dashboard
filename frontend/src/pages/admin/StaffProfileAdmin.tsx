import React from "react";
import { useParams } from "react-router-dom";
import { api } from "../../lib/api";

const DOC_TYPES = [
  "IQAMA","PASSPORT","MOH_LICENSE","CERTIFICATE_OF_GRADUATION","DATA_FLOW","SCFHS","BLS","ACLS","CONSCIOUS_SEDATION","OTHERS"
] as const;

export default function StaffProfileAdmin() {
  const { id } = useParams();
  const [staff, setStaff] = React.useState<any>(null);
  const [tab, setTab] = React.useState<"personal"|"contract"|"credentials"|"documents"|"audit">("personal");
  const [saving, setSaving] = React.useState(false);

  async function load() {
    const res = await api.get(`/staff/${id}`);
    setStaff(res.data);
  }
  React.useEffect(() => { load(); }, [id]);

  async function savePatch(patch:any) {
    setSaving(true);
    await api.patch(`/staff/${id}`, patch);
    await load();
    setSaving(false);
  }

  if (!staff) return <div className="text-slate-500">Loading…</div>;

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-1">
        <div className="text-lg font-semibold">{staff.staffName} <span className="text-sm text-slate-500">({staff.idNo})</span></div>
        <div className="text-sm text-slate-600">{staff.currentArea} • {staff.currentPost} • Contract: {staff.contractStatus} • Remaining: {staff.remainingContractDays} days</div>
      </div>

      <div className="flex flex-wrap gap-2">
        <Tab label="Personal" active={tab==="personal"} onClick={()=>setTab("personal")} />
        <Tab label="Contract" active={tab==="contract"} onClick={()=>setTab("contract")} />
        <Tab label="Credentials" active={tab==="credentials"} onClick={()=>setTab("credentials")} />
        <Tab label="Documents" active={tab==="documents"} onClick={()=>setTab("documents")} />
        <Tab label="Audit" active={tab==="audit"} onClick={()=>setTab("audit")} />
      </div>

      {tab==="personal" && (
        <Section title="Personal (Admin can edit all)">
          <Grid>
            <Field label="Mobile No." value={staff.mobileNo} onSave={(v)=>savePatch({ mobileNo: v })} saving={saving} />
            <Field label="Personal Email" value={staff.personalEmail} onSave={(v)=>savePatch({ personalEmail: v })} saving={saving} />
            <Field label="Care Email" value={staff.careEmail} onSave={(v)=>savePatch({ careEmail: v })} saving={saving} />
            <Field label="Nationality" value={staff.nationality} onSave={(v)=>savePatch({ nationality: v })} saving={saving} />
            <Field label="Gender" value={staff.gender} onSave={(v)=>savePatch({ gender: v })} saving={saving} />
          </Grid>
          <div className="mt-3">
            <label className="text-xs text-slate-500">Admin Notes (internal)</label>
            <textarea className="mt-1 w-full rounded-lg border px-3 py-2 text-sm" value={staff.notes || ""} onChange={()=>{}} readOnly />
            <button className="mt-2 rounded-lg border px-3 py-2 text-sm hover:bg-slate-50"
              onClick={async()=>{ const n = prompt("Update notes:", staff.notes || ""); if (n!==null) await savePatch({ notes: n }); }}>
              Edit Notes
            </button>
          </div>
        </Section>
      )}

      {tab==="contract" && (
        <Section title="Contract">
          <Grid>
            <ReadOnly label="Joining Date" value={String(staff.joiningDate).slice(0,10)} />
            <ReadOnly label="Service Years (auto)" value={String(staff.serviceYears)} />
            <Field label="Contract Expire" value={String(staff.contractExpire).slice(0,10)} onSave={(v)=>savePatch({ contractExpire: v })} saving={saving} />
            <ReadOnly label="Remaining (auto)" value={`${staff.remainingContractDays} days`} />
            <ReadOnly label="Contract Status (auto rule)" value={staff.contractStatus} />
            <Field label="Contract Type" value={staff.contractType} onSave={(v)=>savePatch({ contractType: v })} saving={saving} />
          </Grid>
        </Section>
      )}

      {tab==="credentials" && (
        <Section title="Credentials / IDs">
          <Grid>
            <ReadOnly label="ID No. (locked)" value={staff.idNo} />
            <Field label="IQAMA NO." value={staff.iqamaNo || ""} onSave={(v)=>savePatch({ iqamaNo: v })} saving={saving} />
            <Field label="PASSPORT NO." value={staff.passportNo || ""} onSave={(v)=>savePatch({ passportNo: v })} saving={saving} />
            <Field label="DEGREE" value={staff.degree || ""} onSave={(v)=>savePatch({ degree: v })} saving={saving} />
            <Field label="SPECIALITY" value={staff.speciality || ""} onSave={(v)=>savePatch({ speciality: v })} saving={saving} />
            <Field label="SAUDI COUNCIL" value={staff.saudiCouncil || ""} onSave={(v)=>savePatch({ saudiCouncil: v })} saving={saving} />
            <Field label="CLASSIFICATION" value={staff.classification || ""} onSave={(v)=>savePatch({ classification: v })} saving={saving} />
            <Field label="DATA FLOW" value={staff.dataFlow || ""} onSave={(v)=>savePatch({ dataFlow: v })} saving={saving} />
            <Field label="MOH" value={staff.moh || ""} onSave={(v)=>savePatch({ moh: v })} saving={saving} />
            <Field label="BLS" value={staff.bls || ""} onSave={(v)=>savePatch({ bls: v })} saving={saving} />
            <Field label="ACLS" value={staff.acls || ""} onSave={(v)=>savePatch({ acls: v })} saving={saving} />
            <Field label="C. SEDATION" value={staff.cSedation || ""} onSave={(v)=>savePatch({ cSedation: v })} saving={saving} />
          </Grid>
        </Section>
      )}

      {tab==="documents" && (
        <DocsAdmin staff={staff} onChanged={load} />
      )}

      {tab==="audit" && (
        <Audit staffId={staff.id} />
      )}
    </div>
  );
}

function Tab({ label, active, onClick }:{label:string; active:boolean; onClick:()=>void}) {
  return (
    <button onClick={onClick} className={`rounded-full px-3 py-1.5 text-xs border ${active ? "bg-slate-900 text-white border-slate-900" : "hover:bg-slate-50"}`}>
      {label}
    </button>
  );
}

function Section({ title, children }:{title:string; children:any}) {
  return (
    <div className="rounded-2xl border bg-white p-4">
      <div className="font-semibold">{title}</div>
      <div className="mt-3">{children}</div>
    </div>
  );
}

function Grid({ children }:{children:any}) {
  return <div className="grid gap-3 md:grid-cols-3">{children}</div>;
}

function ReadOnly({ label, value }:{label:string; value:string}) {
  return (
    <div className="rounded-xl border p-3">
      <div className="text-xs text-slate-500">{label}</div>
      <div className="text-sm font-medium mt-1">{value}</div>
    </div>
  );
}

function Field({ label, value, onSave, saving }:{label:string; value:string; onSave:(v:string)=>Promise<void>|void; saving:boolean}) {
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

function DocsAdmin({ staff, onChanged }:{staff:any; onChanged:()=>void}) {
  const [docType, setDocType] = React.useState<string>("IQAMA");
  const [customName, setCustomName] = React.useState("");
  const [issueDate, setIssueDate] = React.useState("");
  const [expiryDate, setExpiryDate] = React.useState("");
  const [file, setFile] = React.useState<File|null>(null);

  const mustHaveDates = ["IQAMA","PASSPORT","MOH_LICENSE","BLS","ACLS","CONSCIOUS_SEDATION"].includes(docType);

  async function createAndUpload() {
    const doc = await api.post(`/docs/${staff.id}`, { docType, customName: docType==="OTHERS" ? customName : null, issueDate: issueDate || null, expiryDate: expiryDate || null });
    if (!file) { alert("Upload file required"); return; }
    const fd = new FormData();
    fd.append("file", file);
    await api.post(`/docs/${doc.data.id}/upload`, fd);
    await onChanged();
    setCustomName(""); setIssueDate(""); setExpiryDate(""); setFile(null);
  }

  async function signedOpen(documentId:string) {
    const res = await api.get(`/docs/${documentId}/signed-url`);
    window.open(res.data.url, "_blank");
  }

  async function verify(documentId:string, status:"APPROVED"|"REJECTED") {
    await api.post(`/docs/${documentId}/verify`, { status });
    await onChanged();
  }

  return (
    <Section title="Documents (Admin view + verify)">
      <div className="rounded-xl border p-3">
        <div className="font-medium text-sm">Add / Upload Document</div>
        <div className="grid gap-2 md:grid-cols-5 mt-2">
          <select className="rounded-lg border px-3 py-2 text-sm" value={docType} onChange={e=>setDocType(e.target.value)}>
            {DOC_TYPES.map(d => <option key={d} value={d}>{d}</option>)}
          </select>
          <input className="rounded-lg border px-3 py-2 text-sm" placeholder="Custom name (Others)" value={customName} onChange={e=>setCustomName(e.target.value)} disabled={docType!=="OTHERS"} />
          <input className="rounded-lg border px-3 py-2 text-sm" type="date" value={issueDate} onChange={e=>setIssueDate(e.target.value)} required={mustHaveDates} />
          <input className="rounded-lg border px-3 py-2 text-sm" type="date" value={expiryDate} onChange={e=>setExpiryDate(e.target.value)} required={mustHaveDates} />
          <input className="rounded-lg border px-3 py-2 text-sm" type="file" accept=".pdf,.png,.jpg,.jpeg" onChange={e=>setFile(e.target.files?.[0] || null)} />
        </div>
        <button className="mt-2 rounded-lg bg-slate-900 text-white px-3 py-2 text-sm hover:bg-slate-800" onClick={createAndUpload}>
          Upload
        </button>
      </div>

      <div className="mt-3 overflow-auto">
        <table className="min-w-[900px] w-full text-sm">
          <thead className="text-left text-slate-500">
            <tr>
              <th className="py-2">Type</th>
              <th>Issue</th>
              <th>Expiry</th>
              <th>Remaining</th>
              <th>Status</th>
              <th>Verification</th>
              <th>File</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {staff.documents.map((d:any) => (
              <tr key={d.id} className="border-t">
                <td className="py-2">{d.docType}{d.customName ? ` (${d.customName})` : ""}</td>
                <td>{d.issueDate ? String(d.issueDate).slice(0,10) : "-"}</td>
                <td>{d.expiryDate ? String(d.expiryDate).slice(0,10) : "-"}</td>
                <td>{d.remainingDays ?? "-"}</td>
                <td>{d.status ?? "-"}</td>
                <td>{d.verificationStatus}</td>
                <td>
                  {d.currentVersion ? (
                    <button className="rounded-lg border px-2 py-1 text-xs hover:bg-slate-50" onClick={()=>signedOpen(d.id)}>Open</button>
                  ) : <span className="text-xs text-slate-500">No file</span>}
                </td>
                <td className="flex gap-2 py-2">
                  <button className="rounded-lg border px-2 py-1 text-xs hover:bg-slate-50" onClick={()=>verify(d.id,"APPROVED")}>Approve</button>
                  <button className="rounded-lg border px-2 py-1 text-xs hover:bg-slate-50" onClick={()=>verify(d.id,"REJECTED")}>Reject</button>
                </td>
              </tr>
            ))}
            {staff.documents.length===0 && <tr><td colSpan={8} className="py-4 text-slate-500">No documents yet.</td></tr>}
          </tbody>
        </table>
      </div>
    </Section>
  );
}

function Audit({ staffId }:{staffId:string}) {
  const [logs, setLogs] = React.useState<any[]>([]);
  React.useEffect(() => {
    api.get("/audit", { params: { staffId } }).then(r=>setLogs(r.data.items));
  }, [staffId]);

  return (
    <div className="rounded-2xl border bg-white p-4">
      <div className="font-semibold">Audit Log</div>
      <div className="mt-3 overflow-auto">
        <table className="min-w-[900px] w-full text-sm">
          <thead className="text-left text-slate-500">
            <tr><th className="py-2">When</th><th>Action</th><th>Field</th><th>Old</th><th>New</th><th>Actor</th></tr>
          </thead>
          <tbody>
            {logs.map(l => (
              <tr key={l.id} className="border-t">
                <td className="py-2">{String(l.createdAt).slice(0,19).replace("T"," ")}</td>
                <td>{l.action}</td>
                <td>{l.field || "-"}</td>
                <td className="max-w-[220px] truncate">{l.oldValue || "-"}</td>
                <td className="max-w-[220px] truncate">{l.newValue || "-"}</td>
                <td>{l.actorUserId}</td>
              </tr>
            ))}
            {logs.length===0 && <tr><td colSpan={6} className="py-4 text-slate-500">No logs.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
