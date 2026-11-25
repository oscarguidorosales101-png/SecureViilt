import "dotenv/config";
import { defineConfig } from "prisma/config";

const databaseUrl = process.env.DATABASE_URL || "postgresql://postgres.vblhexkxtenpermjasml:Ajo2829121314@aws-0-us-west-2.pooler.supabase.com:6543/postgres?pgbouncer=true";
const directUrl = process.env.DIRECT_URL || process.env.DATABASE_URL || "postgresql://postgres.vblhexkxtenpermjasml:Ajo2829121314@aws-0-us-west-2.pooler.supabase.com:5432/postgres";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: databaseUrl,
    directUrl: directUrl,
  },
});
