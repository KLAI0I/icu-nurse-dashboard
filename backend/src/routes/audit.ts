import { Router } from "express";
import { requireAuth, requireRole } from "../auth/middleware.js";
import { prisma } from "../prisma.js";

const r = Router();
r.get("/", requireAuth, requireRole("ADMIN"), async (req, res) => {
  const staffId = req.query.staffId ? String(req.query.staffId) : undefined;
  const docId = req.query.documentId ? String(req.query.documentId) : undefined;

  const logs = await prisma.auditLog.findMany({
    where: { staffId: staffId ?? undefined, documentId: docId ?? undefined },
    orderBy: { createdAt: "desc" },
    take: 200
  });

  res.json({ items: logs });
});

export default r;
