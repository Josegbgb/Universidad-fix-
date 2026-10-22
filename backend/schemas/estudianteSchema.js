import z from "zod";

const studentSchema = z
  .object({
    nombre: z.string({
      invalid_type_error: "Nombre del estudiante debe ser texto",
      required_error: "Nombre del estudiante es obligatorio",
    }),
    apellido: z.string({
      invalid_type_error: "Apellido debe ser texto",
      required_error: "Apellido del estudiante es obligatorio",
    }),
    cedula: z
      .number({
        invalid_type_error: "Debe ser datos numericos, sin decimales",
        required_error: "Se necesita numero de cedula",
      })
      .int()
      .min(1000000, { message: "Numero de cedula debe ser mayor a 26000000" })
      .max(50000000, { message: "Numero de cedula debe ser menor a 34000000" }),
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
    lugar_nacimiento: z
      .string({
        invalid_type_error: "Lugar de nacimiento debe ser texto",
        required_error: "Lugar de nacimiento es obligatorio",
      })
      .trim()
      .min(2, { message: "Lugar de nacimiento demasiado corto" })
      .max(100, { message: "Lugar de nacimiento demasiado largo" }),
    entidad_federal: z
      .string({
        invalid_type_error: "Entidad Federal debe ser texto",
        required_error: "Entidad Federal es obligatoria",
      })
      .trim()
      .min(2, { message: "Entidad Federal demasiado corta" })
      .max(60, { message: "Entidad Federal demasiado larga" }),
  })
  .strict();

const representanteSchema = z
  .object({
    nombre: z.string({
      invalid_type_error: "Nombre del representante debe ser texto",
      required_error: "Nombre del representante es obligatorio",
    }),
    apellido: z.string({
      invalid_type_error: "Apellido debe ser texto",
      required_error: "Apellido del representante es obligatorio",
    }),
    cedula: z
      .number({
        invalid_type_error: "Debe ser datos numericos, sin decimales",
        required_error: "Se necesita numero de cedula",
      })
      .int()
      .min(1000000, { message: "Numero de cedula debe ser mayor a 1000000" })
      .max(40000000, { message: "Numero de cedula debe ser menor a 40000000" }),
    correo: z.string({
      invalid_type_error: "Correo debe ser texto",
      required_error: "Correo del representante es obligatorio",
    }),
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
//
//
//
//
export function validarEstudiante(object) {
  return studentSchema.safeParse(object);
}

export function validarParcialEstudiante(object) {
  return studentSchema
    .partial()
    .refine((data) => Object.keys(data).length > 0, {
      message: "Debe enviar al menos un campo para actualizar.",
    })
    .safeParse(object);
}

export function validarRepresentante(object) {
  return representanteSchema.safeParse(object);
}

export function validarParcialRepresentante(object) {
  return representanteSchema
    .partial()
    .refine((data) => Object.keys(data).length > 0, {
      message: "Debe enviar al menos un campo para actualizar.",
    })
    .safeParse(object);
}
