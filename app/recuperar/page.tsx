import Link from "next/link";
import { FormularioCorreo } from "@/components/formularios-cuenta";
import { pedirRecuperacion } from "../contrasena/actions";

// CU-03, recuperar contraseña.
export default function Recuperar() {
  return (
    <main className="mx-auto w-full max-w-md flex-1 px-4 py-12">
      <Link href="/login" className="text-sm underline">
        ← Iniciar sesión
      </Link>
      <h1 className="mt-4 mb-6 text-2xl font-bold">Recuperar contraseña</h1>
      <FormularioCorreo accion={pedirRecuperacion} boton="Enviar enlace" />
    </main>
  );
}
