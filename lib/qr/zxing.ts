/**
 * Decodificador de QR (ZXing en WebAssembly), tomado del lector de carnets de
 * Isaseca. Se eligió ZXing sobre `jsqr` porque lee mejor códigos torcidos o
 * con reflejos, que es el caso de una pantalla de teléfono frente a la cámara.
 */

import type { ReadResult } from "zxing-wasm/reader";

/**
 * El `.wasm` sale del propio sitio y no del CDN que el paquete usa por defecto:
 * así el lector no depende de un tercero ni le manda pedidos. Lo copia
 * `scripts/copiar-wasm-qr.mjs` antes de `dev` y `build`.
 */
const RUTA_WASM = "/zxing_reader.wasm";

/** Una sola carga compartida, aunque dos lecturas la pidan casi juntas. */
let modulo: Promise<typeof import("zxing-wasm/reader")> | null = null;

function cargar() {
  modulo ??= (async () => {
    const zxing = await import("zxing-wasm/reader");
    zxing.prepareZXingModule({ overrides: { locateFile: () => RUTA_WASM }, fireImmediately: true });
    return zxing;
  })();
  return modulo;
}

/** Empieza a bajar el `.wasm` sin esperar; si falla, la primera lectura lo reintenta. */
export function precalentarLectorQr(): void {
  void cargar().catch(() => {});
}

/** El texto del primer QR de la imagen, o `null` si no hay ninguno. */
export async function leerQr(imagen: ImageData): Promise<string | null> {
  const { readBarcodes } = await cargar();
  const encontrados: ReadResult[] = await readBarcodes(imagen, {
    formats: ["QRCode"],
    tryHarder: true,
    tryRotate: true,
    tryInvert: true,
    maxNumberOfSymbols: 1,
  });
  return encontrados.find((codigo) => codigo.text)?.text ?? null;
}
