import { z } from "zod";
import { TAMANOS, TOLERANCIA_MIN, puedeUsarCupo, type PorTamano } from "./disponibilidad";
import { identificacionValida, normalizarIdentificacion } from "./identificacion";
import { normalizarPlaca, placaValida } from "./placa";
import { maxCuposSolapados } from "./zonas";
import type { tamano_vehiculo } from "@/lib/generated/prisma/enums";

/** Costa Rica está en UTC-6 todo el año. */
const DESFASE_CR_H = 6;

/** Fecha (AAAA-MM-DD) y hora (HH:MM) de Costa Rica, como instante. */
export function fechaHoraCR(fecha: string, hora: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(fecha) || !/^\d{2}:\d{2}$/.test(hora)) return null;
  const d = new Date(`${fecha}T${hora}:00Z`);
  if (Number.isNaN(d.getTime())) return null;
  d.setUTCHours(d.getUTCHours() + DESFASE_CR_H);
  return d;
}

const MAX_CUPOS_EVENTO = 500;

/** CU-25 paso 2 y CU-26 paso 2. Las fechas se validan aparte porque dependen de la hora actual. */
export const esquemaInvitacion = z
  .object({
    tipo: z.enum(["individual", "evento"]),
    motivo: z.string().trim().min(3, "Escribe el motivo o el nombre del evento").max(120),
    zona_id: z.string().min(1, "Elige una zona"),
    fecha: z.string(),
    hora_inicio: z.string(),
    hora_fin: z.string(),
    cupos: z.coerce.number().int().min(1, "Al menos un cupo").max(MAX_CUPOS_EVENTO).optional(),
    inscripcion_fecha: z.string().optional(),
    inscripcion_hora: z.string().optional(),
    nombre_invitado: z.string().trim().max(100).optional(),
    correo_invitado: z.union([z.literal(""), z.email("Correo del invitado inválido")]).optional(),
  })
  .transform((v, ctx) => {
    const inicio_at = fechaHoraCR(v.fecha, v.hora_inicio);
    const fin_at = fechaHoraCR(v.fecha, v.hora_fin);
    if (!inicio_at || !fin_at) {
      ctx.addIssue({ code: "custom", message: "Indica la fecha y las horas de la franja" });
      return z.NEVER;
    }
    const evento = v.tipo === "evento";
    // Individual: el enlace vence al inicio de la franja (CU-25, paso 5).
    const inscripcion_hasta = evento ? fechaHoraCR(v.inscripcion_fecha ?? "", v.inscripcion_hora ?? "") : inicio_at;
    if (!inscripcion_hasta) {
      ctx.addIssue({ code: "custom", message: "Indica hasta cuándo se pueden inscribir" });
      return z.NEVER;
    }
    if (evento && !v.cupos) {
      ctx.addIssue({ code: "custom", message: "Indica la cantidad de cupos" });
      return z.NEVER;
    }
    return {
      tipo: v.tipo,
      motivo: v.motivo,
      zona_id: v.zona_id,
      inicio_at,
      fin_at,
      inscripcion_hasta,
      cupos: evento ? v.cupos! : 1,
      nombre_invitado: evento ? null : v.nombre_invitado || null,
      correo_invitado: evento ? null : v.correo_invitado?.toLowerCase() || null,
    };
  });

/** CU-25 4a y CU-26 4b. */
export function validarFranja(
  i: { inicio_at: Date; fin_at: Date; inscripcion_hasta: Date },
  ahora: Date,
): string | null {
  if (i.inicio_at <= ahora) return "La franja tiene que empezar en el futuro.";
  if (i.fin_at <= i.inicio_at) return "La hora de fin tiene que ser posterior a la de inicio.";
  if (i.inscripcion_hasta > i.inicio_at) return "La inscripción tiene que cerrar antes de que empiece la franja.";
  if (i.inscripcion_hasta <= ahora) return "La fecha límite de inscripción ya pasó.";
  return null;
}

/**
 * CU-25 4b y CU-26 4a: cupos de la zona que quedan sin apartar en la franja,
 * contando las invitaciones que se cruzan con ella.
 */
