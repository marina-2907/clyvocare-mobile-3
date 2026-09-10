import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ownerService,
  UpdateOwnerRequest,
} from "../services/ownerService";

const OWNER_PROFILE_KEY = ["owner", "me"];

export function useOwnerProfile() {
  return useQuery({
    queryKey: OWNER_PROFILE_KEY,
    queryFn: ownerService.getMyProfile,
  });
}

export function useUpdateOwnerProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: UpdateOwnerRequest) =>
      ownerService.updateMyProfile(data),

    onSuccess: (updatedProfile) => {
      queryClient.setQueryData(OWNER_PROFILE_KEY, updatedProfile);
    },
  });
}