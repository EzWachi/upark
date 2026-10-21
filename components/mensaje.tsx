/** Resultado de una acción de formulario: error, aviso o confirmación. */
export function Mensaje({ resultado }: { resultado: { error?: string; aviso?: string; ok?: string } | null }) {
  if (!resultado) return null;
  if (resultado.error) return <p role="alert" className="text-sm text-red-600">{resultado.error}</p>;
  if (resultado.aviso) return <p role="status" className="text-sm text-amber-600">{resultado.aviso}</p>;
  if (resultado.ok) return <p role="status" className="text-sm text-green-700 dark:text-green-500">{resultado.ok}</p>;
  return null;
}

export const estiloInput = "mt-1 w-full rounded border border-neutral-300 bg-transparent px-3 py-2 dark:border-neutral-700";
export const estiloBoton =
  "rounded bg-neutral-900 px-4 py-2 text-white disabled:opacity-50 dark:bg-white dark:text-neutral-900";
