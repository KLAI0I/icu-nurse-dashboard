import { Router } from "express";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { prisma } from "../prisma.js";
import { signAccessToken, signRefreshToken, verifyRefresh } from "../auth/tokens.js";
import { config } from "../config.js";
import { logger } from "../logger.js";

const r = Router();

const LoginSchema = z.object({ email: z.string().email(), password: z.string().min(6) });

function cookieOptions() {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/"
  };
}

r.post("/login", async (req, res) => {
  const parsed = LoginSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ message: "Invalid input", issues: parsed.error.issues });

  const user = await prisma.user.findUnique({ where: { email: parsed.data.email }, include: { staff: true } });
  if (!user || !user.isActive) return res.status(401).json({ message: "Invalid credentials" });

  const ok = await bcrypt.compare(parsed.data.password, user.passwordHash);
  if (!ok) return res.status(401).json({ message: "Invalid credentials" });

  const access = await signAccessToken({ sub: user.id, role: user.role, staffId: user.staffId ?? null });
  const refresh = await signRefreshToken({ sub: user.id });
  const refreshHash = await bcrypt.hash(refresh, 12);

  await prisma.refreshToken.create({
    data: {
      userId: user.id,
      tokenHash: refreshHash,
      expiresAt: new Date(Date.now() + config.refreshTtlDays * 86400 * 1000),
      userAgent: req.get("user-agent") || undefined,
      ip: req.ip
    }
  });

  res.cookie("refresh_token", refresh, cookieOptions());
  return res.json({
    accessToken: access,
    user: { id: user.id, email: user.email, role: user.role, staffId: user.staffId ?? null }
  });
});

r.post("/refresh", async (req, res) => {
  const refresh = req.cookies?.refresh_token;
  if (!refresh) return res.status(401).json({ message: "Missing refresh token" });

  try {
    const payload = await verifyRefresh(refresh);
    const userId = payload.sub as string;

    const tokens = await prisma.refreshToken.findMany({
      where: { userId, revokedAt: null, expiresAt: { gt: new Date() } }
    });

    const match = await Promise.all(tokens.map(t => bcrypt.compare(refresh, t.tokenHash).then(ok => (ok ? t : null))));
    const tokenRow = match.find(Boolean);
    if (!tokenRow) return res.status(401).json({ message: "Invalid refresh token" });

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user || !user.isActive) return res.status(401).json({ message: "User inactive" });

    const access = await signAccessToken({ sub: user.id, role: user.role, staffId: user.staffId ?? null });
    return res.json({ accessToken: access });
  } catch (e) {
    logger.warn({ e }, "refresh failed");
    return res.status(401).json({ message: "Invalid refresh token" });
  }
});

r.post("/logout", async (req, res) => {
  const refresh = req.cookies?.refresh_token;
  if (refresh) {
    const all = await prisma.refreshToken.findMany({ where: { revokedAt: null } });
    for (const t of all) {
      const ok = await bcrypt.compare(refresh, t.tokenHash);
      if (ok) await prisma.refreshToken.update({ where: { id: t.id }, data: { revokedAt: new Date() } });
    }
  }
  res.clearCookie("refresh_token", cookieOptions());
  return res.json({ ok: true });
});

r.post("/forgot", async (_req, res) => res.json({ ok: true, message: "Stubbed. Implement email provider later." }));
r.post("/reset", async (_req, res) => res.json({ ok: true, message: "Stubbed. Implement token verification later." }));

export default r;
