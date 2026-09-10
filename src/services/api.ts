import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";

export const TOKEN_KEY = "@clyvocare_auth_token";

export const API_URL =
  process.env.EXPO_PUBLIC_API_URL ??
  (Platform.OS === "android"
    ? "http://10.0.2.2:8080"
    : "http://localhost:8080");

type ApiErrorPayload = {
  message?: string;
  error?: string;
};

type ApiRequestOptions = Omit<RequestInit, "headers"> & {
  authenticated?: boolean;
  headers?: Record<string, string>;
};

export async function apiRequest<T>(
  endpoint: string,
  options: ApiRequestOptions = {},
): Promise<T> {
  const {
    authenticated = true,
    headers: customHeaders,
    ...fetchOptions
  } = options;

  const token = authenticated ? await AsyncStorage.getItem(TOKEN_KEY) : null;

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...fetchOptions,
    headers: {
      "Content-Type": "application/json",
      ...customHeaders,
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });

  if (response.status === 204) {
    return undefined as T;
  }

  const responseText = await response.text();
  let data: unknown = null;

  if (responseText) {
    try {
      data = JSON.parse(responseText);
    } catch {
      data = responseText;
    }
  }

  if (!response.ok) {
    const errorPayload =
      typeof data === "object" && data !== null
        ? (data as ApiErrorPayload)
        : null;

    const message =
      errorPayload?.message ||
      errorPayload?.error ||
      (typeof data === "string"
        ? data
        : `Erro na comunicação com a API (${response.status}).`);

    throw new Error(message);
  }

  return data as T;
}
