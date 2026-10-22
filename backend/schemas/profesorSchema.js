import z from "zod";

const profesorSchema = z
  .object({
    nombre: z.string(),
    apellido: z.string(),
    cedula: z.number().int().min(1000000).max(31000000),
    correo: z.string({
      invalid_type_error: "Correo debe ser texto",
      required_error: "Correo del estudiante es obligatorio",
    }),
    telefono: z
      .string({
        invalid_type_error: "Teléfono debe ser texto",
        required_error: "Teléfono del estudiante es obligatorio",
      })
      .transform((phone) => {
        // Limpiar y formatear automáticamente
        const cleanPhone = phone.replace(/[^\d]/g, "");

        if (cleanPhone.length === 11) {
          return `${cleanPhone.substring(0, 4)}-${cleanPhone.substring(4)}`;
        }

        return phone;
      })
      .refine(
        (phone) => {
          return /^[0-9]{4}-[0-9]{7}$/.test(phone);
        },
        {
          message: "Teléfono debe tener 11 dígitos en formato: XXXX-XXXXXXX",
        },
      ),
    direccion: z
      .string({
        required_error: "Dirección del representante es obligatoria",
        invalid_type_error: "Dirección debe ser texto",
      })
      .trim()
      .min(5, { message: "Dirección demasiado corta" })
      .max(150, { message: "Dirección demasiado larga" }),
  })
  .strict();

export function validarProfesor(object) {
  return profesorSchema.safeParse(object);
}
export function validarParcialProfesor(object) {
  return profesorSchema
    .partial()
    .refine((data) => Object.keys(data).length > 0, {
      message: "Debe enviar al menos un campo para actualizar.",
    })
    .safeParse(object);
}
