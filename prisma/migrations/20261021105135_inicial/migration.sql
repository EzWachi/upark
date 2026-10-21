-- CreateEnum
CREATE TYPE "rol_usuario" AS ENUM ('miembro', 'guarda', 'admin', 'super_admin');

-- CreateEnum
CREATE TYPE "estado_cuenta" AS ENUM ('sin_verificar', 'pendiente', 'aprobada', 'rechazada', 'desactivada');

-- CreateEnum
CREATE TYPE "tipo_persona" AS ENUM ('estudiante', 'profesor', 'funcionario', 'visita');

-- CreateEnum
CREATE TYPE "tipo_identificacion" AS ENUM ('cedula', 'dimex', 'didi', 'pasaporte');

-- CreateEnum
CREATE TYPE "tamano_vehiculo" AS ENUM ('moto', 'sedan', 'suv', 'grande');

-- CreateEnum
CREATE TYPE "origen_placa" AS ENUM ('nacional', 'extranjera');

-- CreateEnum
CREATE TYPE "tipo_invitacion" AS ENUM ('individual', 'evento');

-- CreateEnum
CREATE TYPE "estado_reserva" AS ENUM ('confirmada', 'usada', 'cancelada');

-- CreateEnum
CREATE TYPE "origen_entrada" AS ENUM ('qr_miembro', 'qr_reserva', 'manual');

-- CreateEnum
CREATE TYPE "tipo_token" AS ENUM ('verificacion', 'recuperacion', 'acceso');

