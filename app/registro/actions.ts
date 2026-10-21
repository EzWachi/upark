"use server";

import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import type { Resultado } from "@/components/formulario";
import { esDuplicado, primerError } from "@/lib/acciones";
import { correoVerificacion } from "@/lib/notificaciones";
import { dominiosInstitucionales, esCorreoInstitucional, esquemaRegistro } from "@/lib/reglas/cuentas";

const YA_REGISTRADO = "Ya existe una cuenta con ese correo o identificación. Si es tuya, recupera tu contraseña.";

/** CU-02, pasos 3 a 5. */
export async function registrarse(_prev: Resultado, form: FormData): Promise<Resultado> {
  const datos = esquemaRegistro.safeParse({
    nombre: form.get("nombre"),
    correo: form.get("correo"),
    password: form.get("password"),
    tipo_identificacion: form.get("tipo_identificacion"),
    identificacion: form.get("identificacion"),
    tipo_persona: form.get("tipo_persona"),
    consentimiento: form.get("consentimiento") === "on",
  });
  if (!datos.success) return primerError(datos.error);
  // El consentimiento ya se exigió en el esquema; no se guarda aparte.
  const { nombre, correo, tipo_identificacion, identificacion, tipo_persona, password } = datos.data;
  const persona = { nombre, correo, tipo_identificacion, identificacion, tipo_persona };

  // 4a
  if (!esCorreoInstitucional(persona.correo, dominiosInstitucionales())) {
    return { error: "Solo se aceptan correos institucionales de ULACIT." };
  }

  let usuario;
  try {
    usuario = await db.usuarios.create({
      data: {
        ...persona,
        password_hash: await bcrypt.hash(password, 12),
        rol: "miembro",
        estado: "sin_verificar",
      },
    });
  } catch (e) {
    if (esDuplicado(e)) return { error: YA_REGISTRADO }; // 4b
    throw e;
  }

  await correoVerificacion(usuario);
  return { ok: `Te enviamos un enlace a ${usuario.correo}. Ábrelo para confirmar tu correo.` };
}
