import { randomInt } from "node:crypto";
import { z } from "zod";
import { identificacionValida, normalizarIdentificacion } from "./identificacion";
import type { rol_usuario, tipo_persona } from "@/lib/generated/prisma/enums";

export function normalizarCorreo(correo: string): string {
  return correo.trim().toLowerCase();
}

/** RN-11. Dominios a confirmar con la universidad; se pueden cambiar por variable de entorno. */
export function dominiosInstitucionales(): string[] {
  return (process.env.DOMINIOS_INSTITUCIONALES ?? "ulacit.ed.cr,ulacit.ac.cr")
    .split(",")
    .map((d) => d.trim().toLowerCase())
    .filter(Boolean);
}

/** Acepta el dominio exacto o un subdominio (alumnos.ulacit.ed.cr). */
export function esCorreoInstitucional(correo: string, dominios: string[]): boolean {
  const dominio = normalizarCorreo(correo).split("@")[1] ?? "";
  return dominios.some((d) => dominio === d || dominio.endsWith(`.${d}`));
}

// bcrypt solo usa los primeros 72 bytes.
export const esquemaPassword = z
  .string()
  .min(8, "La contraseña necesita al menos 8 caracteres")
  .max(72, "La contraseña es demasiado larga")
  .regex(/[A-Za-z]/, "La contraseña necesita al menos una letra")
  .regex(/\d/, "La contraseña necesita al menos un número");

const tipoIdentificacion = z.enum(["cedula", "dimex", "didi", "pasaporte"]);

/** Datos de una persona con identificación (registro, guardas). */
const persona = z.object({
  nombre: z.string().trim().min(3, "Escribe el nombre completo").max(100),
  correo: z.string().trim().toLowerCase().pipe(z.email("Correo inválido")),
  tipo_identificacion: tipoIdentificacion,
  identificacion: z.string().transform(normalizarIdentificacion),
});

const identificacionCoherente = <T extends z.infer<typeof persona>>(datos: T, ctx: z.RefinementCtx) => {
  if (!identificacionValida(datos.tipo_identificacion, datos.identificacion)) {
    ctx.addIssue({ code: "custom", path: ["identificacion"], message: "El número no tiene el formato de ese tipo de identificación" });
  }
};

/** CU-02, pasos 2 a 4. */
export const esquemaRegistro = persona
  .extend({
    password: esquemaPassword,
    tipo_persona: z.enum(["estudiante", "profesor", "funcionario"], "Elige si eres estudiante, profesor o funcionario"),
    consentimiento: z.literal(true, "Debes aceptar el tratamiento de tus datos para continuar"),
  })
  .superRefine(identificacionCoherente);

/** CU-24, pasos 2 y 3. */
export const esquemaGuarda = persona.superRefine(identificacionCoherente);

// Sin 0/O ni 1/I/L para que el guarda pueda dictarlo o digitarlo sin dudas.
const ALFABETO_CODIGO = "23456789ABCDEFGHJKMNPQRSTUVWXYZ";

/** RN-13: código corto de 6 caracteres equivalente al QR. */
export function generarCodigoCorto(): string {
  return Array.from({ length: 6 }, () => ALFABETO_CODIGO[randomInt(ALFABETO_CODIGO.length)]).join("");
}

/** CU-32, 3b y 3c. */
export function validarQuitarRol(input: {
  actorId: string;
  objetivoId: string;
  objetivoRol: rol_usuario;
  superAdminsActivos: number;
}): string | null {
  if (input.actorId === input.objetivoId) return "No puedes quitarte tu propio rol.";
  if (input.objetivoRol === "super_admin" && input.superAdminsActivos <= 1) {
    return "Debe quedar al menos un super admin.";
  }
  return null;
}

/**
 * CU-32, 3a: al quitar el rol, quien fue miembro vuelve a serlo; quien entró
 * solo como administrador queda desactivado.
 */
export function rolAlQuitar(tipoPersona: tipo_persona | null): { rol: rol_usuario; desactivar: boolean } {
  return tipoPersona ? { rol: "miembro", desactivar: false } : { rol: "miembro", desactivar: true };
}
