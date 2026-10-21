# Casos de uso de UPark

Este documento reúne los actores, el diagrama general y el catálogo de casos de uso. Las especificaciones detalladas de los casos **Must** están en los archivos de cada área; las reglas que citan (RN-xx) están en [reglas de negocio](../reglas-de-negocio.md).

Prioridades (MoSCoW):

- **Must:** entra en el prototipo del cuatrimestre.
- **Should:** entra si el tiempo alcanza.
- **Could:** ampliación futura.

## Actores

| Actor | Descripción |
|---|---|
| Público | Cualquier persona sin sesión. Solo consulta disponibilidad. |
| Miembro | Estudiante, profesor o funcionario de ULACIT con cuenta aprobada. Registra sus vehículos y entra con su tarjeta virtual. |
| Invitado | Persona externa (visita, evento, consultorio dental) que recibe un enlace de invitación y reserva un cupo. No tiene cuenta. |
| Guarda | Opera el acceso de un parqueo: registra entradas y salidas, busca vehículos y actualiza la fila. |
| Admin | Aprueba miembros, gestiona guardas y crea invitaciones. |
| Super admin | Todo lo del admin, más la configuración de parqueos, zonas, cupos y administradores. |
| Organizador | Profesor o doctor que coordina una actividad y genera invitaciones. **A definir; fuera de esta fase.** |
| Sistema | Procesos automáticos: cálculo de disponibilidad, liberación de cupos y envío de correos. |

El super admin hereda todos los casos del admin. Miembro, guarda, admin y super admin comparten el caso de inicio de sesión (CU-03).

## Diagrama

```mermaid
flowchart LR
    publico["Público"]
    miembro["Miembro"]
    invitado["Invitado"]
    guarda["Guarda"]
    admin["Admin"]
    superadmin["Super admin"]
    sistema["Sistema"]

    subgraph UPark["Sistema UPark"]
        direction TB
        subgraph consulta["Consulta y cuenta"]
            CU01(["CU-01 Consultar disponibilidad"])
            CU02(["CU-02 Registrarse"])
            CU03(["CU-03 Iniciar sesión y recuperar contraseña"])
            CU04(["CU-04 Gestionar mis vehículos"])
            CU05(["CU-05 Mostrar tarjeta virtual"])
        end
        subgraph visitas["Invitaciones"]
            CU08(["CU-08 Reservar cupo por enlace"])
            CU09(["CU-09 Recibir QR de reserva"])
        end
        subgraph acceso["Control de acceso"]
            CU11(["CU-11 Seleccionar parqueo del turno"])
            CU12(["CU-12 Registrar entrada por QR"])
            CU13(["CU-13 Registrar entrada manual"])
            CU14(["CU-14 Registrar salida"])
            CU15(["CU-15 Buscar vehículo"])
            CU16(["CU-16 Ver vehículos dentro y reservas"])
            CU17(["CU-17 Actualizar fila"])
            CU18(["CU-18 Anular registro"])
        end
        subgraph gestion["Administración"]
            CU22(["CU-22 Aprobar miembros"])
            CU24(["CU-24 Gestionar guardas"])
            CU25(["CU-25 Crear invitación individual"])
            CU26(["CU-26 Crear invitación de evento"])
            CU27(["CU-27 Ver y cancelar invitaciones"])
            CU30(["CU-30 Gestionar parqueos"])
            CU31(["CU-31 Gestionar zonas y cupos"])
            CU32(["CU-32 Gestionar administradores"])
        end
        subgraph auto["Procesos automáticos"]
            CU36(["CU-36 Calcular disponibilidad"])
            CU37(["CU-37 Liberar cupos vencidos"])
            CU38(["CU-38 Enviar correo"])
        end
    end

    publico --- CU01
    publico --- CU02
    miembro --- CU01
    miembro --- CU03
    miembro --- CU04
    miembro --- CU05
    invitado --- CU08
    invitado --- CU09
    guarda --- CU03
    guarda --- CU11
    guarda --- CU12
    guarda --- CU13
    guarda --- CU14
    guarda --- CU15
    guarda --- CU16
    guarda --- CU17
    guarda --- CU18
    admin --- CU03
    admin --- CU22
    admin --- CU24
    admin --- CU25
    admin --- CU26
    admin --- CU27
    superadmin -. hereda .-> admin
    superadmin --- CU30
    superadmin --- CU31
    superadmin --- CU32
    sistema --- CU36
    sistema --- CU37
    sistema --- CU38

    CU08 -. include .-> CU09
    CU09 -. include .-> CU38
    CU12 -. extend .-> CU13
    CU12 -. include .-> CU36
    CU13 -. include .-> CU36
```

