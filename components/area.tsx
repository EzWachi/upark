import { Suspense, type ReactNode } from "react";
import Link from "next/link";
import { signOut } from "@/lib/auth";
import { exigirRol } from "@/lib/auth/sesion";
import type { rol_usuario, usuarios } from "@/lib/generated/prisma/client";

/**
 * Marco común de las áreas privadas: exige el rol, muestra el encabezado con
 * el botón de salir y pasa el usuario al contenido.
 */
export function Area({
  titulo,
  roles,
  children,
}: {
  titulo: string;
  roles: rol_usuario[];
  children: (usuario: usuarios) => ReactNode;
}) {
  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-8">
      <Suspense fallback={<p className="text-neutral-500">Cargando…</p>}>
        <Contenido titulo={titulo} roles={roles}>
          {children}
        </Contenido>
      </Suspense>
    </main>
  );
}

async function Contenido({
  titulo,
  roles,
  children,
}: {
  titulo: string;
  roles: rol_usuario[];
  children: (usuario: usuarios) => ReactNode;
}) {
  const usuario = await exigirRol(...roles);
  return (
    <>
      <header className="mb-6 flex items-center justify-between gap-4">
        <div>
          <Link href="/" className="text-sm underline">
            UPark
          </Link>
          <h1 className="text-2xl font-bold">{titulo}</h1>
          <p className="text-sm text-neutral-500">{usuario.nombre}</p>
        </div>
        <form
          action={async () => {
            "use server";
            await signOut({ redirectTo: "/" });
          }}
        >
          <button className="text-sm underline">Cerrar sesión</button>
        </form>
      </header>
      {children(usuario)}
    </>
  );
}
