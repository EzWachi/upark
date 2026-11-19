"use server";

import { refresh } from "next/cache";
import type { Resultado } from "@/components/formulario";
import { CORREO_NO_SALIO, REENVIO_NO_SALIO, esDuplicado, primerError } from "@/lib/acciones";
import { exigirRol } from "@/lib/auth/sesion";
import { db } from "@/lib/db";
import { correoAcceso } from "@/lib/notificaciones";
import { esquemaGuarda } from "@/lib/reglas/cuentas";

/** CU-24, pasos 2 a 5. */
export async function crearGuarda(_prev: Resultado, form: FormData): Promise<Resultado> {
  await exigirRol("admin");
  const datos = esquemaGuarda.safeParse({
    nombre: form.get("nombre"),
    correo: form.get("correo"),
    tipo_identificacion: form.get("tipo_identificacion"),
    identificacion: form.get("identificacion"),
  });
  if (!datos.success) return primerError(datos.error);

  let guarda;
  try {
    guarda = await db.usuarios.create({
      // Nace aprobada porque la crea un admin (RN-12); entra cuando define su contraseña.
      data: { ...datos.data, rol: "guarda", estado: "aprobada" },
    });
  } catch (e) {
    if (!esDuplicado(e)) throw e;
    // 4a: si es un guarda desactivado, se ofrece reactivarlo.
    const existente = await db.usuarios.findFirst({
      where: {
        OR: [
          { correo: datos.data.correo },
          { tipo_identificacion: datos.data.tipo_identificacion, identificacion: datos.data.identificacion },
        ],
      },
    });
    return existente?.rol === "guarda" && existente.estado === "desactivada"
      ? { error: `Ese guarda ya existe y está desactivado (${existente.nombre}). Reactívalo desde la lista.` }
      : { error: "Ya existe una cuenta con ese correo o identificación." };
  }

  const enviado = await correoAcceso(guarda, "guarda");
  refresh();
  return enviado
    ? { ok: `Guarda creado. Le enviamos a ${guarda.correo} el enlace para definir su contraseña.` }
    : { aviso: `Guarda creado. ${CORREO_NO_SALIO}` };
}

/** CU-24, desactivar: sus registros se conservan y no puede volver a entrar. */
export async function cambiarEstadoGuarda(id: string, activar: boolean): Promise<Resultado> {
  await exigirRol("admin");
  const { count } = await db.usuarios.updateMany({
    where: { id, rol: "guarda", estado: activar ? "desactivada" : "aprobada" },
    data: { estado: activar ? "aprobada" : "desactivada" },
  });
  if (count === 0) return { error: "El guarda ya cambió de estado." };
  refresh();
  return { ok: activar ? "Guarda reactivado." : "Guarda desactivado." };
}

/** CU-24, 5a. */
export async function reenviarAccesoGuarda(id: string): Promise<Resultado> {
  await exigirRol("admin");
  const guarda = await db.usuarios.findFirst({ where: { id, rol: "guarda", estado: "aprobada" } });
  if (!guarda) return { error: "El guarda no está activo." };
  return (await correoAcceso(guarda, "guarda")) ? { ok: "Enlace reenviado." } : { error: REENVIO_NO_SALIO };
}
