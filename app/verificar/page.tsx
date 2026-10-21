import { Suspense } from "react";
import Link from "next/link";
import { revisarToken } from "@/lib/tokens";
import { confirmarCorreo, reenviarVerificacion } from "./actions";
import { BotonAccion, FormularioCorreo } from "@/components/formularios-cuenta";

async function Verificacion({ searchParams }: { searchParams: PageProps<"/verificar">["searchParams"] }) {
  const token = String((await searchParams).token ?? "");
  const revision = token ? await revisarToken(token, ["verificacion"]) : { estado: "invalido" as const };

  if (revision.estado === "valido") {
    return (
      <>
        <p className="mb-4">Confirma que este es tu correo para continuar con tu solicitud.</p>
        <BotonAccion accion={confirmarCorreo.bind(null, token)} texto="Confirmar mi correo" />
      </>
    );
  }

  return (
    <>
      <p className="mb-4">
        {revision.estado === "vencido" ? "El enlace venció." : "El enlace no es válido o ya se usó."} Escribe tu correo y
        te enviamos uno nuevo.
      </p>
      <FormularioCorreo accion={reenviarVerificacion} boton="Enviar enlace nuevo" />
    </>
  );
}

// CU-02, pasos 6 y 7 y 6a.
export default function Verificar(props: PageProps<"/verificar">) {
  return (
    <main className="mx-auto w-full max-w-md flex-1 px-4 py-12">
      <Link href="/login" className="text-sm underline">
        ← Iniciar sesión
      </Link>
      <h1 className="mt-4 mb-6 text-2xl font-bold">Confirmar correo</h1>
      <Suspense fallback={<p className="text-neutral-500">Revisando el enlace…</p>}>
        <Verificacion searchParams={props.searchParams} />
      </Suspense>
    </main>
  );
}
