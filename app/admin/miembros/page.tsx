import Link from "next/link";
import { Area } from "@/components/area";
import { BotonFila, SelectFila, TextoFila } from "@/components/acciones-fila";
import { db } from "@/lib/db";
import { ESTADO_CUENTA, TIPO_IDENTIFICACION, TIPO_PERSONA } from "@/lib/etiquetas";
import { aprobarMiembro, cambiarEstadoMiembro, cambiarTipoMiembro, rechazarMiembro } from "./actions";

const TIPOS_MIEMBRO = {
  estudiante: TIPO_PERSONA.estudiante,
  profesor: TIPO_PERSONA.profesor,
  funcionario: TIPO_PERSONA.funcionario,
};
const fecha = (d: Date) =>
  d.toLocaleDateString("es-CR", { timeZone: "America/Costa_Rica", day: "numeric", month: "short", year: "numeric" });

async function Solicitudes() {
  const pendientes = await db.usuarios.findMany({
    where: { rol: "miembro", estado: "pendiente" },
    orderBy: { created_at: "asc" },
  });
  if (pendientes.length === 0) return <p className="text-neutral-500">No hay solicitudes pendientes.</p>;

  return (
    <ul className="space-y-3">
      {pendientes.map((u) => (
        <li key={u.id} className="space-y-3 rounded-lg border border-neutral-200 p-4 dark:border-neutral-800">
          <div>
            <p className="font-medium">{u.nombre}</p>
            <p className="text-sm text-neutral-500">
              {u.correo} · {u.tipo_identificacion && TIPO_IDENTIFICACION[u.tipo_identificacion]} {u.identificacion}
            </p>
            <p className="text-sm text-neutral-500">
              Solicita: {u.tipo_persona ? TIPO_PERSONA[u.tipo_persona] : "—"} · {fecha(u.created_at)}
            </p>
          </div>
          <div className="flex flex-wrap items-start gap-4">
            <SelectFila
              accion={aprobarMiembro.bind(null, u.id)}
              nombre="tipo_persona"
              opciones={TIPOS_MIEMBRO}
              inicial={u.tipo_persona}
              texto="Aprobar"
            />
            <TextoFila accion={rechazarMiembro.bind(null, u.id)} nombre="motivo" placeholder="Motivo del rechazo" texto="Rechazar" peligro />
          </div>
        </li>
      ))}
    </ul>
  );
}

async function Miembros() {
  const miembros = await db.usuarios.findMany({
    where: { rol: "miembro", estado: { in: ["aprobada", "desactivada"] } },
    orderBy: { nombre: "asc" },
  });
  if (miembros.length === 0) return <p className="text-neutral-500">Todavía no hay miembros aprobados.</p>;

  return (
    <ul className="divide-y divide-neutral-200 rounded-lg border border-neutral-200 dark:divide-neutral-800 dark:border-neutral-800">
      {miembros.map((u) => (
        <li key={u.id} className="flex flex-wrap items-start justify-between gap-3 p-4">
          <div>
            <p className="font-medium">{u.nombre}</p>
            <p className="text-sm text-neutral-500">
              {u.correo} · {ESTADO_CUENTA[u.estado]}
            </p>
          </div>
          <div className="flex flex-wrap items-start gap-3">
            <SelectFila
              key={u.tipo_persona}
              accion={cambiarTipoMiembro.bind(null, u.id)}
              nombre="tipo_persona"
              opciones={TIPOS_MIEMBRO}
              inicial={u.tipo_persona}
              texto="Cambiar tipo"
            />
            <BotonFila
              key={u.estado}
              accion={cambiarEstadoMiembro.bind(null, u.id, u.estado === "desactivada")}
              texto={u.estado === "desactivada" ? "Reactivar" : "Desactivar"}
              peligro={u.estado !== "desactivada"}
            />
          </div>
        </li>
      ))}
    </ul>
  );
}

// CU-22.
export default function PaginaMiembros() {
  return (
    <Area titulo="Miembros" roles={["admin"]}>
      {() => (
        <div className="space-y-10">
          <Link href="/admin" className="text-sm underline">
            ← Administración
          </Link>
          <section>
            <h2 className="mb-3 text-lg font-semibold">Solicitudes pendientes</h2>
            <Solicitudes />
          </section>
          <section>
            <h2 className="mb-3 text-lg font-semibold">Miembros</h2>
            <Miembros />
          </section>
        </div>
      )}
    </Area>
  );
}
