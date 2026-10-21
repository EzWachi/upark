"use client";

import { useActionState } from "react";
import Link from "next/link";
import { iniciarSesion } from "./actions";

export default function Login() {
  const [error, accion, pendiente] = useActionState(iniciarSesion, null);

  return (
    <main className="mx-auto w-full max-w-sm flex-1 px-4 py-12">
      <Link href="/" className="text-sm underline">
        ← Disponibilidad
      </Link>
      <h1 className="mt-4 mb-6 text-2xl font-bold">Iniciar sesión</h1>
      <form action={accion} className="space-y-4">
        <label className="block">
          <span className="text-sm">Correo</span>
          <input name="correo" type="email" required autoComplete="email" className="mt-1 w-full rounded border px-3 py-2" />
        </label>
        <label className="block">
          <span className="text-sm">Contraseña</span>
          <input name="password" type="password" required autoComplete="current-password" className="mt-1 w-full rounded border px-3 py-2" />
        </label>
        {error && (
          <p role="alert" className="text-sm text-red-600">
            {error}
          </p>
        )}
        <button disabled={pendiente} className="w-full rounded bg-neutral-900 py-2 text-white disabled:opacity-50 dark:bg-white dark:text-neutral-900">
          {pendiente ? "Entrando…" : "Entrar"}
        </button>
      </form>
      <div className="mt-6 flex justify-between text-sm">
        <Link href="/registro" className="underline">
          Crear cuenta
        </Link>
        <Link href="/recuperar" className="underline">
          Olvidé mi contraseña
        </Link>
      </div>
    </main>
  );
}
