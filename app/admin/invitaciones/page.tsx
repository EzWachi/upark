import Link from "next/link";
import { Area } from "@/components/area";
import { db } from "@/lib/db";
import { fechaHoraTexto, horaTexto } from "@/lib/etiquetas";
import { FormularioInvitacion } from "./formulario";

async function Lista() {
  const invitaciones = await db.invitaciones.findMany({
    orderBy: { inicio_at: "desc" },
    take: 50,
    include: {
      zona: { include: { parqueo: true } },
      reservas: { where: { estado: { not: "cancelada" } }, select: { estado: true } },
    },
  });
  if (invitaciones.length === 0) return <p className="text-neutral-500">Todavía no hay invitaciones.</p>;

  // `fin_at` en el pasado: terminada (CU-27, 5b).
  const ahora = new Date();
  return (
    <ul className="divide-y divide-neutral-200 rounded-lg border border-neutral-200 dark:divide-neutral-800 dark:border-neutral-800">
      {invitaciones.map((i) => {
        const usados = i.reservas.filter((r) => r.estado === "usada").length;
        const estado = i.cancelada_at ? "Cancelada" : i.fin_at < ahora ? "Terminada" : "Vigente";
        return (
          <li key={i.id}>
            <Link href={`/admin/invitaciones/${i.id}`} className="flex flex-wrap justify-between gap-3 p-4 hover:bg-neutral-50 dark:hover:bg-neutral-900">
              <span>
                <span className="font-medium">{i.motivo}</span>
                <span className="block text-sm text-neutral-500">
                  {i.tipo === "evento" ? "Evento" : "Individual"} · {fechaHoraTexto(i.inicio_at)} a {horaTexto(i.fin_at)} ·{" "}
                  {i.zona.parqueo.nombre}, {i.zona.nombre}
                </span>
              </span>
              <span className="text-right text-sm">
                <span className={estado === "Vigente" ? "text-green-700 dark:text-green-500" : "text-neutral-500"}>{estado}</span>
                <span className="block text-neutral-500">
                  {i.reservas.length}/{i.cupos} reservados · {usados} usados
                </span>
              </span>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

async function Nueva() {
  const zonas = await db.zonas.findMany({
    where: { activa: true, reservable: true, parqueo: { activo: true } },
    include: { parqueo: true },
    orderBy: [{ parqueo: { nombre: "asc" } }, { nombre: "asc" }],
  });
  return <FormularioInvitacion zonas={zonas.map((z) => ({ id: z.id, nombre: `${z.parqueo.nombre} · ${z.nombre}` }))} />;
}

// CU-25, CU-26 y CU-27.
export default function Invitaciones() {
  return (
    <Area titulo="Invitaciones" roles={["admin"]}>
      {() => (
        <div className="space-y-10">
          <Link href="/admin" className="text-sm underline">
            ← Administración
          </Link>
          <section>
            <h2 className="mb-3 text-lg font-semibold">Nueva invitación</h2>
            <Nueva />
          </section>
          <section>
            <h2 className="mb-3 text-lg font-semibold">Invitaciones</h2>
            <Lista />
          </section>
        </div>
      )}
    </Area>
  );
}
