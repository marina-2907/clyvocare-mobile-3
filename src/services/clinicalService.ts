import { apiRequest } from "./api";
import {
  Appointment,
  AppointmentRequest,
  CatalogItem,
  Clinic,
  Exam,
  Reminder,
  Treatment,
  Vaccination,
  Veterinarian,
} from "../types/clinical";

export const clinicalService = {
  listAppointments(petId: number): Promise<Appointment[]> {
    return apiRequest<Appointment[]>(`/api/pets/${petId}/appointments`);
  },

  scheduleAppointment(data: AppointmentRequest): Promise<Appointment> {
    return apiRequest<Appointment>("/api/appointments", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  cancelAppointment(appointmentId: number): Promise<void> {
    return apiRequest<void>(`/api/appointments/${appointmentId}/cancel`, {
      method: "PATCH",
    });
  },

  listVaccinations(petId: number): Promise<Vaccination[]> {
    return apiRequest<Vaccination[]>(`/api/pets/${petId}/vaccinations`);
  },

  listExams(petId: number): Promise<Exam[]> {
    return apiRequest<Exam[]>(`/api/pets/${petId}/exams`);
  },

  listTreatments(petId: number): Promise<Treatment[]> {
    return apiRequest<Treatment[]>(`/api/pets/${petId}/treatments`);
  },

  listReminders(): Promise<Reminder[]> {
    return apiRequest<Reminder[]>("/api/owners/me/reminders");
  },

  confirmReminder(reminderId: number): Promise<Reminder> {
    return apiRequest<Reminder>(`/api/reminders/${reminderId}/confirmed`, {
      method: "PATCH",
    });
  },

  listVeterinarians(): Promise<Veterinarian[]> {
    return apiRequest<Veterinarian[]>("/api/veterinarians");
  },

  listClinics(): Promise<Clinic[]> {
    return apiRequest<Clinic[]>("/api/clinics");
  },

  listVaccines(): Promise<CatalogItem[]> {
    return apiRequest<CatalogItem[]>("/api/catalog-items?type=VACCINE");
  },
};
