import { describe, expect, it } from "vitest";
import { cupoAlEntrar, opcionesDeZona, type ZonaConCupos } from "./acceso";

const cero = { moto: 0, sedan: 0, suv: 0, grande: 0 };
const zonas: ZonaConCupos[] = [
  { id: "a", nombre: "A Estudiantes", tipos_permitidos: ["estudiante"], preferencial: false, porTamano: { ...cero, sedan: 5 } },
  { id: "b", nombre: "B Profesores", tipos_permitidos: ["profesor"], preferencial: false, porTamano: { ...cero, sedan: 0, suv: 2 } },
  { id: "c", nombre: "C Visitas", tipos_permitidos: ["visita"], preferencial: false, porTamano: { ...cero, sedan: 0 } },
  { id: "d", nombre: "D Preferencial", tipos_permitidos: ["estudiante", "profesor", "visita"], preferencial: true, porTamano: { ...cero, sedan: 2 } },
];

describe("opciones de zona (CU-13, paso 6)", () => {
  it("sugiere la zona de su tipo con cupo", () => {
    const r = opcionesDeZona(zonas, { tipo: "estudiante", preferencial: false }, "sedan");
    expect(r.sugerida).toBe("a");
    expect(r.opciones[0]).toMatchObject({ id: "a", admite: true, tamanoCupo: "sedan", libres: 5 });
  });
  it("usa un cupo mayor si no hay de su tamaño", () => {
    const r = opcionesDeZona(zonas, { tipo: "profesor", preferencial: false }, "sedan");
    expect(r.sugerida).toBe("b");
    expect(r.opciones[0].tamanoCupo).toBe("suv");
  });
  it("la zona preferencial no admite a quien no tiene la condición (RN-04)", () => {
    const r = opcionesDeZona(zonas, { tipo: "visita", preferencial: false }, "sedan");
    expect(r.opciones.find((o) => o.id === "d")?.admite).toBe(false);
    expect(r.sugerida).toBeNull(); // visitas llena
  });
  it("con condición preferencial sugiere primero la zona preferencial", () => {
    expect(opcionesDeZona(zonas, { tipo: "estudiante", preferencial: true }, "sedan").sugerida).toBe("d");
  });
  it("las zonas que no lo admiten van al final", () => {
    const r = opcionesDeZona(zonas, { tipo: "estudiante", preferencial: false }, "sedan");
    expect(r.opciones.at(-1)?.admite).toBe(false);
  });
});

describe("cupo al entrar (RN-05)", () => {
  it("toma el cupo compatible más pequeño", () => {
    expect(cupoAlEntrar("sedan", { ...cero, suv: 1 })).toEqual({ tamanoCupo: "suv", sobrecupo: false });
  });
  it("sin cupo queda en sobrecupo con su propio tamaño", () => {
    expect(cupoAlEntrar("grande", { ...cero, sedan: 9 })).toEqual({ tamanoCupo: "grande", sobrecupo: true });
  });
});
