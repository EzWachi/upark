"use client";

import { useState } from "react";
import { useFormulario } from "@/components/formulario";
import { Mensaje, estiloBoton, estiloInput } from "@/components/mensaje";
import { crearInvitacion } from "./actions";

/** CU-25 (individual) y CU-26 (evento). */
export function FormularioInvitacion({ zonas }: { zonas: { id: string; nombre: string }[] }) {
  const { resultado, alEnviar, pendiente } = useFormulario(crearInvitacion);
  // Controlado para mostrar los campos de cada tipo; por eso el envío va por onSubmit.
  const [tipo, setTipo] = useState<"individual" | "evento">("individual");

  if (zonas.length === 0) {
    return <p className="text-neutral-500">No hay zonas reservables. Un super admin tiene que marcar alguna como reservable.</p>;
  }

  return (
    <form method="post" onSubmit={alEnviar} className="space-y-4">
      <input type="hidden" name="tipo" value={tipo} />
      <div className="flex gap-4 text-sm">
        <label className="flex items-center gap-2">
          <input type="radio" checked={tipo === "individual"} onChange={() => setTipo("individual")} />
          Individual (una persona)
        </label>
        <label className="flex items-center gap-2">
          <input type="radio" checked={tipo === "evento"} onChange={() => setTipo("evento")} />
          Evento (varios cupos)
        </label>
      </div>

      <label className="block">
        <span className="text-sm">{tipo === "evento" ? "Nombre del evento" : "Motivo de la visita"}</span>
        <input name="motivo" required maxLength={120} className={estiloInput} />
      </label>

      <div className="grid gap-3 sm:grid-cols-3">
        <label className="block">
          <span className="text-sm">Fecha</span>
          <input name="fecha" type="date" required className={estiloInput} />
        </label>
        <label className="block">
          <span className="text-sm">Desde</span>
          <input name="hora_inicio" type="time" required className={estiloInput} />
        </label>
        <label className="block">
          <span className="text-sm">Hasta</span>
          <input name="hora_fin" type="time" required className={estiloInput} />
        </label>
      </div>

      <label className="block">
        <span className="text-sm">Zona</span>
        <select name="zona_id" required className={estiloInput}>
          {zonas.map((z) => (
            <option key={z.id} value={z.id}>
              {z.nombre}
            </option>
          ))}
        </select>
      </label>

      {tipo === "evento" ? (
        <div className="grid gap-3 sm:grid-cols-3">
          <label className="block">
            <span className="text-sm">Cupos</span>
            <input name="cupos" type="number" min={1} max={500} required className={estiloInput} />
          </label>
          <label className="block">
            <span className="text-sm">Inscripción hasta (fecha)</span>
            <input name="inscripcion_fecha" type="date" required className={estiloInput} />
          </label>
          <label className="block">
            <span className="text-sm">Hora</span>
            <input name="inscripcion_hora" type="time" required className={estiloInput} />
          </label>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block">
            <span className="text-sm">Nombre del invitado (opcional)</span>
            <input name="nombre_invitado" maxLength={100} className={estiloInput} />
          </label>
          <label className="block">
            <span className="text-sm">Correo del invitado (opcional)</span>
            <input name="correo_invitado" type="email" className={estiloInput} />
          </label>
        </div>
      )}

      <p className="text-sm text-neutral-500">
        {tipo === "evento"
          ? "Se apartan los cupos en la franja y obtienes un enlace para compartir."
          : "Se aparta un cupo. Si indicas el correo, le enviamos el enlace; si no, cópialo y compártelo tú. Vence al inicio de la franja."}
      </p>

      <Mensaje resultado={resultado} />
      <button disabled={pendiente} className={estiloBoton}>
        {pendiente ? "Creando…" : "Crear invitación"}
      </button>
    </form>
  );
}

/** Enlace de la invitación con botón para copiarlo (CU-25, paso 6). */
export function EnlaceCopiable({ url }: { url: string }) {
  const [copiado, setCopiado] = useState(false);
  return (
    <div className="flex flex-wrap gap-2">
      <input readOnly value={url} aria-label="Enlace de la invitación" className={`${estiloInput} mt-0 flex-1 text-sm`} onFocus={(e) => e.target.select()} />
      <button
        type="button"
        className="rounded border border-neutral-300 px-3 py-1 text-sm dark:border-neutral-700"
        onClick={async () => {
          await navigator.clipboard.writeText(url);
          setCopiado(true);
        }}
      >
        {copiado ? "Copiado" : "Copiar"}
      </button>
    </div>
  );
}
