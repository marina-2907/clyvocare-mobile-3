import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  AuthResponse,
  LoginRequest,
  RegisterOwnerRequest,
  UserRole,
} from "../types/auth";
import { apiRequest, TOKEN_KEY } from "./api";

export const ROLE_KEY = "@clyvocare_auth_role";

export type StoredSession = {
  token: string;
  role: UserRole;
};

export const authService = {
  async login(data: LoginRequest): Promise<AuthResponse> {
    const response = await apiRequest<AuthResponse>("/api/auth/login", {
      method: "POST",
      body: JSON.stringify(data),
      authenticated: false,
    });

    await AsyncStorage.multiSet([
      [TOKEN_KEY, response.token],
      [ROLE_KEY, response.role],
    ]);

    return response;
  },

  async registerOwner(data: RegisterOwnerRequest): Promise<void> {
    await apiRequest<void>("/api/auth/register/owner", {
      method: "POST",
      body: JSON.stringify(data),
      authenticated: false,
    });
  },

  async getStoredSession(): Promise<StoredSession | null> {
    const values = await AsyncStorage.multiGet([TOKEN_KEY, ROLE_KEY]);

    const token = values[0][1];
    const role = values[1][1] as UserRole | null;

    if (!token || !role) {
      return null;
    }

    return { token, role };
  },

  async logout(): Promise<void> {
    await AsyncStorage.multiRemove([TOKEN_KEY, ROLE_KEY]);
  },
};