import api from "./client";

export const getMasterAccounts = () => api.get("/master-accounts/");
export const getMasterAccount = (id) => api.get(`/master-accounts/${id}`);
export const createMasterAccount = (data) => api.post("/master-accounts/", data);
export const updateMasterAccount = (id, data) => api.patch(`/master-accounts/${id}`, data);
export const deleteMasterAccount = (id) => api.delete(`/master-accounts/${id}`);
