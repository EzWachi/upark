"use server";

import { refresh } from "next/cache";
import { z } from "zod";
import type { Resultado } from "@/components/formulario";
import { CORREO_NO_SALIO, REENVIO_NO_SALIO, esDuplicado } from "@/lib/acciones";
import { exigirRol } from "@/lib/auth/sesion";
import { db } from "@/lib/db";
import { ROL } from "@/lib/etiquetas";
import { correoAcceso } from "@/lib/notificaciones";
import { normalizarCorreo, rolAlQuitar, validarQuitarRol } from "@/lib/reglas/cuentas";

const rolAdmin = z.enum(["admin", "super_admin"]);
const superAdminsActivos = () => db.usuarios.count({ where: { rol: "super_admin", estado: "aprobada" } });

/** CU-32, pasos 3 y 4. */
export async function agregarAdministrador(_prev: Resultado, form: FormData): Promise<Resultado> {
  await exigirRol("super_admin");
  const correo = z.email("Correo inválido").safeParse(normalizarCorreo(String(form.get("correo") ?? "")));
  if (!correo.success) return { error: correo.error.issues[0].message };
  const rol = rolAdmin.safeParse(form.get("rol"));
  if (!rol.success) return { error: "Elige un rol." };

  const existente = await db.usuarios.findUnique({ where: { correo: correo.data } });
  if (existente) {
    // Sin contraseña nunca pudo entrar (por ejemplo, si el primer correo no
    // salió): agregarla de nuevo le reenvía el enlace en vez de dejarla atrapada.
    const sinContrasena = !existente.password_hash;
    if (existente.rol === rol.data && !sinContrasena) return { error: `Esa persona ya es ${ROL[rol.data]}.` };
    // Una cuenta con rol de administración tiene que estar habilitada para usarlo.
    await db.usuarios.update({ where: { id: existente.id }, data: { rol: rol.data, estado: "aprobada" } });
    refresh();
    const hecho = `${existente.nombre} ${existente.rol === rol.data ? "ya era" : "ahora es"} ${ROL[rol.data]}.`;
    if (!sinContrasena) return { ok: hecho };
    return (await correoAcceso(existente, ROL[rol.data]))
      ? { ok: `${hecho} Como no tenía contraseña, le enviamos el enlace para definirla.` }
      : { aviso: `${hecho} ${CORREO_NO_SALIO}` };
  }

  const nombre = String(form.get("nombre") ?? "").trim();
  if (nombre.length < 3) return { error: "La persona no tiene cuenta: escribe su nombre completo." };

  let nuevo;
  try {
    nuevo = await db.usuarios.create({ data: { nombre, correo: correo.data, rol: rol.data, estado: "aprobada" } });
  } catch (e) {
    if (esDuplicado(e)) return { error: "Ya existe una cuenta con ese correo." };
    throw e;
  }
  const enviado = await correoAcceso(nuevo, ROL[rol.data]);
  refresh();
  return enviado
    ? { ok: `Cuenta creada. Le enviamos a ${nuevo.correo} el enlace para definir su contraseña.` }
    : { aviso: `Cuenta creada. ${CORREO_NO_SALIO}` };
}

/** CU-32, paso 4 y CU-38, 3a: reenviar el enlace a quien todavía no define su contraseña. */
export async function reenviarAccesoAdministrador(id: string): Promise<Resultado> {
  await exigirRol("super_admin");
  const admin = await db.usuarios.findFirst({
    where: { id, rol: { in: ["admin", "super_admin"] }, estado: "aprobada", password_hash: null },
  });
  if (!admin) return { error: "Esa persona ya definió su contraseña o ya no es administrador." };
  return (await correoAcceso(admin, ROL[admin.rol])) ? { ok: "Enlace reenviado." } : { error: REENVIO_NO_SALIO };
}

/** CU-32, 3a a 3c. */
export async function quitarRolAdministrador(id: string): Promise<Resultado> {
  const actor = await exigirRol("super_admin");
  const objetivo = await db.usuarios.findFirst({ where: { id, rol: { in: ["admin", "super_admin"] } } });
  if (!objetivo) return { error: "Esa persona ya no es administrador." };

  const error = validarQuitarRol({
    actorId: actor.id,
    objetivoId: id,
    objetivoRol: objetivo.rol,
    superAdminsActivos: await superAdminsActivos(),
  });
  if (error) return { error };

  const { rol, desactivar } = rolAlQuitar(objetivo.tipo_persona);
  await db.usuarios.update({ where: { id }, data: { rol, ...(desactivar && { estado: "desactivada" }) } });
  refresh();
  return { ok: desactivar ? "Rol quitado y cuenta desactivada." : "Rol quitado; vuelve a ser miembro." };
}

/** Pasar entre admin y super admin, con las mismas protecciones de 3b y 3c al bajar. */
export async function cambiarRolAdministrador(id: string, nuevo: "admin" | "super_admin"): Promise<Resultado> {
  const actor = await exigirRol("super_admin");
  const objetivo = await db.usuarios.findFirst({ where: { id, rol: { in: ["admin", "super_admin"] } } });
  if (!objetivo || objetivo.rol === nuevo) return { error: "El rol ya cambió." };

  if (nuevo === "admin") {
    const error = validarQuitarRol({
      actorId: actor.id,
      objetivoId: id,
      objetivoRol: objetivo.rol,
      superAdminsActivos: await superAdminsActivos(),
    });
    if (error) return { error };
  }

  await db.usuarios.update({ where: { id }, data: { rol: nuevo } });
  refresh();
  return { ok: `Ahora es ${ROL[nuevo]}.` };
}
