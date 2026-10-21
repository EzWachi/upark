# Casos de uso: público, miembros e invitados

[Volver al catálogo](README.md) · [Reglas de negocio](../reglas-de-negocio.md)

---

## CU-01 Consultar disponibilidad

| Campo | Detalle |
|---|---|
| Actor principal | Público (también miembro, invitado y cualquier usuario con sesión) |
| Prioridad | Must |
| Disparador | La persona abre la página de inicio de UPark. |
| Precondiciones | Existe al menos un parqueo activo. |
| Postcondiciones | Ninguna; el caso solo consulta. |
| Reglas | RN-06, RN-15 |

**Flujo principal**

1. La persona abre la página de inicio.
2. El sistema muestra una tarjeta por cada parqueo activo con foto, nombre, espacios disponibles, vehículos en fila y hora de la última actualización.
3. La persona abre una tarjeta.
4. El sistema muestra las zonas del parqueo con sus cupos disponibles por tamaño de vehículo, e indica qué zonas son preferenciales y qué tipos de persona admiten.
5. El sistema actualiza los datos cada 30 segundos mientras la página esté abierta.

**Flujos alternos**

- **2a. Miembro con sesión iniciada.** El sistema ordena primero los parqueos y zonas que admiten su tipo de persona y el tamaño de su vehículo principal.
- **2b. Parqueo sin cupos.** La tarjeta muestra "Lleno" en lugar del número.
- **4a. Zona sin cupos para un tamaño.** El tamaño aparece como "0" y la zona sigue visible.
- **5a. Falla la conexión.** El sistema conserva los últimos datos e indica la hora de la última actualización exitosa.

---

## CU-02 Registrarse

| Campo | Detalle |
|---|---|
| Actor principal | Público (estudiante, profesor o funcionario sin cuenta) |
| Prioridad | Must |
| Disparador | La persona elige "Crear cuenta". |
| Precondiciones | La persona tiene un correo institucional de ULACIT. |
| Postcondiciones | Existe una cuenta de miembro en estado **pendiente de aprobación** con el correo verificado. |
| Reglas | RN-11, RN-12, RN-17, RN-19 |

**Flujo principal**

1. La persona elige "Crear cuenta".
2. El sistema solicita nombre completo, correo institucional, contraseña, tipo y número de identificación, y el tipo de persona que solicita (estudiante, profesor o funcionario).
3. La persona completa los datos y acepta el consentimiento de tratamiento de datos.
4. El sistema valida el dominio del correo, el formato de la identificación y que ni el correo ni la identificación estén registrados.
5. El sistema crea la cuenta en estado **sin verificar** y envía un enlace de verificación al correo (CU-38).
6. La persona abre el enlace.
7. El sistema marca el correo como verificado, pasa la cuenta a **pendiente de aprobación** y le informa que un admin revisará su solicitud (CU-22).

**Flujos alternos**

- **4a. Correo fuera del dominio institucional.** El sistema rechaza el registro e indica que solo se aceptan correos de ULACIT.
- **4b. Correo o identificación ya registrados.** El sistema lo indica y ofrece recuperar la contraseña (CU-03).
- **4c. Formato de identificación inválido.** El sistema señala el campo y muestra el formato esperado según el tipo.
- **3a. No acepta el consentimiento.** El sistema no permite continuar.
- **6a. Enlace vencido (más de 24 horas).** El sistema ofrece reenviar un enlace nuevo.

---

## CU-03 Iniciar sesión, cerrar sesión y recuperar contraseña

| Campo | Detalle |
|---|---|
| Actores principales | Miembro, guarda, admin, super admin |
| Prioridad | Must |
| Disparador | La persona elige "Iniciar sesión" o "Olvidé mi contraseña". |
| Precondiciones | La persona tiene una cuenta con el correo verificado. |
| Postcondiciones | La sesión queda abierta con los permisos de su rol, o la contraseña queda cambiada. |
| Reglas | RN-12, RN-21 |

**Flujo principal (inicio de sesión)**

