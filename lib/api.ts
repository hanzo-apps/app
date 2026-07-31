import axios from "axios";
import { SESSION_COOKIE } from "@hanzo/iam/server";

/**
 * Same-origin browser client for the app's own `/v1/*` surface.
 *
 * The bearer comes from the ONE cookie the IAM provider projects the SDK token
 * onto (`components/providers/IamClientProvider`) — there is no second token
 * store to fall out of sync with. The server verifies whatever arrives against
 * IAM's JWKS regardless, so reading it here only decides whether the call is
 * made as somebody at all.
 */
export const api = axios.create({
  baseURL: `/api`,
  headers: {
    cache: "no-store",
  },
});

api.interceptors.request.use(
  async (config) => {
    const token = document.cookie
      .split("; ")
      .find((row) => row.startsWith(`${SESSION_COOKIE}=`))
      ?.split("=")[1];

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);
