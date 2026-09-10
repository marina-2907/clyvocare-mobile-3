import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { clinicalService } from "../services/clinicalService";
import { localCareService } from "../services/localCareService";
import { AppointmentRequest, SelfReportedEvent } from "../types/clinical";

export const clinicalKeys = {
  all: ["clinical"] as const,
  appointments: (petId?: number) => ["clinical", "appointments", petId] as const,
  vaccinations: (petId?: number) => ["clinical", "vaccinations", petId] as const,
  exams: (petId?: number) => ["clinical", "exams", petId] as const,
  treatments: (petId?: number) => ["clinical", "treatments", petId] as const,
  localHistory: (petId?: number) => ["clinical", "local-history", petId] as const,
  reminders: ["clinical", "reminders"] as const,
  veterinarians: ["clinical", "veterinarians"] as const,
  clinics: ["clinical", "clinics"] as const,
  vaccines: ["clinical", "vaccines"] as const,
};

function requirePetId(petId?: number) {
  if (!petId) throw new Error("Selecione um pet.");
  return petId;
}

export function useAppointments(petId?: number) {
  return useQuery({
    queryKey: clinicalKeys.appointments(petId),
    queryFn: () => clinicalService.listAppointments(requirePetId(petId)),
    enabled: Boolean(petId),
  });
}

export function useVaccinations(petId?: number) {
  return useQuery({
    queryKey: clinicalKeys.vaccinations(petId),
    queryFn: () => clinicalService.listVaccinations(requirePetId(petId)),
    enabled: Boolean(petId),
  });
}

export function useExams(petId?: number) {
  return useQuery({
    queryKey: clinicalKeys.exams(petId),
    queryFn: () => clinicalService.listExams(requirePetId(petId)),
    enabled: Boolean(petId),
  });
}

export function useTreatments(petId?: number) {
  return useQuery({
    queryKey: clinicalKeys.treatments(petId),
    queryFn: () => clinicalService.listTreatments(requirePetId(petId)),
    enabled: Boolean(petId),
  });
}

export function useLocalHistory(petId?: number) {
  return useQuery({
    queryKey: clinicalKeys.localHistory(petId),
    queryFn: () => localCareService.listByPet(requirePetId(petId)),
    enabled: Boolean(petId),
  });
}

export function useReminders() {
  return useQuery({ queryKey: clinicalKeys.reminders, queryFn: clinicalService.listReminders });
}

export function useVeterinarians() {
  return useQuery({
    queryKey: clinicalKeys.veterinarians,
    queryFn: clinicalService.listVeterinarians,
  });
}

export function useClinics() {
  return useQuery({ queryKey: clinicalKeys.clinics, queryFn: clinicalService.listClinics });
}

export function useVaccines() {
  return useQuery({ queryKey: clinicalKeys.vaccines, queryFn: clinicalService.listVaccines });
}

export function useScheduleAppointment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: AppointmentRequest) => clinicalService.scheduleAppointment(data),
    onSuccess: async (appointment) => {
      await queryClient.invalidateQueries({
        queryKey: clinicalKeys.appointments(appointment.petId),
      });
    },
  });
}

export function useCancelAppointment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ appointmentId }: { appointmentId: number; petId: number }) =>
      clinicalService.cancelAppointment(appointmentId),
    onSuccess: async (_, variables) => {
      await queryClient.invalidateQueries({
        queryKey: clinicalKeys.appointments(variables.petId),
      });
    },
  });
}

export function useConfirmReminder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: clinicalService.confirmReminder,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: clinicalKeys.reminders });
    },
  });
}

export function useCreateLocalHistory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Omit<SelfReportedEvent, "id" | "createdAt">) =>
      localCareService.create(data),
    onSuccess: async (event) => {
      await queryClient.invalidateQueries({
        queryKey: clinicalKeys.localHistory(event.petId),
      });
    },
  });
}

export function useDeleteLocalHistory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ eventId }: { eventId: string; petId: number }) =>
      localCareService.remove(eventId),
    onSuccess: async (_, variables) => {
      await queryClient.invalidateQueries({
        queryKey: clinicalKeys.localHistory(variables.petId),
      });
    },
  });
}