1. La persona ingresa correo y contraseña.
2. El sistema valida las credenciales y el estado de la cuenta.
3. El sistema abre la sesión y la lleva a la pantalla de su rol: tarjeta virtual (miembro), panel de acceso (guarda) o panel de administración (admin y super admin).
4. Para salir, la persona elige "Cerrar sesión" y el sistema cierra la sesión.

**Flujo principal (recuperar contraseña)**

1. La persona elige "Olvidé mi contraseña" e ingresa su correo.
2. El sistema envía un enlace de cambio de contraseña (CU-38) válido por 1 hora.
3. La persona abre el enlace y define una contraseña nueva.
4. El sistema guarda la contraseña y cierra las demás sesiones abiertas de esa cuenta.

**Flujos alternos**

- **2a. Credenciales incorrectas.** El sistema muestra un mensaje genérico sin indicar cuál dato falló.
- **2b. Cinco intentos fallidos seguidos.** El sistema bloquea el inicio de sesión de esa cuenta durante 15 minutos.
- **2c. Cuenta pendiente de aprobación.** El sistema abre la sesión pero solo muestra el estado de la solicitud; no hay tarjeta virtual.
- **2d. Cuenta rechazada o desactivada.** El sistema no abre la sesión e informa el estado.
- **Recuperar 1a. Correo no registrado.** El sistema muestra el mismo mensaje que si existiera, para no revelar qué correos tienen cuenta.
- **Recuperar 3a. Enlace vencido.** El sistema ofrece enviar uno nuevo.

---

## CU-04 Gestionar mis vehículos

| Campo | Detalle |
|---|---|
| Actor principal | Miembro |
| Prioridad | Must |
| Disparador | El miembro abre "Mis vehículos". |
| Precondiciones | El miembro tiene sesión iniciada y su cuenta está aprobada. |
| Postcondiciones | La lista de vehículos del miembro queda actualizada. |
| Reglas | RN-01, RN-02, RN-18 |

**Flujo principal (agregar)**

1. El miembro abre "Mis vehículos".
2. El sistema muestra sus vehículos registrados.
3. El miembro elige "Agregar vehículo".
4. El sistema solicita origen de la placa (nacional o extranjera), placa, tamaño (moto, sedán/compacto, SUV o grande) y una descripción opcional (marca, modelo, color).
5. El miembro completa los datos.
6. El sistema valida el formato de la placa y que el miembro no supere 5 vehículos.
7. El sistema guarda el vehículo. Si es el primero, lo marca como principal.

**Flujo principal (editar o eliminar)**

1. El miembro elige un vehículo y la acción "Editar" o "Eliminar".
2. El sistema aplica el cambio y actualiza la lista.

**Flujos alternos**

- **4a. Placa extranjera.** El sistema solicita además el país y acepta cualquier formato alfanumérico.
- **6a. Formato de placa nacional inválido.** El sistema señala el campo y muestra los formatos aceptados.
- **6b. Límite de 5 vehículos alcanzado.** El sistema no permite agregar más.
- **6c. La placa ya está registrada en otra cuenta.** El sistema la acepta (por ejemplo, un vehículo familiar) y lo deja indicado para los guardas.
- **Eliminar 1a. El vehículo está dentro de un parqueo.** El sistema no permite eliminarlo hasta que se registre su salida.
- **Editar 1a. Cambio de vehículo principal.** El miembro marca otro vehículo como principal y el sistema desmarca el anterior.

---

## CU-05 Mostrar tarjeta virtual

| Campo | Detalle |
|---|---|
| Actor principal | Miembro |
| Prioridad | Must |
| Disparador | El miembro abre "Mi tarjeta" al llegar al acceso. |
| Precondiciones | El miembro tiene sesión iniciada y su cuenta está aprobada. |
| Postcondiciones | El guarda puede escanear el QR (CU-12). |
| Reglas | RN-12, RN-13 |

**Flujo principal**

1. El miembro abre "Mi tarjeta".
2. El sistema muestra el QR, un código corto de respaldo de 6 caracteres, su nombre y su tipo de persona.
3. El miembro presenta la pantalla al guarda.

