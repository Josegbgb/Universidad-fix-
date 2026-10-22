import z, { object, safeParse } from "zod";
const gradoSchema = z.object({
  anio: z.number().int().max(6),
  seccion: z.string({
    invalid_type_error: "Seccion debe ser una vocal",
    required_error: "Seccion es obligatorio",
  }),
});

export function validarGrado(object) {
  return gradoSchema.safeParse(object);
}

export function validarGradoParcial(object) {
  return gradoSchema.partial().safeParse(object);
}
