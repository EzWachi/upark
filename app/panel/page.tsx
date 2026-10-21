import { Suspense } from "react";
import { redirect } from "next/navigation";
import { inicioDeRol, usuarioActual } from "@/lib/auth/sesion";

/** Reparte a cada rol a su pantalla después de iniciar sesión (CU-03, paso 3). */
async function Redirigir() {
  const usuario = await usuarioActual();
  if (!usuario) redirect("/login");
  redirect(inicioDeRol(usuario.rol));
  return null;
}

export default function Panel() {
  return (
    <Suspense>
      <Redirigir />
    </Suspense>
  );
}
