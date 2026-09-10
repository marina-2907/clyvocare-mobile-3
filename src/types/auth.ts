export type UserRole = "OWNER" | "VETERINARIAN" | "CLINIC_ADMIN";

export type LoginRequest = {
  username: string;
  password: string;
};

export type AuthResponse = {
  token: string;
  role: UserRole;
};

export type RegisterOwnerRequest = {
  username: string;
  password: string;
  name: string;
  phone: string;
  document: string;
  cityId: number | null;
};

export type OwnerProfile = {
  id: number;
  name: string;
  phone: string;
  document: string;
  registeredAt: string;
  cityName: string | null;
  petCount: number;
};
