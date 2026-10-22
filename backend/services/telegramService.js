import TelegramBot from "node-telegram-bot-api";
import { TelegramModel } from "../models/telegramModel.js";

let bot = null;
let botUsername = process.env.TELEGRAM_BOT_USERNAME || null;
let started = false;

export class TelegramService {
  static iniciarBot() {
    TelegramModel.ensureSchema();

    if (started) return;
    started = true;

    const token = process.env.TELEGRAM_BOT_TOKEN;
    if (!token) {
      console.warn(
        "[Telegram] TELEGRAM_BOT_TOKEN no configurado; notificaciones desactivadas.",
      );
      return;
    }

    // Cambio: el bot funciona solo por polling local, sin webhook ni URL publica.
    bot = new TelegramBot(token, { polling: true });

    bot
      .getMe()
      .then((me) => {
        botUsername = me?.username ? `@${me.username}` : botUsername;
        console.log(`[Telegram] Bot activo en polling ${botUsername ?? ""}`);
      })
      .catch((error) => {
        console.warn("[Telegram] No se pudo obtener info del bot:", error.message);
      });

    bot.on("message", (message) => {
      void this._manejarMensaje(message);
    });

    bot.on("polling_error", (error) => {
      console.warn("[Telegram] Error de polling:", error.message);
    });
  }

  static getBotUsername() {
    return botUsername;
  }

  static getEstadoVinculacionUsuario(id_usuario) {
    return TelegramModel.getEstadoVinculacion({
      tipo_entidad: "usuario",
      id_entidad: Number(id_usuario),
    });
  }

  static generarCodigoUsuario(id_usuario) {
    const codigo = TelegramModel.generarCodigo({
      tipo_entidad: "usuario",
      id_entidad: Number(id_usuario),
    });

    return {
      ...codigo,
      bot_username: this.getBotUsername(),
      instrucciones:
        "Abre tu bot de Telegram y envia /vincular CODIGO antes de que expire.",
    };
  }

  static generarCodigoRepresentante(id_representante) {
    // Cambio: representantes no tienen usuario JWT, por eso Control de Estudio genera su codigo.
    const representante = TelegramModel.getRepresentanteBasico(
      Number(id_representante),
    );
    if (!representante) throw new Error("REPRESENTANTE_NO_ENCONTRADO");

    const codigo = TelegramModel.generarCodigo({
      tipo_entidad: "representante",
      id_entidad: Number(id_representante),
    });

    return {
      ...codigo,
      bot_username: this.getBotUsername(),
      instrucciones:
        "El representante debe abrir el bot de Telegram y enviar /vincular CODIGO.",
    };
  }

  static async notificarCargaNota({
    id_rel_estudiante_grado,
    id_rel_grado_asignatura,
    id_lapso,
    nota,
  }) {
    try {
      const detalle = TelegramModel.getDetalleNota({
        id_rel_estudiante_grado,
        id_rel_grado_asignatura,
        id_lapso,
      });
      if (!detalle) return;

      const estudiante = `${detalle.nombre} ${detalle.apellido}`.trim();
      const base = [
        "Calificacion registrada o actualizada.",
        `Estudiante: ${estudiante}`,
        `Periodo: ${detalle.periodo}`,
        `Curso: ${detalle.anio}${detalle.seccion}`,
        `Asignatura: ${detalle.asignatura}`,
        `Lapso: ${detalle.lapso}`,
        `Nota: ${nota}`,
      ].join("\n");

      await this._sendToUsuario(detalle.id_usuario_estudiante, base);

      const representantes = TelegramModel.getRepresentantesPorEstudiante(
        detalle.id_estudiante,
      );
      for (const representante of representantes) {
        await this._sendToRepresentante(representante.id, base);
      }

      const admins = TelegramModel.getAdminsActivos();
      for (const admin of admins) {
        await this._sendToUsuario(
          admin.id_usuario,
          `Control de Estudio:\n${base}`,
        );
      }

      // TODO: enganchar notificarBajoRendimiento(...) cuando exista el calculo de riesgo academico.
    } catch (error) {
      console.warn("[Telegram] No se pudo notificar carga de nota:", error.message);
    }
  }

  static async notificarBajoRendimiento(representanteId, datos) {
    // Cambio: funcion lista para el futuro trigger real de riesgo academico.
    const mensaje = [
      "Alerta de bajo rendimiento academico.",
      datos?.estudiante ? `Estudiante: ${datos.estudiante}` : null,
      datos?.periodo ? `Periodo: ${datos.periodo}` : null,
      datos?.detalle ?? null,
    ]
      .filter(Boolean)
      .join("\n");

    return this._sendToRepresentante(representanteId, mensaje);
  }

  static async notificarResultadoFinal(id_estudiante, datos) {
    try {
      const estudiante = TelegramModel.getEstudianteBasico(id_estudiante);
      if (!estudiante) return;

      const nombre = `${estudiante.nombre} ${estudiante.apellido}`.trim();
      const mensaje = [
        "Resultado final del anio escolar.",
        `Estudiante: ${nombre}`,
        datos?.periodo ? `Periodo: ${datos.periodo}` : null,
        datos?.resultado ? `Resultado: ${datos.resultado}` : null,
        datos?.detalle ?? null,
      ]
        .filter(Boolean)
        .join("\n");

      await this._sendToUsuario(estudiante.id_usuario, mensaje);

      const representantes = TelegramModel.getRepresentantesPorEstudiante(
        estudiante.id,
      );
      for (const representante of representantes) {
        await this._sendToRepresentante(representante.id, mensaje);
      }
    } catch (error) {
      console.warn(
        "[Telegram] No se pudo notificar resultado final:",
        error.message,
      );
    }
  }

