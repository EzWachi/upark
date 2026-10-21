import { createHash, randomBytes } from "node:crypto";
import { db } from "@/lib/db";
import type { tipo_token } from "@/lib/generated/prisma/enums";

/** Horas de validez de cada enlace (CU-02 6a, CU-03, CU-24 paso 5). */
export const VIGENCIA_HORAS: Record<tipo_token, number> = {
  verificacion: 24,
  recuperacion: 1,
  acceso: 72,
};

export const hashToken = (token: string) => createHash("sha256").update(token).digest("hex");

/**
 * Crea un enlace de un solo uso y devuelve el token en claro, que solo viaja en
 * el correo. En la base queda el hash. Invalida los enlaces anteriores del
 * mismo tipo para que solo sirva el último.
 */
export async function crearToken(usuarioId: string, tipo: tipo_token): Promise<string> {
  const token = randomBytes(32).toString("base64url");
  await db.$transaction([
    db.tokens_correo.updateMany({
      where: { usuario_id: usuarioId, tipo, usado_at: null },
      data: { usado_at: new Date() },
    }),
    db.tokens_correo.create({
      data: {
        usuario_id: usuarioId,
        tipo,
        token_hash: hashToken(token),
        expira_at: new Date(Date.now() + VIGENCIA_HORAS[tipo] * 3_600_000),
      },
    }),
  ]);
  return token;
}

export type EstadoToken = { estado: "valido"; usuarioId: string; id: string } | { estado: "vencido" | "invalido" };

/** Revisa un token sin gastarlo. */
export async function revisarToken(token: string, tipos: tipo_token[]): Promise<EstadoToken> {
  const fila = await db.tokens_correo.findUnique({ where: { token_hash: hashToken(token) } });
  if (!fila || !tipos.includes(fila.tipo) || fila.usado_at) return { estado: "invalido" };
  if (fila.expira_at < new Date()) return { estado: "vencido" };
  return { estado: "valido", usuarioId: fila.usuario_id, id: fila.id };
}

/** Marca el token como usado. Devuelve false si otro request lo gastó antes. */
export async function gastarToken(id: string): Promise<boolean> {
  const { count } = await db.tokens_correo.updateMany({
    where: { id, usado_at: null },
    data: { usado_at: new Date() },
  });
  return count === 1;
}
