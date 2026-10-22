import { Suspense } from "react";
import { connection } from "next/server";
import QRCode from "qrcode";
import { db } from "@/lib/db";
import { TAMANO, fechaHoraTexto, horaTexto } from "@/lib/etiquetas";
import { contenidoQr } from "@/lib/reglas/credencial";
import { estadoReserva } from "@/lib/reglas/disponibilidad";
import { venceReserva } from "@/lib/reglas/invitaciones";

const FIN = {
  usada: "Esta reserva ya se usó. ¡Bienvenido!",
  cancelada: "Esta reserva fue cancelada.",
  no_se_presento: "Esta reserva venció porque no se registró la llegada a tiempo.",
};

async function Reserva({ params }: { params: Promise<{ token: string }> }) {
  await connection();
  const { token } = await params;
  const r = await db.reservas.findUnique({
    where: { token_qr: token },
    include: { invitacion: { include: { zona: { include: { parqueo: true } } } } },
  });
  if (!r) return <p>No encontramos esta reserva. Revisa el enlace del correo.</p>;

  const inv = r.invitacion;
  const estado = estadoReserva(r.estado, inv.inicio_at, new Date());
  const detalle = (
    <section className="space-y-1 rounded-lg border border-neutral-200 p-4 dark:border-neutral-800">
      <p className="font-semibold">{inv.motivo}</p>
      <p className="text-neutral-500">
        {fechaHoraTexto(inv.inicio_at)} a {horaTexto(inv.fin_at)}
      </p>
      <p className="text-neutral-500">
        {inv.zona.parqueo.nombre} · {inv.zona.nombre}
      </p>
      <p className="text-neutral-500">
        {r.nombre} · <span className="font-semibold tracking-wide">{r.placa}</span> · {TAMANO[r.tamano]}
      </p>
    </section>
  );

  if (estado !== "confirmada") {
    return (
      <div className="space-y-4">
        <p role="status">{FIN[estado]}</p>
        {detalle}
      </div>
    );
  }

  const svg = await QRCode.toString(contenidoQr("R", r.token_qr), { type: "svg", margin: 1, errorCorrectionLevel: "M" });
  return (
    <div className="space-y-6 text-center">
      <div className="mx-auto w-full max-w-64 rounded-lg bg-white p-3" dangerouslySetInnerHTML={{ __html: svg }} />
      <div>
        <p className="text-2xl font-bold tracking-[0.3em]">{r.codigo}</p>
        <p className="text-sm text-neutral-500">Código por si el QR no se puede leer</p>
      </div>
      <div className="text-left">{detalle}</div>
      <p className="text-left text-sm text-neutral-500">
        Presenta este QR al guarda. Puedes entrar desde 15 minutos antes del inicio; la reserva se libera a las{" "}
        {horaTexto(venceReserva(inv.inicio_at))} si no llegas.
        {r.requiere_preferencial && " El guarda te indicará dónde está el espacio preferencial."}
      </p>
    </div>
  );
}

// CU-09. Página pública: la protege el token de la reserva (RN-13).
export default function PaginaReserva({ params }: PageProps<"/reserva/[token]">) {
  return (
    <main className="mx-auto w-full max-w-md flex-1 px-4 py-12">
      <h1 className="mb-6 text-2xl font-bold">Tu reserva</h1>
      <Suspense fallback={<p className="text-neutral-500">Cargando reserva…</p>}>
        <Reserva params={params} />
      </Suspense>
    </main>
  );
}
