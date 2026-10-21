"use client";

import { useFormulario, type Accion } from "@/components/formulario";
import { Mensaje, estiloBoton, estiloInput } from "@/components/mensaje";

/** Un botón que ejecuta una acción y muestra su resultado; al terminar bien, se oculta. */
export function BotonAccion({ accion, texto }: { accion: Accion; texto: string }) {
  const { resultado, enviar, pendiente } = useFormulario(accion);
  return (
    <form action={enviar} className="space-y-3">
      {!resultado?.ok && (
        <button disabled={pendiente} className={estiloBoton}>
          {pendiente ? "Un momento…" : texto}
        </button>
      )}
      <Mensaje resultado={resultado} />
    </form>
  );
}

/** Pide un correo (reenviar verificación, recuperar contraseña). */
export function FormularioCorreo({ accion, boton }: { accion: Accion; boton: string }) {
  const { resultado, enviar, pendiente, valor } = useFormulario(accion);
  return (
    <form action={enviar} className="space-y-3">
      <label className="block">
        <span className="text-sm">Correo</span>
        <input name="correo" type="email" required autoComplete="email" defaultValue={valor("correo")} className={estiloInput} />
      </label>
      <Mensaje resultado={resultado} />
      <button disabled={pendiente} className={estiloBoton}>
        {pendiente ? "Enviando…" : boton}
      </button>
    </form>
  );
}

/** Contraseña nueva con confirmación (CU-03, CU-24, CU-32). */
export function FormularioContrasena({ accion }: { accion: Accion }) {
  const { resultado, enviar, pendiente } = useFormulario(accion);
  return (
    <form action={enviar} className="space-y-3">
      <label className="block">
        <span className="text-sm">Contraseña nueva</span>
        <input name="password" type="password" required minLength={8} autoComplete="new-password" className={estiloInput} />
        <span className="text-xs text-neutral-500">Al menos 8 caracteres, con una letra y un número.</span>
      </label>
      <label className="block">
        <span className="text-sm">Repite la contraseña</span>
        <input name="confirmacion" type="password" required minLength={8} autoComplete="new-password" className={estiloInput} />
      </label>
      <Mensaje resultado={resultado} />
      <button disabled={pendiente} className={estiloBoton}>
        {pendiente ? "Guardando…" : "Guardar contraseña"}
      </button>
    </form>
  );
}
