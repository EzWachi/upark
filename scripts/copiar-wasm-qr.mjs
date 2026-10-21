// Copia el `.wasm` del lector de QR desde `node_modules` a `public/`.
//
// **Por qué no se sirve desde el CDN.** `zxing-wasm` por defecto se busca el
// binario en jsdelivr. Eso significaría que leer las tarjetas virtuales depende de
// que un tercero esté en línea, y —más importante— metería un pedido a un
// dominio ajeno que la política de privacidad no declara. Sirviéndolo desde
// `public/` no sale nada del sitio.
//
// **Por qué se copia en vez de commitearlo.** Es un binario de 0,9 MB que
// pertenece a una versión concreta del paquete. Copiarlo en cada `build` y en
// cada `dev` garantiza que lo servido y lo instalado sean la misma versión;
// commitearlo abre la puerta a que `npm update` los desincronice sin que nada
// avise, que es la clase de desfase que no se nota hasta que falla en
// producción.
//
// Por eso `public/zxing_reader.wasm` va en `.gitignore`.
import { copyFileSync, mkdirSync, statSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";

const require = createRequire(import.meta.url);

// Se resuelve por el subpath que el paquete exporta, no con una ruta escrita a
// mano hacia `dist/`: si `zxing-wasm` cambia su estructura interna, esto falla
// acá —en el build— y no en el navegador de alguien.
const origen = require.resolve("zxing-wasm/reader/zxing_reader.wasm");

const destino = join(process.cwd(), "public", "zxing_reader.wasm");

try {
  mkdirSync(dirname(destino), { recursive: true });
  copyFileSync(origen, destino);
  const mb = (statSync(destino).size / 1048576).toFixed(2);
  console.log(`✓ public/zxing_reader.wasm (${mb} MB)`);
} catch (error) {
  console.error(
    `No se pudo copiar el wasm del lector de QR desde ${origen}.\n` +
      "Sin él, leer las tarjetas virtuales no funciona. ¿Se instaló zxing-wasm?"
  );
  throw error;
}
