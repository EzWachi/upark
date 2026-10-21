// Datos mínimos para desarrollo: el primer super admin y un parqueo de ejemplo.
// Se puede correr varias veces sin duplicar nada (npx prisma db seed).
import "dotenv/config";
import bcrypt from "bcryptjs";
import { db } from "../lib/db";

async function main() {
  const correo = process.env.SUPERADMIN_CORREO?.trim().toLowerCase();
  const password = process.env.SUPERADMIN_PASSWORD;
  if (!correo || !password) throw new Error("Faltan SUPERADMIN_CORREO o SUPERADMIN_PASSWORD en .env");

  await db.usuarios.upsert({
    where: { correo },
    update: {},
    create: {
      nombre: "Super admin",
      correo,
      password_hash: await bcrypt.hash(password, 12),
      rol: "super_admin",
      estado: "aprobada",
      correo_verificado_at: new Date(),
    },
  });

  // Distribución inventada: reemplazar con los datos reales de la administración.
  const parqueo = await db.parqueos.upsert({
    where: { nombre: "Parqueo Principal" },
    update: {},
    create: { nombre: "Parqueo Principal", descripcion: "Parqueo de ejemplo para desarrollo", activo: true },
  });

  const zonas = [
    { nombre: "A · Estudiantes", tipos_permitidos: ["estudiante"], cupos_moto: 10, cupos_sedan: 40, cupos_suv: 10 },
    { nombre: "B · Profesores", tipos_permitidos: ["profesor", "funcionario"], cupos_sedan: 15, cupos_suv: 5, cupos_grande: 2 },
    { nombre: "C · Visitas", tipos_permitidos: ["visita"], reservable: true, cupos_sedan: 8, cupos_suv: 2 },
    { nombre: "D · Preferencial", tipos_permitidos: ["estudiante", "profesor", "funcionario", "visita"], preferencial: true, cupos_sedan: 2, cupos_suv: 2 },
  ] as const;

  for (const z of zonas) {
    await db.zonas.upsert({
      where: { parqueo_id_nombre: { parqueo_id: parqueo.id, nombre: z.nombre } },
      update: {},
      create: { ...z, tipos_permitidos: [...z.tipos_permitidos], parqueo_id: parqueo.id },
    });
  }

  console.log(`Super admin: ${correo}. Parqueo de ejemplo con ${zonas.length} zonas.`);
}

main()
  .then(() => db.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await db.$disconnect();
    process.exit(1);
  });
