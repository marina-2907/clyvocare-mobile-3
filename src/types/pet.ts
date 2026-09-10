export type PetSex = "MALE" | "FEMALE";
export type PetSize = "SMALL" | "MEDIUM" | "LARGE";

export type Pet = {
  id: number;
  name: string;
  birthDate: string | null;
  sex: PetSex | null;
  currentWeight: number | null;
  microchip: string | null;
  breed: string | null;
  size: PetSize | null;
  photoUrl: string | null;
  registeredAt: string;
  ownerId: number;
  ownerName: string;
  speciesName: string;
};

export type PetRequest = {
  name: string;
  birthDate: string | null;
  sex: PetSex | null;
  currentWeight: number | null;
  microchip: string | null;
  breed: string | null;
  size: PetSize | null;
  photoUrl: string | null;
  ownerId: number;
  speciesId: number;
};

export type Species = {
  id: number;
  name: string;
  description: string | null;
};