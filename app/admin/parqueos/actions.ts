"use server";

import { redirect } from "next/navigation";
import { refresh } from "next/cache";
import { db } from "@/lib/db";
import { exigirRol } from "@/lib/auth/sesion";
import { Prisma } from "@/lib/generated/prisma/client";
import {
  esquemaParqueo,
  esquemaZona,
  maxCuposSolapados,
  totalCupos,
  validarCambioZona,
  validarEstadoParqueo,
} from "@/lib/reglas/zonas";

export type Resultado = { error?: string; aviso?: string; ok?: string } | null;

const nombreRepetido = (e: unknown) =>
  e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002";

function primerError(error: { issues: { message: string }[] }): Resultado {
  return { error: error.issues[0]?.message ?? "Datos inválidos" };
}

function leerZona(form: FormData) {
  return esquemaZona.safeParse({
    nombre: form.get("nombre"),
    tipos_permitidos: form.getAll("tipos_permitidos"),
    preferencial: form.get("preferencial") === "on",
    reservable: form.get("reservable") === "on",
    cupos_moto: form.get("cupos_moto"),
    cupos_sedan: form.get("cupos_sedan"),
    cupos_suv: form.get("cupos_suv"),
    cupos_grande: form.get("cupos_grande"),
  });
}

/** Invitaciones que todavía no terminan: las que una zona tiene que respetar. */
const invitacionesFuturas = (where: Prisma.invitacionesWhereInput) =>
  db.invitaciones.findMany({
    where: { ...where, cancelada_at: null, fin_at: { gt: new Date() } },
    select: { inicio_at: true, fin_at: true, cupos: true },
  });

// ── CU-30 ────────────────────────────────────────────────────────────────

export async function crearParqueo(_prev: Resultado, form: FormData): Promise<Resultado> {
  await exigirRol("super_admin");
  const datos = esquemaParqueo.safeParse({ nombre: form.get("nombre"), descripcion: form.get("descripcion") });
  if (!datos.success) return primerError(datos.error);

  let id: string;
  try {
    // Nace inactivo hasta tener una zona (CU-30, paso 6).
    ({ id } = await db.parqueos.create({ data: { ...datos.data, activo: false } }));
  } catch (e) {
    if (nombreRepetido(e)) return { error: "Ya existe un parqueo con ese nombre." };
    throw e;
  }
  redirect(`/admin/parqueos/${id}`);
}

export async function editarParqueo(id: string, _prev: Resultado, form: FormData): Promise<Resultado> {
  await exigirRol("super_admin");
  const datos = esquemaParqueo.safeParse({ nombre: form.get("nombre"), descripcion: form.get("descripcion") });
  if (!datos.success) return primerError(datos.error);

  try {
    await db.parqueos.update({ where: { id }, data: datos.data });
  } catch (e) {
    if (nombreRepetido(e)) return { error: "Ya existe un parqueo con ese nombre." };
    throw e;
  }
  refresh();
  return { ok: "Cambios guardados." };
}

export async function cambiarEstadoParqueo(id: string, activar: boolean): Promise<Resultado> {
  await exigirRol("super_admin");
  const [zonasActivas, movimientosAbiertos, futuras] = await Promise.all([
    db.zonas.count({ where: { parqueo_id: id, activa: true } }),
    db.movimientos.count({ where: { parqueo_id: id, salida_at: null, anulado_at: null } }),
    invitacionesFuturas({ zona: { parqueo_id: id } }),
  ]);
  const error = validarEstadoParqueo({ activar, zonasActivas, movimientosAbiertos, invitacionesFuturas: futuras.length });
  if (error) return { error };

  await db.parqueos.update({ where: { id }, data: { activo: activar } });
  refresh();
  return { ok: activar ? "Parqueo activado." : "Parqueo desactivado." };
}

// ── CU-31 ────────────────────────────────────────────────────────────────

export async function crearZona(parqueoId: string, _prev: Resultado, form: FormData): Promise<Resultado> {
  await exigirRol("super_admin");
  const datos = leerZona(form);
  if (!datos.success) return primerError(datos.error);

  try {
    await db.zonas.create({ data: { ...datos.data, parqueo_id: parqueoId } });
  } catch (e) {
    if (nombreRepetido(e)) return { error: "Ya existe una zona con ese nombre en este parqueo." };
    throw e;
  }
  refresh();
  return { ok: "Zona agregada." };
}

export async function editarZona(id: string, _prev: Resultado, form: FormData): Promise<Resultado> {
  await exigirRol("super_admin");
  const datos = leerZona(form);
  if (!datos.success) return primerError(datos.error);
  const activa = form.get("activa") === "on";

  const zona = await db.zonas.findUniqueOrThrow({ where: { id }, include: { parqueo: true } });
  const [ocupados, futuras, otrasActivas] = await Promise.all([
    db.movimientos.count({ where: { zona_id: id, salida_at: null, anulado_at: null } }),
    invitacionesFuturas({ zona_id: id }),
    db.zonas.count({ where: { parqueo_id: zona.parqueo_id, activa: true, id: { not: id } } }),
  ]);

  const { error, aviso } = validarCambioZona({
    nuevoTotal: totalCupos(datos.data),
    ocupados,
    apartadosMax: maxCuposSolapados(futuras),
    invitacionesFuturas: futuras.length,
    reservable: datos.data.reservable,
    activa,
    movimientosAbiertos: ocupados,
    ultimaZonaActivaDeParqueoActivo: zona.parqueo.activo && otrasActivas === 0,
  });
  if (error) return { error };

  try {
    await db.zonas.update({ where: { id }, data: { ...datos.data, activa } });
  } catch (e) {
    if (nombreRepetido(e)) return { error: "Ya existe una zona con ese nombre en este parqueo." };
    throw e;
  }
  refresh();
  return aviso ? { aviso } : { ok: "Zona guardada." };
}
