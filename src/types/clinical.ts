export type AppointmentType = "ROUTINE" | "FOLLOW_UP" | "EMERGENCY";
export type AppointmentStatus = "SCHEDULED" | "COMPLETED" | "CANCELED";
export type TreatmentStatus = "ACTIVE" | "COMPLETED" | "SUSPENDED";
export type ReminderType = "VACCINE" | "APPOINTMENT" | "EXAM" | "MEDICATION";
export type ReminderStatus = "PENDING" | "SENT" | "CONFIRMED";
export type ReminderChannel = "PUSH" | "EMAIL" | "SMS";

export type Appointment = {
  id: number;
  appointmentDate: string;
  type: AppointmentType;
  reason: string;
  diagnosis: string | null;
  notes: string | null;
  weightAtVisit: number | null;
  status: AppointmentStatus;
  petId: number;
  petName: string;
  veterinarianName: string | null;
  clinicName: string | null;
};

export type AppointmentRequest = {
  appointmentDate: string;
  type: AppointmentType;
  reason: string;
  petId: number;
  veterinarianId: number | null;
  clinicId: number | null;
};

export type Vaccination = {
  id: number;
  applicationDate: string;
  batch: string | null;
  nextDoseDate: string | null;
  expirationDate: string | null;
  petId: number;
  petName: string;
  vaccineName: string;
  veterinarianName: string | null;
};

export type Exam = {
  id: number;
  examType: string;
  requestDate: string;
  resultDate: string | null;
  result: string | null;
  fileUrl: string | null;
  laboratory: string | null;
  petId: number;
  petName: string;
};

export type Treatment = {
  id: number;
  description: string;
  startDate: string;
  endDate: string | null;
  status: TreatmentStatus;
  petId: number;
  petName: string;
};

export type Reminder = {
  id: number;
  type: ReminderType;
  eventDate: string;
  message: string;
  status: ReminderStatus;
  channel: ReminderChannel;
  petId: number;
  petName: string;
};

export type Veterinarian = {
  id: number;
  name: string;
  licenseNumber: string;
  specialty: string | null;
  email: string | null;
  phone: string | null;
  clinicName: string | null;
};

export type Clinic = {
  id: number;
  name: string;
  taxId: string;
  phone: string | null;
  email: string | null;
  address: string | null;
  subscriptionPlan: string | null;
  subscriptionDate: string | null;
  cityName: string | null;
};

export type CatalogItem = {
  id: number;
  name: string;
  manufacturer: string | null;
  type: "VACCINE" | "MEDICATION";
  activeIngredient: string | null;
  diseasesPrevented: string | null;
  boosterIntervalDays: number | null;
  speciesName: string | null;
};

export type SelfReportedEventType =
  | "VACCINE"
  | "APPOINTMENT"
  | "EXAM"
  | "TREATMENT";

export type SelfReportedEvent = {
  id: string;
  petId: number;
  type: SelfReportedEventType;
  title: string;
  eventDate: string;
  eventTime: string | null;
  professional: string | null;
  clinic: string | null;
  details: string | null;
  createdAt: string;
};
