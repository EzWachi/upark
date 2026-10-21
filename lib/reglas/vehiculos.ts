import { z } from "zod";
import { normalizarPlaca, placaValida } from "./placa";

/** CU-04, 6b. */
export const MAX_VEHICULOS = 5;

/** CU-04, pasos 4 a 6. */
export const esquemaVehiculo = z
  .object({
    origen: z.enum(["nacional", "extranjera"], "Elige el origen de la placa"),
    pais: z.string().trim().max(60).optional().transform((v) => v || null),
    placa: z.string().trim().min(1, "Escribe la placa"),
    tamano: z.enum(["moto", "sedan", "suv", "grande"], "Elige el tamaño del vehículo"),
    descripcion: z.string().trim().max(80).optional().transform((v) => v || null),
  })
  .superRefine((v, ctx) => {
    if (!placaValida(v.placa, v.origen)) {
      ctx.addIssue({ code: "custom", path: ["placa"], message: "La placa no tiene un formato válido" });
    }
    if (v.origen === "extranjera" && !v.pais) {
      ctx.addIssue({ code: "custom", path: ["pais"], message: "Indica el país de la placa extranjera" }); // 4a
    }
  })
  .transform((v) => ({ ...v, placa: normalizarPlaca(v.placa), pais: v.origen === "extranjera" ? v.pais : null }));

export type DatosVehiculo = z.infer<typeof esquemaVehiculo>;
