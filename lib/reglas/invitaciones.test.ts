import { describe, expect, it } from "vitest";
import {
  cabeEnZona,
  cuposLibresEnFranja,
  esquemaInvitacion,
  esquemaReserva,
  estadoInvitacion,
  fechaHoraCR,
  tamanosPermitidos,
  validarFranja,
} from "./invitaciones";

const cero = { moto: 0, sedan: 0, suv: 0, grande: 0 };
const h = (hora: number) => new Date(Date.UTC(2026, 10, 10, hora));

describe("fecha y hora de Costa Rica", () => {
  it("convierte a UTC sumando 6 horas", () => {
    expect(fechaHoraCR("2026-11-10", "08:30")?.toISOString()).toBe("2026-11-10T14:30:00.000Z");
    expect(fechaHoraCR("2026-11-10", "20:00")?.toISOString()).toBe("2026-11-11T02:00:00.000Z");
  });
  it("rechaza formatos inválidos", () => {
    expect(fechaHoraCR("10/11/2026", "08:30")).toBeNull();
    expect(fechaHoraCR("2026-11-10", "")).toBeNull();
  });
});

describe("invitación (CU-25, CU-26)", () => {
  const base = { motivo: "Cita dental", zona_id: "z", fecha: "2026-11-10", hora_inicio: "08:00", hora_fin: "09:00" };
  it("individual: 1 cupo y el enlace vence al inicio", () => {
    const r = esquemaInvitacion.parse({ ...base, tipo: "individual", correo_invitado: "Ana@Gmail.com" });
    expect(r.cupos).toBe(1);
    expect(r.inscripcion_hasta).toEqual(r.inicio_at);
    expect(r.correo_invitado).toBe("ana@gmail.com");
  });
  it("evento: exige cupos y fecha límite", () => {
    expect(esquemaInvitacion.safeParse({ ...base, tipo: "evento" }).success).toBe(false);
    const r = esquemaInvitacion.parse({ ...base, tipo: "evento", cupos: "30", inscripcion_fecha: "2026-11-09", inscripcion_hora: "18:00" });
    expect(r.cupos).toBe(30);
    expect(r.nombre_invitado).toBeNull();
  });
  it("valida la franja contra la hora actual", () => {
    const i = { inicio_at: h(14), fin_at: h(15), inscripcion_hasta: h(14) };
    expect(validarFranja(i, h(10))).toBeNull();
    expect(validarFranja(i, h(14))).toMatch(/futuro/);
    expect(validarFranja({ ...i, fin_at: h(13) }, h(10))).toMatch(/fin/);
    expect(validarFranja({ ...i, inscripcion_hasta: h(16) }, h(10))).toMatch(/cerrar antes/);
  });
});

describe("cupos libres en la franja", () => {
  const existentes = [
    { inicio_at: h(8), fin_at: h(10), cupos: 4 },
    { inicio_at: h(9), fin_at: h(11), cupos: 3 },
    { inicio_at: h(13), fin_at: h(14), cupos: 9 },
  ];
  it("descuenta solo lo que se cruza con la franja nueva", () => {
    expect(cuposLibresEnFranja(10, existentes, h(9), h(10))).toBe(3);
    expect(cuposLibresEnFranja(10, existentes, h(11), h(13))).toBe(10);
    expect(cuposLibresEnFranja(10, existentes, h(10), h(11))).toBe(7);
  });
});

describe("estado de la invitación (CU-08)", () => {
  const inv = { cupos: 2, inscripcion_hasta: h(14), cancelada_at: null };
  it("abierta, llena, cerrada o cancelada", () => {
    expect(estadoInvitacion(inv, 1, h(10))).toBe("abierta");
    expect(estadoInvitacion(inv, 2, h(10))).toBe("llena");
    expect(estadoInvitacion(inv, 0, h(15))).toBe("cerrada");
    expect(estadoInvitacion({ ...inv, cancelada_at: h(9) }, 0, h(10))).toBe("cancelada");
  });
});

describe("tamaños", () => {
  it("cabe si hay un cupo compatible en la zona", () => {
    expect(cabeEnZona("sedan", { ...cero, suv: 1 })).toBe(true);
    expect(cabeEnZona("grande", { ...cero, sedan: 8 })).toBe(false);
    expect(cabeEnZona("moto", { ...cero, sedan: 8 })).toBe(false);
  });
  it("si llega en otro vehículo, solo de igual o menor tamaño (moto aparte)", () => {
    expect(tamanosPermitidos("suv")).toEqual(["sedan", "suv"]);
    expect(tamanosPermitidos("moto")).toEqual(["moto"]);
  });
});

describe("reserva (CU-08)", () => {
  const r = {
    nombre: "Visita Uno",
    correo: "VISITA@mail.com",
    tipo_identificacion: "pasaporte",
    identificacion: "ab-123456",
    origen_placa: "extranjera",
    pais: "Panamá",
    placa: "p-123abc",
    tamano: "sedan",
    requiere_preferencial: false,
    consentimiento: true,
  };
  it("normaliza y descarta el consentimiento", () => {
    const x = esquemaReserva.parse(r);
    expect(x).toMatchObject({ correo: "visita@mail.com", identificacion: "AB123456", placa: "P123ABC", pais: "Panamá" });
    expect("consentimiento" in x).toBe(false);
  });
  it("exige consentimiento y país en placas extranjeras", () => {
    expect(esquemaReserva.safeParse({ ...r, consentimiento: false }).success).toBe(false);
    expect(esquemaReserva.safeParse({ ...r, pais: "" }).success).toBe(false);
  });
});
