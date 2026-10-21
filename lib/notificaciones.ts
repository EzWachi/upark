import "server-only";
import { enviarCorreo, urlAbsoluta } from "@/lib/correo";
import { crearToken } from "@/lib/tokens";

// Correos de cuentas (CU-38). Viven fuera de los archivos "use server" a
// propósito: todo lo que se exporta desde uno de esos archivos se vuelve un
// endpoint que cualquiera puede llamar.

type Persona = { id: string; nombre: string; correo: string };

/** CU-02, paso 5 y 6a. */
export async function correoVerificacion(p: Persona) {
  const token = await crearToken(p.id, "verificacion");
  await enviarCorreo({
    para: p.correo,
    asunto: "Confirma tu correo en UPark",
    texto: [
      `Hola, ${p.nombre}:`,
      "",
      "Confirma tu correo para que un administrador revise tu solicitud:",
      urlAbsoluta(`/verificar?token=${token}`),
      "",
      "El enlace vence en 24 horas.",
    ].join("\n"),
  });
}

/** CU-03, recuperar contraseña. */
export async function correoRecuperacion(p: Persona) {
  const token = await crearToken(p.id, "recuperacion");
  await enviarCorreo({
    para: p.correo,
    asunto: "Cambia tu contraseña de UPark",
    texto: [
      `Hola, ${p.nombre}:`,
      "",
      "Para definir una contraseña nueva, abre este enlace:",
      urlAbsoluta(`/contrasena?token=${token}`),
      "",
      "Vence en 1 hora. Si no lo pediste, ignora este correo.",
    ].join("\n"),
  });
}

/** CU-24, paso 5 y CU-32, paso 4: primer acceso de guardas y administradores. */
export async function correoAcceso(p: Persona, rol: string) {
  const token = await crearToken(p.id, "acceso");
  await enviarCorreo({
    para: p.correo,
    asunto: "Tu acceso a UPark",
    texto: [
      `Hola, ${p.nombre}:`,
      "",
      `Te crearon una cuenta de ${rol} en UPark. Define tu contraseña aquí:`,
      urlAbsoluta(`/contrasena?token=${token}`),
      "",
      "El enlace vence en 72 horas.",
    ].join("\n"),
  });
}

/** CU-22, paso 5 y 4a. */
export async function correoResolucion(p: Persona, aprobada: boolean, motivo?: string) {
  await enviarCorreo({
    para: p.correo,
    asunto: aprobada ? "Tu cuenta de UPark fue aprobada" : "Tu solicitud en UPark fue rechazada",
    texto: aprobada
      ? [`Hola, ${p.nombre}:`, "", "Tu cuenta fue aprobada. Ya puedes usar tu tarjeta virtual:", urlAbsoluta("/cuenta")].join("\n")
      : [`Hola, ${p.nombre}:`, "", "Tu solicitud no fue aprobada por este motivo:", motivo ?? "", "", "Si crees que es un error, contacta a la administración."].join("\n"),
  });
}
