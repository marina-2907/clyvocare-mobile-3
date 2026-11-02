
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { clinicalService } from "../services/clinicalService";
import { localCareService } from "../services/localCareService";
import { agendarNotificacaoConsulta } from "../services/notificationService";

import { AppointmentRequest, SelfReportedEvent } from "../types/clinical";
import { decodeReasonWithTime } from "../utils/date";

// =====================================================
// CHAVES DO TANSTACK QUERY
// =====================================================

export const clinicalKeys = {
  all: ["clinical"] as const,
  appointments: (petId?: number) =>
    ["clinical", "appointments", petId] as const,
  vaccinations: (petId?: number) =>
    ["clinical", "vaccinations", petId] as const,
  exams: (petId?: number) =>
    ["clinical", "exams", petId] as const,
  treatments: (petId?: number) =>
    ["clinical", "treatments", petId] as const,
  localHistory: (petId?: number) =>
    ["clinical", "local-history", petId] as const,
  reminders: ["clinical", "reminders"] as const,
  veterinarians: ["clinical", "veterinarians"] as const,
  clinics: ["clinical", "clinics"] as const,
  vaccines: ["clinical", "vaccines"] as const,
};

function requirePetId(petId?: number) {
  if (!petId) {
    throw new Error("Selecione um pet.");
  }

  return petId;
}

// =====================================================
// CONSULTAS
// =====================================================

export function useAppointments(petId?: number) {
  return useQuery({
    queryKey: clinicalKeys.appointments(petId),
    queryFn: () =>
      clinicalService.listAppointments(requirePetId(petId)),
    enabled: Boolean(petId),
  });
}

// =====================================================
// VACINAS
// =====================================================

export function useVaccinations(petId?: number) {
  return useQuery({
    queryKey: clinicalKeys.vaccinations(petId),
    queryFn: () =>
      clinicalService.listVaccinations(requirePetId(petId)),
    enabled: Boolean(petId),
  });
}

// =====================================================
// EXAMES
// =====================================================

export function useExams(petId?: number) {
  return useQuery({
    queryKey: clinicalKeys.exams(petId),
    queryFn: () =>
      clinicalService.listExams(requirePetId(petId)),
    enabled: Boolean(petId),
  });
}

// =====================================================
// TRATAMENTOS
// =====================================================

export function useTreatments(petId?: number) {
  return useQuery({
    queryKey: clinicalKeys.treatments(petId),
    queryFn: () =>
      clinicalService.listTreatments(requirePetId(petId)),
    enabled: Boolean(petId),
  });
}

// =====================================================
// HISTÓRICO LOCAL
// =====================================================

export function useLocalHistory(petId?: number) {
  return useQuery({
    queryKey: clinicalKeys.localHistory(petId),
    queryFn: () =>
      localCareService.listByPet(requirePetId(petId)),
    enabled: Boolean(petId),
  });
}

// =====================================================
// LEMBRETES
// =====================================================

export function useReminders() {
  return useQuery({
    queryKey: clinicalKeys.reminders,
    queryFn: clinicalService.listReminders,
  });
}

// =====================================================
// VETERINÁRIOS
// =====================================================

export function useVeterinarians() {
  return useQuery({
    queryKey: clinicalKeys.veterinarians,
    queryFn: clinicalService.listVeterinarians,
  });
}

// =====================================================
// CLÍNICAS
// =====================================================

export function useClinics() {
  return useQuery({
    queryKey: clinicalKeys.clinics,
    queryFn: clinicalService.listClinics,
  });
}

// =====================================================
// CATÁLOGO DE VACINAS
// =====================================================

export function useVaccines() {
  return useQuery({
    queryKey: clinicalKeys.vaccines,
    queryFn: clinicalService.listVaccines,
  });
}

// =====================================================
// AGENDAR CONSULTA + NOTIFICAÇÃO LOCAL
// =====================================================

export function useScheduleAppointment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: AppointmentRequest) =>
      clinicalService.scheduleAppointment(data),

    onSuccess: async (appointment) => {
      // Atualiza a agenda após salvar na API.
      await queryClient.invalidateQueries({
        queryKey: clinicalKeys.appointments(appointment.petId),
      });

      // Recupera o horário da consulta.
      const dadosConsulta = decodeReasonWithTime(
        appointment.reason
      );

      // Programa o lembrete somente se houver horário.
      if (dadosConsulta.time) {
        try {
          await agendarNotificacaoConsulta(
            appointment.id,
            appointment.petName,
            appointment.appointmentDate,
            dadosConsulta.time
          );

          console.log(
            "Processamento do lembrete de consulta concluído."
          );
        } catch (error) {
          // A consulta continua salva mesmo se a
          // notificação apresentar algum problema.
          console.warn(
            "Consulta salva, mas houve erro ao programar a notificação:",
            error
          );
        }
      }
    },
  });
}

// =====================================================
// CANCELAR CONSULTA
// =====================================================

export function useCancelAppointment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      appointmentId,
    }: {
      appointmentId: number;
      petId: number;
    }) => clinicalService.cancelAppointment(appointmentId),

    onSuccess: async (_, variables) => {
      await queryClient.invalidateQueries({
        queryKey: clinicalKeys.appointments(variables.petId),
      });
    },
  });
}

// =====================================================
// CONFIRMAR LEMBRETE
// =====================================================

export function useConfirmReminder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: clinicalService.confirmReminder,

    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: clinicalKeys.reminders,
      });
    },
  });
}

// =====================================================
// CRIAR HISTÓRICO LOCAL
// =====================================================

export function useCreateLocalHistory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (
      data: Omit<SelfReportedEvent, "id" | "createdAt">
    ) => localCareService.create(data),

    onSuccess: async (event) => {
      await queryClient.invalidateQueries({
        queryKey: clinicalKeys.localHistory(event.petId),
      });
    },
  });
}

// =====================================================
// EXCLUIR HISTÓRICO LOCAL
// =====================================================

export function useDeleteLocalHistory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      eventId,
    }: {
      eventId: string;
      petId: number;
    }) => localCareService.remove(eventId),

    onSuccess: async (_, variables) => {
      await queryClient.invalidateQueries({
        queryKey: clinicalKeys.localHistory(variables.petId),
      });
    },
  });
}
