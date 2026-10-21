# Casos de uso: guarda

[Volver al catálogo](README.md) · [Reglas de negocio](../reglas-de-negocio.md)

Todos los casos de este archivo tienen como precondición común que el guarda tiene sesión iniciada con una cuenta activa (CU-03). Desde CU-12 en adelante, además, que seleccionó el parqueo del turno (CU-11).

---

## CU-11 Seleccionar parqueo del turno

| Campo | Detalle |
|---|---|
| Actor principal | Guarda |
| Prioridad | Must |
| Disparador | El guarda inicia sesión o elige "Cambiar parqueo". |
| Precondiciones | Existe al menos un parqueo activo. |
| Postcondiciones | Las operaciones del guarda quedan asociadas al parqueo elegido. |
| Reglas | RN-20 |

**Flujo principal**

1. El sistema muestra la lista de parqueos activos.
2. El guarda elige el parqueo donde está de turno.
3. El sistema guarda la selección y muestra el panel de acceso de ese parqueo: botones de entrada y salida, fila, ocupación por zona y reservas del día.

**Flujos alternos**

- **1a. Solo hay un parqueo activo.** El sistema lo selecciona automáticamente.
- **2a. El guarda cambia de parqueo a mitad del turno.** El sistema cambia la selección; los registros anteriores conservan el parqueo donde se hicieron.

---

## CU-12 Registrar entrada por QR

| Campo | Detalle |
|---|---|
| Actor principal | Guarda |
| Actores secundarios | Miembro o invitado (presenta el QR) |
| Prioridad | Must |
| Disparador | Un vehículo llega al acceso y la persona presenta su QR. |
| Precondiciones | El guarda seleccionó el parqueo del turno. |
| Postcondiciones | Existe un movimiento abierto con placa, persona, parqueo, zona, guarda y hora de entrada; la disponibilidad se actualiza. |
| Reglas | RN-01, RN-02, RN-03, RN-04, RN-05, RN-09, RN-13, RN-14 |
| Incluye | CU-36 |
| Extendido por | CU-13 (cuando el QR no sirve) |

**Flujo principal (miembro)**

1. El guarda elige "Entrada" y escanea el QR con la cámara del dispositivo.
2. El sistema identifica la tarjeta de un miembro activo.
3. El sistema muestra nombre, tipo de persona y los vehículos registrados del miembro, con el principal seleccionado.
4. El guarda confirma la placa con la que llegó o elige otra de la lista.
5. El sistema verifica que esa placa no tenga un movimiento abierto (RN-01).
6. El sistema sugiere la zona del parqueo que admite al tipo de persona, al tamaño del vehículo y, si aplica, la condición preferencial, y que tenga cupo (CU-36).
7. El guarda acepta la zona sugerida o elige otra.
8. El sistema registra el movimiento con la hora actual y actualiza la disponibilidad.

**Flujo principal (invitado con reserva)**

1. El guarda elige "Entrada" y escanea el QR.
2. El sistema identifica una reserva confirmada.
3. El sistema verifica que la reserva sea de este parqueo y que la hora actual esté dentro de la ventana de entrada (RN-09).
4. El sistema muestra nombre, identificación, placa, tamaño y zona reservada.
5. El guarda confirma que la placa coincide.
6. El sistema marca la reserva como **usada**, registra el movimiento en la zona reservada y actualiza la disponibilidad.

**Flujos alternos**

