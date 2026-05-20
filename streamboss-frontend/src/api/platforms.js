import api from "./client";

export const getPlatforms = () => api.get("/platforms/");
export const createPlatform = (data) => api.post("/platforms/", data);
export const updatePlatform = (id, data) => api.patch(`/platforms/${id}`, data);
export const deletePlatform = (id) => api.delete(`/platforms/${id}`);
