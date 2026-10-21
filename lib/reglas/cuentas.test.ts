import { describe, expect, it } from "vitest";
import {
  esCorreoInstitucional,
  esquemaGuarda,
  esquemaPassword,
  esquemaRegistro,
  generarCodigoCorto,
  rolAlQuitar,
  validarQuitarRol,
} from "./cuentas";

const dominios = ["ulacit.ed.cr"];
const registro = {
  nombre: "Ana Mora",
  correo: " Ana@ULACIT.ed.cr ",
  password: "segura123",
  tipo_identificacion: "cedula",
  identificacion: "1-2345-6789",
  tipo_persona: "estudiante",
  consentimiento: true,
};

describe("correo institucional (RN-11)", () => {
  it("acepta el dominio y sus subdominios, sin importar mayúsculas", () => {
    expect(esCorreoInstitucional("ana@ULACIT.ed.cr", dominios)).toBe(true);
    expect(esCorreoInstitucional("ana@alumnos.ulacit.ed.cr", dominios)).toBe(true);
  });
  it("rechaza otros dominios, incluso los que terminan parecido", () => {
    expect(esCorreoInstitucional("ana@gmail.com", dominios)).toBe(false);
    expect(esCorreoInstitucional("ana@falsoulacit.ed.cr", dominios)).toBe(false);
  });
});

describe("contraseña", () => {
  it("exige 8 caracteres con letra y número", () => {
    expect(esquemaPassword.safeParse("segura123").success).toBe(true);
    expect(esquemaPassword.safeParse("corta1").success).toBe(false);
    expect(esquemaPassword.safeParse("sinnumeros").success).toBe(false);
    expect(esquemaPassword.safeParse("12345678").success).toBe(false);
  });
});

describe("registro (CU-02)", () => {
  it("normaliza correo e identificación", () => {
    const r = esquemaRegistro.parse(registro);
    expect(r.correo).toBe("ana@ulacit.ed.cr");
    expect(r.identificacion).toBe("123456789");
  });
  it("exige consentimiento", () => {
    expect(esquemaRegistro.safeParse({ ...registro, consentimiento: false }).success).toBe(false);
  });
  it("valida la identificación según su tipo", () => {
    const r = esquemaRegistro.safeParse({ ...registro, tipo_identificacion: "dimex" });
    expect(r.success).toBe(false);
    expect(r.error?.issues[0].path).toEqual(["identificacion"]);
  });
  it("no deja registrarse como visita", () => {
    expect(esquemaRegistro.safeParse({ ...registro, tipo_persona: "visita" }).success).toBe(false);
  });
  it("los guardas aceptan cualquier correo", () => {
    expect(esquemaGuarda.safeParse({ ...registro, correo: "guarda@gmail.com", tipo_identificacion: "pasaporte", identificacion: "AB123456" }).success).toBe(true);
  });
});

describe("código corto (RN-13)", () => {
  it("6 caracteres sin letras o números ambiguos", () => {
    for (let i = 0; i < 200; i++) expect(generarCodigoCorto()).toMatch(/^[2-9A-HJKMNP-Z]{6}$/);
  });
});

describe("quitar rol (CU-32)", () => {
  const base = { actorId: "a", objetivoId: "b", objetivoRol: "admin" as const, superAdminsActivos: 1 };
  it("nadie se quita su propio rol", () => {
    expect(validarQuitarRol({ ...base, objetivoId: "a" })).toMatch(/propio/);
  });
  it("siempre queda un super admin", () => {
    expect(validarQuitarRol({ ...base, objetivoRol: "super_admin" })).toMatch(/al menos un/);
    expect(validarQuitarRol({ ...base, objetivoRol: "super_admin", superAdminsActivos: 2 })).toBeNull();
  });
  it("quien fue miembro vuelve a serlo; si no, se desactiva", () => {
    expect(rolAlQuitar("profesor")).toEqual({ rol: "miembro", desactivar: false });
    expect(rolAlQuitar(null)).toEqual({ rol: "miembro", desactivar: true });
  });
});
