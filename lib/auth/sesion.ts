import { cache } from "react";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import type { rol_usuario } from "@/lib/generated/prisma/enums";

/** El usuario de la sesión leído de la base, una vez por request. */
export const usuarioActual = cache(async () => {
  const session = await auth();
  if (!session?.user?.id) return null;
  return db.usuarios.findUnique({ where: { id: session.user.id } });
});

/** RN-21: el super admin puede todo lo del admin. */
export function tieneRol(rol: rol_usuario, permitidos: rol_usuario[]): boolean {
  return permitidos.includes(rol) || (rol === "super_admin" && permitidos.includes("admin"));
}

/**
 * Corta el render si no hay sesión o el rol no alcanza. Los miembros pendientes
 * pasan para que vean su estado (CU-03, 2c); el resto exige cuenta aprobada.
 */
export async function exigirRol(...permitidos: rol_usuario[]) {
  const usuario = await usuarioActual();
  if (!usuario) redirect("/login");
  const habilitado =
    usuario.estado === "aprobada" || (usuario.rol === "miembro" && usuario.estado === "pendiente");
  if (!habilitado || !tieneRol(usuario.rol, permitidos)) redirect("/panel");
  return usuario;
}

/** A qué pantalla va cada rol después de iniciar sesión (CU-03, paso 3). */
export function inicioDeRol(rol: rol_usuario): string {
  if (rol === "guarda") return "/guarda";
  if (rol === "admin" || rol === "super_admin") return "/admin";
  return "/cuenta";
}
