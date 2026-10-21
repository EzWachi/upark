# 0001. Stack tecnológico

- **Estado:** aceptada
- **Fecha:** 2026-10-21

## Contexto

UPark lo desarrolla un equipo de 4 personas en unas 7 semanas (semanas 8 a 15 del cuatrimestre). Los casos de uso Must (ver [casos de uso](../casos-de-uso/README.md)) piden:

- Una web usable desde el celular para miembros, guardas e invitados.
- Lectura de QR con la cámara del teléfono del guarda (CU-12).
- Generación de QR y envío de correos (CU-05, CU-09, CU-38).
- Datos relacionales con reglas de integridad (RN-01, RN-06, RN-07).
- Roles: miembro, guarda, admin y super admin.
- Disponibilidad casi en tiempo real (CU-01).

Un integrante del equipo ya resolvió QR, cámara, correo y roles con este mismo stack en otros proyectos, lo que reduce el riesgo.

## Decisión

| Capa | Elección |
|---|---|
| Framework | Next.js 16 (App Router), React 19, TypeScript |
| Base de datos | PostgreSQL (Neon o Supabase) |
| ORM | Prisma 7 con `@prisma/adapter-pg` |
| Autenticación | Auth.js v5 (credenciales, sesión JWT, rol leído de la base en cada request) |
| Correo | Resend |
| QR | `qrcode` para generar, `zxing-wasm` para leer |
| Validación | Zod 4, compartido entre formulario y servidor |
| Interfaz | Tailwind CSS 4 y shadcn/ui |
| Imágenes | Cloudinary |
| Hosting | Vercel |
| Pruebas | Vitest para las reglas de negocio puras |
| Gestión ágil | GitHub Projects e Issues |

Decisiones de diseño que salen de esta elección:

- **RN-01 en la base de datos.** Un índice único parcial sobre la placa en los movimientos abiertos impide dos entradas de la misma placa, incluso con dos guardas registrando a la vez.
- **Disponibilidad por consulta periódica.** La página consulta cada 30 segundos; no hay websockets.
- **Sin tareas programadas para CU-37.** El estado de una reserva (pendiente, no se presentó) se calcula con la hora de cada consulta.
- **Reglas de negocio como funciones puras** en `lib/reglas/`, probadas con Vitest sin base de datos.

## Alternativas descartadas

| Alternativa | Motivo |
|---|---|
| Backend separado (NestJS o Express) | Dos repos y dos deploys para un equipo de 4; Next.js cubre la API con server actions y route handlers. |
| App nativa (React Native o Flutter) | La cámara y el QR funcionan desde el navegador; una app nativa agrega tiendas y builds sin aportar a los casos Must. |
| Supabase completo (auth, realtime, storage) | Menos piezas, pero la aprobación de cuentas y los roles son lógica propia de todos modos, y el equipo ya domina Auth.js. |
| Websockets o Redis | El tráfico de un campus no lo justifica; la consulta cada 30 segundos basta. |
| NFC | Safari en iPhone no lo soporta. Queda como trabajo futuro (CU-41). |

## Consecuencias

- Un solo repositorio y un solo deploy; cada PR genera una vista previa en Vercel para enseñar en los avances.
- La cámara exige HTTPS; Vercel lo da por defecto, y en local `next dev --experimental-https` lo cubre.
- Resend necesita un dominio verificado para enviar a cualquier dirección. Sin dominio solo envía a la cuenta del dueño, lo que alcanza para desarrollo pero no para la demo final.
- Vercel Hobby es de uso no comercial. Alcanza para el curso; una adopción real por la universidad requeriría otro plan o infraestructura propia.
