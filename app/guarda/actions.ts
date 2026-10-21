"use server";

import { cookies } from "next/headers";
import { refresh } from "next/cache";
import { z } from "zod";
import type { Resultado } from "@/components/formulario";
import { esDuplicado } from "@/lib/acciones";
import { exigirRol } from "@/lib/auth/sesion";
import { disponibilidadParqueos } from "@/lib/consultas/disponibilidad";
import { db } from "@/lib/db";
import type { Prisma } from "@/lib/generated/prisma/client";
import { cupoAlEntrar } from "@/lib/reglas/acceso";
import { interpretarCredencial } from "@/lib/reglas/credencial";
import { inicioDelDiaCR } from "@/lib/reglas/disponibilidad";
import { identificacionValida, normalizarIdentificacion } from "@/lib/reglas/identificacion";
import { normalizarPlaca, placaValida } from "@/lib/reglas/placa";
import { COOKIE_TURNO, parqueoDelTurno } from "@/lib/turno";

const TAMANO = z.enum(["moto", "sedan", "suv", "grande"]);
const ORIGEN = z.enum(["nacional", "extranjera"]);

/** Guarda con parqueo de turno; todas las operaciones de acceso lo exigen (RN-20). */
async function guardaEnTurno() {
  const guarda = await exigirRol("guarda");
  const parqueo = await parqueoDelTurno();
  return { guarda, parqueo };
}

function auditar(
  tx: Prisma.TransactionClient,
  usuarioId: string,
  accion: string,
  movimientoId: string,
  motivo: string | null,
  datos?: Prisma.InputJsonValue,
) {
  return tx.auditoria.create({
    data: { usuario_id: usuarioId, accion, entidad: "movimientos", entidad_id: movimientoId, motivo, datos },
  });
}

async function dondeEsta(placa: string) {
  return db.movimientos.findFirst({
    where: { placa, salida_at: null, anulado_at: null },
    include: { parqueo: true, zona: true },
  });
}

const hora = (d: Date) =>
  d.toLocaleTimeString("es-CR", { timeZone: "America/Costa_Rica", hour: "2-digit", minute: "2-digit" });

// ── CU-11 ────────────────────────────────────────────────────────────────

export async function seleccionarParqueo(id: string): Promise<Resultado> {
  await exigirRol("guarda");
  const parqueo = await db.parqueos.findFirst({ where: { id, activo: true } });
  if (!parqueo) return { error: "Ese parqueo ya no está activo." };
  (await cookies()).set(COOKIE_TURNO, id, { httpOnly: true, sameSite: "lax", path: "/", maxAge: 16 * 3600 });
  refresh();
  return { ok: `Turno en ${parqueo.nombre}.` };
}

export async function dejarParqueo(): Promise<Resultado> {
  await exigirRol("guarda");
  (await cookies()).delete(COOKIE_TURNO);
  refresh();
  return null;
}

// ── CU-13 ────────────────────────────────────────────────────────────────

export type ConsultaPlaca =
  | { error: string }
  | {
      placa: string;
      miembros: { id: string; nombre: string; tipo: string; preferencial: boolean; tamano: string }[];
    };

/** CU-13, pasos 2 a 5: valida la placa y busca si es de un miembro. */
export async function consultarPlaca(origen: string, placaEscrita: string): Promise<ConsultaPlaca> {
  await exigirRol("guarda");
  const o = ORIGEN.safeParse(origen);
  if (!o.success || !placaValida(placaEscrita, o.data)) {
    return { error: "La placa no tiene un formato válido." }; // 3a
  }
  const placa = normalizarPlaca(placaEscrita);

  const abierto = await dondeEsta(placa); // 3b
  if (abierto) {
    return {
      error: `${placa} ya figura dentro de ${abierto.parqueo.nombre} (${abierto.zona.nombre}, desde las ${hora(abierto.entrada_at)}). Registra su salida o anula ese registro primero.`,
    };
  }

  const vehiculos = await db.vehiculos.findMany({
    where: { placa, usuario: { rol: "miembro", estado: "aprobada" } },
    include: { usuario: true },
  });
  return {
    placa,
    miembros: vehiculos.map((v) => ({
      id: v.usuario.id,
      nombre: v.usuario.nombre,
      tipo: v.usuario.tipo_persona ?? "visita",
      preferencial: v.usuario.preferencial,
      tamano: v.tamano,
    })),
  };
}

