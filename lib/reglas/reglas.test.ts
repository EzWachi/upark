import { describe, expect, it } from "vitest";
import { normalizarPlaca, placaValida } from "./placa";
import { identificacionValida } from "./identificacion";
import {
  cupoSugerido,
  cuposSinReservar,
  dentroDeVentana,
  disponibilidadZona,
  estadoReserva,
  finDelDiaCR,
  inicioDelDiaCR,
  libresParaPublico,
  nivelOcupacion,
  puedeUsarCupo,
} from "./disponibilidad";

const cero = { moto: 0, sedan: 0, suv: 0, grande: 0 };
const inicio = new Date("2026-11-10T14:00:00Z");
const min = (m: number) => new Date(inicio.getTime() + m * 60_000);

describe("placa (RN-18)", () => {
  it("normaliza", () => expect(normalizarPlaca(" abc-123 ")).toBe("ABC123"));
  it("acepta formatos nacionales", () => {
    for (const p of ["123456", "ABC-123", "MOT 123456", "CL 12345"]) {
      expect(placaValida(p, "nacional")).toBe(true);
    }
  });
  it("rechaza basura nacional", () => {
    for (const p of ["", "1234567", "ABCDE1", "12AB"]) expect(placaValida(p, "nacional")).toBe(false);
  });
  it("extranjera es libre pero alfanumérica", () => {
    expect(placaValida("P-123ABC", "extranjera")).toBe(true);
    expect(placaValida("@@", "extranjera")).toBe(false);
  });
});

describe("identificación (RN-17)", () => {
  it("cédula de 9 dígitos, con o sin guiones", () => {
    expect(identificacionValida("cedula", "1-2345-6789")).toBe(true);
    expect(identificacionValida("cedula", "12345678")).toBe(false);
  });
  it("DIMEX de 11 o 12 dígitos", () => {
    expect(identificacionValida("dimex", "123456789012")).toBe(true);
    expect(identificacionValida("dimex", "1234567890")).toBe(false);
  });
  it("pasaporte alfanumérico", () => expect(identificacionValida("pasaporte", "ab123456")).toBe(true));
});

describe("tamaños (RN-02)", () => {
  it("moto solo con moto", () => {
    expect(puedeUsarCupo("moto", "moto")).toBe(true);
    expect(puedeUsarCupo("moto", "sedan")).toBe(false);
    expect(puedeUsarCupo("sedan", "moto")).toBe(false);
  });
  it("igual o mayor", () => {
    expect(puedeUsarCupo("sedan", "grande")).toBe(true);
    expect(puedeUsarCupo("grande", "suv")).toBe(false);
  });
  it("sugiere el cupo más pequeño con espacio", () => {
    expect(cupoSugerido("sedan", { ...cero, sedan: 0, suv: 2, grande: 1 })).toBe("suv");
    expect(cupoSugerido("grande", { ...cero, sedan: 5 })).toBeNull();
  });
});

describe("disponibilidad (RN-06)", () => {
  it("resta ocupados, reservados y apartados sin reservar", () => {
    const r = disponibilidadZona({
      cupos: { moto: 4, sedan: 10, suv: 2, grande: 0 },
      ocupados: { ...cero, sedan: 3 },
      reservados: { ...cero, suv: 1 },
      apartadosSinReservar: 2,
    });
    expect(r.porTamano).toEqual({ moto: 4, sedan: 7, suv: 1, grande: 0 });
    expect(r.total).toBe(10);
  });
  it("el público no ve negativos", () => expect(libresParaPublico(-3)).toBe(0));
  it("semáforo por ocupación (CU-01)", () => {
    expect(nivelOcupacion(36, 100)).toBe("libre");
    expect(nivelOcupacion(35, 100)).toBe("llenandose");
    expect(nivelOcupacion(11, 100)).toBe("llenandose");
    expect(nivelOcupacion(10, 100)).toBe("lleno");
    expect(nivelOcupacion(0, 100)).toBe("lleno");
    expect(nivelOcupacion(-2, 100)).toBe("lleno");
    expect(nivelOcupacion(0, 0)).toBe("lleno");
  });
  it("fin del día en hora de Costa Rica", () => {
    // 2026-11-10 23:00 en CR es 2026-11-11 05:00 UTC: sigue siendo el día 10.
    expect(finDelDiaCR(new Date("2026-11-11T05:00:00Z")).toISOString()).toBe("2026-11-11T05:59:59.999Z");
  });
  it("inicio del día en hora de Costa Rica", () => {
    expect(inicioDelDiaCR(new Date("2026-11-11T05:00:00Z")).toISOString()).toBe("2026-11-10T06:00:00.000Z");
  });
});

describe("reservas (RN-07, RN-09, CU-37)", () => {
  it("ventana: 15 min antes hasta 30 min después", () => {
    expect(dentroDeVentana(inicio, min(-16))).toBe(false);
    expect(dentroDeVentana(inicio, min(-15))).toBe(true);
    expect(dentroDeVentana(inicio, min(30))).toBe(true);
    expect(dentroDeVentana(inicio, min(31))).toBe(false);
  });
  it("confirmada pasa a no_se_presento tras la tolerancia", () => {
    expect(estadoReserva("confirmada", inicio, min(30))).toBe("confirmada");
    expect(estadoReserva("confirmada", inicio, min(31))).toBe("no_se_presento");
    expect(estadoReserva("usada", inicio, min(90))).toBe("usada");
  });
  it("cupos sin reservar se liberan al cerrar inscripción, vencer o cancelar", () => {
    const inv = { cupos: 30, inicio_at: inicio, inscripcion_hasta: min(-60), cancelada_at: null };
    expect(cuposSinReservar(inv, 12, min(-120))).toBe(18);
    expect(cuposSinReservar(inv, 12, min(-30))).toBe(0);
    expect(cuposSinReservar({ ...inv, inscripcion_hasta: inicio }, 12, min(31))).toBe(0);
    expect(cuposSinReservar({ ...inv, cancelada_at: min(-200) }, 0, min(-120))).toBe(0);
  });
});
