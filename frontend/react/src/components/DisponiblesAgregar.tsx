import { useEffect, useState } from "react";
import estilos from "../styles/grados.module.css";
import { crear_estudiante_rel } from "@/api/estudiantes";
import { create_rel_asignatura_profesor } from "@/api/grados";
import Autocomplete from "@mui/material/Autocomplete";
import TextField from "@mui/material/TextField";
import { crearProfesorAsignaturas } from "@/api/profesores";

interface ItemBase {
  id: number;
  nombre: string;
  [key: string]: any; // Permite propiedades adicionales
}
//
//
//
interface Datos<T extends ItemBase> {
  endPoint: string;

  id_componente: number;
  onSuccess: () => void;
  mode: "grados" | "profesores" | "estudiantes" | "asignatura_profesor";
  filterCondition?: (item: T) => boolean;
  displayText: (item: T) => string;
  onItemSelected?: (itemId: number, id_componente: number) => Promise<void>;
}
//
//
//
export function DisponiblesAgregar<T extends ItemBase>({
  endPoint,
  id_componente,
  onSuccess,
  mode,
  filterCondition = () => true,
  displayText = (item) => `${item.nombre} ${item.apellido ?? ""}`,
  onItemSelected,
}: Datos<T>) {
  //
  //
  //
  const [datos, setDatos] = useState<T[]>([]);
  //

  //
  //
  //
  async function crearRelEstudiateGrado(
    id_estudiante: number,
    id_grado: number,
  ) {
    await crear_estudiante_rel({
      id_estudiante: id_estudiante,
      id_grado: id_grado,
    });
    onSuccess();
  }
  //

  async function crearRelAsignaturaProfesor(
    id_rel_grado_asignatura: number,
    id_profesor: number,
  ) {
    await create_rel_asignatura_profesor({
      id_rel_grado_asignatura: id_rel_grado_asignatura,
      id_profesor: id_profesor,
    });
    onSuccess();
  }
  //

  //
  //
  //
  useEffect(() => {
    fetch(endPoint)
      .then((res) => res.json())
      .then((data: T[]) => {
        setDatos(data.filter(filterCondition));
        console.log("📡 Datos crudos del endpoint:", data);

        const filtrados = data.filter(filterCondition);
        console.log("🧹 Datos después del filtro:", filtrados);
      });
  }, [endPoint /*, filterCondition */]);
  //
  //
  //
  const handleSelect = async (_: any, value: T | null) => {
    console.log("🖱️ Opción seleccionada:", value);

    if (!value) return;
    if (onItemSelected) {
      await onItemSelected(value.id, id_componente);
      return;
    }
    if (mode === "grados") {
      await crearRelEstudiateGrado(value.id, id_componente);
    } else if (mode === "profesores") {
      await crearRelAsignaturaProfesor(value.relacion_id, id_componente);
    } else if (mode === "asignatura_profesor") {
      await crearProfesorAsignaturas({
        id_rel_grado_asignatura: value.relacion_id,
        id_profesor: id_componente,
      });
      onSuccess();
    } else {
      await crearRelEstudiateGrado(id_componente, value.id);
    }
  };
  ///
  //
  //
  return (
    <div className={estilos.group}>
      <Autocomplete
        options={datos}
        sx={{ width: 300 }}
        getOptionLabel={(option) => displayText(option)}
        isOptionEqualToValue={(option, value) => option.id === value.id}
        onChange={handleSelect}
        ListboxProps={{
          sx: {
            maxHeight: 250,
            overflowY: "auto",
          },
        }}
        renderInput={(params) => <TextField {...params} label="Buscar..." />}
      />
    </div>
  );
}
