import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator, Alert, KeyboardAvoidingView, Modal, Platform,
  RefreshControl, ScrollView, StatusBar, StyleSheet, Text, TextInput,
  TouchableOpacity, View,
} from "react-native";
import {
  useAppointments, useCreateLocalHistory, useDeleteLocalHistory, useExams,
  useLocalHistory, useTreatments, useVaccinations,
} from "../hooks/useClinical";
import { useOwnerProfile } from "../hooks/useOwnerProfile";
import { usePets } from "../hooks/usePets";
import { SelfReportedEventType } from "../types/clinical";
import {
  decodeReasonWithTime, displayDateToApi, formatApiDate, formatDateInput,
  formatTimeInput, isValidDisplayDate, isValidTime, todayApiDate, todayDisplayDate,
} from "../utils/date";

type HistoryFilter = "ALL" | SelfReportedEventType;
type UnifiedHistory = {
  key: string;
  localId: string | null;
  type: SelfReportedEventType;
  date: string;
  time: string | null;
  title: string;
  subtitle: string;
  details: string | null;
  professional: string | null;
  clinic: string | null;
  source: "OFFICIAL" | "TUTOR";
};

const TYPE_OPTIONS: {
  value: SelfReportedEventType;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
}[] = [
  { value: "VACCINE", label: "Vacina", icon: "shield-checkmark-outline", color: "#2563EB" },
  { value: "APPOINTMENT", label: "Consulta", icon: "medical-outline", color: "#0F766E" },
  { value: "EXAM", label: "Exame", icon: "flask-outline", color: "#7C3AED" },
  { value: "TREATMENT", label: "Tratamento", icon: "medkit-outline", color: "#D97706" },
];

function typeMeta(type: SelfReportedEventType) {
  return TYPE_OPTIONS.find((item) => item.value === type) ?? TYPE_OPTIONS[0];
}

