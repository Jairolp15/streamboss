import api from "./client";

export const getClients = () => api.get("/clients/");
export const createClient = (data) => api.post("/clients/", data);
export const updateClient = (id, data) => api.patch(`/clients/${id}`, data);
export const deleteClient = (id) => api.delete(`/clients/${id}`);
