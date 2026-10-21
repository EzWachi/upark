import Link from "next/link";
import { notFound } from "next/navigation";
import { Area } from "@/components/area";
import { db } from "@/lib/db";
import { totalCupos } from "@/lib/reglas/zonas";
import { cambiarEstadoParqueo, crearZona, editarParqueo, editarZona } from "../actions";
import { BotonEstado, FormularioParqueo, FormularioZona } from "../formularios";

const NOMBRE_TIPO = { estudiante: "Estudiantes", profesor: "Profesores", funcionario: "Funcionarios", visita: "Visitas" };

async function Detalle({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const parqueo = await db.parqueos.findUnique({
    where: { id },
    include: { zonas: { orderBy: { nombre: "asc" } } },
  });
  if (!parqueo) notFound();

  return (
    <div className="space-y-10">
      <Link href="/admin/parqueos" className="text-sm underline">
        ← Parqueos
      </Link>

      <section className="space-y-4">
        <div className="flex items-baseline justify-between gap-4">
          <h2 className="text-xl font-semibold">{parqueo.nombre}</h2>
          <span className={parqueo.activo ? "text-sm text-green-700 dark:text-green-500" : "text-sm text-neutral-500"}>
            {parqueo.activo ? "Activo" : "Inactivo"}
          </span>
        </div>
        <FormularioParqueo
          key={parqueo.nombre}
          accion={editarParqueo.bind(null, parqueo.id)}
          valores={{ nombre: parqueo.nombre, descripcion: parqueo.descripcion }}
          boton="Guardar cambios"
        />
        <BotonEstado
          key={String(parqueo.activo)}
          accion={cambiarEstadoParqueo.bind(null, parqueo.id, !parqueo.activo)}
          activo={parqueo.activo}
        />
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold">Zonas</h2>
        {parqueo.zonas.length === 0 && <p className="text-neutral-500">Este parqueo todavía no tiene zonas.</p>}
        {parqueo.zonas.map((z) => (
          <details key={z.id} className="rounded-lg border border-neutral-200 p-4 dark:border-neutral-800">
            <summary className="cursor-pointer">
              <span className="font-medium">{z.nombre}</span>
              <span className="text-sm text-neutral-500">
                {" · "}
                {totalCupos(z)} cupos · {z.tipos_permitidos.map((t) => NOMBRE_TIPO[t]).join(", ")}
                {z.preferencial && " · preferencial"}
                {z.reservable && " · reservable"}
                {!z.activa && " · inactiva"}
              </span>
            </summary>
            <div className="mt-4">
              <FormularioZona accion={editarZona.bind(null, z.id)} valores={z} />
            </div>
          </details>
        ))}
      </section>

      <section>
        <h2 className="mb-3 text-lg font-semibold">Agregar zona</h2>
        <FormularioZona key={parqueo.zonas.length} accion={crearZona.bind(null, parqueo.id)} />
      </section>
    </div>
  );
}

// CU-30 (editar, activar y desactivar) y CU-31 (zonas y cupos).
export default function ParqueoDetalle({ params }: PageProps<"/admin/parqueos/[id]">) {
  return <Area titulo="Parqueo" roles={["super_admin"]}>{() => <Detalle params={params} />}</Area>;
}
