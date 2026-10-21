"use server";

import { refresh } from "next/cache";
import type { Resultado } from "@/components/formulario";
import { esDuplicado, primerError } from "@/lib/acciones";
import { exigirRol } from "@/lib/auth/sesion";
import { db } from "@/lib/db";
import { MAX_VEHICULOS, esquemaVehiculo } from "@/lib/reglas/vehiculos";
import { nuevaTarjeta } from "@/lib/tarjeta";

/** CU-04 y CU-05 exigen una cuenta de miembro aprobada (RN-12). */
async function miembroAprobado() {
  const usuario = await exigirRol("miembro");
  return usuario.estado === "aprobada" ? usuario : null;
}

const leerVehiculo = (form: FormData) =>
  esquemaVehiculo.safeParse({
    origen: form.get("origen"),
    pais: form.get("pais") ?? undefined,
    placa: form.get("placa"),
    tamano: form.get("tamano"),
    descripcion: form.get("descripcion") ?? undefined,
  });

/** Un vehículo con entrada abierta no se edita ni se borra (CU-04, eliminar 1a). */
async function estaDentro(usuarioId: string, placa: string) {
  const abierto = await db.movimientos.findFirst({
    where: { usuario_id: usuarioId, placa, salida_at: null, anulado_at: null },
    select: { id: true },
  });
  return abierto !== null;
}

/** CU-04, agregar. */
export async function agregarVehiculo(_prev: Resultado, form: FormData): Promise<Resultado> {
  const usuario = await miembroAprobado();
  if (!usuario) return { error: "Tu cuenta todavía no está aprobada." };
  const datos = leerVehiculo(form);
  if (!datos.success) return primerError(datos.error);

  const cantidad = await db.vehiculos.count({ where: { usuario_id: usuario.id } });
  if (cantidad >= MAX_VEHICULOS) return { error: `Puedes registrar hasta ${MAX_VEHICULOS} vehículos.` }; // 6b

  try {
    // El primero queda como principal (paso 7).
    await db.vehiculos.create({ data: { ...datos.data, usuario_id: usuario.id, principal: cantidad === 0 } });
  } catch (e) {
    if (esDuplicado(e)) return { error: "Ya registraste esa placa." };
    throw e;
  }
  refresh();
  return { ok: `${datos.data.placa} agregado.` };
}

/** CU-04, editar. */
export async function editarVehiculo(id: string, _prev: Resultado, form: FormData): Promise<Resultado> {
  const usuario = await miembroAprobado();
  if (!usuario) return { error: "Tu cuenta todavía no está aprobada." };
  const datos = leerVehiculo(form);
  if (!datos.success) return primerError(datos.error);

  const vehiculo = await db.vehiculos.findFirst({ where: { id, usuario_id: usuario.id } });
  if (!vehiculo) return { error: "No se encontró el vehículo." };
  if (await estaDentro(usuario.id, vehiculo.placa)) {
    return { error: "El vehículo está dentro de un parqueo. Podrás editarlo cuando salga." };
  }

  try {
    await db.vehiculos.update({ where: { id }, data: datos.data });
  } catch (e) {
    if (esDuplicado(e)) return { error: "Ya registraste esa placa." };
    throw e;
  }
  refresh();
  return { ok: "Vehículo guardado." };
}

/** CU-04, eliminar. Si era el principal, pasa a serlo el más antiguo de los que quedan. */
export async function eliminarVehiculo(id: string): Promise<Resultado> {
  const usuario = await miembroAprobado();
  if (!usuario) return { error: "Tu cuenta todavía no está aprobada." };
  const vehiculo = await db.vehiculos.findFirst({ where: { id, usuario_id: usuario.id } });
  if (!vehiculo) return { error: "No se encontró el vehículo." };
  if (await estaDentro(usuario.id, vehiculo.placa)) {
    return { error: "El vehículo está dentro de un parqueo. Podrás eliminarlo cuando salga." };
  }

  await db.$transaction(async (tx) => {
    await tx.vehiculos.delete({ where: { id } });
    if (vehiculo.principal) {
      const siguiente = await tx.vehiculos.findFirst({ where: { usuario_id: usuario.id }, orderBy: { created_at: "asc" } });
      if (siguiente) await tx.vehiculos.update({ where: { id: siguiente.id }, data: { principal: true } });
    }
  });
  refresh();
  return { ok: `${vehiculo.placa} eliminado.` };
}

/** CU-04, editar 1a. */
export async function marcarPrincipal(id: string): Promise<Resultado> {
  const usuario = await miembroAprobado();
  if (!usuario) return { error: "Tu cuenta todavía no está aprobada." };
  const vehiculo = await db.vehiculos.findFirst({ where: { id, usuario_id: usuario.id } });
  if (!vehiculo) return { error: "No se encontró el vehículo." };

  await db.$transaction([
    db.vehiculos.updateMany({ where: { usuario_id: usuario.id }, data: { principal: false } }),
    db.vehiculos.update({ where: { id }, data: { principal: true } }),
  ]);
  refresh();
  return { ok: `${vehiculo.placa} es ahora tu vehículo principal.` };
}

/** CU-05, 3a: invalida el QR y el código anteriores. */
export async function regenerarTarjeta(): Promise<Resultado> {
  const usuario = await miembroAprobado();
  if (!usuario) return { error: "Tu cuenta todavía no está aprobada." };
  await db.usuarios.update({ where: { id: usuario.id }, data: nuevaTarjeta() });
  refresh();
  return { ok: "Tarjeta nueva generada. La anterior ya no sirve." };
}
