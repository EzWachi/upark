# Casos de uso: sistema

[Volver al catálogo](README.md) · [Reglas de negocio](../reglas-de-negocio.md)

Estos casos no los inicia una persona: los dispara otro caso de uso o el paso del tiempo.

---

## CU-36 Calcular disponibilidad

| Campo | Detalle |
|---|---|
| Actor principal | Sistema |
| Prioridad | Must |
| Disparador | Una consulta de disponibilidad (CU-01), una entrada o salida (CU-12, CU-13, CU-14), una anulación (CU-18), un cambio de zona (CU-31) o una invitación nueva o cancelada (CU-25, CU-26, CU-27). |
| Precondiciones | La zona existe y está activa. |
| Postcondiciones | Se obtienen los cupos disponibles por zona y tamaño, y el total por parqueo. |
| Reglas | RN-02, RN-06, RN-07 |

**Flujo principal**

1. Para cada zona y tamaño, el sistema toma los cupos configurados.
2. Resta los movimientos abiertos (no anulados) de vehículos de ese tamaño en la zona.
3. Resta los cupos apartados por invitaciones cuya franja está vigente o por empezar ese día, que todavía no se han usado ni liberado (RN-07).
4. El resultado es la disponibilidad de la zona para ese tamaño; la suma de zonas es el total del parqueo.

**Flujos alternos**

- **2a. Un vehículo ocupa un cupo de tamaño mayor (RN-02).** El movimiento resta del tamaño del cupo que ocupa, no del tamaño del vehículo. La zona del movimiento guarda el tamaño de cupo usado.
- **4a. El resultado es negativo (sobrecupo).** El sistema muestra 0 al público y el número real negativo al guarda y a la administración.

---

## CU-37 Liberar cupos vencidos

| Campo | Detalle |
|---|---|
| Actor principal | Sistema |
| Prioridad | Must |
| Disparador | Pasa la tolerancia después del inicio de una franja reservada, o se alcanza la fecha límite de inscripción de un evento. |
| Precondiciones | Existe una invitación con cupos apartados sin usar. |
| Postcondiciones | Los cupos no usados vuelven a estar disponibles y las reservas sin entrada quedan como **no se presentó**. |
| Reglas | RN-07, RN-08 |

**Flujo principal**

1. Al pasar el inicio de la franja más la tolerancia (30 minutos por defecto), el sistema identifica las reservas confirmadas sin entrada.
2. Las marca como **no se presentó**.
3. Libera los cupos de esas reservas y los cupos de la invitación que nadie reservó.
4. La disponibilidad (CU-36) refleja el cambio.

**Flujos alternos**

- **1a. Se alcanza la fecha límite de inscripción de un evento.** El sistema cierra el enlace y libera los cupos que nadie reservó; las reservas confirmadas mantienen su cupo hasta la tolerancia.

Nota de implementación: este caso no requiere una tarea programada. El estado de cada reserva puede calcularse a partir de la hora actual en cada consulta, lo que evita depender de un proceso en segundo plano.

---

## CU-38 Enviar correo

| Campo | Detalle |
|---|---|
| Actor principal | Sistema |
| Actor secundario | Servicio de correo |
| Prioridad | Must |
| Disparador | Otro caso de uso necesita notificar a una persona. |
| Precondiciones | La persona tiene un correo registrado. |
| Postcondiciones | El correo queda enviado o el fallo queda registrado. |
| Reglas | RN-15 |

Correos que envía el sistema:

| Correo | Lo dispara |
|---|---|
| Verificación de cuenta | CU-02 |
| Recuperación de contraseña | CU-03 |
| Aprobación o rechazo de cuenta | CU-22 |
| Acceso para guarda o administrador nuevo | CU-24, CU-32 |
| Enlace de invitación individual | CU-25 |
| QR de la reserva | CU-09 |
| Cancelación de invitación o reserva | CU-27 |

**Flujo principal**

1. El caso que dispara el envío entrega el destinatario, la plantilla y los datos.
2. El sistema arma el correo desde la plantilla.
3. El sistema lo entrega al servicio de correo.
4. El sistema registra el envío.

**Flujos alternos**

- **3a. El servicio de correo falla.** El sistema reintenta hasta 3 veces con espera creciente; si sigue fallando, registra el error y lo muestra en la pantalla de la invitación o de la cuenta para que un admin pueda reenviarlo.
- **3b. La dirección rebota.** El sistema registra el rebote y lo marca en la cuenta o la reserva.
