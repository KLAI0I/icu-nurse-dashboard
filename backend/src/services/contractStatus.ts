import { ContractStatus } from "@prisma/client";
import { remainingDays } from "./dates.js";

export function computeContractStatus(contractExpire: Date, suspended?: boolean) {
  if (suspended) return ContractStatus.SUSPENDED;
  const rem = remainingDays(contractExpire);
  if (rem <= 0) return ContractStatus.EXPIRED;
  if (rem < 60) return ContractStatus.ENDING_SOON;
  return ContractStatus.ACTIVE;
}
