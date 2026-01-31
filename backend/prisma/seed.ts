import { PrismaClient, Role, Gender, ContractStatus, DocType } from "@prisma/client";
import bcrypt from "bcryptjs";
import { DateTime } from "luxon";

const prisma = new PrismaClient();
const TZ = process.env.APP_TIMEZONE || "Asia/Riyadh";

function dtPlus(days: number) {
  return DateTime.now().setZone(TZ).plus({ days }).startOf("day").toJSDate();
}

async function main() {
  const adminPass = await bcrypt.hash("Admin@12345", 12);
  const staffPass = await bcrypt.hash("Staff@12345", 12);

  const staff = await Promise.all(
    Array.from({ length: 10 }).map((_, i) => {
      const contractExpire = dtPlus([-10, 5, 20, 35, 65, 95, 120, 15, 55, 200][i]);
      const now = DateTime.now().setZone(TZ);
      const remaining = Math.floor(DateTime.fromJSDate(contractExpire).diff(now, "days").days);

      let status: ContractStatus =
        remaining <= 0 ? "EXPIRED" : remaining < 60 ? "ENDING_SOON" : "ACTIVE";

      return prisma.staff.create({
        data: {
          idNo: `ICU-${1000 + i}`,
          staffName: `Nurse ${String.fromCharCode(65 + i)} Ahmed`,
          currentArea: ["ICU A", "ICU B", "ER", "Ward"][i % 4],
          currentPost: ["RN", "Charge Nurse", "Supervisor"][i % 3],
          gender: (i % 2 === 0 ? Gender.FEMALE : Gender.MALE),
          birthday: DateTime.fromObject({ year: 1990 + (i % 6), month: 3 + (i % 9), day: 10 + (i % 10) }, { zone: TZ }).toJSDate(),
          nationality: ["Saudi", "Egyptian", "Filipino", "Indian"][i % 4],
          joiningDate: DateTime.now().setZone(TZ).minus({ years: 1 + (i % 7), months: i }).toJSDate(),
          contractExpire,
          contractStatus: status,
          contractType: ["Full-time", "Contract", "Part-time"][i % 3],
          iqamaNo: `IQ-${2000 + i}`,
          passportNo: `P-${3000 + i}`,
          degree: ["BSN", "Diploma", "MSN"][i % 3],
          speciality: ["ICU", "ER", "CCU"][i % 3],
          saudiCouncil: "Registered",
          classification: ["A", "B"][i % 2],
          dataFlow: "Complete",
          moh: "Valid",
          bls: "Valid",
          acls: "Valid",
          cSedation: "Valid",
          mobileNo: `+9665${Math.floor(10000000 + Math.random() * 89999999)}`,
          personalEmail: `nurse${i}@example.com`,
          careEmail: `nurse${i}@hospital.local`,
          notes: i % 3 === 0 ? "Strong performer. Keep for leadership track." : null
        }
      });
    })
  );

  await prisma.user.create({
    data: { email: "admin@icu.local", passwordHash: adminPass, role: Role.ADMIN, isActive: true }
  });

  for (let i = 0; i < 5; i++) {
    await prisma.user.create({
      data: {
        email: `staff${i}@icu.local`,
        passwordHash: staffPass,
        role: Role.STAFF,
        isActive: true,
        staffId: staff[i].id
      }
    });
  }

  for (let i = 0; i < staff.length; i++) {
    await prisma.document.createMany({
      data: [
        { staffId: staff[i].id, docType: DocType.IQAMA, issueDate: dtPlus(-300), expiryDate: dtPlus([90, 40, 20, 10, -2, 180, 65, 55, 25, 5][i]) },
        { staffId: staff[i].id, docType: DocType.PASSPORT, issueDate: dtPlus(-900), expiryDate: dtPlus([365, 120, 59, 29, -1, 500, 200, 80, 31, 2][i]) },
        { staffId: staff[i].id, docType: DocType.BLS, issueDate: dtPlus(-200), expiryDate: dtPlus([70, 58, 28, -5, 300, 45, 10, 90, 15, 120][i]) }
      ]
    });
  }
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
