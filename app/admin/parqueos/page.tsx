import Link from "next/link";
import { Area } from "@/components/area";
import { db } from "@/lib/db";
import { totalCupos } from "@/lib/reglas/zonas";
import { crearParqueo } from "./actions";
import { FormularioParqueo } from "./formularios";

async function Lista() {
  const parqueos = await db.parqueos.findMany({
    orderBy: { nombre: "asc" },
    include: { zonas: { where: { activa: true } } },
  });

  if (parqueos.length === 0) return <p className="text-neutral-500">Todavía no hay parqueos.</p>;

  return (
    <ul className="divide-y divide-neutral-200 rounded-lg border border-neutral-200 dark:divide-neutral-800 dark:border-neutral-800">
      {parqueos.map((p) => (
        <li key={p.id}>
          <Link href={`/admin/parqueos/${p.id}`} className="flex items-center justify-between gap-4 p-4 hover:bg-neutral-50 dark:hover:bg-neutral-900">
            <span>
              <span className="font-medium">{p.nombre}</span>
              <span className="block text-sm text-neutral-500">
                {p.zonas.length} {p.zonas.length === 1 ? "zona" : "zonas"} ·{" "}
                {p.zonas.reduce((acc, z) => acc + totalCupos(z), 0)} cupos
              </span>
            </span>
            <span className={p.activo ? "text-sm text-green-700 dark:text-green-500" : "text-sm text-neutral-500"}>
              {p.activo ? "Activo" : "Inactivo"}
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}

// CU-30: lista y alta de parqueos.
export default function Parqueos() {
  return (
    <Area titulo="Parqueos" roles={["super_admin"]}>
      {() => (
        <div className="space-y-8">
          <Lista />
          <section>
            <h2 className="mb-3 text-lg font-semibold">Agregar parqueo</h2>
            <FormularioParqueo accion={crearParqueo} boton="Crear parqueo" />
            <p className="mt-2 text-sm text-neutral-500">El parqueo queda inactivo hasta que tenga al menos una zona.</p>
          </section>
        </div>
      )}
    </Area>
  );
}
