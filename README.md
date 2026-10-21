# UPark

Sistema de gestión y consulta de parqueos universitarios de ULACIT.

Hoy los guardas anotan cada ingreso en una bitácora de papel y nadie más puede consultar cuántos espacios quedan. UPark digitaliza ese registro, publica la disponibilidad por parqueo y zona, permite a estudiantes y profesores entrar con una tarjeta virtual (QR) y deja que las visitas reserven un cupo por medio de un enlace de invitación.

Proyecto del curso **16-0629 Metodologías Ágiles de Desarrollo** (ULACIT, III cuatrimestre 2026).

## Equipo

- Deran Chavarria Gutierrez
- Anthony Vargas Agruedas
- Jose Dias Bandres
- John Castillo Aguilar

## Documentación

| Documento | Contenido |
|---|---|
| [Casos de uso](docs/casos-de-uso/README.md) | Actores, diagrama y catálogo completo con prioridades |
| [Público, miembros e invitados](docs/casos-de-uso/publico-miembros-invitados.md) | CU-01 a CU-05, CU-08, CU-09 |
| [Guarda](docs/casos-de-uso/guarda.md) | CU-11 a CU-18 |
| [Administración](docs/casos-de-uso/administracion.md) | CU-22, CU-24 a CU-27, CU-30 a CU-32 |
| [Sistema](docs/casos-de-uso/sistema.md) | CU-36 a CU-38 |
| [Reglas de negocio](docs/reglas-de-negocio.md) | Reglas RN-xx, supuestos y pendientes |
| [Decisiones](docs/decisiones/) | Registro de decisiones de arquitectura (ADR), empezando por el [stack](docs/decisiones/0001-stack.md) |

## Desarrollo

Requisitos: Node 22 y PostgreSQL.

```bash
npm install
cp .env.example .env        # completar DATABASE_URL, AUTH_SECRET y el super admin
npx prisma migrate dev      # crea las tablas
npx prisma db seed          # super admin y un parqueo de ejemplo
npm run dev
```

| Comando | Qué hace |
|---|---|
| `npm run dev` | Servidor de desarrollo en http://localhost:3000 |
| `npm test` | Pruebas de las reglas de negocio (`lib/reglas`) |
| `npm run build` | Build de producción |

Estructura:

| Carpeta | Contenido |
|---|---|
| `app/` | Páginas: inicio pública (CU-01), login, y las áreas `cuenta`, `guarda` y `admin` |
| `lib/reglas/` | Reglas de negocio puras con sus pruebas (RN-02, RN-06, RN-07, RN-09, RN-17, RN-18) |
| `lib/consultas/` | Consultas a la base que usan esas reglas |
| `lib/auth/` | Auth.js y control de acceso por rol (RN-21) |
| `prisma/` | Schema, migraciones y seed |

## Estado

- Casos de uso **Must** especificados.
- Esqueleto funcionando: modelo de datos completo, migración inicial (con el índice de RN-01), login por rol, áreas protegidas y disponibilidad pública (CU-01).
- Pendiente: el resto de los casos de uso.
