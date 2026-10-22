import z from "zod";

const object = z.object({
  id_estudiante: z.number().int().positive(),
  id_grado: z.number().int().positive(),
});

export function validarRelacionEstudianteGrado(data) {
  return object.safeParse(data);
}

export function validarParcialRelacionEstudianteGrado(data) {
  return object
    .partial()
    .refine((data) => Object.keys(data).length > 0, {
      message: "Debe enviar al menos un campo para actualizar.",
    })
    .safeParse(data);
}