// ponytail: no descuenta a quienes entren sin reserva a la zona durante la
// franja; si las zonas reservables se llenan con visitas espontáneas, apartar
// también contra la ocupación esperada.
export function cuposLibresEnFranja(
  totalZona: number,
  invitaciones: { inicio_at: Date; fin_at: Date; cupos: number }[],
  inicio: Date,
  fin: Date,
): number {
  const recortadas = invitaciones
    .filter((i) => i.inicio_at < fin && i.fin_at > inicio)
    .map((i) => ({
      inicio_at: i.inicio_at < inicio ? inicio : i.inicio_at,
      fin_at: i.fin_at > fin ? fin : i.fin_at,
      cupos: i.cupos,
    }));
  return totalZona - maxCuposSolapados(recortadas);
}

export type EstadoInvitacion = "abierta" | "cancelada" | "cerrada" | "llena";

/** CU-08 1a y 5a: si el enlace todavía acepta reservas. */
export function estadoInvitacion(
  inv: { cupos: number; inscripcion_hasta: Date; cancelada_at: Date | null },
  tomados: number,
  ahora: Date,
): EstadoInvitacion {
  if (inv.cancelada_at) return "cancelada";
  if (ahora > inv.inscripcion_hasta) return "cerrada";
  if (tomados >= inv.cupos) return "llena";
  return "abierta";
}

/** CU-08, 5c: la zona tiene algún cupo donde quepa ese vehículo (RN-02). */
export function cabeEnZona(tamano: tamano_vehiculo, cupos: PorTamano): boolean {
  return TAMANOS.some((c) => puedeUsarCupo(tamano, c) && cupos[c] > 0);
}

/** CU-12 invitado, 5a: tamaños a los que puede cambiar si llegó en otro vehículo. */
export function tamanosPermitidos(reservado: tamano_vehiculo): tamano_vehiculo[] {
  return TAMANOS.filter((t) => puedeUsarCupo(t, reservado));
}

/** Momento en que vence una reserva sin entrada (RN-08). */
export const venceReserva = (inicio: Date) => new Date(inicio.getTime() + TOLERANCIA_MIN * 60_000);

/** CU-08, pasos 3 y 4. */
export const esquemaReserva = z
  .object({
    nombre: z.string().trim().min(3, "Escribe tu nombre completo").max(100),
    correo: z.string().trim().toLowerCase().pipe(z.email("Correo inválido")),
    tipo_identificacion: z.enum(["cedula", "dimex", "didi", "pasaporte"]),
    identificacion: z.string().transform(normalizarIdentificacion),
    origen_placa: z.enum(["nacional", "extranjera"]),
    pais: z.string().trim().max(60).optional().transform((v) => v || null),
    placa: z.string().trim().min(1, "Escribe la placa"),
    tamano: z.enum(["moto", "sedan", "suv", "grande"], "Elige el tamaño del vehículo"),
    requiere_preferencial: z.boolean(),
    consentimiento: z.literal(true, "Debes aceptar el tratamiento de tus datos para continuar"),
  })
  .superRefine((r, ctx) => {
    if (!identificacionValida(r.tipo_identificacion, r.identificacion)) {
      ctx.addIssue({ code: "custom", path: ["identificacion"], message: "El número no tiene el formato de ese tipo de identificación" });
    }
    if (!placaValida(r.placa, r.origen_placa)) {
      ctx.addIssue({ code: "custom", path: ["placa"], message: "La placa no tiene un formato válido" });
    }
    if (r.origen_placa === "extranjera" && !r.pais) {
      ctx.addIssue({ code: "custom", path: ["pais"], message: "Indica el país de la placa" });
    }
  })
  // El consentimiento ya se exigió; no se guarda aparte.
  .transform((r) => ({
    nombre: r.nombre,
    correo: r.correo,
    tipo_identificacion: r.tipo_identificacion,
    identificacion: r.identificacion,
    origen_placa: r.origen_placa,
    pais: r.origen_placa === "extranjera" ? r.pais : null,
    placa: normalizarPlaca(r.placa),
    tamano: r.tamano,
    requiere_preferencial: r.requiere_preferencial,
  }));
