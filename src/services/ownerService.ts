import { apiRequest } from "./api";
import { OwnerProfile } from "../types/auth";

export type UpdateOwnerRequest = {
  name: string;
  phone: string;
  cityId: number | null;
};

export const ownerService = {
  getMyProfile(): Promise<OwnerProfile> {
    return apiRequest<OwnerProfile>("/api/owners/me");
  },

  updateMyProfile(data: UpdateOwnerRequest): Promise<OwnerProfile> {
    return apiRequest<OwnerProfile>("/api/owners/me", {
      method: "PUT",
      body: JSON.stringify(data),
    });
  },
};
