# Reglas de negocio

[Volver al README](../README.md) · [Casos de uso](casos-de-uso/README.md)

Reglas que citan los casos de uso. Los valores marcados como **configurable** los define el super admin (CU-33); mientras ese caso no exista, se usa el valor por defecto.

## Ocupación y zonas

| ID | Regla |
|---|---|
| RN-01 | **Placa única dentro.** Una placa no puede tener más de un movimiento abierto, sin importar el parqueo. |
| RN-02 | **Tamaños.** Los tamaños, de menor a mayor, son: moto, sedán/compacto, SUV y grande (4x4 o pickup). Un vehículo puede ocupar un cupo de su tamaño o de uno mayor. Una moto solo ocupa cupos de moto. |
| RN-03 | **Tipos de persona por zona.** Cada zona admite uno o más tipos de persona: estudiante, profesor, funcionario y visita. Una persona solo se asigna a zonas que admiten su tipo. Los invitados y las visitas sin reserva cuentan como tipo "visita". |
| RN-04 | **Preferencial (Ley 7600).** Los cupos de zonas preferenciales son para miembros con la condición preferencial aprobada (CU-23) y para invitados que la declaran en su reserva y la verifica el guarda al llegar (CU-21). Mientras CU-21 y CU-23 no existan, el guarda decide en sitio. |
| RN-05 | **Sobrecupo.** Si no hay cupo compatible, el sistema advierte pero no bloquea: el guarda decide si permite la entrada. El movimiento queda marcado como sobrecupo. |
| RN-06 | **Disponibilidad.** Cupos de la zona y tamaño − movimientos abiertos en esa zona y tamaño − cupos apartados por invitaciones vigentes sin usar. El público nunca ve números negativos. |

## Reservas e invitaciones

| ID | Regla |
|---|---|
| RN-07 | **Cupos apartados.** Una invitación aparta sus cupos (1 si es individual, N si es de evento) desde que se crea hasta que: se usan (entrada registrada), vence la tolerancia, se alcanza la fecha límite de inscripción (solo los no reservados) o se cancela. |
| RN-08 | **Tolerancia.** Tiempo después del inicio de la franja en que se mantiene una reserva sin entrada. 30 minutos por defecto, configurable. |
| RN-09 | **Ventana de entrada.** Una reserva solo se puede usar desde 15 minutos antes del inicio de la franja hasta el inicio más la tolerancia. Configurable. |
| RN-10 | **Enlaces de invitación.** Cada enlace lleva un token único no adivinable, tiene fecha de vencimiento y un tope de cupos (1 para individual). Una identificación solo puede tener una reserva por invitación. Un enlace cancelado o vencido deja de funcionar de inmediato. |

## Cuentas y acceso

| ID | Regla |
|---|---|
| RN-11 | **Correo institucional.** Los miembros se registran solo con correos de los dominios de ULACIT (dominios a confirmar con la universidad). Guardas y administradores pueden usar cualquier correo porque los crea un admin. |
| RN-12 | **Estados de cuenta de miembro.** Sin verificar → pendiente de aprobación → aprobada, rechazada o desactivada. Solo una cuenta aprobada tiene tarjeta virtual y puede registrar vehículos. |
| RN-13 | **QR y código corto.** El QR contiene solo un token opaco, nunca datos personales. Cada QR tiene un código corto de 6 caracteres equivalente. Al regenerar una tarjeta, el token y el código anteriores dejan de funcionar. |
| RN-14 | **QR por persona.** En una entrada por QR, la placa debe pertenecer a los vehículos registrados del miembro. Si no, la entrada se hace como manual (CU-13). Esto evita que una tarjeta prestada sirva para otro vehículo. |
| RN-20 | **Parqueo del turno.** Un guarda solo registra entradas, salidas y anulaciones en el parqueo que seleccionó (CU-11). |
| RN-21 | **Roles.** Super admin > admin > guarda y miembro. Solo un super admin crea o quita admins y super admins. Nadie aprueba su propia cuenta ni se quita su propio rol. Siempre existe al menos un super admin. |

## Datos personales y auditoría

| ID | Regla |
|---|---|
| RN-15 | **Privacidad.** El público y los miembros solo ven cupos. Placas, nombres e identificaciones de otras personas solo los ven guardas, admins y super admins. |
| RN-16 | **Auditoría.** Las anulaciones, los cierres de salida en otro parqueo y los cambios de placa en una reserva guardan quién, cuándo y el motivo. Nada se borra: se marca como anulado. |
| RN-19 | **Consentimiento (Ley 8968).** El registro de miembros y la reserva de invitados exigen aceptar el consentimiento informado de tratamiento de datos, que indica qué datos se piden, para qué, quién los ve y cuánto tiempo se conservan. |

## Formatos

| ID | Regla |
|---|---|
| RN-17 | **Identificación.** Tipos aceptados (formatos a confirmar con la normativa vigente): |
| | Cédula nacional: 9 dígitos. Incluye a costarricenses naturalizados, cuya cédula empieza con 8. |
| | DIMEX (extranjeros residentes): 11 o 12 dígitos. |
| | DIDI (diplomáticos): formato numérico propio. |
| | Pasaporte (extranjeros no residentes): alfanumérico, de 6 a 20 caracteres, con país emisor. |
| RN-18 | **Placa.** Nacional: se valida contra los formatos vigentes de Costa Rica (particular numérica, alfanumérica y placas especiales; lista a confirmar). Extranjera: alfanumérica libre, con país. Las placas se guardan en mayúsculas y sin espacios ni guiones para poder buscarlas. |

## Supuestos

Valores por defecto que tomó el equipo y que conviene validar:

- La tolerancia es de 30 minutos y la ventana de entrada abre 15 minutos antes de la franja.
- Un miembro registra como máximo 5 vehículos.
- Los movimientos cerrados se pueden consultar durante 90 días; después se borran los datos personales (CU-40).
- Los movimientos que quedan abiertos se cierran solos a medianoche (CU-39).
- Una misma placa puede estar registrada en varias cuentas (vehículo familiar).
- Los guardas usan un teléfono o tableta con cámara y conexión a internet en el acceso.

## Pendientes con la administración

- Cantidad de parqueos, sus zonas y la capacidad de cada zona por tamaño.
- Qué zonas corresponden a estudiantes, profesores, funcionarios y visitas.
- Dominios de correo institucional válidos.
- Cobertura de red en cada acceso.
- Quién coordina las invitaciones del consultorio dental y de los eventos (base para el rol de organizador, CU-35).
