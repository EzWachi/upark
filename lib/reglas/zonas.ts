import { z } from "zod";
import { TAMANOS } from "./disponibilidad";

const cupo = z.coerce.number().int("Debe ser un número entero").min(0, "No puede ser negativo").max(999);

/** CU-30, paso 4. */
export const esquemaParqueo = z.object({
  nombre: z.string().trim().min(1, "Escribe un nombre").max(60),
  descripcion: z.string().trim().max(200).optional().transform((v) => v || null),
});

/** CU-31, paso 2 y 4: al menos un tipo de persona y al menos un cupo. */
export const esquemaZona = z
  .object({
    nombre: z.string().trim().min(1, "Escribe un nombre").max(60),
    tipos_permitidos: z
      .array(z.enum(["estudiante", "profesor", "funcionario", "visita"]))
      .min(1, "Elige al menos un tipo de persona"),
    preferencial: z.boolean(),
    reservable: z.boolean(),
    cupos_moto: cupo,
    cupos_sedan: cupo,
    cupos_suv: cupo,
    cupos_grande: cupo,
  })
  .refine((zona) => TAMANOS.some((t) => zona[`cupos_${t}`] > 0), {
    message: "La zona necesita al menos un cupo",
    path: ["cupos_sedan"],
  });

export type DatosZona = z.infer<typeof esquemaZona>;

export function totalCupos(zona: Pick<DatosZona, `cupos_${(typeof TAMANOS)[number]}`>): number {
  return TAMANOS.reduce((acc, t) => acc + zona[`cupos_${t}`], 0);
}

/**
 * Máximo de cupos que las invitaciones apartan al mismo tiempo (franjas que se
 * solapan). Es el mínimo de cupos que la zona puede tener sin dejar alguna
 * invitación sin espacio (CU-31, 4b).
 */
export function maxCuposSolapados(invitaciones: { inicio_at: Date; fin_at: Date; cupos: number }[]): number {
  // Barrido: +cupos al empezar, −cupos al terminar. Con la misma hora, primero
  // terminan y después empiezan, porque franjas contiguas no se solapan.
  const eventos = invitaciones.flatMap((i) => [
    { t: i.inicio_at.getTime(), delta: i.cupos },
    { t: i.fin_at.getTime(), delta: -i.cupos },
  ]);
  eventos.sort((a, b) => a.t - b.t || a.delta - b.delta);
  let actual = 0;
  let maximo = 0;
  for (const e of eventos) {
    actual += e.delta;
    maximo = Math.max(maximo, actual);
  }
  return maximo;
}

/** Restricciones de CU-31 al guardar una zona existente. */
export function validarCambioZona(input: {
  nuevoTotal: number;
  ocupados: number;
  apartadosMax: number;
  invitacionesFuturas: number;
  reservable: boolean;
  activa: boolean;
  movimientosAbiertos: number;
  /** Desactivarla dejaría un parqueo activo sin zonas. */
  ultimaZonaActivaDeParqueoActivo: boolean;
}): { error: string | null; aviso: string | null } {
  if (!input.activa && (input.movimientosAbiertos > 0 || input.invitacionesFuturas > 0)) {
    return {
      error: "No se puede desactivar: hay vehículos dentro o invitaciones futuras en esta zona.",
      aviso: null,
    };
  }
  if (!input.activa && input.ultimaZonaActivaDeParqueoActivo) {
    return { error: "Es la última zona activa del parqueo. Desactiva primero el parqueo.", aviso: null };
  }
  if (!input.reservable && input.invitacionesFuturas > 0) {
    return {
      error: "No se puede quitar \"reservable\": hay invitaciones futuras. Cancélalas primero.",
      aviso: null,
    };
  }
  if (input.nuevoTotal < input.apartadosMax) {
    return {
      error: `Las invitaciones futuras apartan hasta ${input.apartadosMax} cupos a la vez; la zona no puede tener menos.`,
      aviso: null,
    };
  }
  if (input.nuevoTotal < input.ocupados) {
    return {
      error: null,
      aviso: `La zona quedó en sobrecupo: hay ${input.ocupados} vehículos dentro y ${input.nuevoTotal} cupos.`,
    };
  }
  return { error: null, aviso: null };
}

/** Restricciones de CU-30 al activar o desactivar un parqueo. */
export function validarEstadoParqueo(input: {
  activar: boolean;
  zonasActivas: number;
  movimientosAbiertos: number;
  invitacionesFuturas: number;
}): string | null {
  if (input.activar) {
    return input.zonasActivas > 0 ? null : "Agrega al menos una zona activa antes de activar el parqueo.";
  }
  if (input.movimientosAbiertos > 0) return "No se puede desactivar: hay vehículos dentro.";
  if (input.invitacionesFuturas > 0) return "No se puede desactivar: hay invitaciones futuras. Cancélalas primero.";
  return null;
}
