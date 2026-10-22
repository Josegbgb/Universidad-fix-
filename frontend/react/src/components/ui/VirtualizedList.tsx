import Box from "@mui/material/Box";
import ListItem from "@mui/material/ListItem";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemText from "@mui/material/ListItemText";
import { FixedSizeList } from "react-window";
import type { ListChildComponentProps } from "react-window";

interface VirtualizedListProps<T> {
  /** Array de items a mostrar */
  items: T[];
  /** Altura del componente en píxeles */
  height?: number;
  /** Ancho del componente en píxeles */
  width?: number;
  /** Altura de cada fila en píxeles */
  itemHeight?: number;
  /** Función que devuelve el texto a mostrar para cada item */
  getItemText: (item: T, index: number) => string;
  /** Función opcional que se ejecuta al hacer click en un item */
  onItemClick?: (item: T, index: number) => void;
  /** Número de items extra a renderizar fuera de la vista (para scroll suave) */
  overscanCount?: number;
  /** Clase CSS adicional para el contenedor */
  className?: string;
}

export default function VirtualizedList<T>({
  items,
  height = 400,
  width = 360,
  itemHeight = 46,
  getItemText,
  onItemClick,
  overscanCount = 5,
  className = "",
}: VirtualizedListProps<T>) {
  const Row = ({ index, style }: ListChildComponentProps) => {
    const item = items[index];

    return (
      <ListItem
        style={style}
        component="div"
        disablePadding
        className="virtualized-list-item"
      >
        <ListItemButton
          onClick={() => onItemClick?.(item, index)}
          sx={{
            "&:hover": {
              backgroundColor: "action.hover",
            },
          }}
        >
          <ListItemText
            primary={getItemText(item, index)}
            primaryTypographyProps={{
              noWrap: true,
              sx: {
                fontSize: "0.875rem",
                fontWeight: 400,
                color: "text.primary",
              },
            }}
          />
        </ListItemButton>
      </ListItem>
    );
  };

  return (
    <Box
      className={`virtualized-list-container ${className}`}
      sx={{
        width: "100%",
        height: height,
        maxWidth: width,
        bgcolor: "background.paper",
        borderRadius: 1,
        border: "1px solid",
        borderColor: "divider",
        overflow: "hidden",
        "& .virtualized-list-item": {
          width: "100%",
        },
      }}
    >
      <FixedSizeList
        height={height}
        width={width}
        itemSize={itemHeight}
        itemCount={items.length}
        overscanCount={overscanCount}
      >
        {Row}
      </FixedSizeList>
    </Box>
  );
}
