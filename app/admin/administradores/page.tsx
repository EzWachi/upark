import Link from "next/link";
import { Area } from "@/components/area";
import { BotonFila } from "@/components/acciones-fila";
import { db } from "@/lib/db";
import { ESTADO_CUENTA, ROL } from "@/lib/etiquetas";
import { agregarAdministrador, cambiarRolAdministrador, quitarRolAdministrador, reenviarAccesoAdministrador } from "./actions";
import { FormularioPersona } from "../formulario-persona";

async function Lista({ actorId }: { actorId: string }) {
  const admins = await db.usuarios.findMany({
    where: { rol: { in: ["admin", "super_admin"] } },
    orderBy: [{ rol: "desc" }, { nombre: "asc" }],
  });

  return (
    <ul className="divide-y divide-neutral-200 rounded-lg border border-neutral-200 dark:divide-neutral-800 dark:border-neutral-800">
      {admins.map((a) => (
        <li key={a.id} className="flex flex-wrap items-start justify-between gap-3 p-4">
          <div>
            <p className="font-medium">
              {a.nombre} {a.id === actorId && <span className="text-sm text-neutral-500">(tú)</span>}
            </p>
            <p className="text-sm text-neutral-500">
              {a.correo} · {ROL[a.rol]}
              {a.estado !== "aprobada" && ` · ${ESTADO_CUENTA[a.estado]}`}
              {!a.password_hash && " · sin contraseña todavía"}
            </p>
          </div>
          {a.id !== actorId && (
            <div key={a.rol} className="flex flex-wrap items-start gap-3">
              <BotonFila
                accion={cambiarRolAdministrador.bind(null, a.id, a.rol === "admin" ? "super_admin" : "admin")}
                texto={a.rol === "admin" ? "Hacer super admin" : "Hacer admin"}
              />
              {!a.password_hash && a.estado === "aprobada" && (
                <BotonFila accion={reenviarAccesoAdministrador.bind(null, a.id)} texto="Reenviar acceso" />
              )}
              <BotonFila accion={quitarRolAdministrador.bind(null, a.id)} texto="Quitar rol" peligro />
            </div>
          )}
        </li>
      ))}
    </ul>
  );
}

// CU-32.
export default function Administradores() {
  return (
    <Area titulo="Administradores" roles={["super_admin"]}>
      {(actor) => (
        <div className="space-y-10">
          <Link href="/admin" className="text-sm underline">
            ← Administración
          </Link>
          <Lista actorId={actor.id} />
          <section>
            <h2 className="mb-3 text-lg font-semibold">Agregar administrador</h2>
            <FormularioPersona accion={agregarAdministrador} boton="Agregar" conRol />
            <p className="mt-2 text-sm text-neutral-500">
              Si el correo ya tiene cuenta, se le asigna el rol. Si no, se crea la cuenta y le llega un enlace para
              definir su contraseña. Si la cuenta existe pero nunca definió contraseña, se le reenvía el enlace.
            </p>
          </section>
        </div>
      )}
    </Area>
  );
}
