import { apiFetch } from "./client.js";

export async function login(email, password) {
  const data = await apiFetch("/api/v1/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });

  localStorage.setItem("access_token", data.access_token);
  return data;
}

export async function register(email, password) {
  return apiFetch("/api/v1/auth/register", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}

export function logout() {
  localStorage.removeItem("access_token");
}

export function isLoggedIn() {
  return !!localStorage.getItem("access_token");
}