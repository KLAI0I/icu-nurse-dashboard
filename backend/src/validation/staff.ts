import { z } from "zod";

export const GenderEnum = z.enum(["MALE", "FEMALE", "OTHER"]);
export const ContractStatusEnum = z.enum(["ACTIVE", "EXPIRED", "ENDING_SOON", "SUSPENDED"]);

export const StaffCreateSchema = z.object({
  idNo: z.string().min(3),
  staffName: z.string().min(2),
  currentArea: z.string().min(1),
  currentPost: z.string().min(1),
  gender: GenderEnum,
  birthday: z.coerce.date(),
  nationality: z.string().min(2),
  joiningDate: z.coerce.date(),
  contractExpire: z.coerce.date(),
  contractStatus: ContractStatusEnum.optional(),
  contractType: z.string().min(1),
  iqamaNo: z.string().optional().nullable(),
  passportNo: z.string().optional().nullable(),
  degree: z.string().optional().nullable(),
  speciality: z.string().optional().nullable(),
  saudiCouncil: z.string().optional().nullable(),
  classification: z.string().optional().nullable(),
  dataFlow: z.string().optional().nullable(),
  moh: z.string().optional().nullable(),
  bls: z.string().optional().nullable(),
  acls: z.string().optional().nullable(),
  cSedation: z.string().optional().nullable(),
  mobileNo: z.string().min(8),
  personalEmail: z.string().email(),
  careEmail: z.string().email(),
  notes: z.string().optional().nullable()
});

export const StaffAdminUpdateSchema = StaffCreateSchema.partial().omit({ idNo: true });

export const StaffSelfUpdateSchema = z.object({
  mobileNo: z.string().min(8).optional(),
  personalEmail: z.string().email().optional(),
  careEmail: z.string().email().optional()
});
