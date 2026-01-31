import React from "react";
import { useAuth } from "../../app/auth";
import { api } from "../../lib/api";

const DOC_TYPES = [
  "IQAMA","PASSPORT","MOH_LICENSE","CERTIFICATE_OF_GRADUATION","DATA_FLOW","SCFHS","BLS","ACLS","CONSCIOUS_SEDATION","OTHERS"
] as const;

export default function StaffMyDocuments() {
  const { user } = useAuth();
  const staffId = user?.staffId;
  const [staff, setStaff] = React.useState<any>(null);

  const [docType, setDocType] = React.useState<string>("IQAMA");
  const [customName, setCustomName] = React.useState("");
  const [issueDate, setIssueDate] = React.useState("");
  const [expiryDate, setExpiryDate] = React.useState("");
  const [file, setFile] = React.useState<File|null>(null);

  async function load() {
    if (!staffId) return;
    const res = await api.get(`/staff/${staffId}`);
    setStaff(res.data);
  }
  React.useEffect(() => { load(); }, [staffId]);

  const mustHaveDates = ["IQAMA","PASSPORT","MOH_LICENSE","BLS","ACLS","CONSCIOUS_SEDATION"].includes(docType);

  async function createAndUpload() {
    if (!staffId) return;
    const doc = await api.post(`/docs/${staffId}`, { docType, customName: docType==="OTHERS" ? customName : null, issueDate: issueDate || null, expiryDate: expiryDate || null });
    if (!file) { alert("Upload file required"); return; }
    const fd = new FormData();
    fd.append("file", file);
    await api.post(`/docs/${doc.data.id}/upload`, fd);
    await load();
    setCustomName(""); setIssueDate(""); setExpiryDate(""); setFile(null);
  }

  async function signedOpen(documentId:string) {
    const res = await api.get(`/docs/${documentId}/signed-url`);
    window.open(res.data.url, "_blank");
  }

  if (!staffId) return <div className="text-slate-500">No linked staff record. Ask admin to link your account.</div>;
  if (!staff) return <div className="text-slate-500">Loading…</div>;

  return (
    <div className="space-y-3">
      <div>
        <div className="text-lg font-semibold">My Documents</div>
        <div className="text-sm text-slate-600">Upload documents with issue/expiry dates and track remaining days.</div>
      </div>

      <div className="rounded-2xl border bg-white p-4">
        <div className="font-semibold">Upload Document</div>
        <div className="grid gap-2 md:grid-cols-5 mt-3">
          <select className="rounded-lg border px-3 py-2 text-sm" value={docType} onChange={e=>setDocType(e.target.value)}>
            {DOC_TYPES.map(d => <option key={d} value={d}>{d}</option>)}
          </select>
          <input className="rounded-lg border px-3 py-2 text-sm" placeholder="Custom name (Others)" value={customName} onChange={e=>setCustomName(e.target.value)} disabled={docType!=="OTHERS"} />
          <input className="rounded-lg border px-3 py-2 text-sm" type="date" value={issueDate} onChange={e=>setIssueDate(e.target.value)} required={mustHaveDates} />
          <input className="rounded-lg border px-3 py-2 text-sm" type="date" value={expiryDate} onChange={e=>setExpiryDate(e.target.value)} required={mustHaveDates} />
          <input className="rounded-lg border px-3 py-2 text-sm" type="file" accept=".pdf,.png,.jpg,.jpeg" onChange={e=>setFile(e.target.files?.[0] || null)} />
        </div>
        <button className="mt-3 rounded-lg bg-slate-900 text-white px-3 py-2 text-sm hover:bg-slate-800" onClick={createAndUpload}>
          Upload
        </button>
        <div className="mt-2 text-xs text-slate-500">
          Allowed: PDF/JPG/PNG. Max size controlled by backend env MAX_FILE_MB. Virus scan hook placeholder exists.
        </div>
      </div>

      <div className="rounded-2xl border bg-white overflow-auto">
        <table className="min-w-[900px] w-full text-sm">
          <thead className="text-left text-slate-500">
            <tr>
              <th className="py-2 px-3">Type</th>
              <th className="py-2 px-3">Issue</th>
              <th className="py-2 px-3">Expiry</th>
              <th className="py-2 px-3">Remaining</th>
              <th className="py-2 px-3">Status</th>
              <th className="py-2 px-3">Verification</th>
              <th className="py-2 px-3">File</th>
            </tr>
          </thead>
          <tbody>
            {staff.documents.map((d:any) => (
              <tr key={d.id} className="border-t">
                <td className="py-2 px-3">{d.docType}{d.customName ? ` (${d.customName})` : ""}</td>
                <td className="py-2 px-3">{d.issueDate ? String(d.issueDate).slice(0,10) : "-"}</td>
                <td className="py-2 px-3">{d.expiryDate ? String(d.expiryDate).slice(0,10) : "-"}</td>
                <td className="py-2 px-3">{d.remainingDays ?? "-"}</td>
                <td className="py-2 px-3">{d.status ?? "-"}</td>
                <td className="py-2 px-3">{d.verificationStatus}</td>
                <td className="py-2 px-3">
                  {d.currentVersion ? (
                    <button className="rounded-lg border px-2 py-1 text-xs hover:bg-slate-50" onClick={()=>signedOpen(d.id)}>Open</button>
                  ) : <span className="text-xs text-slate-500">No file</span>}
                </td>
              </tr>
            ))}
            {staff.documents.length===0 && <tr><td colSpan={7} className="py-6 text-center text-slate-500">No documents uploaded.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
