"use client";

import { useActionState } from "react";

export type Resultado = { error?: string; aviso?: string; ok?: string } | null;
export type Accion = (prev: Resultado, form: FormData) => Promise<Resultado>;

/**
 * React limpia el formulario después de cada acción. Si hubo error, se guarda
 * lo que se envió para volver a mostrarlo y que la persona no tenga que
 * escribir todo de nuevo. Las contraseñas no se devuelven: el navegador no las
 * vuelve a llenar y está bien que así sea.
 */
export function useFormulario(accion: Accion) {
  const [estado, enviar, pendiente] = useActionState(
    async (prev: { resultado: Resultado; enviado: FormData | null } | null, form: FormData) => {
      const resultado = await accion(prev?.resultado ?? null, form);
      return { resultado, enviado: resultado?.error ? form : null };
    },
    null,
  );
  const enviado = estado?.enviado ?? null;
  return {
    resultado: estado?.resultado ?? null,
    enviado,
    enviar,
    pendiente,
    /** Valor a mostrar en un campo de texto: lo enviado si hubo error, o el inicial. */
    valor: (campo: string, inicial = "") => (enviado ? String(enviado.get(campo) ?? "") : inicial),
  };
}
