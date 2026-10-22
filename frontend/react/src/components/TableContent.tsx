import estilo from "../styles/grados.module.css";

interface TableProps {
  headers: string[];
  rows: React.ReactNode[][];
  mode: "grados" | "profesores";
  children: React.ReactNode;
}

export function TableContent({ headers, rows, mode, children }: TableProps) {
  console.log(headers);
  console.log(rows);
  const hasNoData = rows.length === 1 && rows[0][0] === "Sin asignar";

  return (
    <section id={estilo.container_flex}>
      <div id={estilo.agregar_box}>
        <p>
          {mode === "grados"
            ? "Agregar nuevos estudiantes"
            : "Asignar materias al profesor"}
        </p>
        {children}
      </div>
      <table>
        <thead>
          <tr>
            {headers.map((header, i) => (
              <th key={i}>{header}</th>
            ))}
          </tr>
        </thead>
        <tbody id={estilo.container_estudiantes}>
          {hasNoData ? (
            <tr>
              <td
                colSpan={headers.length}
                style={{ textAlign: "center", paddingTop: "20px" }}
              >
                Sin datos registrados
              </td>
            </tr>
          ) : (
            rows.map((row, i) => (
              <tr key={i}>
                {row.map((cell, j) => (
                  <td key={j}>{cell}</td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </section>
  );
}
