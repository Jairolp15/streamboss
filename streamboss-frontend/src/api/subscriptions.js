import api from "./client";

export const getSubscriptions = () => api.get("/subscriptions/");
export const getExpiringSubscriptions = () => api.get("/subscriptions/expiring");
export const createSubscription = (data) => api.post("/subscriptions/", data);
export const getSubscription = (id) => api.get(`/subscriptions/${id}`);
export const getWhatsAppLink = (id) => api.get(`/subscriptions/${id}/whatsapp`);
export const cancelSubscription = (id) => api.patch(`/subscriptions/${id}/cancel`);
export const deleteSubscription = (id) => api.delete(`/subscriptions/${id}`);
