"use server";

import type { Resultado } from "@/components/formulario";
import { db } from "@/lib/db";
import { correoVerificacion } from "@/lib/notificaciones";
import { normalizarCorreo } from "@/lib/reglas/cuentas";
import { gastarToken, revisarToken } from "@/lib/tokens";

/** CU-02, pasos 6 y 7. Se confirma con un botón y no al abrir el enlace, porque algunos
 *  clientes de correo abren los enlaces solos para revisarlos y gastarían el token. */
export async function confirmarCorreo(token: string): Promise<Resultado> {
  const revision = await revisarToken(token, ["verificacion"]);
  if (revision.estado !== "valido") return { error: "El enlace ya no es válido. Pide uno nuevo." };
  if (!(await gastarToken(revision.id))) return { error: "El enlace ya se usó." };

  await db.usuarios.updateMany({
    where: { id: revision.usuarioId, estado: "sin_verificar" },
    data: { estado: "pendiente", correo_verificado_at: new Date() },
  });
  return { ok: "Correo confirmado. Un administrador revisará tu solicitud y te avisará por correo." };
}

/** CU-02, 6a. La respuesta es la misma exista o no la cuenta. */
export async function reenviarVerificacion(_prev: Resultado, form: FormData): Promise<Resultado> {
  const correo = normalizarCorreo(String(form.get("correo") ?? ""));
  const usuario = await db.usuarios.findUnique({ where: { correo } });
  if (usuario?.estado === "sin_verificar") await correoVerificacion(usuario);
  return { ok: "Si hay una cuenta sin confirmar con ese correo, te enviamos un enlace nuevo." };
}
