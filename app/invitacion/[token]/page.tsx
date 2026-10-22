import { Suspense } from "react";
import { connection } from "next/server";
import { db } from "@/lib/db";
import { fechaHoraTexto, horaTexto } from "@/lib/etiquetas";
import { estadoInvitacion } from "@/lib/reglas/invitaciones";
import { reservar } from "./actions";
import { FormularioReserva } from "./formulario";

const NO_DISPONIBLE = {
  cancelada: "Esta invitación fue cancelada.",
  cerrada: "La inscripción de esta invitación ya cerró.",
  llena: "Los cupos de esta invitación se agotaron.",
};

async function Invitacion({ params }: { params: Promise<{ token: string }> }) {
  await connection();
  const { token } = await params;
  const inv = await db.invitaciones.findUnique({
    where: { token },
    include: {
      zona: { include: { parqueo: true } },
      _count: { select: { reservas: { where: { estado: { not: "cancelada" } } } } },
    },
  });

  // 1a
  if (!inv) {
    return <p>Esta invitación no existe. Revisa el enlace o contacta a quien te invitó.</p>;
  }
  const estado = estadoInvitacion(inv, inv._count.reservas, new Date());

  return (
    <div className="space-y-6">
      <section className="rounded-lg border border-neutral-200 p-4 dark:border-neutral-800">
        <p className="text-lg font-semibold">{inv.motivo}</p>
        <p className="text-neutral-500">
          {fechaHoraTexto(inv.inicio_at)} a {horaTexto(inv.fin_at)}
        </p>
        <p className="text-neutral-500">
          {inv.zona.parqueo.nombre} · {inv.zona.nombre}
        </p>
      </section>
      {estado === "abierta" ? (
        <FormularioReserva
          accion={reservar.bind(null, token)}
          nombre={inv.nombre_invitado ?? ""}
          correo={inv.correo_invitado ?? ""}
        />
      ) : (
        <p role="alert" className="text-red-600">
          {NO_DISPONIBLE[estado]} Si necesitas ayuda, contacta a quien te invitó.
        </p>
      )}
    </div>
  );
}

// CU-08. Página pública: la protege el token del enlace (RN-10).
export default function PaginaInvitacion({ params }: PageProps<"/invitacion/[token]">) {
  return (
    <main className="mx-auto w-full max-w-md flex-1 px-4 py-12">
      <h1 className="mb-6 text-2xl font-bold">Reserva tu espacio en ULACIT</h1>
      <Suspense fallback={<p className="text-neutral-500">Cargando invitación…</p>}>
        <Invitacion params={params} />
      </Suspense>
    </main>
  );
}
