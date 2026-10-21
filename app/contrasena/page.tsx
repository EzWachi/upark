import { Suspense } from "react";
import Link from "next/link";
import { revisarToken } from "@/lib/tokens";
import { FormularioContrasena } from "@/components/formularios-cuenta";
import { definirContrasena } from "./actions";

async function Contenido({ searchParams }: { searchParams: PageProps<"/contrasena">["searchParams"] }) {
  const token = String((await searchParams).token ?? "");
  const revision = token ? await revisarToken(token, ["recuperacion", "acceso"]) : { estado: "invalido" as const };

  if (revision.estado !== "valido") {
    return (
      <p>
        {revision.estado === "vencido" ? "El enlace venció." : "El enlace no es válido o ya se usó."}{" "}
        <Link href="/recuperar" className="underline">
          Pide uno nuevo
        </Link>
        {" "}o, si eres guarda o administrador nuevo, pide a la administración que te reenvíe el acceso.
      </p>
    );
  }
  return <FormularioContrasena accion={definirContrasena.bind(null, token)} />;
}

// CU-03 (recuperar contraseña) y primer acceso de guardas y administradores.
export default function Contrasena(props: PageProps<"/contrasena">) {
  return (
    <main className="mx-auto w-full max-w-md flex-1 px-4 py-12">
      <h1 className="mb-6 text-2xl font-bold">Definir contraseña</h1>
      <Suspense fallback={<p className="text-neutral-500">Revisando el enlace…</p>}>
        <Contenido searchParams={props.searchParams} />
      </Suspense>
    </main>
  );
}
