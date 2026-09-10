import { apiRequest } from "./api";
import { Pet, PetRequest, Species } from "../types/pet";

export const petService = {
  listByOwner(ownerId: number): Promise<Pet[]> {
    return apiRequest<Pet[]>(`/api/owners/${ownerId}/pets`);
  },

  getById(petId: number): Promise<Pet> {
    return apiRequest<Pet>(`/api/pets/${petId}`);
  },

  create(data: PetRequest): Promise<Pet> {
    return apiRequest<Pet>("/api/pets", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  update(petId: number, data: PetRequest): Promise<Pet> {
    return apiRequest<Pet>(`/api/pets/${petId}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  },

  delete(petId: number): Promise<void> {
    return apiRequest<void>(`/api/pets/${petId}`, {
      method: "DELETE",
    });
  },

  listSpecies(): Promise<Species[]> {
    return apiRequest<Species[]>("/api/species");
  },
};