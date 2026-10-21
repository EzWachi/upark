import type { estado_reserva, tamano_vehiculo } from "@/lib/generated/prisma/enums";

/** RN-02: de menor a mayor. */
export const TAMANOS: tamano_vehiculo[] = ["moto", "sedan", "suv", "grande"];

/** RN-08 y RN-09. Pasarán a configuración cuando exista CU-33. */
export const TOLERANCIA_MIN = 30;
export const APERTURA_PREVIA_MIN = 15;

const MINUTO = 60_000;

/** Costa Rica está en UTC-6 todo el año (no usa horario de verano). */
const DESFASE_CR = 6 * 60 * MINUTO;

/** Primer instante del día calendario de Costa Rica que contiene `ahora`. */
export function inicioDelDiaCR(ahora: Date): Date {
  const local = new Date(ahora.getTime() - DESFASE_CR);
  local.setUTCHours(0, 0, 0, 0);
  return new Date(local.getTime() + DESFASE_CR);
}

/** Último instante del día calendario de Costa Rica que contiene `ahora`. */
export function finDelDiaCR(ahora: Date): Date {
  const local = new Date(ahora.getTime() - DESFASE_CR);
  local.setUTCHours(23, 59, 59, 999);
  return new Date(local.getTime() + DESFASE_CR);
}

export type PorTamano = Record<tamano_vehiculo, number>;

/** RN-02: una moto solo usa cupos de moto; el resto, su tamaño o uno mayor. */
export function puedeUsarCupo(vehiculo: tamano_vehiculo, cupo: tamano_vehiculo): boolean {
  if (vehiculo === "moto" || cupo === "moto") return vehiculo === cupo;
  return TAMANOS.indexOf(cupo) >= TAMANOS.indexOf(vehiculo);
}

/** El cupo más pequeño compatible que tenga espacio, o null si no hay (RN-05). */
export function cupoSugerido(vehiculo: tamano_vehiculo, libres: PorTamano): tamano_vehiculo | null {
  return TAMANOS.find((cupo) => puedeUsarCupo(vehiculo, cupo) && libres[cupo] > 0) ?? null;
}

/**
 * RN-06. `ocupados` son los movimientos abiertos por tamaño de cupo y `reservados`
 * las reservas pendientes por tamaño. `apartadosSinReservar` son cupos de
 * invitaciones que nadie ha tomado todavía: no tienen tamaño, así que solo
 * restan del total de la zona.
 */
// ponytail: los apartados sin reservar no restan por tamaño, así que el detalle
// por tamaño puede mostrar de más mientras haya invitaciones sin llenar.
// Si confunde a los guardas, asignar un tamaño por defecto a esos cupos.
export function disponibilidadZona(input: {
  cupos: PorTamano;
  ocupados: PorTamano;
  reservados: PorTamano;
  apartadosSinReservar: number;
}): { porTamano: PorTamano; total: number } {
  const porTamano = Object.fromEntries(
    TAMANOS.map((t) => [t, input.cupos[t] - input.ocupados[t] - input.reservados[t]]),
  ) as PorTamano;
  const suma = TAMANOS.reduce((acc, t) => acc + porTamano[t], 0);
  return { porTamano, total: suma - input.apartadosSinReservar };
}

/** Al público nunca se le muestra un número negativo (RN-06). */
export function libresParaPublico(n: number): number {
  return Math.max(0, n);
}

/** Ventana de entrada de una reserva (RN-09). */
export function dentroDeVentana(inicio: Date, ahora: Date): boolean {
  const t = ahora.getTime();
  return (
    t >= inicio.getTime() - APERTURA_PREVIA_MIN * MINUTO &&
    t <= inicio.getTime() + TOLERANCIA_MIN * MINUTO
  );
}

export type EstadoReservaCalculado = estado_reserva | "no_se_presento";

/** CU-37 sin tarea programada: el vencimiento se deduce de la hora. */
export function estadoReserva(
  estado: estado_reserva,
  inicioFranja: Date,
  ahora: Date,
): EstadoReservaCalculado {
  if (estado !== "confirmada") return estado;
  const vence = inicioFranja.getTime() + TOLERANCIA_MIN * MINUTO;
  return ahora.getTime() > vence ? "no_se_presento" : "confirmada";
}

/**
 * RN-07: cupos de una invitación que nadie ha reservado y que siguen apartados.
 * `tomados` son las reservas no canceladas (confirmadas o usadas). Se liberan al
 * cerrar la inscripción, al vencer la tolerancia o al cancelar la invitación.
 */
export function cuposSinReservar(
  inv: { cupos: number; inicio_at: Date; inscripcion_hasta: Date; cancelada_at: Date | null },
  tomados: number,
  ahora: Date,
): number {
  const t = ahora.getTime();
  if (inv.cancelada_at) return 0;
  if (t > inv.inscripcion_hasta.getTime()) return 0;
  if (t > inv.inicio_at.getTime() + TOLERANCIA_MIN * MINUTO) return 0;
  return Math.max(0, inv.cupos - tomados);
}
