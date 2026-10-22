const BACKEND_ORIGINS = ["http://localhost:1234", "http://127.0.0.1:1234"];

let installed = false;

export function installAuthFetch() {
  if (installed || typeof window === "undefined") return;

  const nativeFetch = window.fetch.bind(window);
  installed = true;

  window.fetch = (input: RequestInfo | URL, init: RequestInit = {}) => {
    const url =
      typeof input === "string"
        ? input
        : input instanceof URL
          ? input.href
          : input.url;

    const token = localStorage.getItem("token");
    const isBackendRequest = BACKEND_ORIGINS.some((origin) =>
      url.startsWith(origin),
    );

    if (!token || !isBackendRequest) {
      return nativeFetch(input, init);
    }

    const baseHeaders = input instanceof Request ? input.headers : undefined;
    const headers = new Headers(init.headers ?? baseHeaders);
    // Cambio: agrega JWT a fetch existentes sin alterar sus contratos.
    if (!headers.has("Authorization")) {
      headers.set("Authorization", `Bearer ${token}`);
    }

    return nativeFetch(input, { ...init, headers });
  };
}
