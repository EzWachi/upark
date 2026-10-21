import "server-only";
import { cookies } from "next/headers";
import { db } from "@/lib/db";

/** CU-11: el parqueo del turno se guarda en el dispositivo del guarda. */
export const COOKIE_TURNO = "upark_parqueo";

/** El parqueo del turno, si sigue activo (RN-20). */
export async function parqueoDelTurno() {
  const id = (await cookies()).get(COOKIE_TURNO)?.value;
  if (!id) return null;
  return db.parqueos.findFirst({ where: { id, activo: true } });
}
