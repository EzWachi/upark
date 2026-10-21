import QRCode from "qrcode";
import { Area } from "@/components/area";
import { BotonFila } from "@/components/acciones-fila";
import { db } from "@/lib/db";
import { TIPO_PERSONA } from "@/lib/etiquetas";
import type { usuarios } from "@/lib/generated/prisma/client";
import { contenidoQr } from "@/lib/reglas/credencial";
import { MAX_VEHICULOS } from "@/lib/reglas/vehiculos";
import { eliminarVehiculo, editarVehiculo, agregarVehiculo, marcarPrincipal, regenerarTarjeta } from "./actions";
import { FormularioVehiculo } from "./formulario-vehiculo";

const TAMANO = { moto: "Moto", sedan: "Sedán", suv: "SUV", grande: "Grande" };
const tarjeta = "rounded-lg border border-neutral-200 p-4 dark:border-neutral-800";

/** CU-05. */
async function Tarjeta({ usuario, tieneVehiculos }: { usuario: usuarios; tieneVehiculos: boolean }) {
  if (!usuario.token_tarjeta) return <p className="text-neutral-500">Tu tarjeta todavía no está lista.</p>;
  // SVG generado en el servidor a partir de un texto nuestro: seguro de insertar.
  const svg = await QRCode.toString(contenidoQr("M", usuario.token_tarjeta), { type: "svg", margin: 1, errorCorrectionLevel: "M" });

  return (
    <section className={`${tarjeta} space-y-4 text-center`}>
      <div className="mx-auto w-full max-w-64 rounded-lg bg-white p-3" dangerouslySetInnerHTML={{ __html: svg }} />
      <div>
        <p className="text-2xl font-bold tracking-[0.3em]">{usuario.codigo_tarjeta}</p>
        <p className="text-sm text-neutral-500">Código por si el QR no se puede leer</p>
      </div>
      <p>
        {usuario.nombre} · {usuario.tipo_persona && TIPO_PERSONA[usuario.tipo_persona]}
        {usuario.preferencial && " · preferencial"}
      </p>
      {!tieneVehiculos && (
        <p className="text-sm text-amber-600">Registra un vehículo para poder entrar con tu tarjeta (CU-04).</p>
      )}
      <details className="text-left text-sm">
        <summary className="cursor-pointer text-neutral-500">¿Alguien copió tu QR?</summary>
        <div className="mt-2 space-y-2">
          <p className="text-neutral-500">Genera una tarjeta nueva: el QR y el código anteriores dejan de funcionar.</p>
          <BotonFila accion={regenerarTarjeta} texto="Regenerar tarjeta" peligro />
        </div>
      </details>
    </section>
  );
}

async function Contenido({ usuario }: { usuario: usuarios }) {
  if (usuario.estado === "pendiente") {
    return <p>Tu solicitud está pendiente de aprobación. Te avisaremos por correo.</p>;
  }
  const vehiculos = await db.vehiculos.findMany({
    where: { usuario_id: usuario.id },
    orderBy: [{ principal: "desc" }, { created_at: "asc" }],
  });

  return (
    <div className="space-y-10">
      <Tarjeta usuario={usuario} tieneVehiculos={vehiculos.length > 0} />

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">
          Mis vehículos ({vehiculos.length}/{MAX_VEHICULOS})
        </h2>
        {vehiculos.map((v) => (
          <details key={v.id} className={tarjeta}>
            <summary className="cursor-pointer">
              <span className="font-semibold tracking-wide">{v.placa}</span>
              <span className="text-sm text-neutral-500">
                {" · "}
                {TAMANO[v.tamano]}
                {v.pais && ` · ${v.pais}`}
                {v.descripcion && ` · ${v.descripcion}`}
                {v.principal && " · principal"}
              </span>
            </summary>
            <div className="mt-4 space-y-4">
              <FormularioVehiculo key={`${v.placa}-${v.tamano}-${v.descripcion}`} accion={editarVehiculo.bind(null, v.id)} valores={v} />
              <div className="flex flex-wrap gap-3">
                {!v.principal && <BotonFila accion={marcarPrincipal.bind(null, v.id)} texto="Hacer principal" />}
                <BotonFila accion={eliminarVehiculo.bind(null, v.id)} texto="Eliminar" peligro />
              </div>
            </div>
          </details>
        ))}
        {vehiculos.length < MAX_VEHICULOS && (
          <div className={tarjeta}>
            <h3 className="mb-3 font-semibold">Agregar vehículo</h3>
            {/* key: después de agregar uno, el formulario vuelve a empezar vacío. */}
            <FormularioVehiculo key={vehiculos.length} accion={agregarVehiculo} />
          </div>
        )}
      </section>
    </div>
  );
}

// Miembro: CU-04 y CU-05.
export default function Cuenta() {
  return (
    <Area titulo="Mi cuenta" roles={["miembro"]}>
      {(usuario) => <Contenido usuario={usuario} />}
    </Area>
  );
}
