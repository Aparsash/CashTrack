const API_URL = "https://cashtrack-eo68.onrender.com";

function getToken() {
  return localStorage.getItem("access_token");
}

async function refreshToken() {
  const refresh_token = localStorage.getItem("refresh_token");
  if (!refresh_token) throw new Error("No refresh token");

  const response = await fetch(`${API_URL}/api/v1/auth/refresh`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refresh_token }),
  });

  if (!response.ok) {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    throw new Error("Session abgelaufen. Bitte neu einloggen.");
  }

  const data = await response.json();
  localStorage.setItem("access_token", data.access_token);
  if (data.refresh_token) localStorage.setItem("refresh_token", data.refresh_token);
  return data.access_token;
}

export async function apiFetch(path, options = {}) {
  let token = getToken();

  let response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });

  // Token abgelaufen → refresh und nochmal versuchen
  if (response.status === 401) {
    try {
      token = await refreshToken();
      response = await fetch(`${API_URL}${path}`, {
        ...options,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
          ...options.headers,
        },
      });
    } catch {
      window.location.reload(); // Login-Screen zeigen
      return;
    }
  }

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.detail || "API Error");
  }

  if (response.status === 204) return null;
  return response.json();
}