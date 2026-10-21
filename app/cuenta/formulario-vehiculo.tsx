"use client";

import { useState } from "react";
import { useFormulario, type Accion } from "@/components/formulario";
import { Mensaje, estiloBoton, estiloInput } from "@/components/mensaje";

const TAMANOS = [
  ["moto", "Moto"],
  ["sedan", "Sedán / compacto"],
  ["suv", "SUV"],
  ["grande", "Grande (4x4, pickup)"],
] as const;

type Valores = { origen: string; pais: string | null; placa: string; tamano: string; descripcion: string | null };

/** CU-04. Sin `valores` agrega; con `valores` edita. */
export function FormularioVehiculo({ accion, valores }: { accion: Accion; valores?: Valores }) {
  const { resultado, alEnviar, pendiente } = useFormulario(accion);
  // Controlado para mostrar u ocultar el país; por eso el envío va por onSubmit.
  const [origen, setOrigen] = useState(valores?.origen ?? "nacional");

  return (
    <form method="post" onSubmit={alEnviar} className="space-y-3">
      <div className="flex flex-wrap gap-4 text-sm">
        {(["nacional", "extranjera"] as const).map((o) => (
          <label key={o} className="flex items-center gap-2">
            <input type="radio" name="origen" value={o} checked={origen === o} onChange={() => setOrigen(o)} />
            Placa {o}
          </label>
        ))}
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block">
          <span className="text-sm">Placa</span>
          <input name="placa" required defaultValue={valores?.placa} autoCapitalize="characters" className={`${estiloInput} uppercase`} />
        </label>
        {origen === "extranjera" && (
          <label className="block">
            <span className="text-sm">País</span>
            <input name="pais" required defaultValue={valores?.pais ?? ""} className={estiloInput} />
          </label>
        )}
        <label className="block">
          <span className="text-sm">Tamaño</span>
          <select name="tamano" defaultValue={valores?.tamano ?? "sedan"} className={estiloInput}>
            {TAMANOS.map(([v, t]) => (
              <option key={v} value={v}>
                {t}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="text-sm">Descripción (opcional)</span>
          <input name="descripcion" maxLength={80} placeholder="Marca, modelo, color" defaultValue={valores?.descripcion ?? ""} className={estiloInput} />
        </label>
      </div>
      <Mensaje resultado={resultado} />
      <button disabled={pendiente} className={estiloBoton}>
        {pendiente ? "Guardando…" : valores ? "Guardar" : "Agregar vehículo"}
      </button>
    </form>
  );
}
