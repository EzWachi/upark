"use client";

import { useFormulario, type Accion } from "@/components/formulario";
import { Mensaje } from "@/components/mensaje";

const estiloCampo = "rounded border border-neutral-300 bg-transparent px-2 py-1 text-sm dark:border-neutral-700";
const estiloBotonFila =
  "rounded border border-neutral-300 px-3 py-1 text-sm hover:bg-neutral-100 disabled:opacity-50 dark:border-neutral-700 dark:hover:bg-neutral-800";

/** Acciones compactas para las filas de las listas de administración. */

export function BotonFila({ accion, texto, peligro }: { accion: Accion; texto: string; peligro?: boolean }) {
  const { resultado, enviar, pendiente } = useFormulario(accion);
  return (
    <form action={enviar} className="inline-flex flex-col gap-1">
      <button disabled={pendiente} className={`${estiloBotonFila} ${peligro ? "text-red-600" : ""}`}>
        {texto}
      </button>
      <Mensaje resultado={resultado} />
    </form>
  );
}

export function SelectFila({
  accion,
  nombre,
  opciones,
  inicial,
  texto,
}: {
  accion: Accion;
  nombre: string;
  opciones: Record<string, string>;
  inicial?: string | null;
  texto: string;
}) {
  const { resultado, enviar, pendiente, valor } = useFormulario(accion);
  return (
    <form action={enviar} className="inline-flex flex-col gap-1">
      <span className="inline-flex gap-2">
        <select name={nombre} defaultValue={valor(nombre, inicial ?? "")} aria-label={texto} className={estiloCampo}>
          {Object.entries(opciones).map(([v, t]) => (
            <option key={v} value={v}>
              {t}
            </option>
          ))}
        </select>
        <button disabled={pendiente} className={estiloBotonFila}>
          {texto}
        </button>
      </span>
      <Mensaje resultado={resultado} />
    </form>
  );
}

export function TextoFila({
  accion,
  nombre,
  placeholder,
  texto,
  peligro,
}: {
  accion: Accion;
  nombre: string;
  placeholder: string;
  texto: string;
  peligro?: boolean;
}) {
  const { resultado, enviar, pendiente, valor } = useFormulario(accion);
  return (
    <form action={enviar} className="inline-flex flex-col gap-1">
      <span className="inline-flex gap-2">
        <input name={nombre} placeholder={placeholder} aria-label={placeholder} defaultValue={valor(nombre)} className={estiloCampo} />
        <button disabled={pendiente} className={`${estiloBotonFila} ${peligro ? "text-red-600" : ""}`}>
          {texto}
        </button>
      </span>
      <Mensaje resultado={resultado} />
    </form>
  );
}
