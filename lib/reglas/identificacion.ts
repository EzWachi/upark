import type { tipo_identificacion } from "@/lib/generated/prisma/enums";

export function normalizarIdentificacion(valor: string): string {
  return valor.toUpperCase().replace(/[\s-]/g, "");
}

// RN-17. Formatos a confirmar con la normativa vigente; DIDI se deja abierto
// hasta conocer su formato exacto.
const FORMATOS: Record<tipo_identificacion, RegExp> = {
  cedula: /^\d{9}$/,
  dimex: /^\d{11,12}$/,
  didi: /^\d{6,15}$/,
  pasaporte: /^[A-Z0-9]{6,20}$/,
};

export function identificacionValida(tipo: tipo_identificacion, valor: string): boolean {
  return FORMATOS[tipo].test(normalizarIdentificacion(valor));
}
