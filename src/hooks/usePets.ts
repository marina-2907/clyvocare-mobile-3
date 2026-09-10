import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { petService } from "../services/petService";
import { PetRequest } from "../types/pet";

export const petKeys = {
  all: ["pets"] as const,
  byOwner: (ownerId?: number) =>
    [...petKeys.all, "owner", ownerId] as const,
  detail: (petId: number) =>
    [...petKeys.all, "detail", petId] as const,
  species: ["species"] as const,
};

export function usePets(ownerId?: number) {
  return useQuery({
    queryKey: petKeys.byOwner(ownerId),

    queryFn: () => {
      if (!ownerId) {
        throw new Error("Tutor não identificado.");
      }

      return petService.listByOwner(ownerId);
    },

    enabled: Boolean(ownerId),
  });
}

export function usePet(petId?: number) {
  return useQuery({
    queryKey: petKeys.detail(petId ?? 0),

    queryFn: () => {
      if (!petId) {
        throw new Error("Pet não identificado.");
      }

      return petService.getById(petId);
    },

    enabled: Boolean(petId),
  });
}

export function useSpecies() {
  return useQuery({
    queryKey: petKeys.species,
    queryFn: petService.listSpecies,
  });
}

export function useCreatePet(ownerId: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: PetRequest) => petService.create(data),

    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: petKeys.byOwner(ownerId),
        }),
        queryClient.invalidateQueries({
          queryKey: ["owner", "me"],
        }),
      ]);
    },
  });
}

export function useUpdatePet(ownerId: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      petId,
      data,
    }: {
      petId: number;
      data: PetRequest;
    }) => petService.update(petId, data),

    onSuccess: async (updatedPet) => {
      queryClient.setQueryData(
        petKeys.detail(updatedPet.id),
        updatedPet,
      );

      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: petKeys.byOwner(ownerId),
        }),
        queryClient.invalidateQueries({
          queryKey: ["owner", "me"],
        }),
      ]);
    },
  });
}

export function useDeletePet(ownerId: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (petId: number) => petService.delete(petId),

    onSuccess: async (_, deletedPetId) => {
      queryClient.removeQueries({
        queryKey: petKeys.detail(deletedPetId),
      });

      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: petKeys.byOwner(ownerId),
        }),
        queryClient.invalidateQueries({
          queryKey: ["owner", "me"],
        }),
      ]);
    },
  });
}