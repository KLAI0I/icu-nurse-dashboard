import { DocStatus } from "@prisma/client";
import { remainingDays } from "./dates.js";

export function computeDocStatus(expiryDate?: Date | null) {
  if (!expiryDate) return null;
  const rem = remainingDays(expiryDate);
  if (rem <= 0) return DocStatus.EXPIRED;
  if (rem < 30) return DocStatus.URGENT;
  if (rem < 60) return DocStatus.EXPIRING_SOON;
  return DocStatus.VALID;
}
