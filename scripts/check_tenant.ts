import { db } from "../src/db";
import { tenants, users, schedules } from "../src/db/schema";
import { eq } from "drizzle-orm";

async function main() {
  const slug = process.argv[2];
  if (!slug) {
    console.error("Missing slug");
    process.exit(1);
  }

  const tenant = await db.query.tenants.findFirst({
    where: eq(tenants.slug, slug),
  });

  if (!tenant) {
    console.error("No tenant found");
    process.exit(1);
  }

  console.log(`Tenant: ${tenant.name} (${tenant.id})`);

  const staff = await db.query.users.findMany({
    where: eq(users.tenantId, tenant.id),
  });

  console.log(`Staff count: ${staff.length}`);
  staff.forEach(s => console.log(`- ${s.name} (${s.id}) Role: ${s.role}`));

  const allSchedules = await db.query.schedules.findMany({
    where: eq(schedules.tenantId, tenant.id),
  });

  console.log(`Schedules count: ${allSchedules.length}`);
  allSchedules.forEach(sc => {
      console.log(`- Staff ${sc.staffId} Day ${sc.dayOfWeek}: ${sc.startTime} - ${sc.endTime} Active: ${sc.isActive}`);
  });
}

main().catch(console.error);
