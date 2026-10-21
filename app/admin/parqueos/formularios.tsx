"use client";

import { Mensaje, estiloBoton, estiloInput } from "@/components/mensaje";
import { useFormulario, type Accion } from "@/components/formulario";

const TIPOS = [
  ["estudiante", "Estudiantes"],
  ["profesor", "Profesores"],
  ["funcionario", "Funcionarios"],
  ["visita", "Visitas"],
] as const;

const TAMANOS = [
  ["moto", "Moto"],
  ["sedan", "Sedán / compacto"],
  ["suv", "SUV"],
  ["grande", "Grande (4x4, pickup)"],
] as const;

export function FormularioParqueo({
  accion,
  valores,
  boton,
}: {
  accion: Accion;
  valores?: { nombre: string; descripcion: string | null };
  boton: string;
}) {
  const { resultado, enviado, enviar, pendiente } = useFormulario(accion);
  const texto = (campo: "nombre" | "descripcion") =>
    enviado ? String(enviado.get(campo) ?? "") : (valores?.[campo] ?? "");
  return (
    <form action={enviar} className="space-y-3">
      <label className="block">
        <span className="text-sm">Nombre</span>
        <input name="nombre" required maxLength={60} defaultValue={texto("nombre")} className={estiloInput} />
      </label>
      <label className="block">
        <span className="text-sm">Descripción o ubicación (opcional)</span>
        <input name="descripcion" maxLength={200} defaultValue={texto("descripcion")} className={estiloInput} />
      </label>
      <Mensaje resultado={resultado} />
      <button disabled={pendiente} className={estiloBoton}>
        {pendiente ? "Guardando…" : boton}
      </button>
    </form>
  );
}

export type ValoresZona = {
  nombre: string;
  tipos_permitidos: string[];
  preferencial: boolean;
  reservable: boolean;
  activa: boolean;
  cupos_moto: number;
  cupos_sedan: number;
  cupos_suv: number;
  cupos_grande: number;
};

/** CU-31. Sin `valores` crea una zona; con `valores` la edita y muestra "activa". */
export function FormularioZona({ accion, valores }: { accion: Accion; valores?: ValoresZona }) {
  const { resultado, enviado, enviar, pendiente } = useFormulario(accion);
  // Tras un error se muestra lo enviado; si no, lo guardado (o vacío al crear).
  const marcado = (campo: "preferencial" | "reservable" | "activa") =>
    enviado ? enviado.has(campo) : (valores?.[campo] ?? false);
  const tipoMarcado = (tipo: string) =>
    enviado ? enviado.getAll("tipos_permitidos").includes(tipo) : (valores?.tipos_permitidos.includes(tipo) ?? false);
  const cupos = (tamano: string) =>
    enviado ? String(enviado.get(`cupos_${tamano}`)) : String(valores?.[`cupos_${tamano}` as keyof ValoresZona] ?? 0);

  return (
    <form action={enviar} className="space-y-3">
      <label className="block">
        <span className="text-sm">Nombre de la zona</span>
        <input
          name="nombre"
          required
          maxLength={60}
          defaultValue={enviado ? String(enviado.get("nombre") ?? "") : valores?.nombre}
          className={estiloInput}
        />
      </label>

      <fieldset>
        <legend className="text-sm">Quién puede usarla</legend>
        <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1">
          {TIPOS.map(([valor, etiqueta]) => (
            <label key={valor} className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                name="tipos_permitidos"
                value={valor}
                defaultChecked={tipoMarcado(valor)}
              />
              {etiqueta}
            </label>
          ))}
        </div>
      </fieldset>

      <fieldset>
        <legend className="text-sm">Cupos por tamaño</legend>
        <div className="mt-1 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {TAMANOS.map(([valor, etiqueta]) => (
            <label key={valor} className="block text-sm">
              {etiqueta}
              <input
                name={`cupos_${valor}`}
                type="number"
                min={0}
                max={999}
                step={1}
                required
                defaultValue={cupos(valor)}
                className={estiloInput}
              />
            </label>
          ))}
        </div>
      </fieldset>

      <div className="flex flex-wrap gap-x-6 gap-y-1">
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="preferencial" defaultChecked={marcado("preferencial")} />
          Preferencial (Ley 7600)
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="reservable" defaultChecked={marcado("reservable")} />
          Reservable para invitaciones
        </label>
        {valores && (
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" name="activa" defaultChecked={marcado("activa")} />
            Activa
          </label>
        )}
      </div>

      <Mensaje resultado={resultado} />
      <button disabled={pendiente} className={estiloBoton}>
        {pendiente ? "Guardando…" : valores ? "Guardar zona" : "Agregar zona"}
      </button>
    </form>
  );
}

/** CU-30: activar o desactivar un parqueo. */
export function BotonEstado({ accion, activo }: { accion: Accion; activo: boolean }) {
  const { resultado, enviar, pendiente } = useFormulario(accion);
  return (
    <form action={enviar} className="space-y-2">
      <button
        disabled={pendiente}
        className="rounded border border-neutral-300 px-4 py-2 text-sm disabled:opacity-50 dark:border-neutral-700"
      >
        {activo ? "Desactivar parqueo" : "Activar parqueo"}
      </button>
      <Mensaje resultado={resultado} />
    </form>
  );
}
