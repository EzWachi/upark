import { Area } from "@/components/area";

// Miembro: CU-04 (vehículos) y CU-05 (tarjeta virtual) se construyen aquí.
export default function Cuenta() {
  return (
    <Area titulo="Mi cuenta" roles={["miembro"]}>
      {(usuario) =>
        usuario.estado === "pendiente" ? (
          <p>Tu solicitud está pendiente de aprobación. Te avisaremos por correo.</p>
        ) : (
          <p className="text-neutral-500">Aquí irán tu tarjeta virtual y tus vehículos.</p>
        )
      }
    </Area>
  );
}