- **1a. La cámara no lee el QR.** El guarda digita el código corto de 6 caracteres y el flujo sigue en el paso 2.
- **2a. QR inválido, regenerado o de una cuenta pendiente, rechazada o desactivada.** El sistema lo informa; el guarda puede continuar con CU-13.
- **4a (miembro). La placa no está entre sus vehículos.** El sistema no permite usar la tarjeta para esa placa (RN-14); el guarda continúa con CU-13.
- **5a. La placa ya tiene un movimiento abierto.** El sistema indica en qué parqueo y desde qué hora figura dentro. El guarda puede registrar la salida pendiente (CU-14) o anular el registro equivocado (CU-18) antes de continuar.
- **6a. No hay zona con cupo compatible.** El sistema muestra la advertencia de sobrecupo (RN-05); el guarda decide si permite la entrada eligiendo una zona o si niega el acceso.
- **3a (invitado). La reserva es de otro parqueo.** El sistema indica el parqueo correcto.
- **3b (invitado). Llega antes de la ventana.** El sistema indica desde qué hora puede entrar.
- **3c (invitado). Llega después de la tolerancia.** La reserva ya está liberada (CU-37); el guarda puede tratarlo como visita sin reserva en CU-13.
- **3d (invitado). Reserva cancelada o ya usada.** El sistema lo informa y no registra la entrada.
- **5a (invitado). La placa no coincide.** El guarda puede actualizar la placa de la reserva si la persona llegó en otro vehículo del mismo tamaño o menor; el cambio queda auditado.

---

## CU-13 Registrar entrada manual

| Campo | Detalle |
|---|---|
| Actor principal | Guarda |
| Prioridad | Must |
| Disparador | La persona no tiene QR, el QR no sirve o llega una visita sin reserva. |
| Precondiciones | El guarda seleccionó el parqueo del turno. |
| Postcondiciones | Existe un movimiento abierto y la disponibilidad se actualiza. |
| Reglas | RN-01, RN-02, RN-03, RN-05, RN-17, RN-18 |
| Incluye | CU-36 |

**Flujo principal**

1. El guarda elige "Entrada manual".
2. El guarda ingresa el origen de la placa (nacional o extranjera) y la placa.
3. El sistema valida el formato y que la placa no tenga un movimiento abierto.
4. El sistema busca la placa entre los vehículos de miembros activos.
5. Si la encuentra, precarga nombre, tipo de persona y tamaño; si no, solicita nombre, tipo y número de identificación y tamaño del vehículo, y asigna el tipo **visita sin reserva**.
6. El sistema sugiere una zona compatible con cupo.
7. El guarda acepta la zona o elige otra.
8. El sistema registra el movimiento con la hora actual, marcado como **entrada manual**, y actualiza la disponibilidad.

**Flujos alternos**

- **3a. Formato de placa inválido.** El sistema señala el campo y muestra los formatos aceptados.
- **3b. La placa ya tiene un movimiento abierto.** Igual que CU-12, 5a.
- **4a. La placa pertenece a varios miembros.** El sistema muestra los nombres y el guarda elige a la persona que conduce.
- **5a. Placa extranjera.** El sistema solicita además el país.
- **6a. Visita sin reserva y sin cupo en zonas de visitas.** El sistema muestra la advertencia de sobrecupo (RN-05); el guarda decide si permite la entrada.

---

## CU-14 Registrar salida

| Campo | Detalle |
|---|---|
| Actor principal | Guarda |
| Prioridad | Must |
| Disparador | Un vehículo sale por el acceso. |
| Precondiciones | El guarda seleccionó el parqueo del turno. |
| Postcondiciones | El movimiento queda cerrado con la hora de salida y el cupo se libera. |
| Reglas | RN-06, RN-16 |
| Incluye | CU-36 |

**Flujo principal**

1. El guarda elige "Salida".
2. El guarda escanea el QR de la persona o escribe parte de la placa.
3. El sistema muestra los vehículos dentro del parqueo que coinciden.
4. El guarda elige el vehículo y confirma la salida.
5. El sistema cierra el movimiento con la hora actual y actualiza la disponibilidad.

**Flujos alternos**

- **3a. El QR es de un miembro con más de un vehículo dentro.** El sistema muestra esos vehículos y el guarda elige cuál sale.
- **3b. La placa figura dentro de otro parqueo.** El sistema lo indica; el guarda puede cerrar ese movimiento igualmente y el cierre queda auditado con el parqueo real de salida.
- **3c. La placa no tiene ningún movimiento abierto.** El sistema lo informa y no registra nada.

---

## CU-15 Buscar vehículo

| Campo | Detalle |
|---|---|
| Actores principales | Guarda (también admin y super admin) |
| Prioridad | Must |
| Disparador | Alguien necesita ubicar un vehículo o a su dueño. |
| Precondiciones | Sesión iniciada con rol de guarda o superior. |
| Postcondiciones | Ninguna; el caso solo consulta. |
| Reglas | RN-15 |