  static async enviarRecordatoriosNotasPendientes({ id_periodo, id_lapso }) {
    const periodo =
      id_periodo && Number.isInteger(Number(id_periodo))
        ? { id: Number(id_periodo) }
        : TelegramModel.getPeriodoActivo();

    if (!periodo?.id) throw new Error("NO_PERIODO_ACTIVO");

    const pendientes = TelegramModel.getProfesoresConNotasPendientes({
      id_periodo: Number(periodo.id),
      id_lapso: id_lapso ? Number(id_lapso) : null,
    });

    const agrupados = new Map();
    for (const item of pendientes) {
      if (!agrupados.has(item.id_profesor)) {
        agrupados.set(item.id_profesor, {
          id_profesor: item.id_profesor,
          id_usuario: item.id_usuario,
          nombre: `${item.nombre} ${item.apellido}`.trim(),
          pendientes: [],
        });
      }
      agrupados.get(item.id_profesor).pendientes.push(item);
    }

    const resumen = {
      periodo: periodo.id,
      lapso: id_lapso ? Number(id_lapso) : null,
      profesoresDetectados: agrupados.size,
      notificados: 0,
      sinTelegram: 0,
      profesores: [],
    };

    for (const profesor of agrupados.values()) {
      const enviado = await this.notificarRecordatorioProfesor(
        profesor.id_profesor,
        profesor,
      );

      if (enviado) resumen.notificados += 1;
      else resumen.sinTelegram += 1;

      resumen.profesores.push({
        id_profesor: profesor.id_profesor,
        nombre: profesor.nombre,
        pendientes: profesor.pendientes.length,
        notificado: enviado,
      });
    }

    return resumen;
  }

  static async notificarRecordatorioProfesor(_profesorId, datos) {
    const detalle = datos.pendientes
      .slice(0, 8)
      .map(
        (item) =>
          `- ${item.anio}${item.seccion} ${item.asignatura}, lapso ${item.lapso}: ${item.pendientes} notas`,
      )
      .join("\n");

    const extra =
      datos.pendientes.length > 8
        ? `\nY ${datos.pendientes.length - 8} grupos mas.`
        : "";

    return this._sendToUsuario(
      datos.id_usuario,
      [
        "Recordatorio de carga de notas.",
        "Tienes calificaciones pendientes por registrar:",
        detalle,
        extra,
      ]
        .filter(Boolean)
        .join("\n"),
    );
  }

  static async _manejarMensaje(message) {
    const chatId = message.chat?.id;
    const texto = String(message.text ?? "").trim();
    if (!chatId || !texto) return;

    if (texto === "/start") {
      await this._sendRaw(
        chatId,
        "Hola. Para vincular tu cuenta, genera un codigo en la plataforma y enviame /vincular CODIGO.",
      );
      return;
    }

    const codigo = this._extraerCodigo(texto);
    if (!codigo) {
      await this._sendRaw(
        chatId,
        "Codigo no reconocido. Genera uno nuevo desde la plataforma y envia /vincular CODIGO.",
      );
      return;
    }

    try {
      const vinculado = TelegramModel.vincularChatConCodigo({
        codigo,
        chat_id: chatId,
        username: message.from?.username,
        first_name: message.from?.first_name,
        last_name: message.from?.last_name,
      });

      const perfil =
        vinculado.tipo_entidad === "usuario"
          ? TelegramModel.getPerfilUsuario(vinculado.id_entidad)
          : TelegramModel.getRepresentanteBasico(vinculado.id_entidad);
      const nombre = perfil?.nombre
        ? `${perfil.nombre} ${perfil.apellido ?? ""}`.trim()
        : "tu cuenta";

      await this._sendRaw(
        chatId,
        `Cuenta de Telegram vinculada correctamente con ${nombre}.`,
      );
    } catch (error) {
      const mensaje =
        error.message === "CHAT_YA_VINCULADO"
          ? "Este chat ya esta vinculado a otra cuenta."
          : "Codigo invalido o expirado. Genera uno nuevo desde la plataforma.";
      await this._sendRaw(chatId, mensaje);
    }
  }

  static _extraerCodigo(texto) {
    const partes = texto.split(/\s+/);
    if (partes[0]?.toLowerCase() === "/vincular") return partes[1] ?? "";
    if (/^[a-z0-9-]{6,12}$/i.test(texto)) return texto;
    return "";
  }

  static async _sendToUsuario(id_usuario, mensaje) {
    if (!id_usuario) return false;
    const link = TelegramModel.getChatUsuario(id_usuario);
    if (!link?.chat_id) {
      console.log(`[Telegram] Usuario ${id_usuario} sin chat vinculado.`);
      return false;
    }
    return this._sendRaw(link.chat_id, mensaje);
  }

  static async _sendToRepresentante(id_representante, mensaje) {
    const link = TelegramModel.getChatRepresentante(id_representante);
    if (!link?.chat_id) {
      console.log(
        `[Telegram] Representante ${id_representante} sin chat vinculado.`,
      );
      return false;
    }
    return this._sendRaw(link.chat_id, mensaje);
  }

  static async _sendRaw(chatId, mensaje) {
    if (!bot) {
      console.log("[Telegram] Bot inactivo; mensaje omitido.");
      return false;
    }

    try {
      await bot.sendMessage(chatId, mensaje);
      return true;
    } catch (error) {
      console.warn("[Telegram] Error enviando mensaje:", error.message);
      return false;
    }
  }
}
