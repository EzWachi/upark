# Casos de uso: administración

[Volver al catálogo](README.md) · [Reglas de negocio](../reglas-de-negocio.md)

El super admin puede ejecutar todos los casos del admin. Precondición común: sesión iniciada con el rol indicado (CU-03).

---

## CU-22 Aprobar o rechazar miembros

| Campo | Detalle |
|---|---|
| Actor principal | Admin |
| Prioridad | Must |
| Disparador | Hay solicitudes de cuenta pendientes (CU-02). |
| Precondiciones | Existe al menos una cuenta en estado **pendiente de aprobación**. |
| Postcondiciones | La cuenta queda **aprobada** con un tipo de persona asignado, o **rechazada**; la persona recibe un correo con el resultado. |
| Reglas | RN-12, RN-21 |

**Flujo principal**

1. El admin abre "Solicitudes".
2. El sistema lista las cuentas pendientes con nombre, correo, identificación, tipo solicitado y fecha.
3. El admin abre una solicitud y confirma o cambia el tipo de persona (estudiante, profesor o funcionario).
4. El admin elige "Aprobar".
5. El sistema activa la cuenta, genera su tarjeta virtual y envía un correo de aprobación (CU-38).

**Flujos alternos**

- **4a. El admin elige "Rechazar".** El sistema exige un motivo, marca la cuenta como rechazada y envía el motivo por correo.
- **3a. La solicitud es del propio admin.** El sistema no le permite aprobarla (RN-21).
- **1a. Gestionar una cuenta ya aprobada.** Desde "Miembros", el admin puede cambiar el tipo de persona o desactivar la cuenta; la desactivación invalida la tarjeta virtual de inmediato.

---

## CU-24 Gestionar guardas

| Campo | Detalle |
|---|---|
| Actor principal | Admin |
| Prioridad | Must |
| Disparador | Ingresa, sale o cambia un guarda. |
| Precondiciones | — |
| Postcondiciones | La cuenta del guarda queda creada, actualizada o desactivada. |
| Reglas | RN-17, RN-21 |

Los guardas no se registran por su cuenta: suelen pertenecer a una empresa de seguridad y no tienen correo institucional, así que el admin crea su cuenta.

**Flujo principal (crear)**

1. El admin abre "Guardas" y elige "Agregar guarda".
2. El sistema solicita nombre, tipo y número de identificación y un correo personal.
3. El admin completa los datos.
4. El sistema valida que la identificación y el correo no estén registrados.
5. El sistema crea la cuenta y envía al guarda un enlace para definir su contraseña (CU-38), válido por 72 horas.

**Flujo principal (desactivar)**

1. El admin elige un guarda y la acción "Desactivar".
2. El sistema cierra sus sesiones abiertas e impide nuevos inicios de sesión. Sus registros históricos se conservan.

**Flujos alternos**

- **4a. Identificación o correo ya registrados.** El sistema lo indica; si la cuenta existente está desactivada, ofrece reactivarla.
- **5a. El enlace venció.** El admin elige "Reenviar acceso" y el sistema envía un enlace nuevo.

---

## CU-25 Crear invitación individual

| Campo | Detalle |
|---|---|
| Actor principal | Admin |
| Prioridad | Must |
| Disparador | Una persona externa necesita parquear en una fecha y franja concretas (por ejemplo, una cita en el consultorio dental). |
| Precondiciones | Existe al menos una zona activa marcada como reservable. |
| Postcondiciones | Existe una invitación vigente de 1 cupo, con el cupo apartado en la zona y franja, y un enlace único. |
| Reglas | RN-06, RN-07, RN-10 |

**Flujo principal**

1. El admin elige "Nueva invitación" y el tipo **individual**.
2. El sistema solicita motivo, fecha, hora de inicio y de fin de la franja, parqueo y zona reservable, y opcionalmente nombre y correo del invitado.
3. El admin completa los datos.
4. El sistema valida que la franja sea futura y que la zona tenga un cupo libre en esa franja.
5. El sistema crea la invitación, aparta el cupo y genera el enlace. Por defecto, el enlace vence al inicio de la franja.
6. El sistema muestra el enlace con un botón para copiarlo.

**Flujos alternos**

- **2a. El admin indicó el correo del invitado.** En el paso 6 el sistema además envía el enlace por correo (CU-38).
- **4a. La franja ya pasó o el fin es anterior al inicio.** El sistema señala el error.
- **4b. La zona no tiene cupo en esa franja.** El sistema lo informa y sugiere otras zonas reservables del mismo parqueo con cupo.

---

## CU-26 Crear invitación de evento

| Campo | Detalle |
|---|---|
| Actor principal | Admin |
| Prioridad | Must |
| Disparador | Se organiza una actividad con varias visitas (por ejemplo, un open house). |
| Precondiciones | Existe al menos una zona activa marcada como reservable. |
| Postcondiciones | Existe una invitación vigente con N cupos apartados en la zona y franja, y un enlace compartible. |
| Reglas | RN-06, RN-07, RN-10 |

**Flujo principal**

1. El admin elige "Nueva invitación" y el tipo **evento**.
2. El sistema solicita nombre del evento, fecha, hora de inicio y de fin, parqueo, zona reservable, cantidad de cupos (N) y fecha límite de inscripción.
3. El admin completa los datos.
4. El sistema valida que la franja sea futura, que la fecha límite sea anterior al inicio de la franja y que la zona tenga N cupos libres en esa franja.
5. El sistema crea la invitación, aparta los N cupos y genera el enlace.
6. El sistema muestra el enlace con un botón para copiarlo, para que el admin lo difunda por los canales del evento.

**Flujos alternos**

