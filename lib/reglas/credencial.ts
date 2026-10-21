/**
 * RN-13. Lo que lleva el QR: un prefijo que dice qué es y el token opaco, sin
 * datos personales. El prefijo deja al guarda leer con el mismo escáner la
 * tarjeta de un miembro (M) o el QR de una reserva (R).
 */
const PREFIJO = "UPARK";

export const contenidoQr = (tipo: "M" | "R", token: string) => `${PREFIJO}:${tipo}:${token}`;

export type Credencial =
  | { tipo: "miembro"; token: string }
  | { tipo: "reserva"; token: string }
  | { tipo: "codigo"; codigo: string };

/** Interpreta lo que leyó la cámara o lo que digitó el guarda (CU-12, 1a). */
export function interpretarCredencial(texto: string): Credencial | null {
  const limpio = texto.trim();
  const qr = /^UPARK:([MR]):([A-Za-z0-9_-]{16,})$/.exec(limpio);
  if (qr) return qr[1] === "M" ? { tipo: "miembro", token: qr[2] } : { tipo: "reserva", token: qr[2] };

  // Código corto: se acepta en minúsculas y con espacios o guiones de por medio.
  const codigo = limpio.toUpperCase().replace(/[\s-]/g, "");
  if (/^[2-9A-HJKMNP-Z]{6}$/.test(codigo)) return { tipo: "codigo", codigo };
  return null;
}
