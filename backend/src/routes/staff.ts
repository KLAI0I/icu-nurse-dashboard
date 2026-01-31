import { Router } from "express";
import { prisma } from "../prisma.js";
import { requireAuth, requireRole } from "../auth/middleware.js";
import { StaffAdminUpdateSchema, StaffCreateSchema, StaffSelfUpdateSchema } from "../validation/staff.js";
import { computeContractStatus } from "../services/contractStatus.js";
import { serviceYears, remainingDays } from "../services/dates.js";

const r = Router();

async function audit(actorUserId: string, params: { staffId?: string; documentId?: string; action: string; field?: string; oldValue?: any; newValue?: any }) {
  await prisma.auditLog.create({
    data: {
      actorUserId,
      staffId: params.staffId ?? null,
      documentId: params.documentId ?? null,
      action: params.action,
      field: params.field ?? null,
      oldValue: params.oldValue == null ? null : String(params.oldValue),
      newValue: params.newValue == null ? null : String(params.newValue)
    }
  });
}

r.get("/", requireAuth, requireRole("ADMIN"), async (req, res) => {
  const q = String(req.query.q || "").trim();
  const area = req.query.area ? String(req.query.area) : undefined;
  const post = req.query.post ? String(req.query.post) : undefined;
  const gender = req.query.gender ? String(req.query.gender) : undefined;
  const nationality = req.query.nationality ? String(req.query.nationality) : undefined;
  const contractStatus = req.query.contractStatus ? String(req.query.contractStatus) : undefined;

  const rows = await prisma.staff.findMany({
    where: {
      AND: [
        q
          ? {
              OR: [
                { staffName: { contains: q, mode: "insensitive" } },
                { idNo: { contains: q, mode: "insensitive" } },
                { personalEmail: { contains: q, mode: "insensitive" } },
                { careEmail: { contains: q, mode: "insensitive" } }
              ]
            }
          : {},
        area ? { currentArea: area } : {},
        post ? { currentPost: post } : {},
        gender ? { gender: gender as any } : {},
        nationality ? { nationality } : {},
        contractStatus ? { contractStatus: contractStatus as any } : {}
      ]
    },
    orderBy: { updatedAt: "desc" }
  });

  const enriched = rows.map(s => ({
    ...s,
    remainingContractDays: remainingDays(s.contractExpire),
    serviceYears: serviceYears(s.joiningDate)
  }));

  return res.json({ items: enriched });
});

r.post("/", requireAuth, requireRole("ADMIN"), async (req, res) => {
  const parsed = StaffCreateSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ message: "Invalid", issues: parsed.error.issues });

  const contractStatus = computeContractStatus(parsed.data.contractExpire);

  const created = await prisma.staff.create({
    data: { ...parsed.data, contractStatus }
  });

  await audit(req.user!.id, { staffId: created.id, action: "STAFF_CREATE" });
  return res.status(201).json(created);
});

r.get("/:id", requireAuth, async (req, res) => {
  const staff = await prisma.staff.findUnique({
    where: { id: req.params.id },
    include: { documents: { include: { currentVersion: true } } }
  });
  if (!staff) return res.status(404).json({ message: "Not found" });

  if (req.user!.role === "STAFF" && req.user!.staffId !== staff.id) return res.status(403).json({ message: "Forbidden" });

  return res.json({
    ...staff,
    remainingContractDays: remainingDays(staff.contractExpire),
    serviceYears: serviceYears(staff.joiningDate)
  });
});

r.patch("/:id", requireAuth, requireRole("ADMIN"), async (req, res) => {
  const parsed = StaffAdminUpdateSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ message: "Invalid", issues: parsed.error.issues });

  const before = await prisma.staff.findUnique({ where: { id: req.params.id } });
  if (!before) return res.status(404).json({ message: "Not found" });

  const nextData: any = { ...parsed.data };
  if (parsed.data.contractExpire) nextData.contractStatus = computeContractStatus(parsed.data.contractExpire);

  const updated = await prisma.staff.update({ where: { id: req.params.id }, data: nextData });

  for (const [k, v] of Object.entries(parsed.data)) {
    const oldV = (before as any)[k];
    if (v !== undefined && String(oldV ?? "") !== String(v ?? "")) {
      await audit(req.user!.id, { staffId: updated.id, action: "STAFF_UPDATE_FIELD", field: k, oldValue: oldV, newValue: v });
    }
  }

  return res.json(updated);
});

r.patch("/:id/self", requireAuth, requireRole("STAFF"), async (req, res) => {
  if (req.user!.staffId !== req.params.id) return res.status(403).json({ message: "Forbidden" });

  const parsed = StaffSelfUpdateSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ message: "Invalid", issues: parsed.error.issues });

  const before = await prisma.staff.findUnique({ where: { id: req.params.id } });
  if (!before) return res.status(404).json({ message: "Not found" });

  const updated = await prisma.staff.update({ where: { id: req.params.id }, data: parsed.data });

  for (const [k, v] of Object.entries(parsed.data)) {
    const oldV = (before as any)[k];
    if (v !== undefined && String(oldV ?? "") !== String(v ?? "")) {
      await audit(req.user!.id, { staffId: updated.id, action: "STAFF_SELF_UPDATE_FIELD", field: k, oldValue: oldV, newValue: v });
    }
  }

  return res.json(updated);
});

r.get("/export/csv", requireAuth, requireRole("ADMIN"), async (_req, res) => {
  const rows = await prisma.staff.findMany({ orderBy: { staffName: "asc" } });
  const headers = [
    "ID No.", "STAFF NAME", "Current AREA", "Current POST", "Gender", "BIRTHDAY",
    "NATIONALITY", "JOINING DATE", "Contract Expire", "Remaining", "Contract Status",
    "CONTRACT TYPE", "IQAMA NO.", "PASSPORT NO.", "DEGREE", "SPECIALITY", "SAUDI COUNCIL",
    "CLASSIFICATION", "DATA FLOW", "MOH", "BLS", "ACLS", "C. SEDATION", "MOBILE NO.",
    "Personal E-MAIL", "Care Email"
  ];

  const lines = [headers.join(",")].concat(
    rows.map(s => {
      const rem = remainingDays(s.contractExpire);
      return [
        s.idNo, s.staffName, s.currentArea, s.currentPost, s.gender,
        s.birthday.toISOString().slice(0, 10),
        s.nationality,
        s.joiningDate.toISOString().slice(0, 10),
        s.contractExpire.toISOString().slice(0, 10),
        String(rem),
        s.contractStatus,
        s.contractType,
        s.iqamaNo ?? "", s.passportNo ?? "", s.degree ?? "", s.speciality ?? "",
        s.saudiCouncil ?? "", s.classification ?? "", s.dataFlow ?? "",
        s.moh ?? "", s.bls ?? "", s.acls ?? "", s.cSedation ?? "",
        s.mobileNo, s.personalEmail, s.careEmail
      ].map(v => `"${String(v).replaceAll(`"`, `""`)}"`).join(",");
    })
  );

  res.setHeader("content-type", "text/csv; charset=utf-8");
  res.setHeader("content-disposition", "attachment; filename=staff_export.csv");
  return res.send(lines.join("\n"));
});

export default r;
