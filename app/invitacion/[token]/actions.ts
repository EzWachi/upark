"use server";

import { randomBytes } from "node:crypto";
import { redirect } from "next/navigation";
import type { Resultado } from "@/components/formulario";
import { esDuplicado, primerError } from "@/lib/acciones";
import { db } from "@/lib/db";
import { correoReserva } from "@/lib/notificaciones";
import { generarCodigoCorto } from "@/lib/reglas/cuentas";
import { TAMANOS, type PorTamano } from "@/lib/reglas/disponibilidad";
import { cabeEnZona, esquemaReserva, estadoInvitacion } from "@/lib/reglas/invitaciones";

const MENSAJE_ESTADO = {
  cancelada: "Esta invitación fue cancelada.",
  cerrada: "La inscripción de esta invitación ya cerró.",
  llena: "Los cupos de esta invitación se agotaron.",
} as const;

class SinCupos extends Error {}

/** CU-08, pasos 4 a 6. Público: lo protege el token de la invitación (RN-10). */
export async function reservar(token: string, _prev: Resultado, form: FormData): Promise<Resultado> {
  const datos = esquemaReserva.safeParse({
    ...Object.fromEntries(form),
    requiere_preferencial: form.get("requiere_preferencial") === "on",
    consentimiento: form.get("consentimiento") === "on",
  });
  if (!datos.success) return primerError(datos.error);

  const inv = await db.invitaciones.findUnique({
    where: { token },
    include: {
      zona: { include: { parqueo: true } },
      _count: { select: { reservas: { where: { estado: { not: "cancelada" } } } } },
    },
  });
  if (!inv) return { error: "La invitación no existe." };
  const estado = estadoInvitacion(inv, inv._count.reservas, new Date());
  if (estado !== "abierta") return { error: MENSAJE_ESTADO[estado] };

  const cupos = Object.fromEntries(TAMANOS.map((t) => [t, inv.zona[`cupos_${t}`]])) as PorTamano;
  if (!cabeEnZona(datos.data.tamano, cupos)) {
    return { error: "La zona de esta invitación no tiene espacios para ese tamaño de vehículo." }; // 5c
  }

  let reserva;
  try {
    reserva = await db.$transaction(async (tx) => {
      // Bloquea la invitación para que dos personas no tomen el último cupo a la vez.
      await tx.$queryRaw`SELECT id FROM invitaciones WHERE id = ${inv.id} FOR UPDATE`;
      const tomados = await tx.reservas.count({ where: { invitacion_id: inv.id, estado: { not: "cancelada" } } });
      if (tomados >= inv.cupos) throw new SinCupos();
      return tx.reservas.create({
        data: {
          ...datos.data,
          invitacion_id: inv.id,
          token_qr: randomBytes(24).toString("base64url"),
          codigo: generarCodigoCorto(),
        },
      });
    });
  } catch (e) {
    if (e instanceof SinCupos) return { error: MENSAJE_ESTADO.llena };
    if (!esDuplicado(e)) throw e;
    // 5b: ya reservó con esa identificación. Se reenvía al correo de esa reserva,
    // sin mostrar el QR en pantalla a quien solo conoce la identificación.
    const previa = await db.reservas.findFirst({
      where: {
        invitacion_id: inv.id,
        tipo_identificacion: datos.data.tipo_identificacion,
        identificacion: datos.data.identificacion,
      },
    });
    if (previa && previa.estado !== "cancelada") await correoReserva(previa, inv);
    return { aviso: "Ya hay una reserva con esa identificación. Te reenviamos el QR al correo con el que reservaste." };
  }

  await correoReserva(reserva, inv);
  redirect(`/reserva/${reserva.token_qr}`);
}
