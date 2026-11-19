# UPark: guía para retomar el trabajo

@AGENTS.md

Sistema de gestión y consulta de parqueos de ULACIT. Proyecto del curso 16-0629 Metodologías Ágiles (III cuatrimestre 2026). Equipo: Deran Chavarria, Anthony Vargas, Jose Dias, John Castillo. Todo el código, los comentarios y la documentación van en español.

Fechas del curso: segundo avance en la semana 10 (8 al 14 de noviembre de 2026), entrega final en la semana 15 (13 al 19 de diciembre).

## Dónde está cada cosa

| Qué | Dónde |
|---|---|
| Qué está hecho y qué falta | [docs/estado-del-proyecto.md](docs/estado-del-proyecto.md) |
| Tablero y backlog (un issue por caso de uso y por tarea) | [Project UPark](https://github.com/users/EzWachi/projects/9) |
| Historia de cada sesión | [docs/bitacora/](docs/bitacora/) |
| Casos de uso (41, prioridad MoSCoW) y especificaciones | [docs/casos-de-uso/](docs/casos-de-uso/README.md) |
| Reglas de negocio RN-01 a RN-21, supuestos | [docs/reglas-de-negocio.md](docs/reglas-de-negocio.md) |
| Decisiones de arquitectura | [docs/decisiones/](docs/decisiones/) |

Antes de empezar: leer el estado del proyecto, revisar el Project y correr `gh pr list`.

## Código

Next.js 16.4 (App Router, `cacheComponents` activo), React 19, TypeScript, Prisma 7 con PostgreSQL, Auth.js v5 (credenciales, JWT), Zod 4, Tailwind 4, `qrcode` y `zxing-wasm`.

| Carpeta | Contenido |
|---|---|
| `app/` | Páginas por área: pública (`/`, `/registro`, `/invitacion/[token]`, `/reserva/[token]`), `cuenta` (miembro), `guarda`, `admin` |
| `lib/reglas/` | Reglas de negocio puras, con pruebas Vitest al lado (`*.test.ts`) |
| `lib/consultas/` | Consultas que combinan base y reglas (disponibilidad) |
| `lib/auth/` | Auth.js y `exigirRol` / `usuarioActual` |
| `lib/notificaciones.ts` | Todos los correos (`server-only`) |
| `lib/correo.ts` | Envío por Resend con reintentos (CU-38); sin `RESEND_API_KEY` imprime en consola |
| `components/` | Formularios (`useFormulario`), acciones de fila, escáner QR, marco de áreas (`Area`) |
| `prisma/` | Schema, migraciones y seed (super admin + parqueo de ejemplo) |

## Comandos

```bash
npm run dev            # http://localhost:3000 (antes copia el wasm del lector QR a public/)
npm test               # pruebas de lib/reglas
npm run lint
npm run build
npx prisma migrate dev
npx prisma db seed
```

Base local: Postgres en localhost, base `upark` (en `.env`). En la máquina de Jose corre en el contenedor Docker `upark_db`, puerto 5433 (`docker start upark_db` si está detenido). El mismo servidor tiene otras bases de otros proyectos: no tocarlas.

## Convenciones que importan

- **Cada acción de servidor verifica el rol** con `exigirRol(...)`. Las páginas protegidas no bastan: las acciones se pueden llamar directo.
- **En un archivo `"use server"` todo lo exportado es un endpoint público.** Los ayudantes van sin exportar o en `lib/` (los correos, en `lib/notificaciones.ts`).
- **`cacheComponents`:** lo que lee la base, la sesión o la hora va dentro de `<Suspense>`. `usuarioActual` ya llama a `connection()`. Las páginas con `new Date()` también lo llaman.
- **Después de una mutación:** `refresh()` de `next/cache`.
- **Formularios:** `useFormulario` (en `components/formulario.tsx`) conserva lo enviado si hay error. Si el formulario tiene campos controlados con `useState`, usar `onSubmit={alEnviar}` y `method="post"`. `action=` reinicia el formulario y los desincroniza, y sin `method` un envío antes de hidratar pone los datos en la URL.
- **Reglas:** la lógica que se pueda probar sin base va en `lib/reglas/` con su prueba. Los comentarios citan el caso de uso o la regla (`CU-13, 3b`, `RN-01`).
- **Modelo:** tablas y campos en español y `snake_case`. RN-01 (una placa no puede estar dentro dos veces) lo garantiza un índice único parcial en la migración inicial.
- **Hora:** Costa Rica es UTC-6 fijo. Ayudantes `inicioDelDiaCR`, `finDelDiaCR` y `fechaHoraCR`.
- **Correos:** `enviarCorreo` nunca lanza y devuelve si salió. Si una acción crea algo y su correo no sale, devolver `{ aviso }` (no `error`, para que no se repita) con `CORREO_NO_SALIO` de `lib/acciones.ts`, y ofrecer el reenvío.

## Forma de trabajo

- Una rama y un PR por etapa, con lo verificado y lo no verificado en la descripción. **Fusionar solo cuando el usuario lo pide.**
- El CI (lint, pruebas, build) corre solo en PRs contra `main`. Con PRs apilados: cambiar la base del de arriba a `main` antes de borrar la rama del de abajo; si no, GitHub lo cierra.
- Al terminar un caso de uso, comentar el PR en su issue y pasarlo a Done en el Project (eso cierra el issue solo).
- Al cerrar una sesión: actualizar `docs/estado-del-proyecto.md` y agregar una entrada en `docs/bitacora/`.

## Probar en el navegador

- Sin `RESEND_API_KEY`, los correos salen en la terminal de `npm run dev`. Con ella salen por Resend, pero sin dominio verificado solo llegan al correo dueño de la cuenta de Resend; a otra dirección Resend responde 403 y el fallo queda en la terminal. Los enlaces apuntan a `APP_URL` (por defecto `http://localhost:3000`).
- La clave de Resend empieza con `re_`. El UUID que se ve en la lista de claves es su ID y no sirve.
- Las invitaciones aceptan cualquier correo; el registro solo los de `DOMINIOS_INSTITUCIONALES`. Solo las zonas reservables (las "C · Visitas" del seed) admiten invitaciones.
- `next dev` revisa los avisos de seguridad de npm y puede ofrecer actualizar Next abriendo un agente. Hacerlo en una rama aparte. El agente hereda `NODE_ENV=development` de `next dev`, y con eso `npm run build` falla; en una terminal normal no pasa.
- Super admin del seed: `superadmin@upark.local`, contraseña en `SUPERADMIN_PASSWORD` del `.env`.
- Para probar con otros roles: crear usuarios temporales directo en la base (con `pg` y `bcryptjs`) y borrarlos al terminar, junto con sus movimientos, reservas y auditoría.
- La entrada con reserva solo funciona desde 15 minutos antes del inicio de la franja hasta 30 minutos después.
