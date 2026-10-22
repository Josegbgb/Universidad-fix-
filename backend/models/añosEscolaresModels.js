import { all, get, run } from "../src/db.js";

export class AñosEscolaresModel {
  static async getAll(filtrado) {
    // Cambio: por defecto solo se devuelven los grados habilitados.
    const incluirInactivos = filtrado?.incluirInactivos === true;

    if (filtrado?.anio && filtrado?.seccion !== undefined) {
      const sql = get("SELECT * FROM grados WHERE anio=? AND seccion=?", [
        filtrado.anio,
        filtrado.seccion,
      ]);
      return sql;
    } else if (filtrado?.anio !== undefined) {
      const sql = all(
        `SELECT * FROM grados WHERE anio=? ${incluirInactivos ? "" : "AND activo = 1"}`,
        [filtrado.anio],
      );
      return sql;
    } else {
      return all(
        `SELECT * FROM grados ${incluirInactivos ? "" : "WHERE activo = 1"} order by anio,seccion`,
      );
    }
  }

  // Cambio: lista los grados deshabilitados (la U nunca se muestra aqui).
  static async getDisabled() {
    return all(
      "SELECT * FROM grados WHERE activo = 0 AND seccion != 'U' ORDER BY anio, seccion",
    );
  }
  //
  //Crea nuevo año
  //
  static async createGrade({ input }) {
    const { anio, seccion } = input;

    const existe = get(
      "SELECT activo FROM grados WHERE anio=? AND seccion=?",
      [anio, seccion],
    );

    if (existe) {
      // Cambio: si existe pero esta oculto, se le indica al usuario como recuperarlo.
      if (existe.activo === 0) {
        throw new Error(
          "Ese año y sección existen pero están deshabilitados. Habilítalos desde 'Ver deshabilitados'",
        );
      }
      throw new Error("Año y sección ya se encuentran registrados");
    }

    // 1. Crear el grado
    const result = run("INSERT INTO grados (anio, seccion) VALUES (?, ?)", [
      anio,
      seccion,
    ]);

    const nuevoGradoId = result.lastInsertRowid;

    // 2. TOMAR ASIGNATURAS DESDE EL TEMPLATE
    const asignaturasTemplate = all(
      "SELECT id_asignatura FROM anio_asignatura_template WHERE anio = ?",
      [anio],
    );

    // 3. Copiarlas al grado recién creado
    for (const a of asignaturasTemplate) {
      run(
        "INSERT INTO rel_grado_asignatura (id_grado, id_asignatura) VALUES (?, ?)",
        [nuevoGradoId, a.id_asignatura],
      );
    }
    return { id: nuevoGradoId, ...input };
  }

  // Cambio: deshabilitar un grado (no borra nada, conserva el historial).
  static async disableGrade({ id }) {
    const grado = get("SELECT id, activo FROM grados WHERE id = ?", [id]);
    if (!grado) throw new Error("GRADO_NO_ENCONTRADO");
    if (grado.activo === 0) throw new Error("GRADO_YA_DESHABILITADO");

    // Debe estar vacio: los estudiantes se cambian de sección antes.
    const conEstudiantes = get(
      `SELECT 1 FROM rel_estudiante_grado
       WHERE id_grado = ? AND activo = 1 AND deleted_at IS NULL
       LIMIT 1`,
      [id],
    );
    if (conEstudiantes) throw new Error("GRADO_CON_ESTUDIANTES");

    const result = run("UPDATE grados SET activo = 0 WHERE id = ?", [id]);
    return result.changes > 0;
  }

  // Cambio: habilitar de nuevo un grado deshabilitado.
  static async enableGrade({ id }) {
    const grado = get("SELECT id, activo FROM grados WHERE id = ?", [id]);
    if (!grado) throw new Error("GRADO_NO_ENCONTRADO");
    if (grado.activo === 1) throw new Error("GRADO_YA_HABILITADO");

    const result = run("UPDATE grados SET activo = 1 WHERE id = ?", [id]);
    return result.changes > 0;
  }
  //
  //Eliminar año
  //
  static async deleteGrade({ id }) {
    // 🔥 Verificar si hay notas registradas en este grado
    const tieneNotas = get(
      `
    SELECT 1 FROM notas n
    JOIN rel_grado_asignatura rga ON n.id_rel_grado_asignatura = rga.id
    WHERE rga.id_grado = ?
    UNION
    SELECT 1 FROM notas n
    JOIN rel_estudiante_grado reg ON n.id_rel_estudiante_grado = reg.id
    WHERE reg.id_grado = ?
    LIMIT 1
  `,
      [id, id],
    );

    if (tieneNotas) {
      throw new Error("GRADO_CON_NOTAS");
    }

    // Sin notas — borrar todo limpio
    const relaciones = all(
      `SELECT id FROM rel_grado_asignatura WHERE id_grado = ?`,
      [id],
    );
    const relacionIds = relaciones.map((r) => r.id);

    if (relacionIds.length > 0) {
      run(
        `DELETE FROM rel_asignatura_profesor WHERE id_rel_grado_asignatura IN (${relacionIds.map(() => "?").join(",")})`,
        relacionIds,
      );
    }

    run(`DELETE FROM rel_grado_asignatura WHERE id_grado = ?`, [id]);
    run(`DELETE FROM rel_estudiante_grado WHERE id_grado = ?`, [id]);

    const result = run(`DELETE FROM grados WHERE id = ?`, [id]);
    return result.changes > 0;
  }
  //
  //Actualizar
  //
  static async updateGrade({ id, input }) {
    const fields = [];
    const values = [];

    for (const [key, value] of Object.entries(input)) {
      fields.push(`${key} = ?`);
      values.push(value);
    }

    values.push(id);

    const updateSql = `UPDATE grados SET ${fields.join(", ")} WHERE id = ?`;

    const conditionFields = [];
    const conditionValues = [];

    for (const [key, value] of Object.entries(input)) {
      conditionFields.push(`${key} = ?`);
      conditionValues.push(value);
    }

    conditionFields.push(`id != ?`);
    conditionValues.push(id);

    const checkSql = `SELECT * FROM grados WHERE ${conditionFields.join(
      " AND ",
    )}`;
    const duplicate = await get(checkSql, conditionValues);

    if (duplicate) {
      throw new Error("Grado y sección ya registrados");
    }

    const result = await run(updateSql, values);

    if (result.changes === 0) {
      return false;
    }

    return await get("SELECT * FROM grados WHERE id = ?", [id]);
  }
}