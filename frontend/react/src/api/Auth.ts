// src/api/auth.ts
const API_URL = "http://localhost:1234/api";

export interface LoginResponse {
  statusCode: number;
  body: {
    user: {
      id: number;
      email: string;
      role: string;
    };
    token: string;
  };
}

export async function login(
  email: string,
  password: string,
): Promise<LoginResponse> {
  const res = await fetch(`${API_URL}/users/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    } as Record<string, string>,
    body: JSON.stringify({ email, password }),
  });

  const data = await res.json();

  if (!res.ok) {
    // Si el backend devuelve mensaje de error, lo usamos
    const errorMessage =
      data.body?.error || data.message || "Credenciales incorrectas";
    throw new Error(errorMessage);
  }

  // Guarda el token en localStorage
  localStorage.setItem("token", data.body.token);
  localStorage.setItem("role", data.body.user.role);
  localStorage.setItem("email", data.body.user.email);

  return data;
}
