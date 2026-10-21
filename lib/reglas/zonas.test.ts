import { describe, expect, it } from "vitest";
import { esquemaZona, maxCuposSolapados, validarCambioZona, validarEstadoParqueo } from "./zonas";

const h = (hora: number) => new Date(Date.UTC(2026, 10, 10, hora));
const base = {
  nombre: "A",
  tipos_permitidos: ["estudiante"],
  preferencial: false,
  reservable: false,
  cupos_moto: "0",
  cupos_sedan: "10",
  cupos_suv: "0",
  cupos_grande: "0",
};
const cambio = {
  nuevoTotal: 10,
  ocupados: 0,
  apartadosMax: 0,
  invitacionesFuturas: 0,
  reservable: true,
  activa: true,
  movimientosAbiertos: 0,
  ultimaZonaActivaDeParqueoActivo: false,
};

describe("esquema de zona (CU-31)", () => {
  it("acepta una zona válida y convierte los cupos a número", () => {
    expect(esquemaZona.parse(base).cupos_sedan).toBe(10);
  });
  it("exige al menos un tipo de persona", () => {
    expect(esquemaZona.safeParse({ ...base, tipos_permitidos: [] }).success).toBe(false);
  });
  it("exige al menos un cupo", () => {
    expect(esquemaZona.safeParse({ ...base, cupos_sedan: "0" }).success).toBe(false);
  });
  it("rechaza cupos negativos o decimales", () => {
    expect(esquemaZona.safeParse({ ...base, cupos_moto: "-1" }).success).toBe(false);
    expect(esquemaZona.safeParse({ ...base, cupos_moto: "1.5" }).success).toBe(false);
  });
});

describe("cupos solapados", () => {
  it("suma solo las franjas que se cruzan", () => {
    expect(
      maxCuposSolapados([
        { inicio_at: h(8), fin_at: h(10), cupos: 5 },
        { inicio_at: h(9), fin_at: h(11), cupos: 3 },
        { inicio_at: h(12), fin_at: h(13), cupos: 6 },
      ]),
    ).toBe(8);
  });
  it("franjas contiguas no se solapan", () => {
    expect(
      maxCuposSolapados([
        { inicio_at: h(8), fin_at: h(10), cupos: 5 },
        { inicio_at: h(10), fin_at: h(12), cupos: 5 },
      ]),
    ).toBe(5);
  });
  it("sin invitaciones es 0", () => expect(maxCuposSolapados([])).toBe(0));
});

describe("cambios de zona (CU-31, 4a a 4c)", () => {
  it("sobrecupo es aviso, no error", () => {
    const r = validarCambioZona({ ...cambio, nuevoTotal: 3, ocupados: 5 });
    expect(r.error).toBeNull();
    expect(r.aviso).toMatch(/sobrecupo/);
  });
  it("no baja de lo apartado por invitaciones", () => {
    expect(validarCambioZona({ ...cambio, nuevoTotal: 4, apartadosMax: 6 }).error).toMatch(/apartan/);
  });
  it("no quita reservable con invitaciones futuras", () => {
    expect(validarCambioZona({ ...cambio, reservable: false, invitacionesFuturas: 1 }).error).toMatch(/reservable/);
  });
  it("no desactiva con vehículos dentro", () => {
    expect(validarCambioZona({ ...cambio, activa: false, movimientosAbiertos: 1 }).error).toMatch(/desactivar/);
  });
  it("no deja un parqueo activo sin zonas", () => {
    expect(validarCambioZona({ ...cambio, activa: false, ultimaZonaActivaDeParqueoActivo: true }).error).toMatch(/última/);
  });
});

describe("estado de parqueo (CU-30)", () => {
  const p = { activar: true, zonasActivas: 1, movimientosAbiertos: 0, invitacionesFuturas: 0 };
  it("activar exige una zona activa", () => {
    expect(validarEstadoParqueo({ ...p, zonasActivas: 0 })).toMatch(/zona/);
    expect(validarEstadoParqueo(p)).toBeNull();
  });
  it("desactivar exige que no haya vehículos ni invitaciones futuras", () => {
    expect(validarEstadoParqueo({ ...p, activar: false, movimientosAbiertos: 2 })).toMatch(/vehículos/);
    expect(validarEstadoParqueo({ ...p, activar: false, invitacionesFuturas: 1 })).toMatch(/invitaciones/);
    expect(validarEstadoParqueo({ ...p, activar: false })).toBeNull();
  });
});
