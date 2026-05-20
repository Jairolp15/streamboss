import api from "./client";

export const getPublicPlatforms = () => api.get("/public/platforms");
export const publicSubmitRequest = (data) => api.post("/public/submit-request", data);
