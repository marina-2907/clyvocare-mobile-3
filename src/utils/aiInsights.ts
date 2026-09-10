import {
  Appointment,
  Exam,
  Reminder,
  SelfReportedEvent,
  Treatment,
  Vaccination,
} from "../types/clinical";
import { Pet } from "../types/pet";
import { daysUntil, decodeReasonWithTime, formatApiDate } from "./date";

export type InsightPriority = "HIGH" | "MEDIUM" | "LOW";

export type CareInsight = {
  id: string;
  priority: InsightPriority;
  icon: "warning" | "shield-checkmark" | "calendar" | "fitness" | "sparkles";
  title: string;
  message: string;
  action: string;
  evidence: string;
};

export type CareAnalysis = {
  score: number;
  level: "ATENCAO" | "ACOMPANHAR" | "ESTAVEL";
  summary: string;
  insights: CareInsight[];
  factsAnalyzed: number;
};

export type CareData = {
  pet: Pet;
  appointments: Appointment[];
  vaccinations: Vaccination[];
  exams: Exam[];
  treatments: Treatment[];
  reminders: Reminder[];
  localHistory: SelfReportedEvent[];
};

export function analyzePetCare(data: CareData): CareAnalysis {
  const { pet, appointments, vaccinations, exams, treatments, reminders, localHistory } = data;
  const insights: CareInsight[] = [];
  const overdue = reminders.filter((item) => daysUntil(item.eventDate) < 0);
  const upcomingAppointments = appointments
    .filter((item) => item.status === "SCHEDULED" && daysUntil(item.appointmentDate) >= 0)
    .sort((a, b) => a.appointmentDate.localeCompare(b.appointmentDate));
  const activeTreatments = treatments.filter((item) => item.status === "ACTIVE");
  const reportedVaccines = localHistory.filter((item) => item.type === "VACCINE");

  let score = 86;
  score -= Math.min(overdue.length * 12, 36);
  if (!pet.birthDate) score -= 4;
  if (pet.currentWeight === null) score -= 5;
  if (vaccinations.length + reportedVaccines.length === 0) score -= 12;
  if (activeTreatments.length > 0) score -= 4;
  if (upcomingAppointments.length > 0) score += 4;
  if (appointments.some((item) => item.status === "COMPLETED")) score += 3;
  score = Math.max(20, Math.min(100, score));

  if (overdue.length > 0) {
    const first = overdue.sort((a, b) => a.eventDate.localeCompare(b.eventDate))[0];
    insights.push({
      id: "overdue-care",
      priority: "HIGH",
      icon: "warning",
      title: `${overdue.length} cuidado${overdue.length > 1 ? "s" : ""} em atraso`,
      message: first.message,
      action: "Abrir a Agenda",
      evidence: `Lembrete previsto para ${formatApiDate(first.eventDate)}.`,
    });
  }

  if (vaccinations.length + reportedVaccines.length === 0) {
    insights.push({
      id: "vaccine-history",
      priority: "MEDIUM",
      icon: "shield-checkmark",
      title: "Histórico vacinal incompleto",
      message: `Ainda não há vacina registrada para ${pet.name}. Se o pet foi resgatado, uma avaliação veterinária pode ajudar a reconstruir o protocolo.`,
      action: "Adicionar ao histórico",
      evidence: "Nenhum registro vacinal oficial ou informado pelo tutor foi encontrado.",
    });
  }

  if (activeTreatments.length > 0) {
    insights.push({
      id: "active-treatment",
      priority: "MEDIUM",
      icon: "fitness",
      title: "Tratamento em acompanhamento",
      message: activeTreatments[0].description,
      action: "Ver histórico",
      evidence: `${activeTreatments.length} tratamento${activeTreatments.length > 1 ? "s ativos" : " ativo"}.`,
    });
  }

  if (upcomingAppointments.length > 0) {
    const next = upcomingAppointments[0];
    insights.push({
      id: "next-appointment",
      priority: "LOW",
      icon: "calendar",
      title: "Próxima consulta organizada",
      message: `${decodeReasonWithTime(next.reason).reason} em ${formatApiDate(next.appointmentDate)}.`,
      action: "Ver compromisso",
      evidence: `Consulta com status agendado${next.veterinarianName ? `, com ${next.veterinarianName}` : ""}.`,
    });
  }

  if (!pet.birthDate) {
    insights.push({
      id: "unknown-age",
      priority: "LOW",
      icon: "sparkles",
      title: "Idade aproximada pode ajudar",
      message: "A data de nascimento não foi informada. Em pets resgatados isso é comum e não impede o acompanhamento.",
      action: "Conversar com veterinário",
      evidence: "Cadastro marcado sem data exata de nascimento.",
    });
  }

  if (insights.length === 0) {
    insights.push({
      id: "stable-care",
      priority: "LOW",
      icon: "sparkles",
      title: "Cuidados bem organizados",
      message: `${pet.name} não possui pendências identificadas nos dados atuais. Continue registrando consultas e vacinas.`,
      action: "Manter acompanhamento",
      evidence: "Nenhum lembrete em atraso ou tratamento ativo foi encontrado.",
    });
  }

  insights.sort((a, b) => {
    const order: Record<InsightPriority, number> = { HIGH: 0, MEDIUM: 1, LOW: 2 };
    return order[a.priority] - order[b.priority];
  });

  const level = score < 55 ? "ATENCAO" : score < 80 ? "ACOMPANHAR" : "ESTAVEL";
  const summary =
    level === "ATENCAO"
      ? "Existem cuidados que merecem prioridade."
      : level === "ACOMPANHAR"
        ? "O acompanhamento está no caminho certo, com alguns pontos para revisar."
        : "Os cuidados registrados estão bem organizados.";

  return {
    score,
    level,
    summary,
    insights,
    factsAnalyzed:
      appointments.length + vaccinations.length + exams.length + treatments.length + reminders.length + localHistory.length,
  };
}

