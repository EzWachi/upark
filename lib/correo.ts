/**
 * CU-38. Envío de correos.
 *
 * ponytail: por ahora solo imprime en la consola del servidor. Cuando haya
 * cuenta de Resend con dominio verificado, este es el único lugar que cambia:
 * llamar a `resend.emails.send` y registrar el fallo (CU-38, 3a).
 */
export async function enviarCorreo(correo: { para: string; asunto: string; texto: string }): Promise<void> {
  console.log(
    [
      "",
      "──── correo (consola) ────",
      `Para:   ${correo.para}`,
      `Asunto: ${correo.asunto}`,
      "",
      correo.texto,
      "──────────────────────────",
      "",
    ].join("\n"),
  );
}

/** URL absoluta para los enlaces de los correos. */
export function urlAbsoluta(ruta: string): string {
  const base = process.env.APP_URL ?? "http://localhost:3000";
  return new URL(ruta, base).toString();
}
