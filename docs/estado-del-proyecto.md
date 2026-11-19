# Estado del proyecto

Registro de lo hecho hasta el 19 de noviembre de 2026 (semana 11 del cuatrimestre) y de lo que falta. Se actualiza al cerrar cada etapa. El detalle tarea por tarea está en el [Project UPark](https://github.com/users/EzWachi/projects/9).

[Volver al README](../README.md) · [Tablero (Project)](https://github.com/users/EzWachi/projects/9) · [Casos de uso](casos-de-uso/README.md) · [Reglas de negocio](reglas-de-negocio.md)

## 1. Revisión del primer avance

Se comparó el documento del primer avance con el sílabo del curso 16-0629. El diagnóstico, la propuesta, los objetivos, la misión, la visión y las referencias están bien. Faltan cosas que el sílabo pide y que deben entrar en el segundo avance:

| Falta | Por qué importa |
|---|---|
| Metodología ágil (Scrum): roles, backlog con historias de usuario, sprints, eventos, definición de terminado, tablero Kanban | El curso exige aplicar una metodología vista en clase; el avance no menciona ninguna |
| Caso de negocio y estudio costo/beneficio | La sección "Proyecto (45 %)" lo pide de forma explícita |
| Organización del proyecto (quién hace qué) | Pedido en el sílabo |
| Cronograma corregido | Ubica el primer avance en la semana 6 (es la 5), no marca el segundo avance (semana 10, del 8 al 14 de noviembre) y sigue un orden en cascada |
| Pregunta de investigación | Criterio 4 de la rúbrica del proyecto |
| Probabilidad e impacto de los riesgos | Quedaron pendientes en las tablas 3 y 4 |
| Alcance actualizado | El avance dejaba fuera las reservas y los espacios por tipo de persona; ahora están dentro (ver sección 2) |

## 2. Análisis: casos de uso

Se definieron los casos de uso con el equipo y se documentaron en [docs/casos-de-uso](casos-de-uso/README.md): 41 casos con prioridad MoSCoW, de los cuales 26 son Must y tienen especificación completa (actor, precondiciones, flujo principal y flujos alternos), más el diagrama y las [reglas de negocio](reglas-de-negocio.md) RN-01 a RN-21.

Decisiones tomadas en esta etapa:

- Se reserva un **cupo dentro de una zona**, no un espacio numerado.
- Estudiantes, profesores y funcionarios **no reservan**: entran con su tarjeta virtual a las zonas de su tipo. Solo las visitas reservan.
- La tarjeta virtual es **un QR por persona**, con un código corto de respaldo.
- Invitaciones **individuales** (un solo uso) y **de evento** (N cupos), ambas con vencimiento.
- Las cuentas de miembros se crean por **autorregistro con correo institucional** y las aprueba un admin.
- La condición **preferencial** (Ley 7600) la aprueba un admin; en visitas la verifica el guarda.
- Una reserva sin llegada se libera tras una **tolerancia configurable** (30 minutos por defecto).
- Un vehículo puede usar un cupo **de su tamaño o mayor**; las motos solo usan cupos de moto.
- Tipos de identificación: cédula nacional (incluye naturalizados), DIMEX, DIDI y pasaporte. Las placas pueden ser extranjeras.
- Roles: super admin (parqueos, zonas, administradores), admin (miembros, guardas, invitaciones), guarda, miembro e invitado. El rol de organizador (profesores o doctores que invitan) queda para después.

## 3. Stack

Decisión registrada en [ADR 0001](decisiones/0001-stack.md): Next.js 16, React 19, TypeScript, PostgreSQL con Prisma 7, Auth.js v5, Zod 4, Tailwind 4, `qrcode` y `zxing-wasm` para el QR, Resend para correo, Cloudinary para fotos y Vercel para el hosting. Pruebas de reglas de negocio con Vitest y CI en GitHub Actions.

## 4. Desarrollo

Repositorio privado: [EzWachi/upark](https://github.com/EzWachi/upark). Cada etapa entró por un pull request con su verificación descrita.

| PR | Contenido | Estado |
|---|---|---|
| [#1](https://github.com/EzWachi/upark/pull/1) | Esqueleto: modelo de datos completo, migración inicial (con el índice de RN-01), login por rol, áreas protegidas, disponibilidad pública (CU-01) | Fusionado |
| [#2](https://github.com/EzWachi/upark/pull/2) | CI (lint, pruebas, build); gestión de parqueos y zonas (CU-30, CU-31) | Fusionado |
| [#3](https://github.com/EzWachi/upark/pull/3) | Registro y verificación de correo (CU-02), recuperar contraseña (CU-03), aprobación de miembros (CU-22), guardas (CU-24), administradores (CU-32); correo por consola | Fusionado |
| [#4](https://github.com/EzWachi/upark/pull/4) | Panel del guarda: turno (CU-11), entrada manual (CU-13), salida (CU-14), búsqueda (CU-15), vehículos dentro (CU-16), fila (CU-17), anular (CU-18) | Fusionado |
| [#5](https://github.com/EzWachi/upark/pull/5) | Mis vehículos (CU-04), tarjeta virtual (CU-05), entrada por QR o código (CU-12, miembros); este documento | Fusionado |
| [#6](https://github.com/EzWachi/upark/pull/6) | Invitaciones (CU-25 a CU-27), reserva del invitado (CU-08, CU-09) y entrada con reserva (CU-12) | Fusionado |
| [#7](https://github.com/EzWachi/upark/pull/7) | Bitácora de la sesión y README al día | Fusionado |
| [#60](https://github.com/EzWachi/upark/pull/60) | Enlace al Project de seguimiento | Fusionado |
| [#61](https://github.com/EzWachi/upark/pull/61) | Guía para retomar (`CLAUDE.md`) y bitácora del 24 de octubre | Fusionado |
| [#62](https://github.com/EzWachi/upark/pull/62) | Mapa y semáforo de ocupación en la página principal (CU-01) | Fusionado |
| Rama `feat/correo-resend` | Envío de correos con Resend y reenvío del acceso si falla (CU-38) | Sin PR todavía |
| Rama `chore/next-16.4.6` | Next.js 16.4.2 → 16.4.6 por dos avisos de seguridad de `'use cache'` | Sin PR todavía |

### Estado de los casos de uso Must

| Caso | Estado |
|---|---|
| CU-01 Consultar disponibilidad | Hecho |
| CU-02 Registrarse | Hecho |
| CU-03 Iniciar sesión y recuperar contraseña | Hecho, sin bloqueo tras 5 intentos (2b) y sin cerrar otras sesiones al cambiar la contraseña |
| CU-04 Mis vehículos | Hecho |
| CU-05 Tarjeta virtual | Hecho |
| CU-08 Reservar cupo por enlace | Hecho |
| CU-09 Recibir QR de reserva | Hecho (el QR va en la página de la reserva; el correo lleva el enlace y el código) |
| CU-11 Parqueo del turno | Hecho |
| CU-12 Entrada por QR | Hecho, para miembros y reservas |
| CU-13 a CU-17 | Hecho |
| CU-18 Anular registro | Hecho; anular registros de otros días (solo admin) sin pantalla |
| CU-22 Aprobar miembros | Hecho |
| CU-24 Gestionar guardas | Hecho |
| CU-25 Invitación individual | Hecho |
| CU-26 Invitación de evento | Hecho |
| CU-27 Ver y cancelar invitaciones | Hecho |
| CU-30 Gestionar parqueos | Hecho, sin subir la foto |
| CU-31 Gestionar zonas y cupos | Hecho |
| CU-32 Gestionar administradores | Hecho |
| CU-36 Calcular disponibilidad | Hecho |
| CU-37 Liberar cupos vencidos | Hecho (se calcula con la hora, sin tarea programada) |
| CU-38 Enviar correo | Hecho con Resend y reintentos (3a). Falta: avisar al admin cuando falla el correo de una invitación, registrar los envíos en la base (paso 4; hoy solo el log) y los rebotes (3b, necesitan webhook y la app publicada) |

### Problemas encontrados y corregidos al probar

| Problema | Corrección |
|---|---|
| Con `cacheComponents`, Auth.js usa `crypto.getRandomValues()` al leer la sesión y rompía el prerender | `await connection()` en `usuarioActual` |
| Una función de correo exportada desde un archivo `"use server"` quedaba como endpoint público | Los correos viven en `lib/notificaciones.ts` (`server-only`) |
| Tras un error de validación, React vaciaba el formulario | `useFormulario` devuelve lo enviado para volver a mostrarlo |
| Ese mismo reinicio desincronizaba los campos controlados: una visita "Sedán" se guardaba como "Moto" y en sobrecupo | `useFormulario().alEnviar` con `onSubmit`, que no reinicia |
| Formularios con `onSubmit` enviados antes de hidratar ponían la placa en la URL | `method="post"` en esos formularios |
| El formulario de alta de vehículos se quedaba en "placa extranjera" | Se vuelve a montar después de cada alta |
| Auth.js imprimía cada contraseña equivocada como error del servidor | `logger` que ignora `CredentialsSignin` |
| Texto "a. m.." con doble punto en un mensaje | Mensaje reescrito |
| Al borrar la rama del PR #2, GitHub cerró el PR #3 que apuntaba a ella | Se restauró la rama, se reabrió el #3 y se cambió su base a `main` |
| Si el correo de acceso de un admin nuevo no salía, la cuenta quedaba sin contraseña; agregarla de nuevo solo cambiaba el rol y no reenviaba nada | Agregar de nuevo una cuenta sin contraseña reenvía el enlace, hay botón "Reenviar acceso" y la pantalla avisa cuando el correo no sale |
| En `RESEND_API_KEY` se pegó el ID de la clave (un UUID) en vez de la clave (`re_...`), y Resend respondía 400 | Crear una clave nueva: Resend muestra el valor completo una sola vez |

### Calidad

- 75 pruebas (reglas de negocio en `lib/reglas` y el envío de correo en `lib/correo.test.ts`), lint y build en el CI de cada PR.
- Cada etapa se probó en el navegador con cuentas temporales, borradas al final.
- No hay pruebas automáticas de las acciones contra la base de datos.

## 5. Pendiente

### Inmediato

1. **Abrir los PRs de `feat/correo-resend` (CU-38) y `chore/next-16.4.6`**, y pasar CU-38 a Done en el Project. Las ramas no se han subido porque falta instalar `gh`.
2. **Dominio verificado en Resend.** Sin él, Resend solo entrega al correo dueño de la cuenta y no hay demo con personas reales.
3. **Probar el escaneo con la cámara** en un teléfono, con https (Vercel o `next dev --experimental-https`).
4. **Invitar a los compañeros** al repositorio y al Project.

### Casos de uso Must que faltan

- Los 26 están implementados. De CU-38 quedan el aviso de correos de invitación que fallan, el registro de envíos en la base y los rebotes (3b).

### Casos Should y ajustes

- CU-03: bloqueo tras 5 intentos fallidos y cerrar otras sesiones al cambiar la contraseña.
- CU-06 y CU-23: solicitar y aprobar la condición preferencial.
- CU-10: el invitado cancela su reserva.
- CU-19, CU-20 y CU-21: ajuste manual de ocupación, registro diferido y verificación preferencial en sitio.
- CU-28 y CU-29: reporte de ocupación y pantalla de auditoría.
- CU-33: parámetros configurables (tolerancia, ventana, retención).
- CU-39 y CU-40: cierre de movimientos abiertos a medianoche y borrado de datos personales vencidos.
- Anular registros de otros días desde administración (CU-18, 1a).
- Subir la foto del parqueo (Cloudinary).

### Infraestructura

- Base de datos en la nube (Neon o Supabase) y deploy en Vercel con `APP_URL`.
- Dominio verificado en Resend para enviar a cualquier dirección.
- Cuenta de Cloudinary.

### Por confirmar con la administración

- Cantidad de parqueos, sus zonas y la capacidad de cada zona por tamaño (hoy hay un parqueo de ejemplo inventado).
- Qué zonas corresponden a cada tipo de persona.
- Dominios de correo institucional (`DOMINIOS_INSTITUCIONALES`).
- Formatos oficiales de placa (COSEVI) y de DIDI.
- Cobertura de red en los accesos.

### Para el segundo avance del curso (semana 10)

- Metodología Scrum: roles del equipo, backlog en GitHub Projects con una historia por caso de uso, sprints y definición de terminado.
- Caso de negocio y costo/beneficio.
- Cronograma por sprints con las fechas reales del sílabo.
- Pregunta de investigación y matriz de riesgos con probabilidad e impacto.
- Alcance actualizado (reservas y zonas por tipo de persona ahora dentro).
- Demostración: registro y aprobación de un miembro, su tarjeta virtual y la entrada por QR en el panel del guarda.
