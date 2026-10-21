import Link from "next/link";
import { Area } from "@/components/area";
import { BotonFila } from "@/components/acciones-fila";
import { estiloBoton, estiloInput } from "@/components/mensaje";
import { db } from "@/lib/db";
import { TIPO_PERSONA } from "@/lib/etiquetas";
import { parqueoDelTurno } from "@/lib/turno";
import { registrarSalida } from "../actions";

const DIAS_HISTORIAL = 90;
const fechaHora = (d: Date) =>
  d.toLocaleString("es-CR", { timeZone: "America/Costa_Rica", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });

async function Resultados({ texto, rol }: { texto: string; rol: string }) {
  // Placas e identificaciones se guardan sin espacios ni guiones y en mayúsculas.
  const q = texto.toUpperCase().replace(/[\s-]/g, "");
  if (q.length < 2) return <p className="text-neutral-500">Escribe al menos 2 caracteres.</p>;

  const desde = new Date();
  desde.setDate(desde.getDate() - DIAS_HISTORIAL);
  const coincide = { OR: [{ placa: { contains: q } }, { identificacion: { contains: q } }] };
  const [movimientos, vehiculos, turno] = await Promise.all([
    db.movimientos.findMany({
      where: { AND: [coincide, { OR: [{ salida_at: null }, { entrada_at: { gte: desde } }] }] },
      include: { parqueo: true, zona: true, guarda_entrada: true, guarda_salida: true, parqueo_salida: true },
      orderBy: { entrada_at: "desc" },
      take: 50,
    }),
    db.vehiculos.findMany({ where: { placa: { contains: q } }, include: { usuario: true }, take: 10 }),
    rol === "guarda" ? parqueoDelTurno() : null,
  ]);
  // Primero los que siguen dentro (paso 2).
  movimientos.sort((a, b) => Number(a.salida_at !== null || a.anulado_at !== null) - Number(b.salida_at !== null || b.anulado_at !== null));

  return (
    <div className="space-y-8">
      <section>
        <h2 className="mb-3 font-semibold">Movimientos (últimos {DIAS_HISTORIAL} días)</h2>
        {movimientos.length === 0 ? (
          <p className="text-neutral-500">Sin resultados.</p>
        ) : (
          <ul className="divide-y divide-neutral-200 rounded-lg border border-neutral-200 dark:divide-neutral-800 dark:border-neutral-800">
            {movimientos.map((m) => {
              const abierto = !m.salida_at && !m.anulado_at;
              return (
                <li key={m.id} className="flex flex-wrap items-start justify-between gap-3 p-3 text-sm">
                  <div className="space-y-0.5">
                    <p>
                      <span className="font-semibold tracking-wide">{m.placa}</span> · {m.persona_nombre} ·{" "}
                      {TIPO_PERSONA[m.tipo_persona]}
                      {abierto && <span className="ml-2 font-medium text-green-700 dark:text-green-500">Dentro</span>}
                      {m.anulado_at && <span className="ml-2 font-medium text-red-600">Anulado</span>}
                    </p>
                    <p className="text-neutral-500">
                      {m.parqueo.nombre} · {m.zona.nombre} · entró {fechaHora(m.entrada_at)} ({m.guarda_entrada.nombre})
                    </p>
                    {m.salida_at && (
                      <p className="text-neutral-500">
                        Salió {fechaHora(m.salida_at)}
                        {m.guarda_salida && ` (${m.guarda_salida.nombre})`}
                        {m.parqueo_salida && ` por ${m.parqueo_salida.nombre}`}
                      </p>
                    )}
                    {m.anulado_at && <p className="text-neutral-500">Motivo: {m.motivo_anulacion}</p>}
                  </div>
                  {abierto && turno && (
                    <BotonFila
                      accion={registrarSalida.bind(null, m.id)}
                      texto={m.parqueo_id === turno.id ? "Registrar salida" : `Registrar salida en ${turno.nombre}`}
                    />
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {/* 2b: la placa es de un miembro, aunque no tenga movimientos. */}
      {vehiculos.length > 0 && (
        <section>
          <h2 className="mb-3 font-semibold">Vehículos registrados</h2>
          <ul className="space-y-1 text-sm">
            {vehiculos.map((v) => (
              <li key={v.id}>
                <span className="font-semibold tracking-wide">{v.placa}</span> · {v.usuario.nombre} · {v.usuario.correo}
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

// CU-15.
export default function Buscar({ searchParams }: PageProps<"/guarda/buscar">) {
  return (
    <Area titulo="Buscar vehículo" roles={["guarda", "admin"]}>
      {(usuario) => <Contenido searchParams={searchParams} rol={usuario.rol} />}
    </Area>
  );
}

async function Contenido({ searchParams, rol }: { searchParams: PageProps<"/guarda/buscar">["searchParams"]; rol: string }) {
  const texto = String((await searchParams).q ?? "");
  return (
    <div className="space-y-6">
      <Link href={rol === "guarda" ? "/guarda" : "/admin"} className="text-sm underline">
        ← Volver
      </Link>
      <form className="flex gap-3">
        <input
          name="q"
          defaultValue={texto}
          placeholder="Placa o identificación"
          aria-label="Placa o identificación"
          autoFocus
          className={`${estiloInput} mt-0 uppercase`}
        />
        <button className={estiloBoton}>Buscar</button>
      </form>
      {texto && <Resultados texto={texto} rol={rol} />}
    </div>
  );
}
