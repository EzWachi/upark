"use server";

import { AuthError } from "next-auth";
import { signIn } from "@/lib/auth";

export async function iniciarSesion(_prev: string | null, form: FormData): Promise<string | null> {
  try {
    await signIn("credentials", {
      correo: form.get("correo"),
      password: form.get("password"),
      redirectTo: "/panel",
    });
    return null;
  } catch (error) {
    // CU-03, 2a: mensaje genérico, sin decir qué dato falló.
    if (error instanceof AuthError) return "Correo o contraseña incorrectos.";
    throw error; // la redirección de Auth.js también viaja como excepción
  }
}
