import api from "./client";

export const getReports = () => api.get("/reports/");
export const createReport = (data) => api.post("/reports/", data);
export const resolveReport = (id, data) => api.patch(`/reports/${id}`, data);
