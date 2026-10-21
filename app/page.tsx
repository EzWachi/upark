import { Suspense } from "react";
import Link from "next/link";
import { connection } from "next/server";
import { disponibilidadParqueos } from "@/lib/consultas/disponibilidad";
import { libresParaPublico, TAMANOS } from "@/lib/reglas/disponibilidad";
import { RefrescoAutomatico } from "./refresco-automatico";

const NOMBRE_TAMANO = { moto: "Moto", sedan: "Sedán", suv: "SUV", grande: "Grande" };

// CU-01. Datos frescos en cada request; la página se refresca cada 30 s.
async function Parqueos() {
  await connection();
  const parqueos = await disponibilidadParqueos(new Date());

  if (parqueos.length === 0) {
    return <p className="text-neutral-500">Todavía no hay parqueos activos.</p>;
  }

  return (
    <ul className="grid gap-4 sm:grid-cols-2">
      {parqueos.map((p) => {
        const libres = libresParaPublico(p.total);
        return (
          <li key={p.id} className="rounded-lg border border-neutral-200 p-4 dark:border-neutral-800">
            <div className="flex items-baseline justify-between gap-2">
              <h2 className="text-lg font-semibold">{p.nombre}</h2>
              <span className={libres === 0 ? "font-semibold text-red-600" : "font-semibold"}>
                {libres === 0 ? "Lleno" : `${libres} libres`}
              </span>
            </div>
            <p className="text-sm text-neutral-500">
              Fila: {p.fila}
              {p.fila_actualizada_at &&
                ` · actualizada ${p.fila_actualizada_at.toLocaleTimeString("es-CR", { timeZone: "America/Costa_Rica", hour: "2-digit", minute: "2-digit" })}`}
            </p>
            <details className="mt-3">
              <summary className="cursor-pointer text-sm">Ver zonas</summary>
              <ul className="mt-2 space-y-2 text-sm">
                {p.zonas.map((z) => (
                  <li key={z.id}>
                    <span className="font-medium">{z.nombre}</span>
                    {z.preferencial && " · preferencial"}
                    <span className="block text-neutral-500">
                      {TAMANOS.filter((t) => z.porTamano[t] !== 0)
                        .map((t) => `${NOMBRE_TAMANO[t]}: ${libresParaPublico(z.porTamano[t])}`)
                        .join(" · ") || "Sin cupos"}
                    </span>
                  </li>
                ))}
              </ul>
            </details>
          </li>
        );
      })}
    </ul>
  );
}

export default function Inicio() {
  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-8">
      <header className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">UPark</h1>
        <Link href="/login" className="text-sm underline">
          Iniciar sesión
        </Link>
      </header>
      <Suspense fallback={<p className="text-neutral-500">Cargando disponibilidad…</p>}>
        <Parqueos />
      </Suspense>
      <RefrescoAutomatico />
    </main>
  );
}