export default function TimelineScreen({ navigation }: any) {
  const { data: owner, isLoading: ownerLoading } = useOwnerProfile();
  const { data: pets = [], isLoading: petsLoading, refetch: refetchPets } = usePets(owner?.id);
  const [selectedPetId, setSelectedPetId] = useState<number>();
  const [filter, setFilter] = useState<HistoryFilter>("ALL");
  const [modalVisible, setModalVisible] = useState(false);
  const [eventType, setEventType] = useState<SelfReportedEventType>("VACCINE");
  const [title, setTitle] = useState("");
  const [date, setDate] = useState(todayDisplayDate());
  const [time, setTime] = useState("");
  const [professional, setProfessional] = useState("");
  const [clinic, setClinic] = useState("");
  const [details, setDetails] = useState("");

  useEffect(() => {
    if (!pets.length) return setSelectedPetId(undefined);
    if (!pets.some((pet) => pet.id === selectedPetId)) setSelectedPetId(pets[0].id);
  }, [pets, selectedPetId]);

  const appointments = useAppointments(selectedPetId);
  const vaccinations = useVaccinations(selectedPetId);
  const exams = useExams(selectedPetId);
  const treatments = useTreatments(selectedPetId);
  const localHistory = useLocalHistory(selectedPetId);
  const createLocalHistory = useCreateLocalHistory();
  const deleteLocalHistory = useDeleteLocalHistory();
  const selectedPet = pets.find((pet) => pet.id === selectedPetId);

  const history = useMemo<UnifiedHistory[]>(() => {
    const appointmentItems: UnifiedHistory[] = (appointments.data ?? [])
      .filter((item) => item.status !== "SCHEDULED")
      .map((item) => {
        const parsed = decodeReasonWithTime(item.reason);
        return {
          key: `appointment-${item.id}`,
          localId: null,
          type: "APPOINTMENT",
          date: item.appointmentDate,
          time: parsed.time,
          title: item.status === "COMPLETED" ? "Consulta realizada" : "Consulta cancelada",
          subtitle: parsed.reason,
          details: item.diagnosis ?? item.notes,
          professional: item.veterinarianName,
          clinic: item.clinicName,
          source: "OFFICIAL",
        };
      });
    const vaccineItems: UnifiedHistory[] = (vaccinations.data ?? []).map((item) => ({
      key: `vaccine-${item.id}`,
      localId: null,
      type: "VACCINE",
      date: item.applicationDate,
      time: null,
      title: item.vaccineName,
      subtitle: item.nextDoseDate ? `Próxima dose: ${formatApiDate(item.nextDoseDate)}` : "Aplicação registrada",
      details: item.batch ? `Lote ${item.batch}` : null,
      professional: item.veterinarianName,
      clinic: null,
      source: "OFFICIAL",
    }));
    const examItems: UnifiedHistory[] = (exams.data ?? []).map((item) => ({
      key: `exam-${item.id}`,
      localId: null,
      type: "EXAM",
      date: item.resultDate ?? item.requestDate,
      time: null,
      title: item.examType,
      subtitle: item.resultDate ? "Resultado disponível" : "Exame solicitado",
      details: item.result,
      professional: item.laboratory,
      clinic: null,
      source: "OFFICIAL",
    }));
    const treatmentItems: UnifiedHistory[] = (treatments.data ?? []).map((item) => ({
      key: `treatment-${item.id}`,
      localId: null,
      type: "TREATMENT",
      date: item.endDate ?? item.startDate,
      time: null,
      title: "Tratamento",
      subtitle: item.status === "ACTIVE" ? "Em andamento" : item.status === "COMPLETED" ? "Concluído" : "Suspenso",
      details: item.description,
      professional: null,
      clinic: null,
      source: "OFFICIAL",
    }));
    const tutorItems: UnifiedHistory[] = (localHistory.data ?? []).map((item) => ({
      key: `local-${item.id}`,
      localId: item.id,
      type: item.type,
      date: item.eventDate,
      time: item.eventTime,
      title: item.title,
      subtitle: "Informado pelo tutor",
      details: item.details,
      professional: item.professional,
      clinic: item.clinic,
      source: "TUTOR",
    }));
    return [...appointmentItems, ...vaccineItems, ...examItems, ...treatmentItems, ...tutorItems]
      .filter((item) => filter === "ALL" || item.type === filter)
      .sort((a, b) => `${b.date}${b.time ?? ""}`.localeCompare(`${a.date}${a.time ?? ""}`));
  }, [appointments.data, vaccinations.data, exams.data, treatments.data, localHistory.data, filter]);

  const officialCount = history.filter((item) => item.source === "OFFICIAL").length;
  const tutorCount = history.filter((item) => item.source === "TUTOR").length;
  const isLoading = ownerLoading || petsLoading || (Boolean(selectedPetId) && [appointments, vaccinations, exams, treatments, localHistory].some((query) => query.isLoading));
  const refreshing = [appointments, vaccinations, exams, treatments, localHistory].some((query) => query.isRefetching);

  async function refresh() {
    await Promise.all([refetchPets(), appointments.refetch(), vaccinations.refetch(), exams.refetch(), treatments.refetch(), localHistory.refetch()]);
  }

  function resetForm() {
    setEventType("VACCINE"); setTitle(""); setDate(todayDisplayDate()); setTime("");
    setProfessional(""); setClinic(""); setDetails("");
  }

  async function saveMemory() {
    if (!selectedPetId) return;
    if (!title.trim()) return Alert.alert("Título obrigatório", "Informe o nome da vacina, consulta, exame ou tratamento.");
    if (!isValidDisplayDate(date)) return Alert.alert("Data inválida", "Use o formato dia/mês/ano.");
    if (time && !isValidTime(time)) return Alert.alert("Horário inválido", "Use um horário entre 00:00 e 23:59.");
    const eventDate = displayDateToApi(date);
    if (!eventDate || eventDate > todayApiDate()) return Alert.alert("Data inválida", "O histórico não pode ter uma data futura.");
    try {
      await createLocalHistory.mutateAsync({
        petId: selectedPetId,
        type: eventType,
        title: title.trim(),
        eventDate,
        eventTime: time || null,
        professional: professional.trim() || null,
        clinic: clinic.trim() || null,
        details: details.trim() || null,
      });
      setModalVisible(false); resetForm();
      Alert.alert("Adicionado ao histórico", "O registro foi identificado como informação do tutor.");
    } catch {
      Alert.alert("Erro", "Não foi possível salvar este registro.");
    }
  }

  function askDelete(item: UnifiedHistory) {
    if (!item.localId || !selectedPetId) return;
    Alert.alert("Excluir lembrança", "Deseja remover este registro informado pelo tutor?", [
      { text: "Cancelar", style: "cancel" },
      { text: "Excluir", style: "destructive", onPress: () => void deleteLocalHistory.mutateAsync({ eventId: item.localId!, petId: selectedPetId }) },
    ]);
  }

  if (isLoading) return <View style={styles.center}><ActivityIndicator size="large" color="#0F766E" /><Text style={styles.loadingText}>Montando o histórico...</Text></View>;

  return <View style={styles.container}>
    <StatusBar barStyle="light-content" backgroundColor="#0F766E" />
    <View style={styles.header}>
      <View><Text style={styles.eyebrow}>PRONTUÁRIO LONGITUDINAL</Text><Text style={styles.headerTitle}>Histórico</Text><Text style={styles.headerSubtitle}>Toda a jornada de saúde do seu pet</Text></View>
      <TouchableOpacity style={[styles.addButton, !selectedPetId && styles.disabled]} disabled={!selectedPetId} onPress={() => setModalVisible(true)}><Ionicons name="add" size={27} color="#FFFFFF" /></TouchableOpacity>
    </View>

    <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => void refresh()} colors={["#0F766E"]} />}>
      {!pets.length ? <EmptyHistory onAddPet={() => navigation.navigate("Cadastrar Pet")} /> : <>
        <Text style={styles.sectionLabel}>HISTÓRICO DE</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.petRow}>{pets.map((pet) => { const active = pet.id === selectedPetId; return <TouchableOpacity key={pet.id} style={[styles.petChip, active && styles.petChipActive]} onPress={() => setSelectedPetId(pet.id)}><View style={[styles.petAvatar, active && styles.petAvatarActive]}><Ionicons name="paw" size={17} color={active ? "#0F766E" : "#64748B"} /></View><View><Text style={[styles.petName, active && styles.petNameActive]}>{pet.name}</Text><Text style={styles.petSpecies}>{pet.speciesName}</Text></View></TouchableOpacity>; })}</ScrollView>

        <View style={styles.summaryRow}>
          <SummaryCard icon="shield-checkmark-outline" value={officialCount} label="Registros oficiais" color="#0F766E" />
          <SummaryCard icon="create-outline" value={tutorCount} label="Anotações do tutor" color="#7C3AED" />
        </View>

        <View style={styles.infoBanner}><Ionicons name="information-circle-outline" size={22} color="#2563EB" /><Text style={styles.infoText}>Registros da API são oficiais. Cuidados antigos adicionados por você aparecem claramente como “Informado pelo tutor”.</Text></View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
          <FilterChip label="Tudo" active={filter === "ALL"} onPress={() => setFilter("ALL")} />
          {TYPE_OPTIONS.map((item) => <FilterChip key={item.value} label={item.label} active={filter === item.value} onPress={() => setFilter(item.value)} />)}
        </ScrollView>

        {!history.length ? <View style={styles.emptyCard}><View style={styles.emptyIcon}><Ionicons name="document-text-outline" size={38} color="#0F766E" /></View><Text style={styles.emptyTitle}>O histórico começa aqui</Text><Text style={styles.emptyText}>Adicione uma vacina antiga, consulta, exame ou tratamento de {selectedPet?.name}.</Text><TouchableOpacity style={styles.primaryButton} onPress={() => setModalVisible(true)}><Ionicons name="add-circle-outline" size={20} color="#FFFFFF" /><Text style={styles.primaryButtonText}>Adicionar registro</Text></TouchableOpacity></View> :
          <View style={styles.timeline}>{history.map((item, index) => <HistoryCard key={item.key} item={item} last={index === history.length - 1} onDelete={() => askDelete(item)} />)}</View>}
      </>}
    </ScrollView>

    <Modal visible={modalVisible} transparent animationType="slide" onRequestClose={() => setModalVisible(false)}>
      <KeyboardAvoidingView style={styles.modalBackdrop} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <View style={styles.modalCard}><View style={styles.modalHandle} /><View style={styles.modalHeader}><View><Text style={styles.modalTitle}>Adicionar lembrança</Text><Text style={styles.modalSubtitle}>Um cuidado antigo de {selectedPet?.name}</Text></View><TouchableOpacity style={styles.closeButton} onPress={() => setModalVisible(false)}><Ionicons name="close" size={22} color="#334155" /></TouchableOpacity></View>
          <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
            <Text style={styles.inputLabel}>Tipo de registro</Text><View style={styles.typeGrid}>{TYPE_OPTIONS.map((option) => { const active = eventType === option.value; return <TouchableOpacity key={option.value} style={[styles.typeButton, active && { borderColor: option.color, backgroundColor: `${option.color}10` }]} onPress={() => setEventType(option.value)}><Ionicons name={option.icon} size={21} color={active ? option.color : "#64748B"} /><Text style={[styles.typeText, active && { color: option.color }]}>{option.label}</Text>{active && <Ionicons name="checkmark-circle" size={16} color={option.color} />}</TouchableOpacity>; })}</View>
            <FormInput label={eventType === "VACCINE" ? "Nome da vacina" : eventType === "EXAM" ? "Nome do exame" : eventType === "TREATMENT" ? "Nome do tratamento" : "Motivo da consulta"} value={title} onChangeText={setTitle} placeholder="Ex.: V10 anual" icon="create-outline" />
            <View style={styles.twoColumns}><FormInput label="Data" value={date} onChangeText={(value) => setDate(formatDateInput(value))} placeholder="DD/MM/AAAA" icon="calendar-outline" keyboardType="numeric" maxLength={10} /><FormInput label="Hora (opcional)" value={time} onChangeText={(value) => setTime(formatTimeInput(value))} placeholder="HH:MM" icon="time-outline" keyboardType="numeric" maxLength={5} /></View>
            <FormInput label="Profissional (opcional)" value={professional} onChangeText={setProfessional} placeholder="Ex.: Dra. Ana" icon="person-outline" />
            <FormInput label="Clínica ou local (opcional)" value={clinic} onChangeText={setClinic} placeholder="Ex.: Clínica Clyvo Vet" icon="business-outline" />
            <FormInput label="Detalhes (opcional)" value={details} onChangeText={setDetails} placeholder="Lote, resultado, observações..." icon="document-text-outline" multiline />
            <View style={styles.tutorNotice}><Ionicons name="person-circle-outline" size={20} color="#7C3AED" /><Text style={styles.tutorNoticeText}>Este registro será marcado como informação fornecida pelo tutor.</Text></View>
            <TouchableOpacity style={[styles.saveButton, createLocalHistory.isPending && styles.disabled]} disabled={createLocalHistory.isPending} onPress={() => void saveMemory()}>{createLocalHistory.isPending ? <ActivityIndicator color="#FFFFFF" /> : <><Ionicons name="checkmark-circle-outline" size={21} color="#FFFFFF" /><Text style={styles.saveButtonText}>Salvar no histórico</Text></>}</TouchableOpacity>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  </View>;
}