**Flujo principal**

1. El usuario elige "Buscar" y escribe una placa o un número de identificación, completo o parcial.
2. El sistema muestra primero los movimientos abiertos que coinciden (parqueo, zona, hora de entrada, nombre) y luego los movimientos cerrados de los últimos 90 días.
3. El usuario abre un resultado para ver el detalle, incluido el guarda que registró la entrada y la salida.

**Flujos alternos**

- **2a. Sin resultados.** El sistema lo indica.
- **2b. La placa pertenece a un miembro sin movimientos.** El sistema muestra el miembro dueño del vehículo para que se le pueda contactar por los canales de la universidad.

---

## CU-16 Ver vehículos dentro y reservas del día

| Campo | Detalle |
|---|---|
| Actor principal | Guarda |
| Prioridad | Must |
| Disparador | El guarda abre la lista del parqueo. |
| Precondiciones | El guarda seleccionó el parqueo del turno. |
| Postcondiciones | Ninguna; el caso solo consulta. |
| Reglas | RN-06, RN-07 |

**Flujo principal**

1. El guarda abre "Dentro ahora".
2. El sistema lista los vehículos con movimiento abierto en el parqueo, agrupados por zona, con placa, nombre, tipo de persona y hora de entrada.
3. El guarda cambia a la pestaña "Reservas de hoy".
4. El sistema lista las reservas del parqueo para el día con franja, nombre, placa, zona y estado: **pendiente**, **usada**, **no se presentó** o **cancelada**.

**Flujos alternos**

- **2a. El guarda filtra por zona o escribe parte de una placa.** El sistema reduce la lista.
- **4a. No hay reservas para hoy.** El sistema lo indica.

---

## CU-17 Actualizar fila

| Campo | Detalle |
|---|---|
| Actor principal | Guarda |
| Prioridad | Must |
| Disparador | Cambia la cantidad de vehículos esperando en el acceso. |
| Precondiciones | El guarda seleccionó el parqueo del turno. |
| Postcondiciones | La tarjeta del parqueo muestra la fila actualizada y la hora del cambio. |
| Reglas | — |

**Flujo principal**

1. El guarda toca "+" o "−" en el contador de fila del panel.
2. El sistema actualiza el contador y la hora del último cambio, que se reflejan en CU-01.

**Flujos alternos**

- **1a. La fila se despejó.** El guarda toca "Reiniciar" y el contador vuelve a 0.
- **1b. El contador está en 0 y el guarda toca "−".** El sistema no baja de 0.
- **2a. La fila no se actualiza en 15 minutos o más.** CU-01 muestra la fila con la hora del último cambio para que la persona sepa que el dato puede estar desactualizado.

---

## CU-18 Anular registro

| Campo | Detalle |
|---|---|
| Actor principal | Guarda (también admin y super admin) |
| Prioridad | Must |
| Disparador | Se registró una entrada o salida por error. |
| Precondiciones | El movimiento pertenece al parqueo del turno y es del día actual. |
| Postcondiciones | El movimiento queda **anulado** (no se borra), la disponibilidad se recalcula y la anulación queda en la auditoría. |
| Reglas | RN-16 |
| Incluye | CU-36 |

**Flujo principal**

1. El guarda localiza el movimiento en CU-15 o CU-16.
2. El guarda elige "Anular" y escribe el motivo.
3. El sistema marca el movimiento como anulado y guarda quién, cuándo y por qué.
4. El sistema recalcula la disponibilidad.

**Flujos alternos**

- **1a. El movimiento es de un día anterior o de otro parqueo.** Solo un admin o super admin puede anularlo.
- **2a. El motivo está vacío.** El sistema no permite continuar.
- **3a. El movimiento venía de una reserva.** La reserva vuelve a **pendiente** si todavía está dentro de su ventana; si no, pasa a **no se presentó**.
- **3b. Solo se equivocó la salida.** El guarda elige "Anular salida"; el sistema reabre el movimiento sin anular la entrada.
