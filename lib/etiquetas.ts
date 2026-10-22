/** Textos de pantalla para los valores de la base. */

/** Fecha y hora en Costa Rica, para pantallas y correos. */
export const fechaHoraTexto = (d: Date) =>
  d.toLocaleString("es-CR", {
    timeZone: "America/Costa_Rica",
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });

export const horaTexto = (d: Date) =>
  d.toLocaleTimeString("es-CR", { timeZone: "America/Costa_Rica", hour: "2-digit", minute: "2-digit" });

export const TAMANO = { moto: "Moto", sedan: "Sedán", suv: "SUV", grande: "Grande" } as const;

export const TIPO_IDENTIFICACION = {
  cedula: "Cédula nacional",
  dimex: "DIMEX",
  didi: "DIDI",
  pasaporte: "Pasaporte",
} as const;

export const TIPO_PERSONA = {
  estudiante: "Estudiante",
  profesor: "Profesor",
  funcionario: "Funcionario",
  visita: "Visita",
} as const;

export const ROL = {
  miembro: "Miembro",
  guarda: "Guarda",
  admin: "Admin",
  super_admin: "Super admin",
} as const;

export const ESTADO_CUENTA = {
  sin_verificar: "Sin verificar",
  pendiente: "Pendiente",
  aprobada: "Aprobada",
  rechazada: "Rechazada",
  desactivada: "Desactivada",
} as const;
