import { Prisma } from "@/lib/generated/prisma/client";
import type { Resultado } from "@/components/formulario";

/** Violación de un índice único (nombre, correo o identificación repetidos). */
export const esDuplicado = (e: unknown) => e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002";

/**
 * CU-38, 3a: la cuenta ya quedó guardada aunque el correo no saliera. Va como
 * aviso y no como error para que el formulario no invite a repetir la acción.
 */
export const CORREO_NO_SALIO = 'El correo no se pudo enviar. Usa "Reenviar acceso" en la lista.';
export const REENVIO_NO_SALIO = "El correo no se pudo enviar. Intenta de nuevo en unos minutos.";

/** Primer mensaje de un error de Zod, para mostrarlo en el formulario. */
export function primerError(error: { issues: { message: string }[] }): Resultado {
  return { error: error.issues[0]?.message ?? "Datos inválidos" };
}
