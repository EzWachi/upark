import { Area } from "@/components/area";

// Admin y super admin: CU-22 a CU-32 se construyen aquí.
export default function Admin() {
  return (
    <Area titulo="Administración" roles={["admin"]}>
      {(usuario) => (
        <p className="text-neutral-500">
          {usuario.rol === "super_admin"
            ? "Aquí irán parqueos, zonas, administradores, miembros e invitaciones."
            : "Aquí irán miembros, guardas e invitaciones."}
        </p>
      )}
    </Area>
  );
}
