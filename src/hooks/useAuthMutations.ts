import { useMutation } from "@tanstack/react-query";
import { useAuth } from "../contexts/AuthContext";
import { authService } from "../services/authService";
import {
  LoginRequest,
  RegisterOwnerRequest,
} from "../types/auth";

export function useLogin() {
  const { completeLogin } = useAuth();

  return useMutation({
    mutationFn: (data: LoginRequest) => authService.login(data),
    onSuccess: (response) => {
      completeLogin(response);
    },
  });
}

export function useRegisterOwner() {
  return useMutation({
    mutationFn: (data: RegisterOwnerRequest) =>
      authService.registerOwner(data),
  });
}