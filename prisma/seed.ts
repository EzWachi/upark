// Datos mínimos para desarrollo: el primer super admin y los parqueos P1 a P5.
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

  // Los cinco parqueos del mapa de ULACIT. Los cupos son inventados:
  // reemplazar con los datos reales de la administración.
  const parqueos = [
    { nombre: "P1", descripcion: "Al sur del Ministerio de Trabajo, del otro lado de la Ruta 32", estudiantes: 90, profesores: 30 },
    { nombre: "P2", descripcion: "Al este del edificio, junto a la Ruta 32", estudiantes: 70, profesores: 25 },
    { nombre: "P3", descripcion: "El óvalo, junto a la clínica ULACIT", estudiantes: 50, profesores: 20 },
    { nombre: "P4", descripcion: "Franja al norte del edificio", estudiantes: 25, profesores: 10 },
    { nombre: "P5", descripcion: "Al norte del Museo de los Niños", estudiantes: 160, profesores: 40 },
  ];

  for (const p of parqueos) {
    const parqueo = await db.parqueos.upsert({
      where: { nombre: p.nombre },
      update: {},
      create: { nombre: p.nombre, descripcion: p.descripcion, activo: true },
    });
    const zonas = [
      { nombre: "A · Estudiantes", tipos_permitidos: ["estudiante"], cupos_moto: Math.round(p.estudiantes / 8), cupos_sedan: p.estudiantes, cupos_suv: Math.round(p.estudiantes / 6) },
      { nombre: "B · Profesores", tipos_permitidos: ["profesor", "funcionario"], cupos_sedan: p.profesores, cupos_suv: 4, cupos_grande: 1 },
      { nombre: "C · Visitas", tipos_permitidos: ["visita"], reservable: true, cupos_sedan: 6, cupos_suv: 2 },
      { nombre: "D · Preferencial", tipos_permitidos: ["estudiante", "profesor", "funcionario", "visita"], preferencial: true, cupos_sedan: 2, cupos_suv: 2 },
    ] as const;
    for (const z of zonas) {
      await db.zonas.upsert({
        where: { parqueo_id_nombre: { parqueo_id: parqueo.id, nombre: z.nombre } },
        update: {},
        create: { ...z, tipos_permitidos: [...z.tipos_permitidos], parqueo_id: parqueo.id },
      });
    }
  }

  console.log(`Super admin: ${correo}. Parqueos ${parqueos.map((p) => p.nombre).join(", ")}.`);
}

main()
  .then(() => db.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await db.$disconnect();
    process.exit(1);
  });
