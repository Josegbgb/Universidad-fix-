// src/api/fetchWithAuth.ts
export async function fetchWithAuth(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  const token = localStorage.getItem("token");

  const headers = new Headers({
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  });

  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const res = await fetch(url, {
    ...options,
    headers,
  });

  if (res.status === 401) {
    console.warn("Token expirado o inválido");
    // podrías redirigir a login aquí si quieres
  }

  return res;
}
