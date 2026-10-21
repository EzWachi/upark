import { Prisma } from "@/lib/generated/prisma/client";
import type { Resultado } from "@/components/formulario";

/** Violación de un índice único (nombre, correo o identificación repetidos). */
export const esDuplicado = (e: unknown) => e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002";

/** Primer mensaje de un error de Zod, para mostrarlo en el formulario. */
export function primerError(error: { issues: { message: string }[] }): Resultado {
  return { error: error.issues[0]?.message ?? "Datos inválidos" };
}
