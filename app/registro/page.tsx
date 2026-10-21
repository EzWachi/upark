"use client";

import Link from "next/link";
import { useFormulario } from "@/components/formulario";
import { Mensaje, estiloBoton, estiloInput } from "@/components/mensaje";
import { TIPO_IDENTIFICACION } from "@/lib/etiquetas";
import { registrarse } from "./actions";

// CU-02.
export default function Registro() {
  const { resultado, enviado, enviar, pendiente, valor } = useFormulario(registrarse);

  if (resultado?.ok) {
    return (
      <main className="mx-auto w-full max-w-md flex-1 px-4 py-12">
        <h1 className="mb-4 text-2xl font-bold">Revisa tu correo</h1>
        <p>{resultado.ok}</p>
        <p className="mt-2 text-sm text-neutral-500">Después de confirmarlo, un administrador aprobará tu cuenta.</p>
      </main>
    );
  }

  return (
    <main className="mx-auto w-full max-w-md flex-1 px-4 py-12">
      <Link href="/login" className="text-sm underline">
        ← Iniciar sesión
      </Link>
      <h1 className="mt-4 mb-6 text-2xl font-bold">Crear cuenta</h1>
      <form action={enviar} className="space-y-4">
        <label className="block">
          <span className="text-sm">Nombre completo</span>
          <input name="nombre" required autoComplete="name" defaultValue={valor("nombre")} className={estiloInput} />
        </label>
        <label className="block">
          <span className="text-sm">Correo institucional</span>
          <input name="correo" type="email" required autoComplete="email" defaultValue={valor("correo")} className={estiloInput} />
        </label>
        <label className="block">
          <span className="text-sm">Contraseña</span>
          <input name="password" type="password" required minLength={8} autoComplete="new-password" className={estiloInput} />
          <span className="text-xs text-neutral-500">Al menos 8 caracteres, con una letra y un número.</span>
        </label>
        <div className="grid grid-cols-2 gap-3">
          <label className="block">
            <span className="text-sm">Identificación</span>
            <select name="tipo_identificacion" defaultValue={valor("tipo_identificacion", "cedula")} className={estiloInput}>
              {Object.entries(TIPO_IDENTIFICACION).map(([v, t]) => (
                <option key={v} value={v}>
                  {t}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="text-sm">Número</span>
            <input name="identificacion" required defaultValue={valor("identificacion")} className={estiloInput} />
          </label>
        </div>
        <fieldset>
          <legend className="text-sm">Soy</legend>
          <div className="mt-1 flex gap-4">
            {(["estudiante", "profesor", "funcionario"] as const).map((t) => (
              <label key={t} className="flex items-center gap-2 text-sm">
                <input type="radio" name="tipo_persona" value={t} required defaultChecked={enviado?.get("tipo_persona") === t} />
                {t[0].toUpperCase() + t.slice(1)}
              </label>
            ))}
          </div>
        </fieldset>
        <label className="flex items-start gap-2 text-sm">
          <input type="checkbox" name="consentimiento" required className="mt-1" />
          <span>
            Acepto que ULACIT trate mis datos (nombre, correo, identificación y placas) solo para gestionar el acceso a
            los parqueos, según la Ley 8968. Solo los guardas y la administración pueden verlos.
          </span>
        </label>
        <Mensaje resultado={resultado} />
        <button disabled={pendiente} className={`w-full ${estiloBoton}`}>
          {pendiente ? "Creando cuenta…" : "Crear cuenta"}
        </button>
      </form>
    </main>
  );
}
