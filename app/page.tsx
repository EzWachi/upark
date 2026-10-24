import { Suspense } from "react";
import Link from "next/link";
import { connection } from "next/server";
import { disponibilidadParqueos } from "@/lib/consultas/disponibilidad";
import { libresParaPublico, nivelOcupacion, TAMANOS } from "@/lib/reglas/disponibilidad";
import { RefrescoAutomatico } from "./refresco-automatico";
import { CODIGOS, COLOR, MapaParqueos, type Codigo, type EstadoMapa } from "./mapa-parqueos";

const NOMBRE_TAMANO = { moto: "Moto", sedan: "Sedán", suv: "SUV", grande: "Grande" };
const HORA = { timeZone: "America/Costa_Rica", hour: "2-digit", minute: "2-digit" } as const;

/** "P3 · Óvalo" → "P3". Los parqueos del mapa se reconocen por el nombre. */
function codigoDe(nombre: string): Codigo | null {
  const c = nombre.match(/^P([1-5])\b/i)?.[0].toUpperCase();
  return (c as Codigo | undefined) ?? null;
}

// CU-01. Datos frescos en cada request; la página se refresca cada 30 s.
async function Parqueos() {
  await connection();
  const ahora = new Date();
  const parqueos = (await disponibilidadParqueos(ahora))
    .map((p) => {
      const libres = libresParaPublico(p.total);
      return { ...p, codigo: codigoDe(p.nombre), libres, nivel: nivelOcupacion(libres, p.capacidad) };
    })
    .sort((a, b) => (a.codigo ?? "P9").localeCompare(b.codigo ?? "P9") || a.nombre.localeCompare(b.nombre));

  const estados = Object.fromEntries(
    CODIGOS.map((c) => {
      const p = parqueos.find((x) => x.codigo === c);
      const estado: EstadoMapa = p
        ? { nivel: p.nivel, libres: p.libres, resumen: `${COLOR[p.nivel].etiqueta}, ${p.libres} espacios libres` }
        : { nivel: "sin_datos", libres: 0, resumen: "sin datos" };
      return [c, estado];
    }),
  ) as Record<Codigo, EstadoMapa>;

  const libresTotales = parqueos.reduce((acc, p) => acc + p.libres, 0);

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)] lg:items-start lg:gap-10">
      <section aria-labelledby="titulo-mapa" className="lg:sticky lg:top-6">
        <div className="mb-3 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
          <h2 id="titulo-mapa" className="text-sm font-semibold text-neutral-600 dark:text-neutral-400">
            Mapa del campus
          </h2>
          <p className="text-sm text-neutral-500">Actualizado {ahora.toLocaleTimeString("es-CR", HORA)}</p>
        </div>
        <MapaParqueos estados={estados} />
        <ul className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-sm text-neutral-600 dark:text-neutral-400" aria-label="Leyenda">
          {(["libre", "llenandose", "lleno"] as const).map((n) => (
            <li key={n} className="flex items-center gap-2">
              <span className="size-3 rounded-full" style={{ background: COLOR[n].relleno }} aria-hidden />
              {COLOR[n].etiqueta}
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="titulo-lista">
        <div className="mb-3 flex items-baseline justify-between gap-4">
          <h2 id="titulo-lista" className="text-sm font-semibold text-neutral-600 dark:text-neutral-400">
            Parqueos
          </h2>
          <p className="text-sm text-neutral-500">
            <span className="font-semibold tabular-nums text-neutral-900 dark:text-neutral-100">{libresTotales}</span> libres
            en total
          </p>
        </div>

        {parqueos.length === 0 ? (
          <p className="rounded-xl border border-dashed border-neutral-300 p-6 text-neutral-500 dark:border-neutral-700">
            Todavía no hay parqueos activos. Cuando la administración active uno, su disponibilidad aparece acá.
          </p>
        ) : (
          <ul className="divide-y divide-neutral-200 overflow-hidden rounded-2xl border border-neutral-200 dark:divide-neutral-800 dark:border-neutral-800">
            {parqueos.map((p) => {
              const color = COLOR[p.nivel];
              // El chip ya dice "P1": si el nombre es solo el código, el título es la ubicación.
              const titulo = p.codigo === p.nombre && p.descripcion ? p.descripcion : p.nombre;
              const ocupacion = p.capacidad > 0 ? Math.round(((p.capacidad - p.libres) / p.capacidad) * 100) : 100;
              return (
                <li key={p.id} id={p.codigo?.toLowerCase()} className="scroll-mt-6 p-4 target:bg-neutral-50 dark:target:bg-neutral-900">
                  <div className="flex items-center gap-3">
                    <span
                      className="grid size-11 shrink-0 place-items-center rounded-xl text-sm font-bold"
                      style={{ background: color.relleno, color: color.tinta }}
                      aria-hidden
                    >
                      {p.codigo ?? p.nombre.slice(0, 2).toUpperCase()}
                    </span>
                    <div className="min-w-0 flex-1">
                      <h3 className="font-semibold leading-snug text-balance">{titulo}</h3>
                      <p className="text-sm font-medium" style={{ color: color.texto }}>
                        {color.etiqueta}
                      </p>
                    </div>
                    <p className="text-right leading-none">
                      <span className="block text-3xl font-bold tabular-nums tracking-tight">{p.libres}</span>
                      <span className="text-xs text-neutral-500">de {p.capacidad} libres</span>
                    </p>
                  </div>

                  <div
                    className="mt-3 h-2 overflow-hidden rounded-full bg-neutral-100 dark:bg-neutral-800"
                    role="meter"
                    aria-label={`Ocupación de ${p.nombre}`}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-valuenow={ocupacion}
                  >
                    <div className="h-full rounded-full" style={{ width: `${ocupacion}%`, background: color.relleno }} />
                  </div>
                  <p className="mt-2 text-sm text-neutral-500">
                    {ocupacion} % ocupado · Fila: {p.fila}
                    {p.fila_actualizada_at && ` (${p.fila_actualizada_at.toLocaleTimeString("es-CR", HORA)})`}
                  </p>

                  <details className="group mt-2">
                    <summary className="cursor-pointer text-sm font-medium text-neutral-700 underline-offset-4 hover:underline dark:text-neutral-300">
                      Ver zonas
                    </summary>
                    <ul className="mt-2 space-y-2 text-sm">
                      {p.zonas.map((z) => {
                        const libres = libresParaPublico(z.total);
                        return (
                          <li key={z.id} className="flex items-start justify-between gap-3">
                            <span>
                              <span className="flex items-center gap-2 font-medium">
                                <span
                                  className="size-2 rounded-full"
                                  style={{ background: COLOR[nivelOcupacion(libres, z.capacidad)].relleno }}
                                  aria-hidden
                                />
                                {z.nombre}
                                {z.preferencial && <span className="font-normal text-neutral-500">· preferencial</span>}
                              </span>
                              <span className="block pl-4 text-neutral-500">
                                {TAMANOS.filter((t) => z.porTamano[t] !== 0)
                                  .map((t) => `${NOMBRE_TAMANO[t]}: ${libresParaPublico(z.porTamano[t])}`)
                                  .join(" · ") || "Sin cupos"}
                              </span>
                            </span>
                            <span className="shrink-0 tabular-nums text-neutral-600 dark:text-neutral-400">
                              {libres}/{z.capacidad}
                            </span>
                          </li>
                        );
                      })}
                    </ul>
                  </details>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}

function Cargando() {
  return (
    <div className="grid animate-pulse gap-6 lg:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)] lg:gap-10" aria-label="Cargando disponibilidad">
      <div className="aspect-[860/660] rounded-2xl bg-neutral-100 dark:bg-neutral-900" />
      <div className="h-96 rounded-2xl bg-neutral-100 dark:bg-neutral-900" />
    </div>
  );
}

export default function Inicio() {
  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 sm:py-10">
      <nav className="mb-6 flex items-center justify-between gap-4 sm:mb-8">
        <span className="text-lg font-bold tracking-tight">UPark</span>
        <Link href="/login" className="text-sm font-medium underline underline-offset-4">
          Iniciar sesión
        </Link>
      </nav>
      <header className="mb-6 sm:mb-8">
        <h1 className="text-2xl font-bold tracking-tight text-balance sm:text-3xl">¿Dónde hay espacio?</h1>
        <p className="mt-1 text-neutral-600 dark:text-neutral-400">
          Parqueos de ULACIT en este momento. Se actualiza cada 30 segundos.
        </p>
      </header>
      <Suspense fallback={<Cargando />}>
        <Parqueos />
      </Suspense>
      <RefrescoAutomatico />
    </main>
  );
}
