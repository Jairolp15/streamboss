import api from "./client";

export const login = (email, password) => {
  const form = new FormData();
  form.append("username", email);
  form.append("password", password);
  return api.post("/auth/login", form, { headers: { "Content-Type": "multipart/form-data" } });
};

export const getMe = () => api.get("/auth/me");
