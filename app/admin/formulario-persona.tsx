"use client";

import { useFormulario, type Accion } from "@/components/formulario";
import { Mensaje, estiloBoton, estiloInput } from "@/components/mensaje";
import { ROL, TIPO_IDENTIFICACION } from "@/lib/etiquetas";

/** Alta de guardas (CU-24) y administradores (CU-32). */
export function FormularioPersona({
  accion,
  boton,
  conIdentificacion,
  conRol,
}: {
  accion: Accion;
  boton: string;
  conIdentificacion?: boolean;
  conRol?: boolean;
}) {
  const { resultado, enviar, pendiente, valor } = useFormulario(accion);
  return (
    <form action={enviar} className="space-y-3">
      <label className="block">
        <span className="text-sm">Correo</span>
        <input name="correo" type="email" required defaultValue={valor("correo")} className={estiloInput} />
      </label>
      <label className="block">
        <span className="text-sm">Nombre completo{conRol && " (solo si la persona no tiene cuenta)"}</span>
        <input name="nombre" required={!conRol} defaultValue={valor("nombre")} className={estiloInput} />
      </label>
      {conIdentificacion && (
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
      )}
      {conRol && (
        <label className="block">
          <span className="text-sm">Rol</span>
          <select name="rol" defaultValue={valor("rol", "admin")} className={estiloInput}>
            <option value="admin">{ROL.admin}</option>
            <option value="super_admin">{ROL.super_admin}</option>
          </select>
        </label>
      )}
      <Mensaje resultado={resultado} />
      <button disabled={pendiente} className={estiloBoton}>
        {pendiente ? "Guardando…" : boton}
      </button>
    </form>
  );
}
