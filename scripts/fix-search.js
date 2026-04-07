const fs = require('fs');
let c = fs.readFileSync('src/actions/appointments.ts', 'utf8');

c = c.replace(
    'import { and, eq, sql, asc } from "drizzle-orm";', 
    'import { and, eq, sql, asc, ilike, or } from "drizzle-orm";'
);

const searchConditionString = `    if (status) conditions.push(eq(appointments.status, status));

    if (search) {
        conditions.push(
            or(
                ilike(clientUser.name, \`%\${search}%\`),
                ilike(appointments.serviceName, \`%\${search}%\`)
            )
        );
    }`;

c = c.replace('    if (status) conditions.push(eq(appointments.status, status));', searchConditionString);

const regexFilterToReplace = /\/\/ Filter by search \(client name\)[ \t\r\n\S]*?mapped = mapped.filter\([ \t\r\n\S]*?\);[ \t\r\n]*\}/m;

c = c.replace(regexFilterToReplace, 'const mapped = rows.map(mapRow);');

const countQueryOriginal = `    // Total count
    const [countResult] = await db
        .select({ count: sql<number>\`count(*)\` })
        .from(appointments)
        .where(and(...conditions));`;

const countQueryNew = `    // Total count
    const [countResult] = await db
        .select({ count: sql<number>\`count(*)\` })
        .from(appointments)
        .leftJoin(clientUser, eq(appointments.clientId, clientUser.id))
        .where(and(...conditions));`;

// The exact string matching can sometimes be tricky due to CRLF.
// Let's use regex for count.
c = c.replace(/\/\/ Total count[\s\S]*?\.where\(and\(\.\.\.conditions\)\);/, countQueryNew);

fs.writeFileSync('src/actions/appointments.ts', c);
