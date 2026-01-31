import { Router } from "express";
import { prisma } from "../prisma.js";
import { requireAuth, requireRole } from "../auth/middleware.js";
import { z } from "zod";
import bcrypt from "bcryptjs";

const r = Router();
r.use(requireAuth, requireRole("ADMIN"));

const CreateUserSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  role: z.enum(["ADMIN", "STAFF"]),
  isActive: z.boolean().optional(),
  staffId: z.string().optional().nullable()
});

r.get("/", async (_req, res) => {
  const users = await prisma.user.findMany({ include: { staff: true }, orderBy: { createdAt: "desc" } });
  res.json({ items: users.map(u => ({ id: u.id, email: u.email, role: u.role, isActive: u.isActive, staffId: u.staffId, createdAt: u.createdAt })) });
});

r.post("/", async (req, res) => {
  const parsed = CreateUserSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ message: "Invalid", issues: parsed.error.issues });

  const passwordHash = await bcrypt.hash(parsed.data.password, 12);

  const created = await prisma.user.create({
    data: {
      email: parsed.data.email,
      passwordHash,
      role: parsed.data.role as any,
      isActive: parsed.data.isActive ?? true,
      staffId: parsed.data.staffId ?? null
    }
  });

  await prisma.auditLog.create({
    data: { actorUserId: req.user!.id, action: "USER_CREATE", newValue: created.email }
  });

  res.status(201).json({ id: created.id, email: created.email, role: created.role, isActive: created.isActive, staffId: created.staffId });
});

r.patch("/:id", async (req, res) => {
  const schema = z.object({
    role: z.enum(["ADMIN", "STAFF"]).optional(),
    isActive: z.boolean().optional(),
    staffId: z.string().nullable().optional()
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ message: "Invalid", issues: parsed.error.issues });

  const updated = await prisma.user.update({ where: { id: req.params.id }, data: parsed.data as any });

  await prisma.auditLog.create({
    data: { actorUserId: req.user!.id, action: "USER_UPDATE", field: "user", newValue: updated.email }
  });

  res.json({ id: updated.id, email: updated.email, role: updated.role, isActive: updated.isActive, staffId: updated.staffId });
});

r.post("/:id/reset-password", async (req, res) => {
  const schema = z.object({ newPassword: z.string().min(8) });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ message: "Invalid", issues: parsed.error.issues });

  const hash = await bcrypt.hash(parsed.data.newPassword, 12);
  const updated = await prisma.user.update({ where: { id: req.params.id }, data: { passwordHash: hash } });

  await prisma.auditLog.create({
    data: { actorUserId: req.user!.id, action: "USER_RESET_PASSWORD", newValue: updated.email }
  });

  res.json({ ok: true });
});

export default r;
