import crypto from "crypto";
import db, { all, get, run, transaction } from "../src/db.js";

const OWNER_TYPES = ["usuario", "representante"];
const CODE_TTL_MS = 15 * 60 * 1000;
const CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

export class TelegramModel {
  static ensureSchema() {
    // Cambio: tablas separadas para soportar usuarios auth y representantes.
    db.exec(`
      CREATE TABLE IF NOT EXISTS telegram_vinculaciones (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        tipo_entidad TEXT NOT NULL CHECK(tipo_entidad IN ('usuario','representante')),
        id_entidad INTEGER NOT NULL,
        chat_id TEXT NOT NULL UNIQUE,
        username TEXT,
        first_name TEXT,
        last_name TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(tipo_entidad, id_entidad)
      );

      CREATE TABLE IF NOT EXISTS telegram_codigos_vinculacion (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        tipo_entidad TEXT NOT NULL CHECK(tipo_entidad IN ('usuario','representante')),
        id_entidad INTEGER NOT NULL,
        codigo TEXT NOT NULL UNIQUE,
        expira_at TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(tipo_entidad, id_entidad)
      );

      CREATE INDEX IF NOT EXISTS idx_telegram_codigo
      ON telegram_codigos_vinculacion(codigo, expira_at);
    `);
  }

  static generarCodigo({ tipo_entidad, id_entidad }) {
    this._validarOwner(tipo_entidad, id_entidad);

    const expiraAt = new Date(Date.now() + CODE_TTL_MS).toISOString();
    const crear = transaction(() => {
      let codigo = this._codigoCorto();
      let intentos = 0;

      while (
        get("SELECT 1 FROM telegram_codigos_vinculacion WHERE codigo = ?", [
          codigo,
        ])
      ) {
        intentos += 1;
        if (intentos > 10) throw new Error("NO_SE_PUDO_GENERAR_CODIGO");
        codigo = this._codigoCorto();
      }

      // Cambio: cada solicitud reemplaza el codigo anterior no usado.
      run(
        `DELETE FROM telegram_codigos_vinculacion
         WHERE tipo_entidad = ? AND id_entidad = ?`,
        [tipo_entidad, id_entidad],
      );
      run(
        `INSERT INTO telegram_codigos_vinculacion
           (tipo_entidad, id_entidad, codigo, expira_at)
         VALUES (?, ?, ?, ?)`,
        [tipo_entidad, id_entidad, codigo, expiraAt],
      );

      return { codigo, expira_at: expiraAt };
    });

    return crear();
  }

  static getEstadoVinculacion({ tipo_entidad, id_entidad }) {
    this._validarOwner(tipo_entidad, id_entidad);
    return get(
      `SELECT id, tipo_entidad, id_entidad, chat_id, username, created_at, updated_at
       FROM telegram_vinculaciones
       WHERE tipo_entidad = ? AND id_entidad = ?`,
      [tipo_entidad, id_entidad],
    );
  }

  static vincularChatConCodigo({
    codigo,
    chat_id,
    username,
    first_name,
    last_name,
  }) {
    const limpio = this._normalizarCodigo(codigo);
    if (!limpio) throw new Error("CODIGO_INVALIDO");

    const registro = get(
      `SELECT *
       FROM telegram_codigos_vinculacion
       WHERE codigo = ? AND expira_at > ?
       LIMIT 1`,
      [limpio, new Date().toISOString()],
    );
    if (!registro) throw new Error("CODIGO_INVALIDO_O_EXPIRADO");

    const chatId = String(chat_id);
    const chatActual = get(
      `SELECT tipo_entidad, id_entidad
       FROM telegram_vinculaciones
       WHERE chat_id = ?`,
      [chatId],
    );

    if (
      chatActual &&
      (chatActual.tipo_entidad !== registro.tipo_entidad ||
        chatActual.id_entidad !== registro.id_entidad)
    ) {
      throw new Error("CHAT_YA_VINCULADO");
    }

    const vincular = transaction(() => {
      run(
        `INSERT INTO telegram_vinculaciones
           (tipo_entidad, id_entidad, chat_id, username, first_name, last_name)
         VALUES (?, ?, ?, ?, ?, ?)
         ON CONFLICT(tipo_entidad, id_entidad)
         DO UPDATE SET
           chat_id = excluded.chat_id,
           username = excluded.username,
           first_name = excluded.first_name,
           last_name = excluded.last_name,
           updated_at = CURRENT_TIMESTAMP`,
        [
          registro.tipo_entidad,
          registro.id_entidad,
          chatId,
          username ?? null,
          first_name ?? null,
          last_name ?? null,
        ],
      );

      // Cambio: el codigo es de un solo uso.
      run(`DELETE FROM telegram_codigos_vinculacion WHERE id = ?`, [
        registro.id,
      ]);
    });

    vincular();
    return {
      tipo_entidad: registro.tipo_entidad,
      id_entidad: registro.id_entidad,
    };
  }

  static getChatUsuario(id_usuario) {
    return this._getChat("usuario", id_usuario);
  }

  static getChatRepresentante(id_representante) {
    return this._getChat("representante", id_representante);
  }

  static getPerfilUsuario(id_usuario) {
    return get(
      `SELECT
         u.id,
         u.role,
         COALESCE(e.nombre, p.nombre, a.nombre) AS nombre,
         COALESCE(e.apellido, p.apellido, a.apellido) AS apellido
       FROM usuarios u
       LEFT JOIN estudiantes e ON e.id_usuario = u.id
       LEFT JOIN profesores p ON p.id_usuario = u.id
       LEFT JOIN administradores a ON a.id_usuario = u.id
       WHERE u.id = ?`,
      [id_usuario],
    );
  }

