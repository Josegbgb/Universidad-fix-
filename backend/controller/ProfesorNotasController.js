import { ProfesorNotaModel } from "../models/ProfesorNotasModel.js";
import { TelegramService } from "../services/telegramService.js";

export class ProfesorDashboardController {
  static getMisAsignaciones(req, res) {
    try {
      const { correo } = req.params;
      if (!ProfesorDashboardController._puedeUsarCorreo(req, correo)) {
        return res.status(403).json({ error: "Forbidden" });
      }

      const data = ProfesorNotaModel.getAsignacionesByProfesor({
        correo,
      });

      res.json(data);
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: "Error al obtener asignaciones" });
    }
  }

  static getAsignaciones(req, res) {
    try {
      const { id_profesor } = req.params; // o de params si no tienes auth

      const data = ProfesorNotaModel.getAsignaciones(id_profesor);

      res.json(data);
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: "Error al obtener asignaciones" });
    }
  }

  static getNotasByAsignacion(req, res) {
    try {
      const { id_rel_grado_asignatura } = req.params;
      const { id_periodo } = req.query;
      // Cambio: se omiten logs de parametros sensibles de notas.
      if (
        !ProfesorDashboardController._puedeUsarAsignacion(
          req,
          Number(id_rel_grado_asignatura),
        )
      ) {
        return res.status(403).json({ error: "Forbidden" });
      }
      // Cambio: las lecturas de notas requieren periodo escolar explicito.
      const data = ProfesorNotaModel.getNotasByRelacion(
        id_rel_grado_asignatura,
        id_periodo ? Number(id_periodo) : undefined,
      );

      res.json(data);
    } catch (e) {
      console.error(e);
      if (e.message === "ID_PERIODO_REQUERIDO") {
        return res.status(400).json({ error: e.message });
      }
      res.status(500).json({ error: "Error al obtener notas" });
    }
  }

  static saveNota(req, res) {
    try {
      const {
        id_rel_estudiante_grado,
        id_rel_grado_asignatura,
        id_lapso,
        nota,
      } = req.body;

      if (
        !ProfesorDashboardController._puedeUsarAsignacion(
          req,
          Number(id_rel_grado_asignatura),
        )
      ) {
        return res.status(403).json({ error: "Forbidden" });
      }

      ProfesorNotaModel.saveNota({
        id_rel_estudiante_grado,
        id_rel_grado_asignatura,
        id_lapso,
        nota,
      });

      // Cambio: avisa carga/actualizacion de calificacion sin bloquear el guardado.
      void TelegramService.notificarCargaNota({
        id_rel_estudiante_grado,
        id_rel_grado_asignatura,
        id_lapso,
        nota,
      });

      res.json({ ok: true });
    } catch (e) {
      console.error(e);
      if (e.message === "REL_ESTUDIANTE_GRADO_NO_ENCONTRADA") {
        return res.status(400).json({ error: e.message });
      }
      if (e.message === "ASIGNACION_NO_CORRESPONDE_AL_GRADO") {
        return res.status(400).json({ error: e.message });
      }
      res.status(500).json({ error: "Error al guardar nota" });
    }
  }

  static async getNotasByGrado(req, res) {
    try {
      const { id_grado } = req.params;
      const { id_periodo } = req.query;

      // Cambio: el grado se consulta dentro de un periodo especifico.
      const raw = await ProfesorNotaModel.getNotasByGrado(
        id_grado,
        id_periodo ? Number(id_periodo) : undefined,
      );

      const resultado = {};

      raw.forEach((r) => {
        if (!resultado[r.id_estudiante]) {
          resultado[r.id_estudiante] = {
            id_estudiante: r.id_estudiante,
            nombre: r.nombre,
            apellido: r.apellido,
            id_rel_estudiante_grado: r.id_rel_estudiante_grado,
            asignaturas: {},
          };
        }

        const est = resultado[r.id_estudiante];

        if (!est.asignaturas[r.id_rel_grado_asignatura]) {
          est.asignaturas[r.id_rel_grado_asignatura] = {
            id_rel_grado_asignatura: r.id_rel_grado_asignatura,
            nombre: r.asignatura,
            notas: {},
          };
        }

        est.asignaturas[r.id_rel_grado_asignatura].notas[r.lapso] = r.nota;
      });

      // 🔥 convertir a array
      const final = Object.values(resultado).map((est) => ({
        ...est,
        asignaturas: Object.values(est.asignaturas),
      }));

      res.json(final);
    } catch (e) {
      console.error(e);
      if (e.message === "ID_PERIODO_REQUERIDO") {
        return res.status(400).json({ error: e.message });
      }
      res.status(500).json({ error: "Error al obtener notas del grado" });
    }
  }

  static _puedeUsarCorreo(req, correo) {
    if (req.user?.role === "admin") return true;

    // Cambio: el profesor solo puede consultar sus propias asignaciones.
    const profesor = ProfesorNotaModel.getProfesorByUserId(req.user?.id);
    return Boolean(profesor && profesor.correo === correo);
  }

  static _puedeUsarAsignacion(req, id_rel_grado_asignatura) {
    if (req.user?.role === "admin") return true;

    return ProfesorNotaModel.profesorTieneAsignacion({
      userId: req.user?.id,
      id_rel_grado_asignatura,
    });
  }
}
