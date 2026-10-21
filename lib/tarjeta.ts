import "server-only";
import { randomBytes } from "node:crypto";
import { generarCodigoCorto } from "@/lib/reglas/cuentas";

/**
 * RN-13: tarjeta virtual nueva (token del QR y código corto). Se usa al aprobar
 * un miembro (CU-22) y al regenerarla (CU-05, 3a).
 */
// ponytail: sin reintento si el código corto choca (1 en ~887 millones);
// si pasa, el índice único hace fallar la operación y se vuelve a intentar.
export const nuevaTarjeta = () => ({
  token_tarjeta: randomBytes(24).toString("base64url"),
  codigo_tarjeta: generarCodigoCorto(),
});