/** CU-13, pasos 6 a 8. */
export async function registrarEntrada(_prev: Resultado, form: FormData): Promise<Resultado> {
  const { guarda, parqueo } = await guardaEnTurno();
  if (!parqueo) return { error: "Selecciona primero el parqueo de tu turno." };

  const origen = ORIGEN.safeParse(form.get("origen"));
  const placaEscrita = String(form.get("placa") ?? "");
  if (!origen.success || !placaValida(placaEscrita, origen.data)) return { error: "La placa no tiene un formato válido." };
  const placa = normalizarPlaca(placaEscrita);
  const pais = origen.data === "extranjera" ? String(form.get("pais") ?? "").trim() : "";
  if (origen.data === "extranjera" && !pais) return { error: "Indica el país de la placa extranjera." };

  // Persona: el miembro dueño de la placa (4a) o una visita sin reserva (5).
  let persona: Pick<
    Prisma.movimientosUncheckedCreateInput,
    "persona_nombre" | "tipo_persona" | "tipo_identificacion" | "identificacion" | "usuario_id" | "tamano_vehiculo"
  >;
  const usuarioId = String(form.get("usuario_id") ?? "");
  if (usuarioId) {
    const vehiculo = await db.vehiculos.findFirst({
      where: { placa, usuario_id: usuarioId, usuario: { rol: "miembro", estado: "aprobada" } },
      include: { usuario: true },
    });
    if (!vehiculo) return { error: "Esa placa ya no está registrada a nombre de ese miembro." };
    persona = {
      persona_nombre: vehiculo.usuario.nombre,
      tipo_persona: vehiculo.usuario.tipo_persona ?? "visita",
      tipo_identificacion: vehiculo.usuario.tipo_identificacion,
      identificacion: vehiculo.usuario.identificacion,
      usuario_id: vehiculo.usuario.id,
      tamano_vehiculo: vehiculo.tamano,
    };
  } else {
    const nombre = String(form.get("nombre") ?? "").trim();
    const tipoId = z.enum(["cedula", "dimex", "didi", "pasaporte"]).safeParse(form.get("tipo_identificacion"));
    const identificacion = normalizarIdentificacion(String(form.get("identificacion") ?? ""));
    const tamano = TAMANO.safeParse(form.get("tamano"));
    if (nombre.length < 3) return { error: "Escribe el nombre de la persona." };
    if (!tipoId.success || !identificacionValida(tipoId.data, identificacion)) {
      return { error: "La identificación no tiene el formato de ese tipo." };
    }
    if (!tamano.success) return { error: "Elige el tamaño del vehículo." };
    persona = {
      persona_nombre: nombre,
      tipo_persona: "visita",
      tipo_identificacion: tipoId.data,
      identificacion,
      usuario_id: null,
      tamano_vehiculo: tamano.data,
    };
  }

  return crearEntrada({
    parqueoId: parqueo.id,
    guardaId: guarda.id,
    zonaId: String(form.get("zona_id") ?? ""),
    origen: "manual",
    datos: { ...persona, placa, origen_placa: origen.data, pais: pais || null },
  });
}

type DatosEntrada = Pick<
  Prisma.movimientosUncheckedCreateInput,
  | "persona_nombre"
  | "tipo_persona"
  | "tipo_identificacion"
  | "identificacion"
  | "usuario_id"
  | "tamano_vehiculo"
  | "placa"
  | "origen_placa"
  | "pais"
>;

/**
 * Pasos finales comunes a la entrada manual (CU-13) y por QR (CU-12): valida
 * que la zona sea del parqueo, calcula el cupo que ocupa y crea el movimiento.
 * No se exporta: en un archivo "use server" solo lo exportado es un endpoint.
 */
async function crearEntrada(input: {
  parqueoId: string;
  guardaId: string;
  zonaId: string;
  origen: "manual" | "qr_miembro" | "qr_reserva";
  datos: DatosEntrada;
}): Promise<Resultado> {
  const [disp] = await disponibilidadParqueos(new Date(), input.parqueoId);
  const zona = disp?.zonas.find((z) => z.id === input.zonaId);
  if (!zona) return { error: "Elige una zona de este parqueo." };
  const { tamanoCupo, sobrecupo } = cupoAlEntrar(input.datos.tamano_vehiculo, zona.porTamano);

  try {
    await db.movimientos.create({
      data: {
        ...input.datos,
        tamano_cupo: tamanoCupo,
        origen: input.origen,
        sobrecupo,
        parqueo_id: input.parqueoId,
        zona_id: zona.id,
        guarda_entrada_id: input.guardaId,
      },
    });
  } catch (e) {
    // RN-01 garantizado por la base: la placa ya está dentro, quizá registrada
    // por otro guarda al mismo tiempo.
    if (esDuplicado(e)) return { error: `${input.datos.placa} ya figura dentro de un parqueo.` };
    throw e;
  }

  refresh();
  const texto = `Entrada registrada: ${input.datos.placa} en ${zona.nombre}.`;
  return sobrecupo ? { aviso: `${texto} La zona quedó en sobrecupo.` } : { ok: texto };
}

