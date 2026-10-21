"use client";

import { useState, useTransition } from "react";
import { useFormulario, type Resultado } from "@/components/formulario";
import { Mensaje, estiloBoton, estiloInput } from "@/components/mensaje";
import { TIPO_IDENTIFICACION, TIPO_PERSONA } from "@/lib/etiquetas";
import type { tamano_vehiculo, tipo_persona } from "@/lib/generated/prisma/enums";
import { opcionesDeZona, type ZonaConCupos } from "@/lib/reglas/acceso";
import { consultarPlaca, registrarEntrada, type ConsultaPlaca } from "./actions";

const TAMANOS: Record<tamano_vehiculo, string> = { moto: "Moto", sedan: "Sedán", suv: "SUV", grande: "Grande" };

/** CU-13. Paso 1: placa. Paso 2: persona y zona. */
export function EntradaManual({ zonas }: { zonas: ZonaConCupos[] }) {
  const [consulta, setConsulta] = useState<Extract<ConsultaPlaca, { placa: string }> | null>(null);
  const [origen, setOrigen] = useState<"nacional" | "extranjera">("nacional");
  const [pais, setPais] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [buscando, iniciar] = useTransition();
  // Cambia después de cada entrada para volver a empezar con el formulario limpio.
  const [vuelta, setVuelta] = useState(0);
  // Resultado de la última entrada, visible al volver al paso 1.
  const [ultimo, setUltimo] = useState<Resultado>(null);

  if (consulta) {
    return (
      <PersonaYZona
        key={vuelta}
        zonas={zonas}
        consulta={consulta}
        origen={origen}
        pais={pais}
        alTerminar={(r) => {
          setUltimo(r);
          setConsulta(null);
          setPais("");
          setVuelta((v) => v + 1);
        }}
      />
    );
  }

  return (
    <form
      key={vuelta}
      className="space-y-3"
      // onSubmit y no action: con action React limpia el formulario y los
      // radios controlados de origen quedan desmarcados.
      method="post"
      onSubmit={(e) => {
        e.preventDefault();
        const placa = String(new FormData(e.currentTarget).get("placa"));
        iniciar(async () => {
          setError(null);
          setUltimo(null);
          const r = await consultarPlaca(origen, placa);
          if ("error" in r) setError(r.error);
          else setConsulta(r);
        });
      }}
    >
      <div className="flex flex-wrap gap-4 text-sm">
        {(["nacional", "extranjera"] as const).map((o) => (
          <label key={o} className="flex items-center gap-2">
            <input type="radio" name="origen" checked={origen === o} onChange={() => setOrigen(o)} />
            Placa {o}
          </label>
        ))}
      </div>
      <div className="flex gap-3">
        <label className="block flex-1">
          <span className="text-sm">Placa</span>
          <input name="placa" required autoCapitalize="characters" autoComplete="off" className={`${estiloInput} uppercase`} />
        </label>
        {origen === "extranjera" && (
          <label className="block flex-1">
            <span className="text-sm">País</span>
            <input value={pais} onChange={(e) => setPais(e.target.value)} required className={estiloInput} />
          </label>
        )}
      </div>
      {error && <Mensaje resultado={{ error }} />}
      <Mensaje resultado={ultimo} />
      <button disabled={buscando} className={estiloBoton}>
        {buscando ? "Buscando…" : "Continuar"}
      </button>
    </form>
  );
}

