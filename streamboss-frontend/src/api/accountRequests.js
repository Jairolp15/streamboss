import api from "./client";

export const getAccountRequests = () => api.get("/account-requests/");
export const createAccountRequest = (data) => api.post("/account-requests/", data);
export const resolveAccountRequest = (id, data) => api.patch(`/account-requests/${id}`, data);