// ── CU-12 ────────────────────────────────────────────────────────────────

/** Busca al miembro de una tarjeta por el QR o el código corto (RN-13). */
async function miembroDeCredencial(texto: string) {
  const credencial = interpretarCredencial(texto);
  if (!credencial) return { ok: false, error: "No es una tarjeta de UPark." } as const;
  if (credencial.tipo === "reserva") {
    return { ok: false, error: "Las entradas con reserva todavía no están disponibles. Usa la entrada manual." } as const;
  }

  const usuario = await db.usuarios.findFirst({
    where: credencial.tipo === "miembro" ? { token_tarjeta: credencial.token } : { codigo_tarjeta: credencial.codigo },
    include: { vehiculos: { orderBy: [{ principal: "desc" }, { created_at: "asc" }] } },
  });
  // 2a: tarjeta regenerada, inexistente o de una cuenta que no está aprobada.
  if (!usuario || usuario.rol !== "miembro" || usuario.estado !== "aprobada") {
    return { ok: false, error: "Tarjeta no válida o de una cuenta inactiva. Usa la entrada manual." } as const;
  }
  return { ok: true, usuario } as const;
}

export type ConsultaTarjeta =
  | { error: string }
  | {
      nombre: string;
      tipo: string;
      preferencial: boolean;
      vehiculos: { placa: string; tamano: string; principal: boolean; descripcion: string | null }[];
    };

/** CU-12 (miembro), pasos 1 a 3. */
export async function identificarTarjeta(texto: string): Promise<ConsultaTarjeta> {
  await exigirRol("guarda");
  const r = await miembroDeCredencial(texto);
  if (!r.ok) return { error: r.error };
  const { usuario } = r;
  if (usuario.vehiculos.length === 0) {
    return { error: `${usuario.nombre} no tiene vehículos registrados. Usa la entrada manual.` };
  }
  return {
    nombre: usuario.nombre,
    tipo: usuario.tipo_persona ?? "visita",
    preferencial: usuario.preferencial,
    vehiculos: usuario.vehiculos.map((v) => ({
      placa: v.placa,
      tamano: v.tamano,
      principal: v.principal,
      descripcion: v.descripcion,
    })),
  };
}

/** CU-12 (miembro), pasos 4 a 8. Vuelve a validar todo con la tarjeta, no con lo que mande el navegador. */
export async function registrarEntradaTarjeta(texto: string, _prev: Resultado, form: FormData): Promise<Resultado> {
  const { guarda, parqueo } = await guardaEnTurno();
  if (!parqueo) return { error: "Selecciona primero el parqueo de tu turno." };
  const r = await miembroDeCredencial(texto);
  if (!r.ok) return { error: r.error };
  const { usuario } = r;

  // RN-14: la tarjeta solo sirve para los vehículos del miembro.
  const vehiculo = usuario.vehiculos.find((v) => v.placa === String(form.get("placa") ?? ""));
  if (!vehiculo) return { error: "Esa placa no es de este miembro. Usa la entrada manual." };

  return crearEntrada({
    parqueoId: parqueo.id,
    guardaId: guarda.id,
    zonaId: String(form.get("zona_id") ?? ""),
    origen: "qr_miembro",
    datos: {
      persona_nombre: usuario.nombre,
      tipo_persona: usuario.tipo_persona ?? "visita",
      tipo_identificacion: usuario.tipo_identificacion,
      identificacion: usuario.identificacion,
      usuario_id: usuario.id,
      tamano_vehiculo: vehiculo.tamano,
      placa: vehiculo.placa,
      origen_placa: vehiculo.origen,
      pais: vehiculo.pais,
    },
  });
}

// ── CU-14 ────────────────────────────────────────────────────────────────

export async function registrarSalida(movimientoId: string): Promise<Resultado> {
  const { guarda, parqueo } = await guardaEnTurno();
  if (!parqueo) return { error: "Selecciona primero el parqueo de tu turno." };

  const mov = await db.movimientos.findFirst({ where: { id: movimientoId, salida_at: null, anulado_at: null } });
  if (!mov) return { error: "Ese vehículo ya no figura dentro." };
  const otroParqueo = mov.parqueo_id !== parqueo.id; // 3b

  await db.$transaction(async (tx) => {
    const { count } = await tx.movimientos.updateMany({
      where: { id: mov.id, salida_at: null, anulado_at: null },
      data: {
        salida_at: new Date(),
        guarda_salida_id: guarda.id,
        parqueo_salida_id: otroParqueo ? parqueo.id : null,
      },
    });
    if (count === 1 && otroParqueo) {
      await auditar(tx, guarda.id, "salida_otro_parqueo", mov.id, null, { parqueo_entrada: mov.parqueo_id, parqueo_salida: parqueo.id });
    }
  });

  refresh();
  return { ok: `Salida registrada: ${mov.placa}.` };
}

