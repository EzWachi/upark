import Link from "next/link";
import { notFound } from "next/navigation";
import { Area } from "@/components/area";
import { BotonFila } from "@/components/acciones-fila";
import { urlAbsoluta } from "@/lib/correo";
import { db } from "@/lib/db";
import { TAMANO, TIPO_IDENTIFICACION, fechaHoraTexto, horaTexto } from "@/lib/etiquetas";
import { estadoReserva } from "@/lib/reglas/disponibilidad";
import { cancelarInvitacion, cancelarReserva } from "../actions";
import { EnlaceCopiable } from "../formulario";

const ESTADO = { confirmada: "Pendiente", usada: "Usada", cancelada: "Cancelada", no_se_presento: "No se presentó" };

async function Detalle({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const inv = await db.invitaciones.findUnique({
    where: { id },
    include: { zona: { include: { parqueo: true } }, creada_por: true, reservas: { orderBy: { created_at: "asc" } } },
  });
  if (!inv) notFound();

  const ahora = new Date();
  const terminada = inv.fin_at <= ahora;
  const tomados = inv.reservas.filter((r) => r.estado !== "cancelada").length;

  return (
    <div className="space-y-8">
      <Link href="/admin/invitaciones" className="text-sm underline">
        ← Invitaciones
      </Link>

      <section className="space-y-2">
        <h2 className="text-xl font-semibold">{inv.motivo}</h2>
        <p className="text-sm text-neutral-500">
          {inv.tipo === "evento" ? "Evento" : "Individual"} · {fechaHoraTexto(inv.inicio_at)} a {horaTexto(inv.fin_at)} ·{" "}
          {inv.zona.parqueo.nombre}, {inv.zona.nombre}
        </p>
        <p className="text-sm text-neutral-500">
          {tomados}/{inv.cupos} reservados · inscripción hasta {fechaHoraTexto(inv.inscripcion_hasta)} · creada por {inv.creada_por.nombre}
        </p>
        {inv.nombre_invitado && (
          <p className="text-sm text-neutral-500">
            Para {inv.nombre_invitado}
            {inv.correo_invitado && ` (${inv.correo_invitado})`}
          </p>
        )}
        {inv.cancelada_at ? (
          <p className="font-medium text-red-600">Cancelada el {fechaHoraTexto(inv.cancelada_at)}</p>
        ) : terminada ? (
          <p className="text-neutral-500">Terminada. Solo para consulta.</p>
        ) : (
          <>
            <EnlaceCopiable url={urlAbsoluta(`/invitacion/${inv.token}`)} />
            <BotonFila accion={cancelarInvitacion.bind(null, inv.id)} texto="Cancelar invitación" peligro />
          </>
        )}
      </section>

      <section>
        <h3 className="mb-3 font-semibold">Reservas</h3>
        {inv.reservas.length === 0 ? (
          <p className="text-neutral-500">Nadie ha reservado todavía.</p>
        ) : (
          <ul className="divide-y divide-neutral-200 rounded-lg border border-neutral-200 dark:divide-neutral-800 dark:border-neutral-800">
            {inv.reservas.map((r) => {
              const estado = estadoReserva(r.estado, inv.inicio_at, ahora);
              return (
                <li key={r.id} className="flex flex-wrap items-start justify-between gap-3 p-3 text-sm">
                  <div>
                    <p>
                      <span className="font-medium">{r.nombre}</span> · {TIPO_IDENTIFICACION[r.tipo_identificacion]} {r.identificacion}
                    </p>
                    <p className="text-neutral-500">
                      <span className="font-semibold tracking-wide">{r.placa}</span> · {TAMANO[r.tamano]}
                      {r.pais && ` · ${r.pais}`}
                      {r.requiere_preferencial && " · requiere preferencial"} · {r.correo}
                    </p>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="text-neutral-500">{ESTADO[estado]}</span>
                    {estado === "confirmada" && !terminada && !inv.cancelada_at && (
                      <BotonFila accion={cancelarReserva.bind(null, r.id)} texto="Cancelar" peligro />
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}

// CU-27.
export default function InvitacionDetalle({ params }: PageProps<"/admin/invitaciones/[id]">) {
  return <Area titulo="Invitación" roles={["admin"]}>{() => <Detalle params={params} />}</Area>;
}
