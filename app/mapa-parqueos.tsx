import type { NivelOcupacion } from "@/lib/reglas/disponibilidad";

export type EstadoMapa = { nivel: NivelOcupacion | "sin_datos"; libres: number; resumen: string };

export const CODIGOS = ["P1", "P2", "P3", "P4", "P5"] as const;
export type Codigo = (typeof CODIGOS)[number];

/** Colores de semáforo; los tokens viven en globals.css. */
export const COLOR: Record<EstadoMapa["nivel"], { relleno: string; tinta: string; texto: string; etiqueta: string }> = {
  libre: { relleno: "var(--libre)", tinta: "var(--libre-tinta)", texto: "var(--libre-texto)", etiqueta: "Hay espacio" },
  llenandose: {
    relleno: "var(--llenandose)",
    tinta: "var(--llenandose-tinta)",
    texto: "var(--llenandose-texto)",
    etiqueta: "Llenándose",
  },
  lleno: { relleno: "var(--lleno)", tinta: "var(--lleno-tinta)", texto: "var(--lleno-texto)", etiqueta: "Lleno" },
  sin_datos: {
    relleno: "var(--sin-datos)",
    tinta: "var(--sin-datos-tinta)",
    texto: "var(--sin-datos-texto)",
    etiqueta: "Sin datos",
  },
};

// Distribución del mapa oficial de ULACIT (norte arriba), simplificada.
// Coordenadas en un lienzo de 1000 × 750.
const FORMAS: Record<Codigo, { forma: React.ReactNode; insignia: [number, number]; guia?: string }> = {
  P5: { forma: <polygon points="96,226 380,262 380,380 223,395 78,340" />, insignia: [232, 308] },
  P4: { forma: <polygon points="469,309 500,309 500,316 574,342 562,357 469,334" />, insignia: [520, 262], guia: "M520 296 L520 318" },
  P2: {
    forma: <path d="M608 352 L676 364 L670 458 L640 458 C612 462 594 480 588 506 L562 506 C566 470 588 442 608 420 Z" />,
    insignia: [636, 410],
  },
  P3: { forma: <ellipse cx="624" cy="522" rx="40" ry="52" />, insignia: [624, 522] },
  P1: { forma: <polygon points="672,612 742,625 806,680 790,738 740,735 672,672" />, insignia: [738, 676] },
};

export function MapaParqueos({ estados }: { estados: Record<Codigo, EstadoMapa> }) {
  return (
    <svg
      viewBox="40 100 860 660"
      className="block h-auto w-full rounded-2xl bg-[var(--mapa-suelo)]"
      role="group"
      aria-label="Mapa de los parqueos de ULACIT"
    >
      <g fill="none" stroke="var(--mapa-calle)" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <path d="M0 211 C200 205 330 250 383 262 S560 232 680 210 L1000 140" strokeWidth="20" />
        <path d="M383 0 L383 262 L372 760" strokeWidth="16" />
        <path d="M55 331 C150 380 280 400 380 380" strokeWidth="12" />
        <path d="M223 397 L150 560 L25 760" strokeWidth="12" />
        <path d="M640 352 C520 330 455 410 465 500 C472 560 540 590 640 575" strokeWidth="14" />
        <path d="M385 428 L466 452 M380 533 L464 540 M500 578 L518 760 M668 464 L1000 578" strokeWidth="12" />
        <ellipse cx="624" cy="522" rx="54" ry="66" strokeWidth="10" />
        <path d="M690 230 C780 300 860 420 1000 530" strokeWidth="24" />
        <path d="M800 100 C720 220 690 320 680 450 L663 760" strokeWidth="32" />
      </g>

      <g fill="var(--mapa-edificio)" aria-hidden>
        <rect x="572" y="132" width="105" height="48" rx="3" />
        <polygon points="785,575 820,550 850,590 815,615" />
        <polygon points="0,370 60,365 110,400 175,420 170,490 120,560 50,570 0,540" />
        <rect x="212" y="430" width="85" height="90" rx="3" />
        <rect x="312" y="415" width="60" height="85" rx="3" />
      </g>
      <g fill="none" stroke="var(--mapa-ulacit)" aria-hidden>
        <path d="M500 532 C486 470 498 410 548 378 L604 368" strokeWidth="34" />
        <path d="M548 402 L590 448" strokeWidth="26" />
      </g>

      <g fill="var(--mapa-rotulo)" fontSize="17" fontWeight="600" letterSpacing="0.04em" aria-hidden>
        <text x="380" y="400" fontSize="28" fontWeight="700" fill="var(--mapa-ulacit)" letterSpacing="0.02em">
          ULACIT
        </text>
        <text x="572" y="122">EDIFICIO LA REPÚBLICA</text>
        <text x="60" y="455">MUSEO DE</text>
        <text x="60" y="475">LOS NIÑOS</text>
        <text x="215" y="545">TERMINAL</text>
        <text x="215" y="565">CARIBEÑOS</text>
        <text x="700" y="535">MINISTERIO</text>
        <text x="700" y="555">DE TRABAJO</text>
        <text x="420" y="580">Clínica</text>
      </g>
      <g fontSize="16" fontWeight="700" letterSpacing="0.06em" aria-hidden>
        <rect x="728" y="150" width="98" height="30" rx="4" fill="var(--background)" stroke="var(--mapa-rotulo)" />
        <text x="777" y="171" textAnchor="middle" fill="var(--foreground)">
          RUTA 32
        </text>
        <rect x="806" y="388" width="88" height="30" rx="4" fill="var(--background)" stroke="var(--mapa-rotulo)" />
        <text x="850" y="409" textAnchor="middle" fill="var(--foreground)">
          RUTA 108
        </text>
      </g>

      {CODIGOS.map((codigo) => {
        const { forma, insignia, guia } = FORMAS[codigo];
        const estado = estados[codigo];
        const color = COLOR[estado.nivel];
        const [x, y] = insignia;
        return (
          <a key={codigo} href={`#${codigo.toLowerCase()}`} className="zona-mapa" aria-label={`${codigo}: ${estado.resumen}`}>
            <g className="forma" style={{ fill: color.relleno }}>
              {forma}
            </g>
            {guia && <path d={guia} stroke={color.relleno} strokeWidth="4" strokeLinecap="round" />}
            <g transform={`translate(${x} ${y})`} className="insignia">
              <rect x="-44" y="-34" width="88" height="68" rx="14" style={{ fill: color.relleno }} stroke="var(--mapa-suelo)" strokeWidth="4" />
              <text y="-8" textAnchor="middle" fontSize="20" fontWeight="600" style={{ fill: color.tinta }} opacity="0.85">
                {codigo}
              </text>
              <text y="24" textAnchor="middle" fontSize="32" fontWeight="700" style={{ fill: color.tinta }} className="tabular-nums">
                {estado.nivel === "sin_datos" ? "—" : estado.libres}
              </text>
            </g>
          </a>
        );
      })}
    </svg>
  );
}
