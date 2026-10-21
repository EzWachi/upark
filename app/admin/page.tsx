import Link from "next/link";
import { Area } from "@/components/area";

const ENLACES_SUPER_ADMIN = [{ href: "/admin/parqueos", titulo: "Parqueos y zonas", detalle: "CU-30, CU-31" }];

// Admin y super admin. Los enlaces de admin (miembros, guardas, invitaciones)
// se agregan cuando existan sus pantallas.
export default function Admin() {
  return (
    <Area titulo="Administración" roles={["admin"]}>
      {(usuario) => {
        const enlaces = usuario.rol === "super_admin" ? ENLACES_SUPER_ADMIN : [];
        if (enlaces.length === 0) return <p className="text-neutral-500">Aquí irán miembros, guardas e invitaciones.</p>;
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