-- CreateTable
CREATE TABLE "usuarios" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "correo" TEXT NOT NULL,
    "password_hash" TEXT,
    "rol" "rol_usuario" NOT NULL DEFAULT 'miembro',
    "estado" "estado_cuenta" NOT NULL DEFAULT 'sin_verificar',
    "tipo_persona" "tipo_persona",
    "tipo_identificacion" "tipo_identificacion",
    "identificacion" TEXT,
    "preferencial" BOOLEAN NOT NULL DEFAULT false,
    "token_tarjeta" TEXT,
    "codigo_tarjeta" TEXT,
    "correo_verificado_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "usuarios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tokens_correo" (
    "id" TEXT NOT NULL,
    "usuario_id" TEXT NOT NULL,
    "tipo" "tipo_token" NOT NULL,
    "token_hash" TEXT NOT NULL,
    "expira_at" TIMESTAMP(3) NOT NULL,
    "usado_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tokens_correo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vehiculos" (
    "id" TEXT NOT NULL,
    "usuario_id" TEXT NOT NULL,
    "origen" "origen_placa" NOT NULL,
    "pais" TEXT,
    "placa" TEXT NOT NULL,
    "tamano" "tamano_vehiculo" NOT NULL,
    "descripcion" TEXT,
    "principal" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "vehiculos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "parqueos" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT,
    "foto_url" TEXT,
    "activo" BOOLEAN NOT NULL DEFAULT false,
    "fila" INTEGER NOT NULL DEFAULT 0,
    "fila_actualizada_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "parqueos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "zonas" (
    "id" TEXT NOT NULL,
    "parqueo_id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "tipos_permitidos" "tipo_persona"[],
    "preferencial" BOOLEAN NOT NULL DEFAULT false,
    "reservable" BOOLEAN NOT NULL DEFAULT false,
    "activa" BOOLEAN NOT NULL DEFAULT true,
    "cupos_moto" INTEGER NOT NULL DEFAULT 0,
    "cupos_sedan" INTEGER NOT NULL DEFAULT 0,
    "cupos_suv" INTEGER NOT NULL DEFAULT 0,
    "cupos_grande" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "zonas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "movimientos" (
    "id" TEXT NOT NULL,
    "placa" TEXT NOT NULL,
    "origen_placa" "origen_placa" NOT NULL,
    "pais" TEXT,
    "tamano_vehiculo" "tamano_vehiculo" NOT NULL,
    "tamano_cupo" "tamano_vehiculo" NOT NULL,
    "persona_nombre" TEXT NOT NULL,
    "tipo_persona" "tipo_persona" NOT NULL,
    "tipo_identificacion" "tipo_identificacion",
    "identificacion" TEXT,
    "origen" "origen_entrada" NOT NULL,
    "sobrecupo" BOOLEAN NOT NULL DEFAULT false,
    "usuario_id" TEXT,
    "reserva_id" TEXT,
    "parqueo_id" TEXT NOT NULL,
    "zona_id" TEXT NOT NULL,
    "entrada_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "guarda_entrada_id" TEXT NOT NULL,
    "salida_at" TIMESTAMP(3),
    "guarda_salida_id" TEXT,
    "parqueo_salida_id" TEXT,
    "anulado_at" TIMESTAMP(3),
    "anulado_por_id" TEXT,
    "motivo_anulacion" TEXT,

    CONSTRAINT "movimientos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "invitaciones" (
    "id" TEXT NOT NULL,
    "tipo" "tipo_invitacion" NOT NULL,
    "motivo" TEXT NOT NULL,
    "zona_id" TEXT NOT NULL,
    "inicio_at" TIMESTAMP(3) NOT NULL,
    "fin_at" TIMESTAMP(3) NOT NULL,
    "cupos" INTEGER NOT NULL DEFAULT 1,
    "inscripcion_hasta" TIMESTAMP(3) NOT NULL,
    "token" TEXT NOT NULL,
    "nombre_invitado" TEXT,
    "correo_invitado" TEXT,
    "creada_por_id" TEXT NOT NULL,
    "cancelada_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "invitaciones_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reservas" (
    "id" TEXT NOT NULL,
    "invitacion_id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "correo" TEXT NOT NULL,
    "tipo_identificacion" "tipo_identificacion" NOT NULL,
    "identificacion" TEXT NOT NULL,
    "origen_placa" "origen_placa" NOT NULL,
    "pais" TEXT,
    "placa" TEXT NOT NULL,
    "tamano" "tamano_vehiculo" NOT NULL,
    "requiere_preferencial" BOOLEAN NOT NULL DEFAULT false,
    "token_qr" TEXT NOT NULL,
    "codigo" TEXT NOT NULL,
    "estado" "estado_reserva" NOT NULL DEFAULT 'confirmada',
    "cancelada_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "reservas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "auditoria" (
    "id" TEXT NOT NULL,
    "usuario_id" TEXT NOT NULL,
    "accion" TEXT NOT NULL,
    "entidad" TEXT NOT NULL,
    "entidad_id" TEXT NOT NULL,
    "motivo" TEXT,
    "datos" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "auditoria_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "usuarios_correo_key" ON "usuarios"("correo");

-- CreateIndex
CREATE UNIQUE INDEX "usuarios_token_tarjeta_key" ON "usuarios"("token_tarjeta");

-- CreateIndex
CREATE UNIQUE INDEX "usuarios_codigo_tarjeta_key" ON "usuarios"("codigo_tarjeta");

-- CreateIndex
CREATE UNIQUE INDEX "usuarios_tipo_identificacion_identificacion_key" ON "usuarios"("tipo_identificacion", "identificacion");

-- CreateIndex
CREATE UNIQUE INDEX "tokens_correo_token_hash_key" ON "tokens_correo"("token_hash");

-- CreateIndex
CREATE INDEX "vehiculos_placa_idx" ON "vehiculos"("placa");

-- CreateIndex
CREATE UNIQUE INDEX "vehiculos_usuario_id_placa_key" ON "vehiculos"("usuario_id", "placa");

-- CreateIndex
CREATE UNIQUE INDEX "parqueos_nombre_key" ON "parqueos"("nombre");

-- CreateIndex
CREATE UNIQUE INDEX "zonas_parqueo_id_nombre_key" ON "zonas"("parqueo_id", "nombre");

-- CreateIndex
CREATE UNIQUE INDEX "movimientos_reserva_id_key" ON "movimientos"("reserva_id");

-- CreateIndex
CREATE INDEX "movimientos_parqueo_id_salida_at_idx" ON "movimientos"("parqueo_id", "salida_at");

-- CreateIndex
CREATE INDEX "movimientos_zona_id_salida_at_idx" ON "movimientos"("zona_id", "salida_at");

-- CreateIndex
CREATE INDEX "movimientos_placa_idx" ON "movimientos"("placa");

-- CreateIndex
CREATE UNIQUE INDEX "invitaciones_token_key" ON "invitaciones"("token");

-- CreateIndex
CREATE INDEX "invitaciones_zona_id_inicio_at_idx" ON "invitaciones"("zona_id", "inicio_at");

-- CreateIndex
CREATE UNIQUE INDEX "reservas_token_qr_key" ON "reservas"("token_qr");

-- CreateIndex
CREATE UNIQUE INDEX "reservas_codigo_key" ON "reservas"("codigo");

-- CreateIndex
CREATE UNIQUE INDEX "reservas_invitacion_id_tipo_identificacion_identificacion_key" ON "reservas"("invitacion_id", "tipo_identificacion", "identificacion");

-- CreateIndex
CREATE INDEX "auditoria_entidad_entidad_id_idx" ON "auditoria"("entidad", "entidad_id");

-- AddForeignKey
ALTER TABLE "tokens_correo" ADD CONSTRAINT "tokens_correo_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vehiculos" ADD CONSTRAINT "vehiculos_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "zonas" ADD CONSTRAINT "zonas_parqueo_id_fkey" FOREIGN KEY ("parqueo_id") REFERENCES "parqueos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "movimientos" ADD CONSTRAINT "movimientos_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "movimientos" ADD CONSTRAINT "movimientos_reserva_id_fkey" FOREIGN KEY ("reserva_id") REFERENCES "reservas"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "movimientos" ADD CONSTRAINT "movimientos_parqueo_id_fkey" FOREIGN KEY ("parqueo_id") REFERENCES "parqueos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "movimientos" ADD CONSTRAINT "movimientos_zona_id_fkey" FOREIGN KEY ("zona_id") REFERENCES "zonas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "movimientos" ADD CONSTRAINT "movimientos_guarda_entrada_id_fkey" FOREIGN KEY ("guarda_entrada_id") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "movimientos" ADD CONSTRAINT "movimientos_guarda_salida_id_fkey" FOREIGN KEY ("guarda_salida_id") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "movimientos" ADD CONSTRAINT "movimientos_parqueo_salida_id_fkey" FOREIGN KEY ("parqueo_salida_id") REFERENCES "parqueos"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "movimientos" ADD CONSTRAINT "movimientos_anulado_por_id_fkey" FOREIGN KEY ("anulado_por_id") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invitaciones" ADD CONSTRAINT "invitaciones_zona_id_fkey" FOREIGN KEY ("zona_id") REFERENCES "zonas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invitaciones" ADD CONSTRAINT "invitaciones_creada_por_id_fkey" FOREIGN KEY ("creada_por_id") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reservas" ADD CONSTRAINT "reservas_invitacion_id_fkey" FOREIGN KEY ("invitacion_id") REFERENCES "invitaciones"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "auditoria" ADD CONSTRAINT "auditoria_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- RN-01: una placa no puede tener dos movimientos abiertos, en ningún parqueo.
-- Prisma no permite declarar índices parciales en el schema.
CREATE UNIQUE INDEX "movimientos_placa_abierta_key"
  ON "movimientos" ("placa")
  WHERE "salida_at" IS NULL AND "anulado_at" IS NULL;
