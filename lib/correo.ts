/**
 * CU-38. Envío de correos.
 *
 * Con `RESEND_API_KEY` el correo sale por la API de Resend. Sin ella
 * (desarrollo, CI) se imprime en la consola del servidor.
 *
 * Nunca lanza: un correo que no sale no debe deshacer el registro, la
 * invitación o la reserva que lo disparó. Devuelve si se entregó al servicio
 * y deja el fallo en el log del servidor (CU-38, 3a).
 */

export type Correo = { para: string; asunto: string; texto: string };

const API_RESEND = "https://api.resend.com/emails";

/** CU-38, 3a: hasta 3 reintentos con espera creciente (0,5 s, 1 s, 2 s). */
const REINTENTOS = 3;
const ESPERA_INICIAL_MS = 500;

/** Remitente de prueba de Resend: sirve sin dominio verificado, solo hacia el dueño de la cuenta. */
const REMITENTE_POR_DEFECTO = "UPark <onboarding@resend.dev>";

export async function enviarCorreo(correo: Correo): Promise<boolean> {
  const clave = process.env.RESEND_API_KEY;
  if (!clave) {
    imprimirEnConsola(correo);
    return true;
  }

  // La misma clave en todos los intentos: si un intento llegó a Resend pero la
  // respuesta se perdió, el reintento no manda el correo dos veces.
  const idempotencia = crypto.randomUUID();
  let motivo = "";

  for (let intento = 0; intento <= REINTENTOS; intento++) {
    if (intento > 0) await esperar(ESPERA_INICIAL_MS * 2 ** (intento - 1));

    let respuesta: Response;
    try {
      respuesta = await fetch(API_RESEND, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${clave}`,
          "Content-Type": "application/json",
          "Idempotency-Key": idempotencia,
        },
        body: JSON.stringify({
          from: process.env.CORREO_REMITENTE || REMITENTE_POR_DEFECTO,
          to: [correo.para],
          subject: correo.asunto,
          text: correo.texto,
        }),
      });
    } catch (e) {
      motivo = `sin conexión con Resend (${e instanceof Error ? e.message : String(e)})`;
      continue;
    }

    if (respuesta.ok) return true;

    motivo = `Resend respondió ${respuesta.status}: ${await respuesta.text().catch(() => "")}`;
    // Un 4xx (remitente sin verificar, dirección inválida, clave mala) no se
    // arregla reintentando. Sí se reintenta el límite de envíos (429) y los 5xx.
    if (respuesta.status !== 429 && respuesta.status < 500) break;
  }

  console.error(`[correo] No se pudo enviar "${correo.asunto}" a ${correo.para}. ${motivo}`);
  return false;
}

function esperar(ms: number) {
  return new Promise<void>((listo) => setTimeout(listo, ms));
}

function imprimirEnConsola(correo: Correo) {
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
