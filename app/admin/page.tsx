import Link from "next/link";
import { Area } from "@/components/area";

const ENLACES_ADMIN = [
  { href: "/admin/miembros", titulo: "Miembros", detalle: "Aprobar solicitudes y gestionar cuentas" },
  { href: "/admin/guardas", titulo: "Guardas", detalle: "Crear, desactivar y reenviar acceso" },
  { href: "/admin/invitaciones", titulo: "Invitaciones", detalle: "Visitas y eventos con reserva de espacio" },
  { href: "/guarda/buscar", titulo: "Buscar vehículo", detalle: "Por placa o identificación" },
];

const ENLACES_SUPER_ADMIN = [
  { href: "/admin/parqueos", titulo: "Parqueos y zonas", detalle: "Capacidad y distribución" },
  { href: "/admin/administradores", titulo: "Administradores", detalle: "Asignar y quitar roles" },
];

// Admin y super admin (el super admin ve también sus propias secciones).
export default function Admin() {
  return (
    <Area titulo="Administración" roles={["admin"]}>
      {(usuario) => {
        const enlaces = usuario.rol === "super_admin" ? [...ENLACES_ADMIN, ...ENLACES_SUPER_ADMIN] : ENLACES_ADMIN;
        return (
          <ul className="grid gap-3 sm:grid-cols-2">
            {enlaces.map((e) => (
              <li key={e.href}>
                <Link
                  href={e.href}
                  className="block rounded-lg border border-neutral-200 p-4 hover:bg-neutral-50 dark:border-neutral-800 dark:hover:bg-neutral-900"
                >
                  <span className="font-medium">{e.titulo}</span>
                  <span className="block text-sm text-neutral-500">{e.detalle}</span>
                </Link>
              </li>
            ))}
          </ul>
        );
      }}
    </Area>
  );
}