**Flujos alternos**

- **2a. Cuenta pendiente de aprobación.** El sistema muestra el estado de la solicitud en lugar del QR.
- **2b. El miembro no tiene vehículos registrados.** El sistema muestra el QR con un aviso de que debe registrar un vehículo (CU-04); sin vehículo, el guarda tendrá que usar la entrada manual.
- **3a. El miembro cree que alguien copió su QR.** Elige "Regenerar tarjeta"; el sistema crea un QR y un código nuevos e invalida los anteriores.
- **3b. El QR no se puede escanear.** El guarda digita el código corto en CU-12.

---

## CU-08 Reservar cupo por enlace de invitación

| Campo | Detalle |
|---|---|
| Actor principal | Invitado |
| Prioridad | Must |
| Disparador | El invitado abre el enlace que recibió. |
| Precondiciones | La invitación existe, está vigente y tiene cupos sin asignar (CU-25 o CU-26). |
| Postcondiciones | Existe una reserva confirmada a nombre del invitado y el cupo queda asignado. |
| Reglas | RN-02, RN-04, RN-10, RN-17, RN-18, RN-19 |
| Incluye | CU-09 |

**Flujo principal**

1. El invitado abre el enlace.
2. El sistema muestra el motivo o nombre del evento, la fecha, la franja horaria, el parqueo y la zona.
3. El sistema solicita nombre completo, correo, tipo y número de identificación, origen y número de placa, tamaño del vehículo y si requiere espacio preferencial.
4. El invitado completa los datos y acepta el consentimiento de tratamiento de datos.
5. El sistema valida los formatos, que esa identificación no tenga ya una reserva en esta invitación y que la zona tenga cupos compatibles con el tamaño del vehículo.
6. El sistema crea la reserva confirmada y ejecuta CU-09.

**Flujos alternos**

- **1a. Enlace inexistente, vencido o cancelado.** El sistema informa que la invitación no está disponible y muestra el contacto de la universidad.
- **1b. Invitación individual con datos precargados.** El sistema muestra el nombre y el correo que indicó el admin; el invitado puede corregirlos.
- **5a. La invitación ya no tiene cupos.** El sistema informa que los cupos se agotaron.
- **5b. La identificación ya tiene una reserva en esta invitación.** El sistema ofrece reenviar el QR al correo registrado en esa reserva, sin mostrarlo en pantalla.
- **5c. No hay cupo compatible con el tamaño del vehículo.** El sistema lo informa y permite cambiar el vehículo.
- **3a. Requiere espacio preferencial.** El sistema asigna un cupo de la zona preferencial asociada, si la invitación tiene una; si no, crea la reserva normal y avisa que el guarda le indicará dónde parquear (RN-04).
- **4a. No acepta el consentimiento.** El sistema no permite continuar.

---

## CU-09 Recibir QR de reserva

| Campo | Detalle |
|---|---|
| Actor principal | Invitado |
| Prioridad | Must |
| Disparador | Se confirma una reserva (CU-08). |
| Precondiciones | Existe una reserva confirmada. |
| Postcondiciones | El invitado tiene el QR en pantalla y en su correo. |
| Reglas | RN-09, RN-13 |
| Incluye | CU-38 |

**Flujo principal**

1. El sistema genera un QR y un código corto de 6 caracteres asociados a la reserva.
2. El sistema muestra la página de confirmación con el QR, el código, la fecha, la franja, el parqueo, la zona y las instrucciones: llegar dentro de la franja y presentar el QR en el acceso.
3. El sistema envía el mismo contenido al correo del invitado (CU-38), junto con un enlace para volver a ver la reserva.

**Flujos alternos**

- **3a. Falla el envío del correo.** La página de confirmación sigue disponible; el sistema reintenta el envío (CU-38) y el invitado puede pedir el reenvío desde el enlace de la invitación (CU-08, 5b).
- **2a. El invitado cierra la página sin guardar el QR.** Lo recupera desde el correo o pidiendo el reenvío.
