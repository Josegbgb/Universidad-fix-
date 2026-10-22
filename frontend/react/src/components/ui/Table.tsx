import React, { useState } from "react";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Paper from "@mui/material/Paper";
import TableSortLabel from "@mui/material/TableSortLabel";
import Box from "@mui/material/Box";

type Order = "asc" | "desc";

interface Column<T> {
  readonly label: string;
  readonly key: keyof T;
  readonly sortable?: boolean;
  readonly align?: "left" | "right" | "center";
  // Nueva propiedad: si la columna contiene componentes React
  readonly isReactNode?: boolean;
  readonly width?: number;
  readonly minWidth?: number;
}

interface SortableTableProps<T> {
  columns: readonly Column<T>[];
  rows: T[];
  maxWidth?: number | string;
  responsive?: boolean;
  headerActions?: React.ReactNode;
}

export function SortableTable<T extends Record<string, any>>({
  columns,
  rows,
  maxWidth = "100%",
  responsive = false,
  headerActions,
}: SortableTableProps<T>) {
  const [order, setOrder] = useState<Order>("asc");
  const [orderBy, setOrderBy] = useState<keyof T>(() => {
    // Encontrar la primera columna ordenable que no sea React node
    const firstSortable = columns.find(
      (col) => col.sortable && !col.isReactNode,
    );
    return firstSortable ? firstSortable.key : columns[0].key;
  });

  const handleSort = (property: keyof T) => {
    // No permitir ordenar columnas con React nodes
    const columnConfig = columns.find((col) => col.key === property);
    if (columnConfig?.isReactNode) return;

    const isAsc = orderBy === property && order === "asc";
    setOrder(isAsc ? "desc" : "asc");
    setOrderBy(property);
  };

  const sortedRows = [...rows].sort((a, b) => {
    const valueA = a[orderBy];
    const valueB = b[orderBy];

    // Si son React nodes, no ordenar
    if (React.isValidElement(valueA) || React.isValidElement(valueB)) {
      return 0;
    }

    if (typeof valueA === "number" && typeof valueB === "number") {
      return order === "asc" ? valueA - valueB : valueB - valueA;
    }

    return order === "asc"
      ? String(valueA).localeCompare(String(valueB))
      : String(valueB).localeCompare(String(valueA));
  });

  return (
    <Box sx={{ mt: 4 }}>
      {/* Cambio: permite acciones externas sin romper el tipado del build. */}
      {headerActions ? (
        <Box sx={{ display: "flex", justifyContent: "flex-end", mb: 1 }}>
          {headerActions}
        </Box>
      ) : null}
      <TableContainer
        component={Paper}
        sx={{
          maxWidth,
          width: "100%",
          borderRadius: 2,
          boxShadow: 3,
          overflowX: responsive ? "auto" : "visible",
        }}
      >
        <Table
          sx={{
            minWidth: responsive ? 0 : 650,
            width: "100%",
            tableLayout: responsive ? "auto" : "fixed",
          }}
        >
          <TableHead>
            <TableRow>
              {columns.map((col) => (
                <TableCell
                  key={String(col.key)}
                  align={col.align || "center"}
                  sortDirection={orderBy === col.key ? order : false}
                  sx={{
                    width: col.width,
                    minWidth: col.minWidth,
                    whiteSpace: "nowrap",
                  }}
                >
                  {col.sortable && !col.isReactNode ? (
                    <TableSortLabel
                      active={orderBy === col.key}
                      direction={orderBy === col.key ? order : "asc"}
                      onClick={() => handleSort(col.key)}
                    >
                      {col.label}
                    </TableSortLabel>
                  ) : (
                    col.label
                  )}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>

          <TableBody>
            {sortedRows.map((row, index) => (
              <TableRow
                key={index}
                sx={{
                  "&:last-child td, &:last-child th": { border: 0 },
                  "&:hover": {
                    backgroundColor: "rgba(127, 126, 126, 0.47)",
                    transition: "background-color 0.25s ease-in-out",
                  },
                }}
              >
                {columns.map((col) => (
                  <TableCell
                    key={String(col.key)}
                    align={col.align || "center"}
                    sx={{
                      width: col.width,
                      minWidth: col.minWidth,

                      cursor: col.isReactNode ? "default" : "pointer",
                      whiteSpace: "normal",
                      wordBreak: "break-word",
                      overflowWrap: "break-word",
                    }}
                  >
                    {row[col.key]}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}
