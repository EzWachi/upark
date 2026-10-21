import Link from "next/link";
import { Area } from "@/components/area";
import { BotonFila, TextoFila } from "@/components/acciones-fila";
import { disponibilidadParqueos } from "@/lib/consultas/disponibilidad";
import { db } from "@/lib/db";
import { TIPO_PERSONA } from "@/lib/etiquetas";
import { estadoReserva, inicioDelDiaCR, finDelDiaCR, TAMANOS } from "@/lib/reglas/disponibilidad";
import { parqueoDelTurno } from "@/lib/turno";
import { anularSalida, dejarParqueo, moverFila, seleccionarParqueo } from "./actions";
import { Dentro } from "./dentro";
import { EntradaManual } from "./entrada";
import { EntradaTarjeta } from "./entrada-tarjeta";

const hora = (d: Date) =>
  d.toLocaleTimeString("es-CR", { timeZone: "America/Costa_Rica", hour: "2-digit", minute: "2-digit" });
const ESTADO_RESERVA = { confirmada: "Pendiente", usada: "Usada", cancelada: "Cancelada", no_se_presento: "No se presentó" };
const tarjeta = "rounded-lg border border-neutral-200 p-4 dark:border-neutral-800";

/** CU-11. */
async function SeleccionParqueo() {
  const parqueos = await db.parqueos.findMany({ where: { activo: true }, orderBy: { nombre: "asc" } });
  if (parqueos.length === 0) return <p className="text-neutral-500">No hay parqueos activos.</p>;
  return (
    <section className="space-y-3">
      <h2 className="text-lg font-semibold">¿En qué parqueo estás de turno?</h2>
      <ul className="space-y-2">
        {parqueos.map((p) => (
          <li key={p.id} className={`${tarjeta} flex items-center justify-between gap-3`}>
            <span className="font-medium">{p.nombre}</span>
            <BotonFila accion={seleccionarParqueo.bind(null, p.id)} texto="Elegir" />
          </li>
        ))}
      </ul>
    </section>
  );
}