function HistoryCard({ item, last, onDelete }: { item: UnifiedHistory; last: boolean; onDelete: () => void }) {
  const meta = typeMeta(item.type);
  return <View style={styles.timelineRow}><View style={styles.timelineRail}><View style={[styles.timelineDot, { backgroundColor: meta.color }]}><Ionicons name={meta.icon} size={18} color="#FFFFFF" /></View>{!last && <View style={styles.timelineLine} />}</View><View style={styles.historyCard}>
    <View style={styles.historyTop}><View style={styles.datePill}><Ionicons name="calendar-outline" size={13} color="#64748B" /><Text style={styles.dateText}>{formatApiDate(item.date)}{item.time ? ` • ${item.time}` : ""}</Text></View><View style={[styles.sourcePill, item.source === "TUTOR" && styles.tutorPill]}><Text style={[styles.sourceText, item.source === "TUTOR" && styles.tutorPillText]}>{item.source === "OFFICIAL" ? "OFICIAL" : "TUTOR"}</Text></View></View>
    <Text style={styles.historyTitle}>{item.title}</Text><Text style={styles.historySubtitle}>{item.subtitle}</Text>
    {item.details && <Text style={styles.historyDetails}>{item.details}</Text>}
    {(item.professional || item.clinic) && <View style={styles.metaBox}>{item.professional && <View style={styles.metaLine}><Ionicons name="person-outline" size={14} color="#64748B" /><Text style={styles.metaText}>{item.professional}</Text></View>}{item.clinic && <View style={styles.metaLine}><Ionicons name="business-outline" size={14} color="#64748B" /><Text style={styles.metaText}>{item.clinic}</Text></View>}</View>}
    {item.localId && <TouchableOpacity style={styles.deleteButton} onPress={onDelete}><Ionicons name="trash-outline" size={15} color="#B91C1C" /><Text style={styles.deleteText}>Excluir anotação</Text></TouchableOpacity>}
  </View></View>;
}

