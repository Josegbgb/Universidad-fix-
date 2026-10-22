import z from "zod";

const userSchema = z
  .object({
    email: z
      .string({
        invalid_type_error: "El email debe ser texto",
        required_error: "El email es obligatorio",
      })
      .email("Debe ser un correo válido"),
    password: z
      .string({
        invalid_type_error: "La contraseña debe ser texto",
        required_error: "La contraseña es obligatoria",
      })
      .min(6, "La contraseña debe tener al menos 6 caracteres"),
    role: z.enum(["admin", "profesor", "estudiante"], {
      required_error: "El rol es obligatorio",
    }),
    telefono: z
      .string({
        invalid_type_error: "Teléfono debe ser texto",
        required_error: "Teléfono es obligatorio",
      })
      .transform((phone) => {
        const cleanPhone = phone.replace(/[^\d]/g, "");
        if (cleanPhone.length === 11) {
          return `${cleanPhone.substring(0, 4)}-${cleanPhone.substring(4)}`;
        }
        return phone;
      })
      .refine((phone) => /^[0-9]{4}-[0-9]{7}$/.test(phone), {
        message: "Teléfono debe tener formato XXXX-XXXXXXX",
      })
      .optional(),
  })
  .strict();

export function validarUser(object) {
  return userSchema.safeParse(object);
}

export function validarParcialUser(object) {
  return userSchema
    .partial()
    .refine((data) => Object.keys(data).length > 0, {
      message: "Debe enviar al menos un campo para actualizar.",
    })
    .safeParse(object);
}
