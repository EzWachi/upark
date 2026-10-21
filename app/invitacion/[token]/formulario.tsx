"use client";

import { useState } from "react";
import { useFormulario, type Accion } from "@/components/formulario";
import { Mensaje, estiloBoton, estiloInput } from "@/components/mensaje";
import { TAMANO, TIPO_IDENTIFICACION } from "@/lib/etiquetas";

/** CU-08, pasos 3 y 4. */
export function FormularioReserva({ accion, nombre, correo }: { accion: Accion; nombre: string; correo: string }) {
  const { resultado, alEnviar, pendiente } = useFormulario(accion);
  const [origen, setOrigen] = useState<"nacional" | "extranjera">("nacional");

  return (
    <form method="post" onSubmit={alEnviar} className="space-y-4">
      <label className="block">
        <span className="text-sm">Nombre completo</span>
        <input name="nombre" required defaultValue={nombre} autoComplete="name" className={estiloInput} />
      </label>
      <label className="block">
        <span className="text-sm">Correo (ahí te llega el QR)</span>
        <input name="correo" type="email" required defaultValue={correo} autoComplete="email" className={estiloInput} />
      </label>
      <div className="grid grid-cols-2 gap-3">
        <label className="block">
          <span className="text-sm">Identificación</span>
          <select name="tipo_identificacion" defaultValue="cedula" className={estiloInput}>
            {Object.entries(TIPO_IDENTIFICACION).map(([v, t]) => (
              <option key={v} value={v}>
                {t}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="text-sm">Número</span>
          <input name="identificacion" required className={estiloInput} />
        </label>
      </div>

      <fieldset>
        <legend className="text-sm">Vehículo</legend>
        <input type="hidden" name="origen_placa" value={origen} />
        <div className="mt-1 flex gap-4 text-sm">
          {(["nacional", "extranjera"] as const).map((o) => (
            <label key={o} className="flex items-center gap-2">
              <input type="radio" checked={origen === o} onChange={() => setOrigen(o)} />
              Placa {o === "nacional" ? "de Costa Rica" : "extranjera"}
            </label>
          ))}
        </div>
      </fieldset>
      <div className="grid gap-3 sm:grid-cols-3">
        <label className="block">
          <span className="text-sm">Placa</span>
          <input name="placa" required autoCapitalize="characters" className={`${estiloInput} uppercase`} />
        </label>
        {origen === "extranjera" && (
          <label className="block">
            <span className="text-sm">País</span>
            <input name="pais" required className={estiloInput} />
          </label>
        )}
        <label className="block">
          <span className="text-sm">Tamaño</span>
          <select name="tamano" defaultValue="sedan" className={estiloInput}>
            {Object.entries(TAMANO).map(([v, t]) => (
              <option key={v} value={v}>
                {t}
              </option>
            ))}
          </select>
        </label>
      </div>

      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" name="requiere_preferencial" />
        Necesito espacio preferencial (Ley 7600)
      </label>
      <label className="flex items-start gap-2 text-sm">
        <input type="checkbox" name="consentimiento" required className="mt-1" />
        <span>
          Acepto que ULACIT use mi nombre, correo, identificación y placa solo para gestionar esta visita al parqueo, según
          la Ley 8968. Solo los guardas y la administración pueden verlos.
        </span>
      </label>

      <Mensaje resultado={resultado} />
      <button disabled={pendiente} className={`w-full ${estiloBoton}`}>
        {pendiente ? "Reservando…" : "Reservar mi espacio"}
      </button>
    </form>
  );
}
