"use client";

import { useState } from "react";
import { BotonFila, TextoFila } from "@/components/acciones-fila";
import { estiloInput } from "@/components/mensaje";
import { anularEntrada, registrarSalida } from "./actions";

export type VehiculoDentro = {
  id: string;
  placa: string;
  nombre: string;
  tipo: string;
  zona: string;
  hora: string;
  avisos: string[];
};

/** CU-16 (lista y filtro), CU-14 (salida) y CU-18 (anular). */
export function Dentro({ vehiculos, zonas }: { vehiculos: VehiculoDentro[]; zonas: string[] }) {
  const [texto, setTexto] = useState("");
  const [zona, setZona] = useState("");
  const buscado = texto.toUpperCase().replace(/[\s-]/g, "");
  const visibles = vehiculos.filter((v) => (!zona || v.zona === zona) && v.placa.includes(buscado));

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-3">
        <input
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          placeholder="Buscar placa"
          aria-label="Buscar placa"
          className={`${estiloInput} mt-0 max-w-48 uppercase`}
        />
        <select value={zona} onChange={(e) => setZona(e.target.value)} aria-label="Zona" className={`${estiloInput} mt-0 max-w-56`}>
          <option value="">Todas las zonas</option>
          {zonas.map((z) => (
            <option key={z} value={z}>
              {z}
            </option>
          ))}
        </select>
      </div>

      {visibles.length === 0 ? (
        <p className="text-neutral-500">{vehiculos.length === 0 ? "No hay vehículos dentro." : "Ninguno coincide."}</p>
      ) : (
        <ul className="divide-y divide-neutral-200 rounded-lg border border-neutral-200 dark:divide-neutral-800 dark:border-neutral-800">
          {visibles.map((v) => (
            <li key={v.id} className="flex flex-wrap items-start justify-between gap-3 p-3">
              <div>
                <p className="font-semibold tracking-wide">{v.placa}</p>
                <p className="text-sm text-neutral-500">
                  {v.nombre} · {v.tipo} · {v.zona} · {v.hora}
                </p>
                {v.avisos.length > 0 && <p className="text-xs text-amber-600">{v.avisos.join(" · ")}</p>}
              </div>
              <div className="flex flex-wrap items-start gap-2">
                <BotonFila accion={registrarSalida.bind(null, v.id)} texto="Salida" />
                <TextoFila accion={anularEntrada.bind(null, v.id)} nombre="motivo" placeholder="Motivo" texto="Anular" peligro />
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
