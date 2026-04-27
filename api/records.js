import { apiFetch } from "./client.js";

export async function getRecords() {
  return apiFetch("/api/v1/records/");
}

export async function createRecord(data) {
  return apiFetch("/api/v1/records/", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function updateRecord(id, data) {
  return apiFetch(`/api/v1/records/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export async function deleteRecord(id) {
  return apiFetch(`/api/v1/records/${id}`, {
    method: "DELETE",
  });
}

export async function deleteAllRecords() {
  return apiFetch("/api/v1/records/", {
    method: "DELETE",
  });
}