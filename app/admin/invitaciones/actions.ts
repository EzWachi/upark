"use server";

import { randomBytes } from "node:crypto";
import { refresh } from "next/cache";
import { redirect } from "next/navigation";
import type { Resultado } from "@/components/formulario";
import { primerError } from "@/lib/acciones";
import { exigirRol } from "@/lib/auth/sesion";
import { db } from "@/lib/db";
import { correoCancelacion, correoInvitacion } from "@/lib/notificaciones";
import { cuposLibresEnFranja, esquemaInvitacion, validarFranja } from "@/lib/reglas/invitaciones";
import { totalCupos } from "@/lib/reglas/zonas";

/** Invitaciones vigentes de una zona que se cruzan con la franja. */
const invitacionesQueSeCruzan = (zonaId: string, inicio: Date, fin: Date) =>
  db.invitaciones.findMany({
    where: { zona_id: zonaId, cancelada_at: null, inicio_at: { lt: fin }, fin_at: { gt: inicio } },
    select: { inicio_at: true, fin_at: true, cupos: true },
  });

/** CU-25 y CU-26. */
export async function crearInvitacion(_prev: Resultado, form: FormData): Promise<Resultado> {
  const admin = await exigirRol("admin");
  const datos = esquemaInvitacion.safeParse(Object.fromEntries(form));
  if (!datos.success) return primerError(datos.error);
  const inv = datos.data;

  const error = validarFranja(inv, new Date());
  if (error) return { error };

  const zona = await db.zonas.findFirst({
    where: { id: inv.zona_id, activa: true, reservable: true, parqueo: { activo: true } },
  });
  if (!zona) return { error: "Elige una zona reservable de un parqueo activo." };

  const libres = cuposLibresEnFranja(totalCupos(zona), await invitacionesQueSeCruzan(zona.id, inv.inicio_at, inv.fin_at), inv.inicio_at, inv.fin_at);
  if (libres < inv.cupos) {
    // CU-25 4b y CU-26 4a: decir cuántos hay y dónde más hay espacio.
    const otras = await db.zonas.findMany({
      where: { parqueo_id: zona.parqueo_id, activa: true, reservable: true, id: { not: zona.id } },
    });
    const alternativas: string[] = [];
    for (const z of otras) {
      const l = cuposLibresEnFranja(totalCupos(z), await invitacionesQueSeCruzan(z.id, inv.inicio_at, inv.fin_at), inv.inicio_at, inv.fin_at);
      if (l >= inv.cupos) alternativas.push(`${z.nombre} (${l})`);
    }
    return {
      error:
        `${zona.nombre} tiene ${Math.max(0, libres)} cupos libres en esa franja.` +
        (alternativas.length ? ` Con espacio: ${alternativas.join(", ")}.` : ""),
    };
  }

  const creada = await db.invitaciones.create({
    data: { ...inv, token: randomBytes(24).toString("base64url"), creada_por_id: admin.id },
    include: { zona: { include: { parqueo: true } } },
  });
  if (creada.correo_invitado) await correoInvitacion(creada.correo_invitado, creada.nombre_invitado, creada); // 2a
  redirect(`/admin/invitaciones/${creada.id}`);
}

/** CU-27, pasos 5 y 6. */
export async function cancelarInvitacion(id: string): Promise<Resultado> {
  await exigirRol("admin");
  const inv = await db.invitaciones.findFirst({
    where: { id, cancelada_at: null },
    include: { zona: { include: { parqueo: true } }, reservas: { where: { estado: "confirmada" } } },
  });
  if (!inv) return { error: "La invitación ya estaba cancelada." };
  if (inv.fin_at <= new Date()) return { error: "La invitación ya terminó; queda solo para consulta." }; // 5b

  const ahora = new Date();
  await db.$transaction([
    db.invitaciones.update({ where: { id }, data: { cancelada_at: ahora } }),
    db.reservas.updateMany({ where: { invitacion_id: id, estado: "confirmada" }, data: { estado: "cancelada", cancelada_at: ahora } }),
  ]);
  for (const r of inv.reservas) await correoCancelacion(r, inv);
  refresh();
  return { ok: `Invitación cancelada. Se avisó a ${inv.reservas.length} ${inv.reservas.length === 1 ? "persona" : "personas"}.` };
}

/** CU-27, 5a: el cupo vuelve a quedar libre dentro de la misma invitación. */
export async function cancelarReserva(id: string): Promise<Resultado> {
  await exigirRol("admin");
  const r = await db.reservas.findFirst({
    where: { id, estado: "confirmada" },
    include: { invitacion: { include: { zona: { include: { parqueo: true } } } } },
  });
  if (!r) return { error: "La reserva ya no está pendiente." };
  if (r.invitacion.fin_at <= new Date()) return { error: "La invitación ya terminó." };

  await db.reservas.update({ where: { id }, data: { estado: "cancelada", cancelada_at: new Date() } });
  await correoCancelacion(r, r.invitacion);
  refresh();
  return { ok: "Reserva cancelada." };
}
