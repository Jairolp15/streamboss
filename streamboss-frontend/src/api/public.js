import axios from "axios";

// Separate axios instance for public endpoints.
// Does NOT include auth token or 401→/login redirect interceptors,
// so unauthenticated users can freely access /auto-registro.
const publicApi = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "/api/v1",
  headers: { "Content-Type": "application/json" },
});

export const getPublicPlatforms = () => publicApi.get("/public/platforms");
export const publicSubmitRequest = (data) => publicApi.post("/public/submit-request", data);