async function Panel() {
  const parqueo = await parqueoDelTurno();
  if (!parqueo) return <SeleccionParqueo />;

  const ahora = new Date();
  const hoy = { gte: inicioDelDiaCR(ahora), lte: finDelDiaCR(ahora) };
  const [[disp], dentro, salidasHoy, reservasHoy] = await Promise.all([
    disponibilidadParqueos(ahora, parqueo.id),
    db.movimientos.findMany({
      where: { parqueo_id: parqueo.id, salida_at: null, anulado_at: null },
      include: { zona: true },
      orderBy: { entrada_at: "desc" },
    }),
    db.movimientos.findMany({
      where: { OR: [{ parqueo_salida_id: parqueo.id }, { parqueo_id: parqueo.id, parqueo_salida_id: null }], salida_at: hoy, anulado_at: null },
      orderBy: { salida_at: "desc" },
    }),
    db.reservas.findMany({
      where: { invitacion: { zona: { parqueo_id: parqueo.id }, inicio_at: hoy } },
      include: { invitacion: { include: { zona: true } } },
      orderBy: { invitacion: { inicio_at: "asc" } },
    }),
  ]);
  const zonas = disp?.zonas ?? [];

  return (
    <div className="space-y-8">
      <section className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold">{parqueo.nombre}</h2>
          <p className="text-sm text-neutral-500">{disp ? `${Math.max(0, disp.total)} cupos libres` : ""}</p>
        </div>
        <div className="flex gap-3">
          <Link href="/guarda/buscar" className="rounded border border-neutral-300 px-3 py-1 text-sm dark:border-neutral-700">
            Buscar
          </Link>
          <BotonFila accion={dejarParqueo} texto="Cambiar parqueo" />
        </div>
      </section>

      {/* CU-17 */}
      <section className={`${tarjeta} flex flex-wrap items-center justify-between gap-3`}>
        <div>
          <p className="text-sm text-neutral-500">Vehículos en fila</p>
          <p className="text-3xl font-bold">{parqueo.fila}</p>
        </div>
        <div className="flex gap-2">
          <BotonFila accion={moverFila.bind(null, -1)} texto="−" />
          <BotonFila accion={moverFila.bind(null, 1)} texto="+" />
          <BotonFila accion={moverFila.bind(null, 0)} texto="Reiniciar" />
        </div>
      </section>

      <section className={tarjeta}>
        <h3 className="mb-2 font-semibold">Ocupación por zona</h3>
        <ul className="space-y-1 text-sm">
          {zonas.map((z) => (
            <li key={z.id} className="flex flex-wrap justify-between gap-2">
              <span>{z.nombre}</span>
              <span className={z.total < 0 ? "text-amber-600" : "text-neutral-500"}>
                {TAMANOS.filter((t) => z.porTamano[t] !== 0)
                  .map((t) => `${t}: ${z.porTamano[t]}`)
                  .join(" · ") || "sin cupos"}
                {z.total < 0 && " (sobrecupo)"}
              </span>
            </li>
          ))}
        </ul>
      </section>

      <section className={tarjeta}>
        <h3 className="mb-3 font-semibold">Entrada con tarjeta o reserva</h3>
        <EntradaTarjeta zonas={zonas} />
      </section>

      <section className={tarjeta}>
        <h3 className="mb-3 font-semibold">Entrada manual</h3>
        <EntradaManual zonas={zonas} />
      </section>

      <section>
        <h3 className="mb-3 font-semibold">Dentro ahora ({dentro.length})</h3>
        <Dentro
          zonas={zonas.map((z) => z.nombre)}
          vehiculos={dentro.map((m) => ({
            id: m.id,
            placa: m.placa,
            nombre: m.persona_nombre,
            tipo: TIPO_PERSONA[m.tipo_persona],
            zona: m.zona.nombre,
            hora: hora(m.entrada_at),
            avisos: [m.sobrecupo && "sobrecupo", m.origen === "manual" && "manual", m.pais && `placa de ${m.pais}`].filter(
              (a): a is string => typeof a === "string",
            ),
          }))}
        />
      </section>

      <section>
        <h3 className="mb-3 font-semibold">Reservas de hoy</h3>
        {reservasHoy.length === 0 ? (
          <p className="text-neutral-500">No hay reservas para hoy.</p>
        ) : (
          <ul className="divide-y divide-neutral-200 rounded-lg border border-neutral-200 text-sm dark:divide-neutral-800 dark:border-neutral-800">
            {reservasHoy.map((r) => (
              <li key={r.id} className="flex flex-wrap justify-between gap-2 p-3">
                <span>
                  <span className="font-semibold tracking-wide">{r.placa}</span> · {r.nombre} · {r.invitacion.zona.nombre}
                </span>
                <span className="text-neutral-500">
                  {hora(r.invitacion.inicio_at)} · {ESTADO_RESERVA[estadoReserva(r.estado, r.invitacion.inicio_at, ahora)]}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <h3 className="mb-3 font-semibold">Salidas de hoy</h3>
        {salidasHoy.length === 0 ? (
          <p className="text-neutral-500">Todavía no hay salidas.</p>
        ) : (
          <ul className="divide-y divide-neutral-200 rounded-lg border border-neutral-200 dark:divide-neutral-800 dark:border-neutral-800">
            {salidasHoy.map((m) => (
              <li key={m.id} className="flex flex-wrap items-start justify-between gap-3 p-3">
                <span className="text-sm">
                  <span className="font-semibold tracking-wide">{m.placa}</span> · {m.persona_nombre} · salió{" "}
                  {m.salida_at && hora(m.salida_at)}
                </span>
                <TextoFila accion={anularSalida.bind(null, m.id)} nombre="motivo" placeholder="Motivo" texto="Anular salida" peligro />
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

// Guarda: CU-11, CU-13, CU-14, CU-16, CU-17 y CU-18.
export default function Guarda() {
  return (
    <Area titulo="Control de acceso" roles={["guarda"]}>
      {() => <Panel />}
    </Area>
  );
}
