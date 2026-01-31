import { Router } from "express";
import multer from "multer";
import { z } from "zod";
import { prisma } from "../prisma.js";
import { requireAuth, requireRole } from "../auth/middleware.js";
import { computeDocStatus } from "../services/docStatus.js";
import { remainingDays } from "../services/dates.js";
import { storage } from "../storage/index.js";
import { config } from "../config.js";

const r = Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: config.maxFileMB * 1024 * 1024 }
});

const MetaSchema = z.object({
  docType: z.enum([
    "IQAMA", "PASSPORT", "MOH_LICENSE", "CERTIFICATE_OF_GRADUATION", "DATA_FLOW", "SCFHS",
    "BLS", "ACLS", "CONSCIOUS_SEDATION", "OTHERS"
  ]),
  customName: z.string().optional().nullable(),
  issueDate: z.string().optional().nullable(),
  expiryDate: z.string().optional().nullable()
});

r.post("/:staffId", requireAuth, async (req, res) => {
  const staffId = req.params.staffId;
  if (req.user!.role === "STAFF" && req.user!.staffId !== staffId) return res.status(403).json({ message: "Forbidden" });

  const parsed = MetaSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ message: "Invalid", issues: parsed.error.issues });

  const issueDate = parsed.data.issueDate ? new Date(parsed.data.issueDate) : null;
  const expiryDate = parsed.data.expiryDate ? new Date(parsed.data.expiryDate) : null;

  // Issue/Expiry required for specific doc types:
  const mustHaveDates = ["IQAMA","PASSPORT","MOH_LICENSE","BLS","ACLS","CONSCIOUS_SEDATION"];
  if (mustHaveDates.includes(parsed.data.docType) && (!issueDate || !expiryDate)) {
    return res.status(400).json({ message: "Issue and Expiry dates are required for this document type" });
  }

  const rem = expiryDate ? remainingDays(expiryDate) : null;
  const status = computeDocStatus(expiryDate);

  const doc = await prisma.document.create({
    data: {
      staffId,
      docType: parsed.data.docType as any,
      customName: parsed.data.docType === "OTHERS" ? (parsed.data.customName ?? "Other") : null,
      issueDate,
      expiryDate,
      remainingDays: rem,
      status
    }
  });

  await prisma.auditLog.create({
    data: { actorUserId: req.user!.id, staffId, documentId: doc.id, action: "DOC_CREATE", newValue: doc.docType }
  });

  res.status(201).json(doc);
});

r.post("/:documentId/upload", requireAuth, upload.single("file"), async (req, res) => {
  const documentId = req.params.documentId;
  const doc = await prisma.document.findUnique({ where: { id: documentId }, include: { currentVersion: true } });
  if (!doc) return res.status(404).json({ message: "Document not found" });

  if (req.user!.role === "STAFF" && req.user!.staffId !== doc.staffId) return res.status(403).json({ message: "Forbidden" });

  const file = req.file;
  if (!file) return res.status(400).json({ message: "Missing file" });

  const allowed = ["application/pdf", "image/jpeg", "image/png"];
  if (!allowed.includes(file.mimetype)) return res.status(400).json({ message: "Invalid file type" });

  // Virus scan hook placeholder:
  // TODO integrate ClamAV/cloud scanner; if suspicious -> reject.

  const fileKey = `staff/${doc.staffId}/docs/${doc.id}/${Date.now()}-${file.originalname}`.replaceAll(" ", "_");
  await storage.putPrivate({ buffer: file.buffer, fileKey, contentType: file.mimetype });

  const ver = await prisma.documentVersion.create({
    data: {
      documentId: doc.id,
      fileKey,
      fileName: file.originalname,
      mimeType: file.mimetype,
      sizeBytes: file.size,
      uploadedById: req.user!.id
    }
  });

  const updated = await prisma.document.update({
    where: { id: doc.id },
    data: { currentVersionId: ver.id, verificationStatus: "PENDING", verifiedByUserId: null, verifiedAt: null }
  });

  await prisma.auditLog.create({
    data: { actorUserId: req.user!.id, staffId: doc.staffId, documentId: doc.id, action: "DOC_UPLOAD", newValue: ver.fileKey }
  });

  res.json({ document: updated, version: ver });
});

r.get("/:documentId/signed-url", requireAuth, async (req, res) => {
  const doc = await prisma.document.findUnique({ where: { id: req.params.documentId }, include: { currentVersion: true } });
  if (!doc || !doc.currentVersion) return res.status(404).json({ message: "Not found" });

  if (req.user!.role === "STAFF" && req.user!.staffId !== doc.staffId) return res.status(403).json({ message: "Forbidden" });

  const url = await storage.signedGetUrl({ fileKey: doc.currentVersion.fileKey, expiresInSec: 60 });
  res.json({ url });
});

r.post("/:documentId/verify", requireAuth, requireRole("ADMIN"), async (req, res) => {
  const schema = z.object({ status: z.enum(["APPROVED", "REJECTED"]), note: z.string().optional() });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ message: "Invalid", issues: parsed.error.issues });

  const updated = await prisma.document.update({
    where: { id: req.params.documentId },
    data: { verificationStatus: parsed.data.status as any, verifiedByUserId: req.user!.id, verifiedAt: new Date() }
  });

  await prisma.auditLog.create({
    data: { actorUserId: req.user!.id, staffId: updated.staffId, documentId: updated.id, action: "DOC_VERIFY", newValue: parsed.data.status }
  });

  res.json(updated);
});

export default r;
