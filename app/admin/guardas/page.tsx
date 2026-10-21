import Link from "next/link";
import { Area } from "@/components/area";
import { BotonFila } from "@/components/acciones-fila";
import { db } from "@/lib/db";
import { ESTADO_CUENTA } from "@/lib/etiquetas";
import { cambiarEstadoGuarda, crearGuarda, reenviarAccesoGuarda } from "./actions";
import { FormularioPersona } from "../formulario-persona";

async function Lista() {
  const guardas = await db.usuarios.findMany({ where: { rol: "guarda" }, orderBy: { nombre: "asc" } });
  if (guardas.length === 0) return <p className="text-neutral-500">Todavía no hay guardas.</p>;

  return (
    <ul className="divide-y divide-neutral-200 rounded-lg border border-neutral-200 dark:divide-neutral-800 dark:border-neutral-800">
      {guardas.map((g) => (
        <li key={g.id} className="flex flex-wrap items-start justify-between gap-3 p-4">
          <div>
            <p className="font-medium">{g.nombre}</p>
            <p className="text-sm text-neutral-500">
              {g.correo} · {ESTADO_CUENTA[g.estado]}
              {!g.password_hash && g.estado === "aprobada" && " · sin contraseña todavía"}
            </p>
          </div>
          <div className="flex flex-wrap items-start gap-3">
            {g.estado === "aprobada" && <BotonFila accion={reenviarAccesoGuarda.bind(null, g.id)} texto="Reenviar acceso" />}
            <BotonFila
              key={g.estado}
              accion={cambiarEstadoGuarda.bind(null, g.id, g.estado === "desactivada")}
              texto={g.estado === "desactivada" ? "Reactivar" : "Desactivar"}
              peligro={g.estado !== "desactivada"}
            />
          </div>
        </li>
      ))}
    </ul>
  );
}

// CU-24.
export default function Guardas() {
  return (
    <Area titulo="Guardas" roles={["admin"]}>
      {() => (
        <div className="space-y-10">
          <Link href="/admin" className="text-sm underline">
            ← Administración
          </Link>
          <Lista />
          <section>
            <h2 className="mb-3 text-lg font-semibold">Agregar guarda</h2>
            <FormularioPersona accion={crearGuarda} boton="Crear guarda" conIdentificacion />
            <p className="mt-2 text-sm text-neutral-500">
              Puede ser un correo personal. Le llegará un enlace para definir su contraseña, válido por 72 horas.
            </p>
          </section>
        </div>
      )}
    </Area>
  );
}
