import type { origen_placa } from "@/lib/generated/prisma/enums";

/** RN-18: se guarda en mayúsculas y sin espacios ni guiones para poder buscarla. */
export function normalizarPlaca(placa: string): string {
  return placa.toUpperCase().replace(/[\s-]/g, "");
}

// ponytail: formatos aproximados de Costa Rica (particular numérica, alfanumérica
// ABC123 y especiales con prefijo como MOT, CL, C, TSJ). Reemplazar por la lista
// oficial de COSEVI cuando se confirme (docs/reglas-de-negocio.md, RN-18).
const FORMATOS_NACIONALES = [
  /^\d{1,6}$/,
  /^[A-Z]{3}\d{3}$/,
  /^[A-Z]{1,4}\d{1,6}$/,
];

export function placaValida(placa: string, origen: origen_placa): boolean {
  const p = normalizarPlaca(placa);
  if (origen === "extranjera") return /^[A-Z0-9]{2,12}$/.test(p);
  return FORMATOS_NACIONALES.some((formato) => formato.test(p));
}
