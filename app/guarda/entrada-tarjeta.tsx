"use client";

import { useState, useTransition } from "react";
import { EscanerQR } from "@/components/escaner-qr";
import { useFormulario, type Resultado } from "@/components/formulario";
import { Mensaje, estiloBoton, estiloInput } from "@/components/mensaje";
import { TIPO_PERSONA } from "@/lib/etiquetas";
import type { tamano_vehiculo, tipo_persona } from "@/lib/generated/prisma/enums";
import { opcionesDeZona, type ZonaConCupos } from "@/lib/reglas/acceso";
import { identificarTarjeta, registrarEntradaTarjeta, type ConsultaTarjeta } from "./actions";

const TAMANOS: Record<tamano_vehiculo, string> = { moto: "Moto", sedan: "Sedán", suv: "SUV", grande: "Grande" };
type Miembro = Extract<ConsultaTarjeta, { nombre: string }>;

/** CU-12 para miembros: QR con la cámara o código corto (1a). */
export function EntradaTarjeta({ zonas }: { zonas: ZonaConCupos[] }) {
  const [leido, setLeido] = useState<{ texto: string; miembro: Miembro } | null>(null);
  const [camara, setCamara] = useState(false);
  const [mensaje, setMensaje] = useState<Resultado>(null);
  const [buscando, iniciar] = useTransition();

  const identificar = (texto: string) =>
    new Promise<void>((listo) =>
      iniciar(async () => {
        setMensaje(null);
        const r = await identificarTarjeta(texto);
        if ("error" in r) setMensaje({ error: r.error });
        else {
          setLeido({ texto, miembro: r });
          setCamara(false);
        }
        listo();
      }),
    );

  if (leido) {
    return (
      <VehiculoYZona
        zonas={zonas}
        texto={leido.texto}
        miembro={leido.miembro}
        alTerminar={(r) => {
          setMensaje(r);
          setLeido(null);
        }}
      />
    );
  }

  return (
    <div className="space-y-3">
      {camara ? (
        <div className="space-y-2">
          <EscanerQR onLeer={identificar} />
          <button type="button" onClick={() => setCamara(false)} className="text-sm underline">
            Cerrar cámara
          </button>
        </div>
      ) : (
        <button type="button" onClick={() => setCamara(true)} className={estiloBoton}>
          Escanear QR
        </button>
      )}
      <form
        className="flex flex-wrap items-end gap-3"
        method="post"
        onSubmit={(e) => {
          e.preventDefault();
          void identificar(String(new FormData(e.currentTarget).get("codigo")));
        }}
      >
        <label className="block">
          <span className="text-sm">o digita el código</span>
          <input name="codigo" required maxLength={8} autoComplete="off" className={`${estiloInput} w-40 uppercase tracking-widest`} />
        </label>
        <button disabled={buscando} className="rounded border border-neutral-300 px-4 py-2 text-sm disabled:opacity-50 dark:border-neutral-700">
          {buscando ? "Buscando…" : "Buscar"}
        </button>
      </form>
      <Mensaje resultado={mensaje} />
    </div>
  );
}

function VehiculoYZona({
  zonas,
  texto,
  miembro,
  alTerminar,
}: {
  zonas: ZonaConCupos[];
  texto: string;
  miembro: Miembro;
  alTerminar: (r: Resultado) => void;
}) {
  const { resultado, alEnviar, pendiente } = useFormulario(async (prev, form) => {
    const r = await registrarEntradaTarjeta(texto, prev, form);
    if (r && !r.error) alTerminar(r);
    return r;
  });
  const [placa, setPlaca] = useState(miembro.vehiculos[0].placa);
  const vehiculo = miembro.vehiculos.find((v) => v.placa === placa) ?? miembro.vehiculos[0];
  const { opciones, sugerida } = opcionesDeZona(
    zonas,
    { tipo: miembro.tipo as tipo_persona, preferencial: miembro.preferencial },
    vehiculo.tamano as tamano_vehiculo,
  );

  return (
    <form method="post" onSubmit={alEnviar} className="space-y-4">
      <div>
        <p className="text-lg font-semibold">{miembro.nombre}</p>
        <p className="text-sm text-neutral-500">
          {TIPO_PERSONA[miembro.tipo as tipo_persona]}
          {miembro.preferencial && " · preferencial"}
        </p>
      </div>

      <fieldset className="space-y-1">
        <legend className="text-sm">¿Con qué vehículo llegó?</legend>
        {miembro.vehiculos.map((v) => (
          <label key={v.placa} className="flex items-center gap-2 text-sm">
            <input type="radio" name="placa" value={v.placa} checked={placa === v.placa} onChange={() => setPlaca(v.placa)} />
            <span className="font-semibold tracking-wide">{v.placa}</span> · {TAMANOS[v.tamano as tamano_vehiculo]}
            {v.descripcion && ` · ${v.descripcion}`}
          </label>
        ))}
        <p className="text-xs text-neutral-500">Si llegó en otro vehículo, cancela y usa la entrada manual (RN-14).</p>
      </fieldset>

      <label className="block">
        <span className="text-sm">Zona</span>
        <select key={placa} name="zona_id" defaultValue={sugerida ?? opciones[0]?.id} className={estiloInput}>
          {opciones.map((o) => (
            <option key={o.id} value={o.id}>
              {o.nombre} ·{" "}
              {!o.admite ? "no le corresponde" : o.tamanoCupo ? `${o.libres} libres (${TAMANOS[o.tamanoCupo]})` : "llena"}
            </option>
          ))}
        </select>
        {!sugerida && (
          <span className="text-sm text-amber-600">No hay zona con cupo para esta persona. Si la dejas pasar, quedará en sobrecupo.</span>
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