// ── CU-18 ────────────────────────────────────────────────────────────────

const motivoDe = (form: FormData) => String(form.get("motivo") ?? "").trim();

/** CU-18: anula una entrada del día en el parqueo del turno (no se borra). */
export async function anularEntrada(movimientoId: string, _prev: Resultado, form: FormData): Promise<Resultado> {
  const { guarda, parqueo } = await guardaEnTurno();
  if (!parqueo) return { error: "Selecciona primero el parqueo de tu turno." };
  const motivo = motivoDe(form);
  if (!motivo) return { error: "Escribe el motivo." }; // 2a

  const mov = await db.movimientos.findFirst({ where: { id: movimientoId, anulado_at: null } });
  if (!mov) return { error: "Ese registro ya está anulado." };
  // 1a: otro día u otro parqueo queda para un admin.
  if (mov.parqueo_id !== parqueo.id || mov.entrada_at < inicioDelDiaCR(new Date())) {
    return { error: "Solo puedes anular registros de hoy en tu parqueo. Pide ayuda a un administrador." };
  }

  await db.$transaction(async (tx) => {
    await tx.movimientos.update({
      where: { id: mov.id },
      // La reserva se suelta para que pueda volver a usarse (3a).
      data: { anulado_at: new Date(), anulado_por_id: guarda.id, motivo_anulacion: motivo, reserva_id: null },
    });
    if (mov.reserva_id) {
      await tx.reservas.update({ where: { id: mov.reserva_id }, data: { estado: "confirmada" } });
    }
    await auditar(tx, guarda.id, "anular_entrada", mov.id, motivo, mov.reserva_id ? { reserva_id: mov.reserva_id } : undefined);
  });

  refresh();
  return { ok: `Registro de ${mov.placa} anulado.` };
}

/** CU-18, 3b: solo se equivocó la salida; el vehículo vuelve a figurar dentro. */
export async function anularSalida(movimientoId: string, _prev: Resultado, form: FormData): Promise<Resultado> {
  const { guarda, parqueo } = await guardaEnTurno();
  if (!parqueo) return { error: "Selecciona primero el parqueo de tu turno." };
  const motivo = motivoDe(form);
  if (!motivo) return { error: "Escribe el motivo." };

  const mov = await db.movimientos.findFirst({ where: { id: movimientoId, anulado_at: null, salida_at: { not: null } } });
  if (!mov?.salida_at) return { error: "Ese registro no tiene salida." };
  if ((mov.parqueo_salida_id ?? mov.parqueo_id) !== parqueo.id || mov.salida_at < inicioDelDiaCR(new Date())) {
    return { error: "Solo puedes anular salidas de hoy en tu parqueo. Pide ayuda a un administrador." };
  }

  try {
    await db.$transaction(async (tx) => {
      await tx.movimientos.update({
        where: { id: mov.id },
        data: { salida_at: null, guarda_salida_id: null, parqueo_salida_id: null },
      });
      await auditar(tx, guarda.id, "anular_salida", mov.id, motivo, { salida_at: mov.salida_at!.toISOString() });
    });
  } catch (e) {
    if (esDuplicado(e)) return { error: `${mov.placa} ya volvió a entrar; no se puede reabrir este registro.` };
    throw e;
  }

  refresh();
  return { ok: `Salida de ${mov.placa} anulada.` };
}

// ── CU-17 ────────────────────────────────────────────────────────────────

/** +1, −1 (sin bajar de 0) o 0 para reiniciar. */
export async function moverFila(delta: -1 | 0 | 1): Promise<Resultado> {
  const { parqueo } = await guardaEnTurno();
  if (!parqueo) return { error: "Selecciona primero el parqueo de tu turno." };

  const ahora = new Date();
  if (delta === 0) {
    await db.parqueos.update({ where: { id: parqueo.id }, data: { fila: 0, fila_actualizada_at: ahora } });
  } else if (delta === 1) {
    await db.parqueos.update({ where: { id: parqueo.id }, data: { fila: { increment: 1 }, fila_actualizada_at: ahora } });
  } else {
    // 1b: el filtro evita bajar de 0 aunque dos toques lleguen juntos.
    await db.parqueos.updateMany({
      where: { id: parqueo.id, fila: { gt: 0 } },
      data: { fila: { decrement: 1 }, fila_actualizada_at: ahora },
    });
  }
  refresh();
  return null;
}
