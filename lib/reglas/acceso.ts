import type { tamano_vehiculo, tipo_persona } from "@/lib/generated/prisma/enums";
import { cupoSugerido, type PorTamano } from "./disponibilidad";

export type ZonaConCupos = {
  id: string;
  nombre: string;
  tipos_permitidos: tipo_persona[];
  preferencial: boolean;
  porTamano: PorTamano;
};

export type OpcionZona = {
  id: string;
  nombre: string;
  /** RN-03 y RN-04: la zona admite a esta persona. */
  admite: boolean;
  /** Cupo que ocuparía (RN-02), o null si no hay cupo compatible. */
  tamanoCupo: tamano_vehiculo | null;
  libres: number;
};

/**
 * CU-12 paso 6 y CU-13 paso 6. Ordena las zonas del parqueo para el guarda:
 * primero las que admiten a la persona y tienen cupo (las preferenciales
 * primero si la persona tiene esa condición, al final si no), después las que
 * la admiten pero están llenas y al final las que no la admiten. La primera,
 * si tiene cupo, es la sugerida.
 */
export function opcionesDeZona(
  zonas: ZonaConCupos[],
  persona: { tipo: tipo_persona; preferencial: boolean },
  tamano: tamano_vehiculo,
): { opciones: OpcionZona[]; sugerida: string | null } {
  const opciones = zonas.map((z) => {
    const admite = z.tipos_permitidos.includes(persona.tipo) && (!z.preferencial || persona.preferencial);
    const tamanoCupo = cupoSugerido(tamano, z.porTamano);
    return {
      id: z.id,
      nombre: z.nombre,
      admite,
      tamanoCupo,
      libres: tamanoCupo ? z.porTamano[tamanoCupo] : 0,
      preferencial: z.preferencial,
    };
  });

  const rango = (o: (typeof opciones)[number]) =>
    (o.admite ? 0 : 4) + (o.tamanoCupo ? 0 : 2) + (o.preferencial === persona.preferencial ? 0 : 1);
  opciones.sort((a, b) => rango(a) - rango(b) || a.nombre.localeCompare(b.nombre));

  const primera = opciones[0];
  return {
    opciones: opciones.map((o) => ({
      id: o.id,
      nombre: o.nombre,
      admite: o.admite,
      tamanoCupo: o.tamanoCupo,
      libres: o.libres,
    })),
    sugerida: primera?.admite && primera.tamanoCupo ? primera.id : null,
  };
}

/** Cupo que ocupa la entrada en la zona elegida; sin cupo compatible es sobrecupo (RN-05). */
export function cupoAlEntrar(
  tamano: tamano_vehiculo,
  libres: PorTamano,
): { tamanoCupo: tamano_vehiculo; sobrecupo: boolean } {
  const cupo = cupoSugerido(tamano, libres);
  return cupo ? { tamanoCupo: cupo, sobrecupo: false } : { tamanoCupo: tamano, sobrecupo: true };
}
