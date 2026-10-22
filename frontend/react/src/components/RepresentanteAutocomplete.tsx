import React from "react";
import TextField from "@mui/material/TextField";
import Autocomplete from "@mui/material/Autocomplete";
import { obtenerRepresentantes } from "@/api/representantes";
import type { Representantes } from "@/interfaces/interface";

type RepresentanteAutocompleteProps = {
  onSelect: (representante: Representantes | null) => void;
};

export default function RepresentanteAutocomplete({
  onSelect,
}: RepresentanteAutocompleteProps) {
  const [value, setValue] = React.useState<Representantes | null>(null);
  const [inputValue, setInputValue] = React.useState("");
  // Cambio: tipa las opciones para que Autocomplete conozca sus campos.
  const [options, setOptions] = React.useState<Representantes[]>([]);

  React.useEffect(() => {
    async function cargar() {
      const reps = await obtenerRepresentantes();
      setOptions(reps);
    }

    cargar();
  }, []);

  return (
    <Autocomplete
      options={options}
      value={value}
      inputValue={inputValue}
      getOptionLabel={(option) =>
        `${option.nombre} ${option.apellido} - ${option.cedula}`
      }
      onChange={(_event, newValue) => {
        setValue(newValue);
        onSelect(newValue);
      }}
      onInputChange={(_event, newInputValue) => {
        setInputValue(newInputValue);
      }}
      renderInput={(params) => (
        <TextField
          {...params}
          label="Buscar representante por cedula"
          placeholder=""
          InputLabelProps={{ shrink: true }}
        />
      )}
    />
  );
}
