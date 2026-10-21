"use server";

import { randomBytes } from "node:crypto";
import { refresh } from "next/cache";
import { z } from "zod";
import type { Resultado } from "@/components/formulario";
import { exigirRol } from "@/lib/auth/sesion";
import { db } from "@/lib/db";
import { correoResolucion } from "@/lib/notificaciones";
import { generarCodigoCorto } from "@/lib/reglas/cuentas";

const tipoMiembro = z.enum(["estudiante", "profesor", "funcionario"], "Elige un tipo de persona");

/** RN-13: tarjeta nueva. ponytail: sin reintento si el código choca (1 en ~887 millones). */
const nuevaTarjeta = () => ({
  token_tarjeta: randomBytes(24).toString("base64url"),
  codigo_tarjeta: generarCodigoCorto(),
});

async function miembro(id: string) {
  return db.usuarios.findFirst({ where: { id, rol: "miembro" } });
}

/** CU-22, pasos 3 a 5. */
export async function aprobarMiembro(id: string, _prev: Resultado, form: FormData): Promise<Resultado> {
  const actor = await exigirRol("admin");
  if (actor.id === id) return { error: "No puedes aprobar tu propia cuenta." }; // 3a
  const tipo = tipoMiembro.safeParse(form.get("tipo_persona"));
  if (!tipo.success) return { error: tipo.error.issues[0].message };

  const usuario = await miembro(id);
  if (usuario?.estado !== "pendiente") return { error: "La solicitud ya no está pendiente." };

  await db.usuarios.update({
    where: { id },
    data: { estado: "aprobada", tipo_persona: tipo.data, ...nuevaTarjeta() },
  });
  await correoResolucion(usuario, true);
  refresh();
  return { ok: `${usuario.nombre} fue aprobado.` };
}

/** CU-22, 4a. */
export async function rechazarMiembro(id: string, _prev: Resultado, form: FormData): Promise<Resultado> {
  const actor = await exigirRol("admin");
  if (actor.id === id) return { error: "No puedes resolver tu propia solicitud." };
  const motivo = String(form.get("motivo") ?? "").trim();
  if (!motivo) return { error: "Escribe el motivo del rechazo." };

  const usuario = await miembro(id);
  if (usuario?.estado !== "pendiente") return { error: "La solicitud ya no está pendiente." };

  await db.usuarios.update({ where: { id }, data: { estado: "rechazada" } });
  await correoResolucion(usuario, false, motivo);
  refresh();
  return { ok: "Solicitud rechazada." };
}

/** CU-22, 1a: cambiar el tipo de un miembro aprobado. */
export async function cambiarTipoMiembro(id: string, _prev: Resultado, form: FormData): Promise<Resultado> {
  await exigirRol("admin");
  const tipo = tipoMiembro.safeParse(form.get("tipo_persona"));
  if (!tipo.success) return { error: tipo.error.issues[0].message };

  const { count } = await db.usuarios.updateMany({
    where: { id, rol: "miembro", estado: { in: ["aprobada", "desactivada"] } },
    data: { tipo_persona: tipo.data },
  });
  if (count === 0) return { error: "No se encontró el miembro." };
  refresh();
  return { ok: "Tipo actualizado." };
}

/**
 * CU-22, 1a: desactivar invalida la tarjeta de inmediato porque cada entrada
 * revisa el estado de la cuenta; reactivar la devuelve sin cambiar el QR.
 */
export async function cambiarEstadoMiembro(id: string, activar: boolean): Promise<Resultado> {
  const actor = await exigirRol("admin");
  if (actor.id === id) return { error: "No puedes cambiar el estado de tu propia cuenta." };

  const { count } = await db.usuarios.updateMany({
    where: { id, rol: "miembro", estado: activar ? "desactivada" : "aprobada" },
    data: { estado: activar ? "aprobada" : "desactivada" },
  });
  if (count === 0) return { error: "El miembro ya cambió de estado." };
  refresh();
  return { ok: activar ? "Cuenta reactivada." : "Cuenta desactivada." };
}