Notas del diagrama:

- `include`: el caso siempre ejecuta el otro (por ejemplo, reservar siempre genera el QR).
- `extend`: el caso puede derivar en el otro (si el QR falla, el guarda pasa a la entrada manual).
- Solo aparecen los casos **Must**. Los demás están en el catálogo.

## Catálogo completo

### Público

| ID | Caso | Prioridad |
|---|---|---|
| CU-01 | Consultar disponibilidad por parqueo y zona | Must |

### Miembro

| ID | Caso | Prioridad |
|---|---|---|
| CU-02 | Registrarse con correo institucional | Must |
| CU-03 | Iniciar y cerrar sesión, recuperar contraseña | Must |
| CU-04 | Gestionar mis vehículos | Must |
| CU-05 | Mostrar mi tarjeta virtual (QR) | Must |
| CU-06 | Solicitar condición preferencial | Should |
| CU-07 | Ver mi historial de ingresos | Could |

### Invitado

| ID | Caso | Prioridad |
|---|---|---|
| CU-08 | Reservar cupo por enlace de invitación | Must |
| CU-09 | Recibir el QR de la reserva | Must |
| CU-10 | Cancelar mi reserva | Should |

### Guarda

| ID | Caso | Prioridad |
|---|---|---|
| CU-11 | Seleccionar el parqueo del turno | Must |
| CU-12 | Registrar entrada por QR | Must |
| CU-13 | Registrar entrada manual | Must |
| CU-14 | Registrar salida | Must |
| CU-15 | Buscar vehículo por placa o identificación | Must |
| CU-16 | Ver vehículos dentro y reservas del día | Must |
| CU-17 | Actualizar la fila | Must |
| CU-18 | Anular un registro | Must |
| CU-19 | Ajustar la ocupación a mano | Should |
| CU-20 | Registro diferido tras una caída | Should |
| CU-21 | Verificar condición preferencial de una visita | Should |

### Admin

| ID | Caso | Prioridad |
|---|---|---|
| CU-22 | Aprobar o rechazar miembros | Must |
| CU-23 | Aprobar condición preferencial | Should |
| CU-24 | Gestionar guardas | Must |
| CU-25 | Crear invitación individual | Must |
| CU-26 | Crear invitación de evento | Must |
| CU-27 | Ver y cancelar invitaciones y reservas | Must |
| CU-28 | Reporte de ocupación por zona y franja | Should |
| CU-29 | Revisar auditoría de anulaciones y ajustes | Should |

### Super admin

| ID | Caso | Prioridad |
|---|---|---|
| CU-30 | Gestionar parqueos | Must |
| CU-31 | Gestionar zonas y cupos | Must |
| CU-32 | Gestionar administradores | Must |
| CU-33 | Configurar parámetros del sistema | Should |
| CU-34 | Editar catálogos de tamaños y tipos de persona | Could |

### Organizador

| ID | Caso | Prioridad |
|---|---|---|
| CU-35 | Generar invitaciones para su actividad | Could |

### Sistema

| ID | Caso | Prioridad |
|---|---|---|
| CU-36 | Calcular disponibilidad por zona y tamaño | Must |
| CU-37 | Liberar cupos vencidos | Must |
| CU-38 | Enviar correos (QR, aprobaciones, invitaciones) | Must |
| CU-39 | Cerrar movimientos abiertos al final del día | Should |
| CU-40 | Borrar datos personales vencidos (Ley 8968) | Should |
| CU-41 | QR rotativo o NFC | Could |
