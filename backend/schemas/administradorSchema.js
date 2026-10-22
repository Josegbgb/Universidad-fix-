import { z } from "zod";

export const administradorSchema = z.object({
  nombre: z
    .string({
      required_error: "El nombre es requerido",
    })
    .min(2, "Nombre muy corto"),

  apellido: z
    .string({
      required_error: "El apellido es requerido",
    })
    .min(2, "Apellido muy corto"),

  cedula: z
    .union([z.string(), z.number()])
    .refine((v) => String(v).length >= 7, {
      message: "Cédula inválida",
    }),

  correo: z
    .string({
      required_error: "El correo es requerido",
    })
    .email("Correo inválido"),

  telefono: z
    .string({
      invalid_type_error: "Teléfono debe ser texto",
      required_error: "Teléfono del representante es obligatorio",
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

  direccion: z.string(),
});

// ✅ crear
export function validarAdministrador(input) {
  return administradorSchema.safeParse(input);
}

// ✅ update parcial
export function validarParcialAdministrador(input) {
  return administradorSchema.partial().safeParse(input);
}
