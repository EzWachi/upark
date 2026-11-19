import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { enviarCorreo } from "./correo";

// CU-38: envío por Resend con reintentos (3a) y respaldo en consola.

const correo = { para: "ana@ulacit.ed.cr", asunto: "Prueba", texto: "Hola" };

const respuesta = (status: number, cuerpo = "") => new Response(cuerpo, { status });

let fetchFalso: ReturnType<typeof vi.fn>;

beforeEach(() => {
  vi.useFakeTimers();
  fetchFalso = vi.fn();
  vi.stubGlobal("fetch", fetchFalso);
  vi.spyOn(console, "log").mockImplementation(() => {});
  vi.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

/** Corre el envío dejando pasar las esperas entre reintentos. */
async function enviar() {
  const promesa = enviarCorreo(correo);
  await vi.runAllTimersAsync();
  return promesa;
}

describe("enviarCorreo", () => {
  it("sin RESEND_API_KEY imprime en consola y no llama a Resend", async () => {
    vi.stubEnv("RESEND_API_KEY", "");
    expect(await enviar()).toBe(true);
    expect(fetchFalso).not.toHaveBeenCalled();
    expect(console.log).toHaveBeenCalledWith(expect.stringContaining("Para:   ana@ulacit.ed.cr"));
  });

  describe("con RESEND_API_KEY", () => {
    beforeEach(() => {
      vi.stubEnv("RESEND_API_KEY", "re_prueba");
      vi.stubEnv("CORREO_REMITENTE", "UPark <no-responder@upark.test>");
    });

    it("envía una vez con la clave, el remitente y el contenido", async () => {
      fetchFalso.mockResolvedValue(respuesta(200, '{"id":"1"}'));
      expect(await enviar()).toBe(true);
      expect(fetchFalso).toHaveBeenCalledTimes(1);

      const [url, init] = fetchFalso.mock.calls[0];
      expect(url).toBe("https://api.resend.com/emails");
      expect(init.headers.Authorization).toBe("Bearer re_prueba");
      expect(JSON.parse(init.body)).toEqual({
        from: "UPark <no-responder@upark.test>",
        to: ["ana@ulacit.ed.cr"],
        subject: "Prueba",
        text: "Hola",
      });
    });

    it("3a: reintenta un 5xx con la misma clave de idempotencia", async () => {
      fetchFalso.mockResolvedValueOnce(respuesta(500)).mockResolvedValueOnce(respuesta(200));
      expect(await enviar()).toBe(true);
      expect(fetchFalso).toHaveBeenCalledTimes(2);
      const claves = fetchFalso.mock.calls.map(([, init]) => init.headers["Idempotency-Key"]);
      expect(claves[0]).toBeTruthy();
      expect(claves[1]).toBe(claves[0]);
    });

    it("3a: reintenta una falla de red y el límite de envíos (429)", async () => {
      fetchFalso
        .mockRejectedValueOnce(new TypeError("fetch failed"))
        .mockResolvedValueOnce(respuesta(429))
        .mockResolvedValueOnce(respuesta(200));
      expect(await enviar()).toBe(true);
      expect(fetchFalso).toHaveBeenCalledTimes(3);
    });

    it("3a: tras 3 reintentos fallidos registra el error y devuelve false", async () => {
      fetchFalso.mockImplementation(async () => respuesta(503, "caído"));
      expect(await enviar()).toBe(false);
      expect(fetchFalso).toHaveBeenCalledTimes(4);
      expect(console.error).toHaveBeenCalledWith(expect.stringContaining("Resend respondió 503: caído"));
    });

    it("un 4xx no se reintenta", async () => {
      fetchFalso.mockResolvedValue(respuesta(403, "dominio sin verificar"));
      expect(await enviar()).toBe(false);
      expect(fetchFalso).toHaveBeenCalledTimes(1);
      expect(console.error).toHaveBeenCalledWith(expect.stringContaining("ana@ulacit.ed.cr"));
    });
  });
});
