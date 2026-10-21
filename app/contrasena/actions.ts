"use server";

import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import type { Resultado } from "@/components/formulario";
import { primerError } from "@/lib/acciones";
import { db } from "@/lib/db";
import { correoRecuperacion } from "@/lib/notificaciones";
import { esquemaPassword, normalizarCorreo } from "@/lib/reglas/cuentas";
import { gastarToken, revisarToken } from "@/lib/tokens";

/** CU-03 (recuperar) y CU-24 / CU-32 (primer acceso): define la contraseña. */
export async function definirContrasena(token: string, _prev: Resultado, form: FormData): Promise<Resultado> {
  const password = esquemaPassword.safeParse(form.get("password"));
  if (!password.success) return primerError(password.error);
  if (password.data !== form.get("confirmacion")) return { error: "Las contraseñas no coinciden." };

  const revision = await revisarToken(token, ["recuperacion", "acceso"]);
  if (revision.estado !== "valido") return { error: "El enlace ya no es válido. Pide uno nuevo." };
  if (!(await gastarToken(revision.id))) return { error: "El enlace ya se usó." };

  // Usar un enlace que llegó al correo también prueba que el correo es suyo.
  const usuario = await db.usuarios.findUniqueOrThrow({ where: { id: revision.usuarioId } });
  await db.usuarios.update({
    where: { id: usuario.id },
    data: {
      password_hash: await bcrypt.hash(password.data, 12),
      correo_verificado_at: usuario.correo_verificado_at ?? new Date(),
    },
  });
  redirect("/login");
}

/** CU-03, recuperar 1 y 2. La respuesta no revela si el correo tiene cuenta (1a). */
export async function pedirRecuperacion(_prev: Resultado, form: FormData): Promise<Resultado> {
  const correo = normalizarCorreo(String(form.get("correo") ?? ""));
  const usuario = await db.usuarios.findUnique({ where: { correo } });
  if (usuario && ["pendiente", "aprobada"].includes(usuario.estado)) await correoRecuperacion(usuario);
  return { ok: "Si hay una cuenta con ese correo, te enviamos un enlace para cambiar la contraseña." };
}
