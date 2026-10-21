/** Textos de pantalla para los valores de la base. */

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
