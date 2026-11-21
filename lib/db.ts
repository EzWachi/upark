import { PrismaClient } from "@/lib/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

declare global {
  var prisma: PrismaClient | undefined;
}

// Pocas conexiones por instancia: en producción el pooler de Neon o Supabase
// es el que multiplexa.
// El adaptador pg ignora `?schema=` del URL (Prisma Migrate sí lo usa), así
// que se le pasa aparte. Permite tener UPark en un schema propio, no `public`.
const url = process.env.DATABASE_URL;
const schema = url ? new URL(url).searchParams.get("schema") ?? undefined : undefined;
const adapter = new PrismaPg(
  { connectionString: url, max: Number(process.env.DATABASE_POOL_MAX ?? 5) },
  { schema },
);

export const db = global.prisma ?? new PrismaClient({ adapter });

if (process.env.NODE_ENV !== "production") {
  global.prisma = db;
}