function SummaryCard({ icon, value, label, color }: { icon: keyof typeof Ionicons.glyphMap; value: number; label: string; color: string }) { return <View style={styles.summaryCard}><View style={[styles.summaryIcon, { backgroundColor: `${color}12` }]}><Ionicons name={icon} size={21} color={color} /></View><Text style={styles.summaryValue}>{value}</Text><Text style={styles.summaryLabel}>{label}</Text></View>; }
function FilterChip({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) { return <TouchableOpacity style={[styles.filterChip, active && styles.filterChipActive]} onPress={onPress}><Text style={[styles.filterText, active && styles.filterTextActive]}>{label}</Text></TouchableOpacity>; }
function EmptyHistory({ onAddPet }: { onAddPet: () => void }) { return <View style={styles.emptyCard}><View style={styles.emptyIcon}><Ionicons name="paw-outline" size={40} color="#0F766E" /></View><Text style={styles.emptyTitle}>Nenhum pet cadastrado</Text><Text style={styles.emptyText}>Cadastre um pet para construir o histórico de saúde.</Text><TouchableOpacity style={styles.primaryButton} onPress={onAddPet}><Text style={styles.primaryButtonText}>Cadastrar pet</Text></TouchableOpacity></View>; }
function FormInput({ label, icon, multiline, ...props }: { label: string; icon: keyof typeof Ionicons.glyphMap; multiline?: boolean } & React.ComponentProps<typeof TextInput>) { return <View style={[styles.formField, multiline && styles.fullField]}><Text style={styles.inputLabel}>{label}</Text><View style={[styles.inputBox, multiline && styles.multilineBox]}><Ionicons name={icon} size={18} color="#0F766E" /><TextInput {...props} multiline={multiline} style={[styles.input, multiline && styles.multilineInput]} placeholderTextColor="#94A3B8" autoComplete="off" importantForAutofill="no" /></View></View>; }

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F5FAF9" }, center: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: "#F5FAF9" }, loadingText: { marginTop: 12, color: "#475569", fontWeight: "700" },
  header: { paddingTop: 52, paddingBottom: 24, paddingHorizontal: 20, backgroundColor: "#0F766E", borderBottomLeftRadius: 28, borderBottomRightRadius: 28, flexDirection: "row", alignItems: "center", justifyContent: "space-between" }, eyebrow: { color: "#99F6E4", fontSize: 10, fontWeight: "900", letterSpacing: 1.4 }, headerTitle: { marginTop: 2, color: "#FFFFFF", fontSize: 29, fontWeight: "900" }, headerSubtitle: { marginTop: 3, color: "#CCFBF1", fontSize: 13, fontWeight: "600" }, addButton: { width: 48, height: 48, borderRadius: 18, backgroundColor: "#14B8A6", alignItems: "center", justifyContent: "center", elevation: 5 }, disabled: { opacity: 0.55 }, content: { padding: 18, paddingBottom: 44 }, sectionLabel: { marginBottom: 9, color: "#64748B", fontSize: 10, fontWeight: "900", letterSpacing: 1.3 },
  petRow: { gap: 10, paddingRight: 12 }, petChip: { minWidth: 132, padding: 10, paddingRight: 15, borderRadius: 18, borderWidth: 1, borderColor: "#DCE9E7", backgroundColor: "#FFFFFF", flexDirection: "row", alignItems: "center", gap: 9 }, petChipActive: { borderColor: "#0F766E", backgroundColor: "#E6F7F4" }, petAvatar: { width: 35, height: 35, borderRadius: 13, alignItems: "center", justifyContent: "center", backgroundColor: "#F1F5F4" }, petAvatarActive: { backgroundColor: "#FFFFFF" }, petName: { color: "#334155", fontSize: 14, fontWeight: "900" }, petNameActive: { color: "#0F766E" }, petSpecies: { marginTop: 1, color: "#94A3B8", fontSize: 10, fontWeight: "600" },
  summaryRow: { marginTop: 17, flexDirection: "row", gap: 10 }, summaryCard: { flex: 1, padding: 14, borderRadius: 19, borderWidth: 1, borderColor: "#E0ECEA", backgroundColor: "#FFFFFF" }, summaryIcon: { width: 38, height: 38, borderRadius: 13, alignItems: "center", justifyContent: "center" }, summaryValue: { marginTop: 10, color: "#0F172A", fontSize: 23, fontWeight: "900" }, summaryLabel: { marginTop: 2, color: "#64748B", fontSize: 10, fontWeight: "700" },
  infoBanner: { marginTop: 12, padding: 13, borderRadius: 17, borderWidth: 1, borderColor: "#BFDBFE", backgroundColor: "#EFF6FF", flexDirection: "row", alignItems: "flex-start", gap: 9 }, infoText: { flex: 1, color: "#1E3A8A", fontSize: 11, lineHeight: 17, fontWeight: "600" }, filterRow: { gap: 8, paddingVertical: 15, paddingRight: 8 }, filterChip: { paddingHorizontal: 15, paddingVertical: 9, borderRadius: 13, borderWidth: 1, borderColor: "#DCE8E6", backgroundColor: "#FFFFFF" }, filterChipActive: { borderColor: "#0F766E", backgroundColor: "#0F766E" }, filterText: { color: "#64748B", fontSize: 11, fontWeight: "800" }, filterTextActive: { color: "#FFFFFF" },
  timeline: { marginTop: 2 }, timelineRow: { flexDirection: "row" }, timelineRail: { width: 42, alignItems: "center" }, timelineDot: { width: 36, height: 36, borderRadius: 14, alignItems: "center", justifyContent: "center", zIndex: 2 }, timelineLine: { width: 2, flex: 1, minHeight: 20, backgroundColor: "#D8E7E4" }, historyCard: { flex: 1, marginLeft: 5, marginBottom: 13, padding: 15, borderRadius: 20, borderWidth: 1, borderColor: "#E0ECEA", backgroundColor: "#FFFFFF" }, historyTop: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" }, datePill: { flexDirection: "row", alignItems: "center", gap: 4 }, dateText: { color: "#64748B", fontSize: 10, fontWeight: "700" }, sourcePill: { paddingHorizontal: 7, paddingVertical: 4, borderRadius: 7, backgroundColor: "#DFF7F4" }, tutorPill: { backgroundColor: "#F3E8FF" }, sourceText: { color: "#0F766E", fontSize: 8, fontWeight: "900", letterSpacing: 0.5 }, tutorPillText: { color: "#7C3AED" }, historyTitle: { marginTop: 10, color: "#0F172A", fontSize: 16, fontWeight: "900" }, historySubtitle: { marginTop: 3, color: "#64748B", fontSize: 11, fontWeight: "700" }, historyDetails: { marginTop: 9, padding: 10, borderRadius: 12, backgroundColor: "#F7FAFA", color: "#475569", fontSize: 11, lineHeight: 17 }, metaBox: { marginTop: 10, gap: 5 }, metaLine: { flexDirection: "row", alignItems: "center", gap: 6 }, metaText: { flex: 1, color: "#64748B", fontSize: 10 }, deleteButton: { marginTop: 11, flexDirection: "row", alignItems: "center", gap: 5, alignSelf: "flex-start" }, deleteText: { color: "#B91C1C", fontSize: 10, fontWeight: "800" },
  emptyCard: { marginTop: 28, padding: 28, borderRadius: 24, borderWidth: 1, borderColor: "#DCEBE8", backgroundColor: "#FFFFFF", alignItems: "center" }, emptyIcon: { width: 78, height: 78, borderRadius: 28, backgroundColor: "#DFF7F4", alignItems: "center", justifyContent: "center" }, emptyTitle: { marginTop: 16, color: "#0F172A", fontSize: 18, fontWeight: "900", textAlign: "center" }, emptyText: { marginTop: 7, color: "#64748B", fontSize: 13, lineHeight: 20, textAlign: "center" }, primaryButton: { marginTop: 18, minHeight: 47, paddingHorizontal: 20, borderRadius: 15, backgroundColor: "#0F766E", flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 7 }, primaryButtonText: { color: "#FFFFFF", fontSize: 13, fontWeight: "900" },
  modalBackdrop: { flex: 1, justifyContent: "flex-end", backgroundColor: "rgba(15,23,42,0.45)" }, modalCard: { maxHeight: "94%", padding: 20, paddingTop: 10, borderTopLeftRadius: 30, borderTopRightRadius: 30, backgroundColor: "#FFFFFF" }, modalHandle: { alignSelf: "center", width: 42, height: 5, borderRadius: 3, backgroundColor: "#CBD5E1", marginBottom: 15 }, modalHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 18 }, modalTitle: { color: "#0F172A", fontSize: 22, fontWeight: "900" }, modalSubtitle: { marginTop: 3, color: "#64748B", fontSize: 12 }, closeButton: { width: 38, height: 38, borderRadius: 13, alignItems: "center", justifyContent: "center", backgroundColor: "#F1F5F9" }, inputLabel: { marginBottom: 7, color: "#334155", fontSize: 12, fontWeight: "800" },
  typeGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 16 }, typeButton: { width: "48.5%", minHeight: 50, paddingHorizontal: 11, borderRadius: 15, borderWidth: 1, borderColor: "#DCE8E6", backgroundColor: "#F8FBFB", flexDirection: "row", alignItems: "center", gap: 7 }, typeText: { flex: 1, color: "#64748B", fontSize: 11, fontWeight: "800" }, twoColumns: { flexDirection: "row", gap: 10 }, formField: { flex: 1, marginBottom: 14 }, fullField: { flex: 0 }, inputBox: { minHeight: 49, paddingHorizontal: 13, borderRadius: 15, borderWidth: 1, borderColor: "#DCE8E6", backgroundColor: "#F8FBFB", flexDirection: "row", alignItems: "center", gap: 8 }, multilineBox: { minHeight: 82, alignItems: "flex-start", paddingTop: 14 }, input: { flex: 1, color: "#0F172A", fontSize: 13 }, multilineInput: { minHeight: 58, textAlignVertical: "top" }, tutorNotice: { padding: 12, borderRadius: 14, backgroundColor: "#F5F3FF", flexDirection: "row", alignItems: "center", gap: 8 }, tutorNoticeText: { flex: 1, color: "#5B21B6", fontSize: 10, lineHeight: 15, fontWeight: "600" }, saveButton: { minHeight: 53, marginTop: 14, marginBottom: 18, borderRadius: 17, backgroundColor: "#0F766E", flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8 }, saveButtonText: { color: "#FFFFFF", fontSize: 14, fontWeight: "900" },
});