  static getDetalleNota({
    id_rel_estudiante_grado,
    id_rel_grado_asignatura,
    id_lapso,
  }) {
    return get(
      `SELECT
         e.id AS id_estudiante,
         e.id_usuario AS id_usuario_estudiante,
         e.nombre,
         e.apellido,
         a.nombre AS asignatura,
         l.numero AS lapso,
         g.anio,
         g.seccion,
         pe.nombre AS periodo
       FROM rel_estudiante_grado reg
       INNER JOIN estudiantes e ON e.id = reg.id_estudiante
       INNER JOIN rel_grado_asignatura rga ON rga.id = ?
       INNER JOIN asignaturas a ON a.id = rga.id_asignatura
       INNER JOIN lapsos l ON l.id = ?
       INNER JOIN grados g ON g.id = reg.id_grado
       INNER JOIN periodos_escolares pe ON pe.id = reg.id_periodo
       WHERE reg.id = ?`,
      [id_rel_grado_asignatura, id_lapso, id_rel_estudiante_grado],
    );
  }

  static getRepresentantesPorEstudiante(id_estudiante) {
    return all(
      `SELECT r.id, r.nombre, r.apellido
       FROM rel_estudiante_representante rer
       INNER JOIN representantes r ON r.id = rer.id_representante
       WHERE rer.id_estudiante = ?
         AND rer.deleted_at IS NULL
         AND r.deleted_at IS NULL`,
      [id_estudiante],
    );
  }

  static getRepresentanteBasico(id_representante) {
    return get(
      `SELECT id, nombre, apellido
       FROM representantes
       WHERE id = ? AND deleted_at IS NULL`,
      [id_representante],
    );
  }

  static getAdminsActivos() {
    return all(
      `SELECT a.id, a.id_usuario, a.nombre, a.apellido
       FROM administradores a
       INNER JOIN usuarios u ON u.id = a.id_usuario
       WHERE a.deleted_at IS NULL
         AND u.deleted_at IS NULL
         AND u.activo = 1`,
    );
  }

  static getEstudianteBasico(id_estudiante) {
    return get(
      `SELECT id, id_usuario, nombre, apellido
       FROM estudiantes
       WHERE id = ? AND deleted_at IS NULL`,
      [id_estudiante],
    );
  }

  static getPeriodoActivo() {
    return get(`SELECT * FROM periodos_escolares WHERE activo = 1 LIMIT 1`);
  }

  static getProfesoresConNotasPendientes({ id_periodo, id_lapso }) {
    const params = [id_periodo, id_periodo];
    let lapsoWhere = "";

    if (id_lapso) {
      lapsoWhere = "AND l.id = ?";
      params.push(id_lapso);
    }

    return all(
      `SELECT
         p.id AS id_profesor,
         p.id_usuario,
         p.nombre,
         p.apellido,
         a.nombre AS asignatura,
         g.anio,
         g.seccion,
         l.numero AS lapso,
         COUNT(DISTINCT reg.id) AS pendientes
       FROM rel_asignatura_profesor rap
       INNER JOIN profesores p ON p.id = rap.id_profesor
       INNER JOIN rel_grado_asignatura rga ON rga.id = rap.id_rel_grado_asignatura
       INNER JOIN asignaturas a ON a.id = rga.id_asignatura
       INNER JOIN grados g ON g.id = rga.id_grado
       INNER JOIN rel_estudiante_grado reg
         ON reg.id_grado = g.id
        AND reg.id_periodo = ?
        AND reg.activo = 1
        AND reg.deleted_at IS NULL
       CROSS JOIN lapsos l
       LEFT JOIN notas n
         ON n.id_rel_estudiante_grado = reg.id
        AND n.id_rel_grado_asignatura = rga.id
        AND n.id_lapso = l.id
        AND n.id_periodo = ?
       WHERE rap.deleted_at IS NULL
         AND rga.deleted_at IS NULL
         AND p.deleted_at IS NULL
         AND p.id_usuario IS NOT NULL
         ${lapsoWhere}
         AND n.id IS NULL
       GROUP BY p.id, rga.id, l.id
       HAVING pendientes > 0
       ORDER BY p.apellido, p.nombre, g.anio, g.seccion, a.nombre, l.numero`,
      params,
    );
  }

  static _getChat(tipo_entidad, id_entidad) {
    return get(
      `SELECT chat_id
       FROM telegram_vinculaciones
       WHERE tipo_entidad = ? AND id_entidad = ?`,
      [tipo_entidad, id_entidad],
    );
  }

  static _validarOwner(tipo_entidad, id_entidad) {
    if (!OWNER_TYPES.includes(tipo_entidad)) throw new Error("TIPO_INVALIDO");
    if (!Number.isInteger(Number(id_entidad))) throw new Error("ID_INVALIDO");
  }

  static _normalizarCodigo(codigo) {
    return String(codigo ?? "")
      .trim()
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, "");
  }

  static _codigoCorto() {
    let codigo = "";
    for (let i = 0; i < 6; i += 1) {
      const index = crypto.randomInt(0, CODE_ALPHABET.length);
      codigo += CODE_ALPHABET[index];
    }
    return codigo;
  }
}
