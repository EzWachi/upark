import { db } from "@/lib/db";
import {
  TAMANOS,
  TOLERANCIA_MIN,
  cuposSinReservar,
  disponibilidadZona,
  estadoReserva,
  finDelDiaCR,
  type PorTamano,
} from "@/lib/reglas/disponibilidad";

const vacio = (): PorTamano => ({ moto: 0, sedan: 0, suv: 0, grande: 0 });

/** CU-36: disponibilidad por zona y tamaño de los parqueos activos (o de uno solo). */
export async function disponibilidadParqueos(ahora: Date, parqueoId?: string) {
  const [parqueos, ocupados, invitaciones] = await Promise.all([
    db.parqueos.findMany({
      where: { activo: true, ...(parqueoId && { id: parqueoId }) },
      orderBy: { nombre: "asc" },
      include: { zonas: { where: { activa: true }, orderBy: { nombre: "asc" } } },
    }),
    db.movimientos.groupBy({
      by: ["zona_id", "tamano_cupo"],
      where: { salida_at: null, anulado_at: null },
      _count: { _all: true },
    }),
    // Solo apartan cupos hoy las invitaciones de hoy cuya tolerancia no venció.
    db.invitaciones.findMany({
      where: {
        cancelada_at: null,
        inicio_at: {
          gte: new Date(ahora.getTime() - TOLERANCIA_MIN * 60_000),
          lte: finDelDiaCR(ahora),
        },
      },
      include: { reservas: { where: { estado: { not: "cancelada" } }, select: { estado: true, tamano: true } } },
    }),
  ]);

  const ocupadosPorZona = new Map<string, PorTamano>();
  for (const o of ocupados) {
    const fila = ocupadosPorZona.get(o.zona_id) ?? vacio();
    fila[o.tamano_cupo] += o._count._all;
    ocupadosPorZona.set(o.zona_id, fila);
  }

  const reservadosPorZona = new Map<string, PorTamano>();
  const apartadosPorZona = new Map<string, number>();
  for (const inv of invitaciones) {
    const fila = reservadosPorZona.get(inv.zona_id) ?? vacio();
    for (const r of inv.reservas) {
      if (estadoReserva(r.estado, inv.inicio_at, ahora) === "confirmada") fila[r.tamano] += 1;
    }
    reservadosPorZona.set(inv.zona_id, fila);
    apartadosPorZona.set(
      inv.zona_id,
      (apartadosPorZona.get(inv.zona_id) ?? 0) + cuposSinReservar(inv, inv.reservas.length, ahora),
    );
  }

  return parqueos.map((p) => {
    const zonas = p.zonas.map((z) => {
      const cupos = Object.fromEntries(TAMANOS.map((t) => [t, z[`cupos_${t}`]])) as PorTamano;
      const { porTamano, total } = disponibilidadZona({
        cupos,
        ocupados: ocupadosPorZona.get(z.id) ?? vacio(),
        reservados: reservadosPorZona.get(z.id) ?? vacio(),
        apartadosSinReservar: apartadosPorZona.get(z.id) ?? 0,
      });
      return {
        id: z.id,
        nombre: z.nombre,
        preferencial: z.preferencial,
        tipos_permitidos: z.tipos_permitidos,
        porTamano,
        total,
        capacidad: TAMANOS.reduce((acc, t) => acc + cupos[t], 0),
      };
    });
    return {
      id: p.id,
      nombre: p.nombre,
      descripcion: p.descripcion,
      foto_url: p.foto_url,
      fila: p.fila,
      fila_actualizada_at: p.fila_actualizada_at,
      total: zonas.reduce((acc, z) => acc + z.total, 0),
      capacidad: zonas.reduce((acc, z) => acc + z.capacidad, 0),
      zonas,
    };
  });
}
