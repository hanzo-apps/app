import axios from "axios";
import MY_TOKEN_KEY from "./get-cookie-name";
import { getStoredToken } from "./client-auth";

export const api = axios.create({
  baseURL: `/api`,
  headers: {
    cache: "no-store",
  },
});

export const apiServer = axios.create({
  baseURL: process.env.NEXT_APP_API_URL as string,
  headers: {
    cache: "no-store",
  },
});

api.interceptors.request.use(
  async (config) => {
    // Try localStorage first, then fall back to cookies
    let token = getStoredToken();

    if (!token) {
      // Fall back to cookie if localStorage doesn't have it
      const cookie_name = MY_TOKEN_KEY();
      token = document.cookie
        .split("; ")
        .find((row) => row.startsWith(`${cookie_name}=`))
        ?.split("=")[1] || null;
    }

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    // Handle the error
    return Promise.reject(error);
  }
);
