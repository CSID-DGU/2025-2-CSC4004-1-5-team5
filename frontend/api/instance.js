// FRONTEND/api/instance.js
import axios from "axios";

// ✅ 하드코딩: 일단은 이렇게 직접 넣어서 확실히 붙이기
const API_BASE_URL = "https://yeonhee.shop/api";

console.log("🔥 axios instance 초기화, API_BASE_URL =", API_BASE_URL);

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 60000,
});
api.interceptors.request.use((config) => {
  console.log(
    "[axios 요청]",
    config.method?.toUpperCase(),
    (config.baseURL || "") + (config.url || "")
  );
  return config;
});
