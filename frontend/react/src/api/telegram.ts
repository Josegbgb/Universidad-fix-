import { fetchWithAuth } from "./apiClient";

const API_URL = "http://localhost:1234/telegram";

async function unwrap<T>(res: Response): Promise<T> {
  const data = await res.json();
  if (!res.ok) {
    throw new Error(
      data?.body?.error ?? data?.error ?? data?.message ?? "ERROR_TELEGRAM",
    );
  }
  return (data?.body ?? data) as T;
}

export type TelegramCodigo = {
  codigo: string;
  expira_at: string;
  bot_username?: string | null;
  instrucciones: string;
};

export type TelegramEstado = {
  vinculado: boolean;
  data?: {
    chat_id: string;
    username?: string | null;
    updated_at?: string;
  } | null;
};

export async function obtenerEstadoTelegram() {
  const res = await fetchWithAuth(`${API_URL}/vinculacion`);
  return unwrap<TelegramEstado>(res);
}

export async function generarCodigoTelegram() {
  // Cambio: solicita un codigo temporal para vincular Telegram.
  const res = await fetchWithAuth(`${API_URL}/vinculacion/codigo`, {
    method: "POST",
  });
  return unwrap<TelegramCodigo>(res);
}

export async function enviarRecordatorioNotasPendientes(idLapso?: number) {
  // Cambio: accion manual admin para avisar a profesores con notas pendientes.
  const res = await fetchWithAuth(`${API_URL}/recordatorios/notas-pendientes`, {
    method: "POST",
    body: JSON.stringify({ id_lapso: idLapso }),
  });
  return unwrap<{
    profesoresDetectados: number;
    notificados: number;
    sinTelegram: number;
  }>(res);
}
