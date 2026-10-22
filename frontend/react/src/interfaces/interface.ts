export interface Estudiantes {
  id: number;
  nombre: string;
  apellido: string;
  cedula: number;
  correo: string;
  telefono: string;
  // Cambio: datos oficiales usados por la planilla 31060.
  lugar_nacimiento?: string;
  entidad_federal?: string;
  año: number;
  seccion: string;
  id_estudiante: number;
  id_grado: number;
}
export interface Representantes {
  id: number;
  nombre: string;
  apellido: string;
  cedula: number;
  correo: string;
  telefono: string;
  direccion: string;
  parentesco: string;
  nombre_estudiante?: string;
  apellido_estudiante?: string;

  // grado
  grado_anio?: number;
  grado_seccion?: string;
}
export interface EstudianteCreate {
  nombre: string;
  apellido: string;
  cedula: number;
  correo?: string;
  telefono?: string;
  // Cambio: permite crear y editar datos oficiales de nacimiento.
  lugar_nacimiento?: string;
  entidad_federal?: string;
}
export interface Grados {
  id: number;
  anio: number;
  seccion: string;
}
export interface Profesores {
  id: number;
  nombre: string;
  apellido: string;
  cedula: number;
  asignatura: string;
  anio: number;
  seccion: string;
  direccion?: string;
  telefono?: string;
  correo?: string;
  id_relacion_grado_asignatura?: number;
  relacion_asignatura_profesor_id?: number;
  asignaturas_capaces?: any[];
}
export interface Administrador {
  id: number;
  nombre: string;
  apellido: string;
  cedula: number;
  correo: string;
  created_at: Date;
  telefono?: string;
  direccion?: string;
  deleted_at?: string | null;
}
export interface Asignaturas {
  id: number;
  // Cambio: algunas respuestas de plantilla usan el id de asignatura con este alias.
  id_asignatura?: number;
  nombre: string;
}
export interface relacion_asignatura_profesor {
  relacion_asignatura_profesor_id: number;
  id_profesor: number;
  nombre: string;
  apellido: string;
  anio: number;
  seccion: string;
  asignatura: string;
  id_relacion_grado_asignatura: number;
}
