import { describe, expect, it } from "vitest";
import { esquemaVehiculo } from "./vehiculos";
import { contenidoQr, interpretarCredencial } from "./credencial";

const base = { origen: "nacional", placa: "abc-123", tamano: "sedan" };

describe("vehículo (CU-04)", () => {
  it("normaliza la placa y deja el país vacío si es nacional", () => {
    expect(esquemaVehiculo.parse({ ...base, pais: "Panamá" })).toMatchObject({ placa: "ABC123", pais: null });
  });
  it("rechaza una placa nacional inválida", () => {
    const r = esquemaVehiculo.safeParse({ ...base, placa: "ABCDE12" });
    expect(r.error?.issues[0].path).toEqual(["placa"]);
  });
  it("una placa extranjera exige país", () => {
    expect(esquemaVehiculo.safeParse({ ...base, origen: "extranjera", placa: "P123ABC" }).success).toBe(false);
    expect(esquemaVehiculo.parse({ ...base, origen: "extranjera", placa: "P-123ABC", pais: "Panamá" }).placa).toBe("P123ABC");
  });
  it("exige un tamaño válido", () => {
    expect(esquemaVehiculo.safeParse({ ...base, tamano: "bus" }).success).toBe(false);
  });
});

describe("credencial (RN-13, CU-12)", () => {
  const token = "a".repeat(32);
  it("reconoce el QR de un miembro y el de una reserva", () => {
    expect(interpretarCredencial(contenidoQr("M", token))).toEqual({ tipo: "miembro", token });
    expect(interpretarCredencial(contenidoQr("R", token))).toEqual({ tipo: "reserva", token });
  });
  it("acepta el código corto digitado con minúsculas o guiones", () => {
    expect(interpretarCredencial(" ab3-k7z ")).toEqual({ tipo: "codigo", codigo: "AB3K7Z" });
  });
  it("rechaza códigos con caracteres ambiguos o QR de otro sistema", () => {
    expect(interpretarCredencial("AB0K1Z")).toBeNull();
    expect(interpretarCredencial("https://otro.sitio/qr")).toBeNull();
    expect(interpretarCredencial("UPARK:X:" + token)).toBeNull();
  });
});