export function answerCareQuestion(question: string, analysis: CareAnalysis, data: CareData) {
  const normalized = question.toLocaleLowerCase("pt-BR");
  const { pet, vaccinations, appointments, treatments, reminders, localHistory } = data;

  if (normalized.includes("vacin")) {
    if (vaccinations.length === 0 && !localHistory.some((item) => item.type === "VACCINE")) {
      return `Não encontrei vacina oficial registrada para ${pet.name}. Você pode adicionar uma lembrança no Histórico ou confirmar a carteirinha com um veterinário.`;
    }
    if (vaccinations.length === 0) {
      const reported = localHistory.find((item) => item.type === "VACCINE");
      return `Encontrei uma vacina informada pelo tutor: ${reported?.title}, em ${formatApiDate(reported?.eventDate)}. Como não é um registro oficial, confirme o protocolo na próxima consulta.`;
    }
    const last = [...vaccinations].sort((a, b) => b.applicationDate.localeCompare(a.applicationDate))[0];
    return `A vacina mais recente registrada é ${last.vaccineName}, aplicada em ${formatApiDate(last.applicationDate)}${last.nextDoseDate ? `. O reforço está previsto para ${formatApiDate(last.nextDoseDate)}` : ""}.`;
  }

  if (normalized.includes("consulta") || normalized.includes("agenda")) {
    const next = appointments
      .filter((item) => item.status === "SCHEDULED" && daysUntil(item.appointmentDate) >= 0)
      .sort((a, b) => a.appointmentDate.localeCompare(b.appointmentDate))[0];
    return next
      ? `A próxima consulta de ${pet.name} está marcada para ${formatApiDate(next.appointmentDate)}: ${decodeReasonWithTime(next.reason).reason}.`
      : `Não encontrei consulta futura para ${pet.name}. Você pode agendar uma pela Agenda.`;
  }

  if (normalized.includes("tratamento") || normalized.includes("remédio")) {
    const active = treatments.filter((item) => item.status === "ACTIVE");
    return active.length > 0
      ? `${pet.name} possui ${active.length} tratamento${active.length > 1 ? "s ativos" : " ativo"}: ${active[0].description}.`
      : `Não encontrei tratamento ativo para ${pet.name}.`;
  }

  if (normalized.includes("atras") || normalized.includes("pendên")) {
    const overdue = reminders.filter((item) => daysUntil(item.eventDate) < 0);
    return overdue.length > 0
      ? `Encontrei ${overdue.length} cuidado${overdue.length > 1 ? "s" : ""} em atraso. O mais antigo estava previsto para ${formatApiDate(overdue[0].eventDate)}.`
      : `Não encontrei cuidados em atraso para ${pet.name}.`;
  }

  return `${analysis.summary} Hoje o indicador de organização dos cuidados de ${pet.name} está em ${analysis.score}/100. Minha principal sugestão é: ${analysis.insights[0].title.toLowerCase()}.`;
}
