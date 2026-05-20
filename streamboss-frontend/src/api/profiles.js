import api from "./client";

export const updateProfile = (id, data) => api.patch(`/profiles/${id}`, data);