function PersonaYZona({
  zonas,
  consulta,
  origen,
  pais,
  alTerminar,
}: {
  zonas: ZonaConCupos[];
  consulta: Extract<ConsultaPlaca, { placa: string }>;
  origen: string;
  pais: string;
  alTerminar: (r: Resultado) => void;
}) {
  const { resultado, alEnviar, pendiente, valor } = useFormulario(async (prev, form) => {
    const r = await registrarEntrada(prev, form);
    if (r && !r.error) alTerminar(r);
    return r;
  });
  // "" = visita sin reserva; si la placa es de miembros, el primero por defecto.
  const [usuarioId, setUsuarioId] = useState(consulta.miembros[0]?.id ?? "");
  const [tamano, setTamano] = useState<tamano_vehiculo>("sedan");
  const [preferencial, setPreferencial] = useState(false);

  const miembro = consulta.miembros.find((m) => m.id === usuarioId);
  const persona = miembro
    ? { tipo: miembro.tipo as tipo_persona, preferencial: miembro.preferencial }
    : { tipo: "visita" as const, preferencial };
  const tamanoEfectivo = (miembro?.tamano as tamano_vehiculo | undefined) ?? tamano;
  const { opciones, sugerida } = opcionesDeZona(zonas, persona, tamanoEfectivo);

  return (
    <form method="post" onSubmit={alEnviar} className="space-y-4">
      <input type="hidden" name="origen" value={origen} />
      <input type="hidden" name="pais" value={pais} />
      <input type="hidden" name="placa" value={consulta.placa} />
      <input type="hidden" name="usuario_id" value={usuarioId} />

      <p className="text-lg font-semibold tracking-wide">{consulta.placa}</p>

      {consulta.miembros.length > 0 && (
        <fieldset className="space-y-1">
          <legend className="text-sm">¿Quién conduce?</legend>
          {consulta.miembros.map((m) => (
            <label key={m.id} className="flex items-center gap-2 text-sm">
              <input type="radio" checked={usuarioId === m.id} onChange={() => setUsuarioId(m.id)} />
              {m.nombre} · {TIPO_PERSONA[m.tipo as tipo_persona]} · {TAMANOS[m.tamano as tamano_vehiculo]}
              {m.preferencial && " · preferencial"}
            </label>
          ))}
          <label className="flex items-center gap-2 text-sm">
            <input type="radio" checked={usuarioId === ""} onChange={() => setUsuarioId("")} />
            Otra persona (visita sin reserva)
          </label>
        </fieldset>
      )}

      {!miembro && (
        <div className="space-y-3">
          <label className="block">
            <span className="text-sm">Nombre</span>
            <input name="nombre" required defaultValue={valor("nombre")} className={estiloInput} />
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
          <div className="flex flex-wrap items-end gap-4">
            <label className="block">
              <span className="text-sm">Tamaño</span>
              <select
                name="tamano"
                value={tamano}
                onChange={(e) => setTamano(e.target.value as tamano_vehiculo)}
                className={estiloInput}
              >
                {Object.entries(TAMANOS).map(([v, t]) => (
                  <option key={v} value={v}>
                    {t}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex items-center gap-2 pb-2 text-sm">
              <input type="checkbox" checked={preferencial} onChange={(e) => setPreferencial(e.target.checked)} />
              Requiere espacio preferencial
            </label>
          </div>
        </div>
      )}

      <label className="block">
        <span className="text-sm">Zona</span>
        {/* key: al cambiar la persona o el tamaño, vuelve a la zona sugerida. */}
        <select key={`${usuarioId}-${tamanoEfectivo}-${preferencial}`} name="zona_id" defaultValue={sugerida ?? opciones[0]?.id} className={estiloInput}>
          {opciones.map((o) => (
            <option key={o.id} value={o.id}>
              {o.nombre} ·{" "}
              {!o.admite ? "no le corresponde" : o.tamanoCupo ? `${o.libres} libres (${TAMANOS[o.tamanoCupo]})` : "llena"}
            </option>
          ))}
        </select>
        {!sugerida && (
          <span className="text-sm text-amber-600">
            No hay zona con cupo para esta persona. Si la dejas pasar, quedará en sobrecupo.
          </span>
        )}
      </label>

      <Mensaje resultado={resultado} />
      <div className="flex gap-3">
        <button disabled={pendiente} className={estiloBoton}>
          {pendiente ? "Registrando…" : "Registrar entrada"}
        </button>
        <button type="button" onClick={() => alTerminar(null)} className="text-sm underline">
          Cancelar
        </button>
      </div>
    </form>
  );
}