- **4a. La zona no tiene N cupos libres.** El sistema indica cuántos hay disponibles; el admin puede reducir N o elegir otra zona.
- **4b. Fechas inválidas.** El sistema señala el campo con error.
- **2a. El evento necesita cupos en dos zonas.** El admin crea una invitación por zona.

---

## CU-27 Ver y cancelar invitaciones y reservas

| Campo | Detalle |
|---|---|
| Actor principal | Admin |
| Prioridad | Must |
| Disparador | El admin necesita revisar o cancelar una invitación o una reserva. |
| Precondiciones | Existe al menos una invitación. |
| Postcondiciones | La invitación o reserva queda cancelada y sus cupos liberados, o no hay cambios si solo se consultó. |
| Reglas | RN-07, RN-16 |

**Flujo principal**

1. El admin abre "Invitaciones".
2. El sistema lista las invitaciones con tipo, motivo o evento, fecha, zona, cupos totales, cupos reservados, cupos usados y estado.
3. El admin abre una invitación.
4. El sistema muestra el enlace y la lista de reservas con nombre, identificación, placa y estado.
5. El admin elige "Cancelar invitación" y confirma.
6. El sistema marca la invitación y sus reservas pendientes como canceladas, libera los cupos, invalida el enlace y avisa por correo a cada invitado con reserva (CU-38).

**Flujos alternos**

- **5a. Cancelar una sola reserva.** El admin elige la reserva y "Cancelar reserva"; el sistema la cancela, avisa al invitado y el cupo vuelve a estar disponible dentro de la misma invitación.
- **5b. La invitación ya terminó.** El sistema la muestra solo para consulta, sin opción de cancelar.
- **2a. Filtrar.** El admin filtra por fecha, estado o parqueo.

---

## CU-30 Gestionar parqueos

| Campo | Detalle |
|---|---|
| Actor principal | Super admin |
| Prioridad | Must |
| Disparador | Se agrega, cambia o cierra un parqueo. |
| Precondiciones | — |
| Postcondiciones | El parqueo queda creado, actualizado, activado o desactivado. |
| Reglas | — |

**Flujo principal**

1. El super admin abre "Parqueos".
2. El sistema lista los parqueos con nombre, estado, número de zonas y cupos totales.
3. El super admin elige "Agregar parqueo" o un parqueo existente.
4. El sistema solicita o muestra nombre, descripción o ubicación y foto.
5. El super admin guarda los cambios.
6. El sistema valida que el nombre no se repita y guarda. Un parqueo nuevo queda inactivo hasta que tenga al menos una zona (CU-31).

**Flujos alternos**

- **5a. Desactivar un parqueo con vehículos dentro.** El sistema no lo permite hasta que no haya movimientos abiertos.
- **5b. Desactivar un parqueo con invitaciones futuras.** El sistema lista esas invitaciones y exige cancelarlas primero (CU-27).
- **4a. Foto mayor a 5 MB o en un formato no admitido.** El sistema la rechaza e indica los formatos aceptados (JPG, PNG, WebP).

---

## CU-31 Gestionar zonas y cupos

| Campo | Detalle |
|---|---|
| Actor principal | Super admin |
| Prioridad | Must |
| Disparador | Se define o cambia la distribución de un parqueo. |
| Precondiciones | El parqueo existe. |
| Postcondiciones | La zona queda creada o actualizada y la disponibilidad se recalcula. |
| Reglas | RN-02, RN-03, RN-04, RN-06 |

**Flujo principal**

1. El super admin abre un parqueo y elige "Agregar zona" o una zona existente.
2. El sistema solicita:
   - Nombre de la zona.
   - Tipos de persona admitidos (uno o más): estudiante, profesor, funcionario, visita.
   - Cupos por tamaño: moto, sedán/compacto, SUV y grande.
   - Si es preferencial (Ley 7600).
   - Si es reservable para invitaciones.
3. El super admin completa los datos y guarda.
4. El sistema valida que haya al menos un tipo de persona y al menos un cupo.
5. El sistema guarda la zona y recalcula la disponibilidad (CU-36).

**Flujos alternos**

- **4a. Se reducen los cupos por debajo de los vehículos que hay dentro.** El sistema advierte que la zona quedará en sobrecupo y permite guardar.
- **4b. Se reducen los cupos por debajo de los apartados por invitaciones.** El sistema no lo permite y lista las invitaciones afectadas.
- **4c. Se desmarca "reservable" con invitaciones futuras.** El sistema no lo permite hasta cancelarlas.
- **1a. Desactivar una zona.** Mismas restricciones que 4b y que CU-30, 5a.

---

## CU-32 Gestionar administradores

| Campo | Detalle |
|---|---|
| Actor principal | Super admin |
| Prioridad | Must |
| Disparador | Una persona asume o deja funciones de administración. |
| Precondiciones | — |
| Postcondiciones | La persona queda con el rol de admin o super admin, o lo pierde. |
| Reglas | RN-21 |

**Flujo principal**

1. El super admin abre "Administradores".
2. El sistema lista los admins y super admins.
3. El super admin elige "Agregar" e indica el correo de una cuenta existente o de una persona nueva, y el rol (admin o super admin).
4. El sistema asigna el rol. Si la persona no tiene cuenta, crea una y envía un enlace para definir la contraseña (CU-38).

**Flujos alternos**

- **3a. Quitar el rol.** El super admin elige una persona y "Quitar rol"; la cuenta vuelve a su rol anterior (miembro) o se desactiva si no tenía otro.
- **3b. El super admin intenta quitarse su propio rol.** El sistema no lo permite.
- **3c. Se intenta quitar el rol al último super admin.** El sistema no lo permite; siempre debe quedar al menos uno.
