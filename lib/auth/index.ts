import NextAuth, { type DefaultSession } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import type { rol_usuario } from "@/lib/generated/prisma/enums";

declare module "next-auth" {
  interface Session {
    user: { id: string; rol: rol_usuario } & DefaultSession["user"];
  }
  interface User {
    rol: rol_usuario;
  }
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  // El token solo lleva la identidad. Rol y estado se leen de la base en cada
  // request (lib/auth/sesion.ts) porque un JWT no se puede revocar.
  session: { strategy: "jwt", maxAge: 7 * 24 * 60 * 60 },
  pages: { signIn: "/login" },
  providers: [
    Credentials({
      credentials: { correo: {}, password: {} },
      authorize: async (credentials) => {
        const correo = String(credentials?.correo ?? "").trim().toLowerCase();
        const password = String(credentials?.password ?? "");
        if (!correo || !password) return null;

        const usuario = await db.usuarios.findUnique({ where: { correo } });
        if (!usuario?.password_hash) return null;
        // CU-03, 2c y 2d: una cuenta pendiente entra a ver su estado; sin
        // verificar, rechazada o desactivada, no.
        if (!["pendiente", "aprobada"].includes(usuario.estado)) return null;
        if (!(await bcrypt.compare(password, usuario.password_hash))) return null;

        return { id: usuario.id, name: usuario.nombre, email: usuario.correo, rol: usuario.rol };
      },
    }),
  ],
  callbacks: {
    jwt: ({ token, user }) => {
      if (user) {
        token.id = user.id;
        token.rol = user.rol;
      }
      return token;
    },
    session: ({ session, token }) => {
      session.user.id = token.id as string;
      session.user.rol = token.rol as rol_usuario;
      return session;
    },
  },
});
