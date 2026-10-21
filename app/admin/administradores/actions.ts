"use server";

import { refresh } from "next/cache";
import { z } from "zod";
import type { Resultado } from "@/components/formulario";
import { esDuplicado } from "@/lib/acciones";
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
    if (existente.rol === rol.data) return { error: `Esa persona ya es ${ROL[rol.data]}.` };
    // Una cuenta con rol de administración tiene que estar habilitada para usarlo.
    await db.usuarios.update({ where: { id: existente.id }, data: { rol: rol.data, estado: "aprobada" } });
    refresh();
    return { ok: `${existente.nombre} ahora es ${ROL[rol.data]}.` };
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
  await correoAcceso(nuevo, ROL[rol.data]);
  refresh();
  return { ok: `Cuenta creada. Le enviamos a ${nuevo.correo} el enlace para definir su contraseña.` };
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
