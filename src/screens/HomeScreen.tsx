import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { LinearGradient } from "expo-linear-gradient";
import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  RefreshControl,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from "react-native";
import EmptyHome from "../components/EmptyHome";
import {
  useAppointments,
  useExams,
  useLocalHistory,
  useReminders,
  useTreatments,
  useVaccinations,
} from "../hooks/useClinical";
import { useOwnerProfile } from "../hooks/useOwnerProfile";
import { usePets } from "../hooks/usePets";
import { analyzePetCare } from "../utils/aiInsights";
import { daysUntil, decodeReasonWithTime, formatApiDate } from "../utils/date";

function firstName(name?: string) {
  return name?.trim().split(/\s+/)[0] || "Tutor";
}

function petAge(birthDate?: string | null) {
  if (!birthDate) return "Idade aproximada";
  const birth = new Date(`${birthDate}T12:00:00`);
  const now = new Date();
  let years = now.getFullYear() - birth.getFullYear();
  let months = now.getMonth() - birth.getMonth();
  if (now.getDate() < birth.getDate()) months -= 1;
  if (months < 0) {
    years -= 1;
    months += 12;
  }
  if (years > 0) return `${years} ano${years > 1 ? "s" : ""}`;
  return `${Math.max(months, 0)} ${months === 1 ? "mês" : "meses"}`;
}

type HealthType = "VACCINE" | "EXAM" | "TREATMENT";

type ManualHealthEntry = {
  id: string;
  type: HealthType;
  title: string;
  date: string;
  notes?: string;
};

function healthStorageKey(petId: number) {
  return `@clyvocare_owner_health_${petId}`;
}

function healthTypeLabel(type: HealthType) {
  if (type === "VACCINE") return "Vacina";
  if (type === "EXAM") return "Exame";
  return "Tratamento";
}

function healthTypeIcon(type: HealthType): keyof typeof Ionicons.glyphMap {
  if (type === "VACCINE") return "shield-checkmark-outline";
  if (type === "EXAM") return "flask-outline";
  return "medkit-outline";
}

function todayBrazilDisplay() {
  return new Intl.DateTimeFormat("pt-BR", {
    timeZone: "America/Sao_Paulo",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date());
}

export default function HomeScreen({ navigation }: any) {
  const { width } = useWindowDimensions();
  const wideLayout = width >= 700;
  const wideBannerHeight = Math.min(Math.max(width * 0.21, 320), 440);

  const { data: owner, isLoading: ownerLoading, refetch: refetchOwner } = useOwnerProfile();
  const { data: pets = [], isLoading: petsLoading, refetch: refetchPets } = usePets(owner?.id);
  const [selectedPetId, setSelectedPetId] = useState<number>();

  const [healthModalVisible, setHealthModalVisible] = useState(false);
  const [healthType, setHealthType] = useState<HealthType>("VACCINE");
  const [healthTitle, setHealthTitle] = useState("");
  const [healthDate, setHealthDate] = useState(todayBrazilDisplay());
  const [healthNotes, setHealthNotes] = useState("");
  const [manualHealthEntries, setManualHealthEntries] = useState<ManualHealthEntry[]>([]);

  useEffect(() => {
    if (!pets.length) {
      setSelectedPetId(undefined);
      return;
    }
    if (!pets.some((pet) => pet.id === selectedPetId)) setSelectedPetId(pets[0].id);
  }, [pets, selectedPetId]);

  useEffect(() => {
    let active = true;

    async function loadManualHealth() {
      if (!selectedPetId) {
        if (active) setManualHealthEntries([]);
        return;
      }

      try {
        const saved = await AsyncStorage.getItem(healthStorageKey(selectedPetId));
        const parsed = saved ? JSON.parse(saved) : [];
        if (active) {
          setManualHealthEntries(Array.isArray(parsed) ? parsed : []);
        }
      } catch {
        if (active) setManualHealthEntries([]);
      }
    }

    void loadManualHealth();

    return () => {
      active = false;
    };
  }, [selectedPetId]);

  const appointments = useAppointments(selectedPetId);
  const vaccinations = useVaccinations(selectedPetId);
  const exams = useExams(selectedPetId);
  const treatments = useTreatments(selectedPetId);
  const reminders = useReminders();
  const localHistory = useLocalHistory(selectedPetId);
  const selectedPet = pets.find((pet) => pet.id === selectedPetId);
  const queries = [appointments, vaccinations, exams, treatments, reminders, localHistory];

  const analysis = useMemo(
    () =>
      selectedPet
        ? analyzePetCare({
            pet: selectedPet,
            appointments: appointments.data ?? [],
            vaccinations: vaccinations.data ?? [],
            exams: exams.data ?? [],
            treatments: treatments.data ?? [],
            reminders: (reminders.data ?? []).filter((item) => item.petId === selectedPet.id),
            localHistory: localHistory.data ?? [],
          })
        : null,
    [
      selectedPet,
      appointments.data,
      vaccinations.data,
      exams.data,
      treatments.data,
      reminders.data,
      localHistory.data,
    ],
  );

  const nextCare = useMemo(() => {
    if (!selectedPetId) return null;

    const appointmentItems = (appointments.data ?? [])
      .filter((item) => item.status === "SCHEDULED" && daysUntil(item.appointmentDate) >= 0)
      .map((item) => ({
        date: item.appointmentDate,
        title: "Consulta",
        description: decodeReasonWithTime(item.reason).reason,
        icon: "medical-outline" as const,
      }));

    const reminderItems = (reminders.data ?? [])
      .filter((item) => item.petId === selectedPetId && daysUntil(item.eventDate) >= 0)
      .map((item) => ({
        date: item.eventDate,
        title: item.type === "VACCINE" ? "Reforço de vacina" : "Lembrete",
        description: item.message,
        icon: "notifications-outline" as const,
      }));

    return [...appointmentItems, ...reminderItems].sort((a, b) => a.date.localeCompare(b.date))[0] ?? null;
  }, [appointments.data, reminders.data, selectedPetId]);

  const manualVaccinations = manualHealthEntries.filter(
    (item) => item.type === "VACCINE",
  ).length;

  const manualExams = manualHealthEntries.filter(
    (item) => item.type === "EXAM",
  ).length;

  const manualTreatments = manualHealthEntries.filter(
    (item) => item.type === "TREATMENT",
  ).length;

  const vaccinationCount = (vaccinations.data ?? []).length + manualVaccinations;
  const examCount = (exams.data ?? []).length + manualExams;
  const treatmentCount =
    (treatments.data ?? []).filter((item) => item.status === "ACTIVE").length +
    manualTreatments;

  function openHealthModal(type: HealthType) {
    setHealthType(type);
    setHealthTitle("");
    setHealthDate(todayBrazilDisplay());
    setHealthNotes("");
    setHealthModalVisible(true);
  }

  async function saveManualHealth() {
    if (!selectedPetId) return;

    if (!healthTitle.trim()) {
      Alert.alert(
        "Preencha o nome",
        `Informe o nome do ${healthTypeLabel(healthType).toLowerCase()}.`,
      );
      return;
    }

    if (!healthDate.trim()) {
      Alert.alert("Preencha a data", "Informe a data desse cuidado.");
      return;
    }

    const newEntry: ManualHealthEntry = {
      id: `${Date.now()}`,
      type: healthType,
      title: healthTitle.trim(),
      date: healthDate.trim(),
      notes: healthNotes.trim() || undefined,
    };

    const updated = [newEntry, ...manualHealthEntries];

    try {
      await AsyncStorage.setItem(
        healthStorageKey(selectedPetId),
        JSON.stringify(updated),
      );

      setManualHealthEntries(updated);
      setHealthModalVisible(false);

      Alert.alert(
        "Informação adicionada",
        `${healthTypeLabel(healthType)} registrado nas informações de ${selectedPet?.name ?? "seu pet"}.`,
      );
    } catch {
      Alert.alert("Erro", "Não foi possível salvar essa informação.");
    }
  }

  const isLoading =
    ownerLoading ||
    petsLoading ||
    (Boolean(selectedPetId) && queries.some((query) => query.isLoading));
  const refreshing = queries.some((query) => query.isRefetching);

  async function refresh() {
    await Promise.all([refetchOwner(), refetchPets(), ...queries.map((query) => query.refetch())]);
  }

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#0F766E" />
        <Text style={styles.loadingText}>Preparando seu painel...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#064E49" />

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => void refresh()}
            tintColor="#FFFFFF"
            colors={["#0F766E"]}
          />
        }
      >
        <LinearGradient
          colors={["#043F3A", "#05665E", "#0B8E82"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[
            styles.header,
            wideLayout && styles.headerWide,
            wideLayout && { minHeight: wideBannerHeight },
          ]}
        >
          <View style={styles.headerGlow} />
          <View style={styles.heroOrb} />
          <View style={styles.heroOrbSmall} />

          <View style={styles.decorHeartOne}>
            <Ionicons name="heart" size={20} color="rgba(167,243,208,0.30)" />
          </View>
          <View style={styles.decorHeartTwo}>
            <Ionicons name="heart-outline" size={15} color="rgba(209,250,229,0.26)" />
          </View>
          <View style={styles.decorPawOne}>
            <Ionicons name="paw" size={34} color="rgba(167,243,208,0.13)" />
          </View>
          <View style={styles.decorPawTwo}>
            <Ionicons name="paw-outline" size={22} color="rgba(94,234,212,0.14)" />
          </View>
          <View style={styles.decorSparkOne}>
            <Ionicons name="sparkles" size={17} color="rgba(209,250,229,0.24)" />
          </View>

          <View style={styles.headerTop}>
            <View style={styles.brandRow}>
              <View style={styles.brandIcon}>
                <Ionicons name="paw" size={19} color="#0F766E" />
              </View>
              <View>
                <Text style={styles.brand}>CLYVOCARE</Text>
                <Text style={styles.brandTagline}>SAÚDE ANIMAL SEMPRE COM VOCÊ</Text>
              </View>
            </View>

            <View style={styles.headerActions}>
              <TouchableOpacity
                style={styles.planPill}
                onPress={() => navigation.navigate("Perfil", { abrirPlanos: true })}
                activeOpacity={0.82}
              >
                <Ionicons name="diamond-outline" size={13} color="#FDE68A" />
                <Text style={styles.planPillText}>Planos</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.profileButton}
                onPress={() => navigation.navigate("Perfil")}
                activeOpacity={0.82}
              >
                <Ionicons name="person-outline" size={21} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          </View>

          <View style={[styles.headerCopy, wideLayout && styles.headerCopyWide]}>
            <View style={styles.heroEyebrow}>
              <Ionicons name="heart" size={10} color="#D1FAE5" />
              <Text style={styles.heroEyebrowText}>CUIDADO QUE ACOMPANHA</Text>
            </View>

            <Text style={[styles.greeting, wideLayout && styles.greetingWide]}>
              Olá, {firstName(owner?.name)} ♡
            </Text>

            <Text style={[styles.headerTitle, wideLayout && styles.headerTitleWide]}>
              Cuidado que acompanha cada fase.
            </Text>

            <Text style={styles.headerSubtitle}>
              Saúde, rotina e carinho em cada fase — tudo organizado em um só lugar.
            </Text>

            <View style={styles.onlinePill}>
              <Ionicons name="cloud-done-outline" size={11} color="#CCFBF1" />
              <Text style={styles.onlineText}>Tudo sincronizado</Text>
            </View>
          </View>

          {!wideLayout && (
            <View style={styles.heroDecorRow}>
              <View style={styles.heroDecorItem}>
                <View style={styles.heroDecorIcon}>
                  <Ionicons name="paw" size={15} color="#D1FAE5" />
                </View>
                <Text style={styles.heroDecorText}>Rotina</Text>
              </View>

              <View style={styles.heroDecorDivider} />

              <View style={styles.heroDecorItem}>
                <View style={styles.heroDecorIcon}>
                  <Ionicons name="heart" size={15} color="#D1FAE5" />
                </View>
                <Text style={styles.heroDecorText}>Carinho</Text>
              </View>

              <View style={styles.heroDecorDivider} />

              <View style={styles.heroDecorItem}>
                <View style={styles.heroDecorIcon}>
                  <Ionicons name="sparkles" size={15} color="#D1FAE5" />
                </View>
                <Text style={styles.heroDecorText}>Cuidado</Text>
              </View>
            </View>
          )}
        </LinearGradient>

        {!pets.length ? (
          <EmptyHome
            ownerName={owner?.name}
            onAddPet={() => navigation.navigate("Cadastrar Pet")}
            onOpenAgenda={() => navigation.navigate("Agenda")}
            onOpenHistory={() => navigation.navigate("Histórico")}
            onOpenAi={() => navigation.navigate("IA")}
            onOpenPlans={() => navigation.navigate("Perfil", { abrirPlanos: true })}
          />
        ) : (
          <>
            <View style={styles.petSelectorHeader}>
              <Text style={styles.sectionLabel}>MEU PET</Text>
              <TouchableOpacity onPress={() => navigation.navigate("Pets")}>
                <Text style={styles.seeAll}>Ver todos</Text>
              </TouchableOpacity>
            </View>

            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.petRow}>
              {pets.map((pet) => {
                const active = pet.id === selectedPetId;
                return (
                  <TouchableOpacity
                    key={pet.id}
                    style={[styles.petChip, active && styles.petChipActive]}
                    onPress={() => setSelectedPetId(pet.id)}
                  >
                    <View style={[styles.petChipAvatar, active && styles.petChipAvatarActive]}>
                      <Ionicons name="paw" size={17} color={active ? "#FFFFFF" : "#0F766E"} />
                    </View>
                    <Text style={[styles.petChipText, active && styles.petChipTextActive]}>{pet.name}</Text>
                  </TouchableOpacity>
                );
              })}

              <TouchableOpacity style={styles.addPetChip} onPress={() => navigation.navigate("Cadastrar Pet")}>
                <Ionicons name="add" size={18} color="#0F766E" />
                <Text style={styles.addPetText}>Novo</Text>
              </TouchableOpacity>
            </ScrollView>

            {selectedPet && (
              <LinearGradient colors={["#FFFFFF", "#EFFCF9"]} style={styles.petHero}>
                <View style={styles.petHeroTop}>
                  <View style={styles.bigAvatar}>
                    <Ionicons name="paw" size={34} color="#0F766E" />
                  </View>
                  <View style={styles.petIdentity}>
                    <Text style={styles.petName}>{selectedPet.name}</Text>
                    <Text style={styles.petDetails}>
                      {selectedPet.speciesName}{selectedPet.breed ? ` • ${selectedPet.breed}` : ""}
                    </Text>
                    <View style={styles.tags}>
                      <View style={styles.tag}>
                        <Ionicons name="calendar-outline" size={12} color="#0F766E" />
                        <Text style={styles.tagText}>{petAge(selectedPet.birthDate)}</Text>
                      </View>
                      {selectedPet.currentWeight !== null && (
                        <View style={styles.tag}>
                          <Ionicons name="fitness-outline" size={12} color="#0F766E" />
                          <Text style={styles.tagText}>{selectedPet.currentWeight} kg</Text>
                        </View>
                      )}
                    </View>
                  </View>
                  <TouchableOpacity
                    style={styles.editButton}
                    onPress={() => navigation.navigate("Cadastrar Pet", { pet: selectedPet })}
                  >
                    <Ionicons name="create-outline" size={18} color="#0F766E" />
                  </TouchableOpacity>
                </View>

                {analysis && (
                  <TouchableOpacity style={styles.aiScoreRow} onPress={() => navigation.navigate("IA")}>
                    <View
                      style={[
                        styles.miniScore,
                        analysis.score < 55 && styles.miniScoreHigh,
                        analysis.score >= 55 && analysis.score < 80 && styles.miniScoreMedium,
                      ]}
                    >
                      <Text style={styles.miniScoreValue}>{analysis.score}</Text>
                    </View>
                    <View style={styles.aiScoreText}>
                      <View style={styles.aiTitleRow}>
                        <Ionicons name="sparkles" size={14} color="#7C3AED" />
                        <Text style={styles.aiScoreTitle}>Clyvo IA analisou os cuidados</Text>
                      </View>
                      <Text style={styles.aiScoreSubtitle}>{analysis.insights[0]?.title}</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={20} color="#0F766E" />
                  </TouchableOpacity>
                )}
              </LinearGradient>
            )}

            <View style={styles.quickHeader}>
              <Text style={styles.sectionTitle}>Acesso rápido</Text>
              <Text style={styles.sectionHint}>Tudo que você precisa hoje</Text>
            </View>

            <View style={styles.quickGrid}>
              <QuickAction label="Agenda" caption="Consultas" icon="calendar-outline" color="#0F766E" onPress={() => navigation.navigate("Agenda")} />
              <QuickAction label="Histórico" caption="Prontuário" icon="document-text-outline" color="#7C3AED" onPress={() => navigation.navigate("Histórico")} />
              <QuickAction label="Clyvo IA" caption="Insights" icon="sparkles-outline" color="#2563EB" onPress={() => navigation.navigate("IA")} />
              <QuickAction label="Novo pet" caption="Cadastrar" icon="add-circle-outline" color="#D97706" onPress={() => navigation.navigate("Cadastrar Pet")} />
            </View>

            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Próximo cuidado</Text>
              <TouchableOpacity onPress={() => navigation.navigate("Agenda")}>
                <Text style={styles.seeAll}>Abrir agenda</Text>
              </TouchableOpacity>
            </View>

            {nextCare ? (
              <TouchableOpacity style={styles.nextCard} onPress={() => navigation.navigate("Agenda")}>
                <View style={styles.nextDate}>
                  <Text style={styles.nextDay}>{nextCare.date.slice(8, 10)}</Text>
                  <Text style={styles.nextMonth}>
                    {new Date(`${nextCare.date}T12:00:00`)
                      .toLocaleDateString("pt-BR", { month: "short" })
                      .replace(".", "")
                      .toUpperCase()}
                  </Text>
                </View>
                <View style={styles.nextBody}>
                  <View style={styles.nextTitleRow}>
                    <Ionicons name={nextCare.icon} size={17} color="#0F766E" />
                    <Text style={styles.nextTitle}>{nextCare.title}</Text>
                  </View>
                  <Text numberOfLines={2} style={styles.nextDescription}>{nextCare.description}</Text>
                  <Text style={styles.nextFullDate}>{formatApiDate(nextCare.date)}</Text>
                </View>
                <Ionicons name="chevron-forward" size={21} color="#94A3B8" />
              </TouchableOpacity>
            ) : (
              <View style={styles.noCareCard}>
                <View style={styles.noCareIcon}>
                  <Ionicons name="checkmark-circle" size={25} color="#0F766E" />
                </View>
                <View style={styles.noCareText}>
                  <Text style={styles.noCareTitle}>Nenhum cuidado futuro</Text>
                  <Text style={styles.noCareSubtitle}>A agenda de {selectedPet?.name} está livre.</Text>
                </View>
                <TouchableOpacity onPress={() => navigation.navigate("Agenda")}>
                  <Text style={styles.scheduleLink}>Agendar</Text>
                </TouchableOpacity>
              </View>
            )}

            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Resumo de saúde</Text>
              <Text style={styles.updatedText}>Atualizado agora</Text>
            </View>

            <View style={styles.metricsRow}>
              <MetricCard
                icon="shield-checkmark-outline"
                value={vaccinationCount}
                label="Vacinas"
                color="#2563EB"
                onPress={() => openHealthModal("VACCINE")}
              />

              <MetricCard
                icon="flask-outline"
                value={examCount}
                label="Exames"
                color="#7C3AED"
                onPress={() => openHealthModal("EXAM")}
              />

              <MetricCard
                icon="medkit-outline"
                value={treatmentCount}
                label="Tratamentos"
                color="#D97706"
                onPress={() => openHealthModal("TREATMENT")}
              />
            </View>

            <Text style={styles.healthOwnerHint}>
              Toque em um card para adicionar uma informação de saúde informada pelo tutor.
            </Text>

            <TouchableOpacity style={styles.aiBanner} onPress={() => navigation.navigate("IA")}>
              <LinearGradient colors={["#312E81", "#5B21B6", "#7C3AED"]} style={styles.aiBannerGradient}>
                <View style={styles.aiBannerIcon}>
                  <Ionicons name="sparkles" size={25} color="#FFFFFF" />
                </View>
                <View style={styles.aiBannerText}>
                  <Text style={styles.aiBannerTitle}>Converse com a Clyvo IA</Text>
                  <Text style={styles.aiBannerSubtitle}>Pergunte sobre vacinas, agenda e pendências de {selectedPet?.name}.</Text>
                </View>
                <Ionicons name="arrow-forward-circle" size={27} color="#DDD6FE" />
              </LinearGradient>
            </TouchableOpacity>
          </>
        )}
      </ScrollView>

      <Modal
        visible={healthModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setHealthModalVisible(false)}
      >
        <KeyboardAvoidingView
          style={styles.healthModalBackdrop}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          <View style={styles.healthModalCard}>
            <View style={styles.healthModalHandle} />

            <View style={styles.healthModalHeader}>
              <View style={styles.healthModalHeaderText}>
                <Text style={styles.healthModalEyebrow}>
                  INFORMAÇÃO DO TUTOR
                </Text>
                <Text style={styles.healthModalTitle}>
                  Adicionar {healthTypeLabel(healthType).toLowerCase()}
                </Text>
                <Text style={styles.healthModalSubtitle}>
                  Esse registro complementa o resumo de saúde de {selectedPet?.name}.
                </Text>
              </View>

              <TouchableOpacity
                style={styles.healthCloseButton}
                onPress={() => setHealthModalVisible(false)}
              >
                <Ionicons name="close" size={21} color="#334155" />
              </TouchableOpacity>
            </View>

            <View style={styles.healthTypePreview}>
              <View style={styles.healthTypeIcon}>
                <Ionicons
                  name={healthTypeIcon(healthType)}
                  size={22}
                  color="#0F766E"
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.healthTypeTitle}>
                  {healthTypeLabel(healthType)}
                </Text>
                <Text style={styles.healthTypeCaption}>
                  Registro informado pelo tutor
                </Text>
              </View>
            </View>

            <Text style={styles.healthInputLabel}>Nome</Text>
            <View style={styles.healthInputBox}>
              <Ionicons name="create-outline" size={18} color="#0F766E" />
              <TextInput
                value={healthTitle}
                onChangeText={setHealthTitle}
                placeholder={
                  healthType === "VACCINE"
                    ? "Ex.: V10"
                    : healthType === "EXAM"
                      ? "Ex.: Hemograma"
                      : "Ex.: Antibiótico"
                }
                placeholderTextColor="#94A3B8"
                style={styles.healthInput}
              />
            </View>

            <Text style={styles.healthInputLabel}>Data</Text>
            <View style={styles.healthInputBox}>
              <Ionicons name="calendar-outline" size={18} color="#0F766E" />
              <TextInput
                value={healthDate}
                onChangeText={setHealthDate}
                placeholder="DD/MM/AAAA"
                placeholderTextColor="#94A3B8"
                keyboardType="numeric"
                maxLength={10}
                style={styles.healthInput}
              />
            </View>

            <Text style={styles.healthInputLabel}>Observação (opcional)</Text>
            <View style={[styles.healthInputBox, styles.healthNotesBox]}>
              <Ionicons name="document-text-outline" size={18} color="#0F766E" />
              <TextInput
                value={healthNotes}
                onChangeText={setHealthNotes}
                placeholder="Ex.: reforço anual, resultado normal..."
                placeholderTextColor="#94A3B8"
                multiline
                style={[styles.healthInput, styles.healthNotesInput]}
              />
            </View>

            <View style={styles.healthInfoNote}>
              <Ionicons name="information-circle-outline" size={18} color="#64748B" />
              <Text style={styles.healthInfoNoteText}>
                Informações adicionadas aqui são registros do tutor e não substituem o prontuário do veterinário.
              </Text>
            </View>

            <TouchableOpacity
              style={styles.healthSaveButton}
              onPress={() => void saveManualHealth()}
            >
              <Ionicons name="checkmark-circle-outline" size={20} color="#FFFFFF" />
              <Text style={styles.healthSaveButtonText}>
                Adicionar ao resumo
              </Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

function QuickAction({ label, caption, icon, color, onPress }: { label: string; caption: string; icon: keyof typeof Ionicons.glyphMap; color: string; onPress: () => void }) {
  return (
    <TouchableOpacity style={styles.quickCard} onPress={onPress} activeOpacity={0.82}>
      <View style={[styles.quickIcon, { backgroundColor: `${color}12` }]}>
        <Ionicons name={icon} size={23} color={color} />
      </View>
      <Text style={styles.quickLabel}>{label}</Text>
      <Text style={styles.quickCaption}>{caption}</Text>
    </TouchableOpacity>
  );
}

function MetricCard({
  icon,
  value,
  label,
  color,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  value: number;
  label: string;
  color: string;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      style={styles.metricCard}
      onPress={onPress}
      activeOpacity={0.82}
    >
      <View style={styles.metricTopRow}>
        <View style={[styles.metricIcon, { backgroundColor: `${color}12` }]}>
          <Ionicons name={icon} size={19} color={color} />
        </View>

        <View style={styles.metricAddIcon}>
          <Ionicons name="add" size={14} color={color} />
        </View>
      </View>

      <Text style={styles.metricValue}>{value}</Text>
      <Text style={styles.metricLabel}>{label}</Text>
      <Text style={[styles.metricAddText, { color }]}>+ Adicionar</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F5F9F8" },
  content: { paddingBottom: 42 },
  center: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: "#F4F9F8" },
  loadingText: { marginTop: 12, color: "#475569", fontWeight: "700" },

  // HERO PRINCIPAL
  header: {
    minHeight: 330,
    paddingTop: 48,
    paddingHorizontal: 18,
    paddingBottom: 22,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    overflow: "hidden",
    backgroundColor: "#064E49",
  },

  headerWide: {
    paddingTop: 25,
    paddingHorizontal: 30,
    paddingBottom: 30,
    justifyContent: "space-between",
  },

  headerGlow: {
    position: "absolute",
    width: 220,
    height: 220,
    borderRadius: 110,
    right: -82,
    top: -92,
    backgroundColor: "rgba(255,255,255,0.055)",
  },

  heroOrb: {
    position: "absolute",
    width: 210,
    height: 210,
    borderRadius: 105,
    right: -96,
    bottom: -72,
    backgroundColor: "rgba(20,184,166,0.09)",
  },

  heroOrbSmall: {
    position: "absolute",
    width: 120,
    height: 120,
    borderRadius: 60,
    left: -62,
    bottom: 36,
    backgroundColor: "rgba(167,243,208,0.045)",
  },

  headerTop: {
    zIndex: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  brandRow: {
    flexDirection: "row",
    alignItems: "center",
    flexShrink: 1,
  },

  brandIcon: {
    width: 39,
    height: 39,
    marginRight: 9,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.96)",
  },

  brand: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "900",
    letterSpacing: 1.2,
  },

  brandTagline: {
    marginTop: 2,
    color: "#A7F3D0",
    fontSize: 5.6,
    fontWeight: "800",
    letterSpacing: 0.65,
  },

  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
  },

  planPill: {
    height: 37,
    paddingHorizontal: 11,
    borderRadius: 14,
    backgroundColor: "rgba(2,35,32,0.36)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.14)",
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },

  planPillText: {
    color: "#FFFFFF",
    fontSize: 9,
    fontWeight: "900",
  },

  profileButton: {
    width: 41,
    height: 41,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.16)",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.10)",
  },

  headerCopy: {
    zIndex: 10,
    marginTop: 22,
    maxWidth: 300,
  },

  headerCopyWide: {
    marginTop: 34,
    width: "41%",
    minWidth: 320,
  },

  heroEyebrow: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.07)",
    borderWidth: 1,
    borderColor: "rgba(167,243,208,0.24)",
    marginBottom: 10,
  },

  heroEyebrowText: {
    color: "#D1FAE5",
    fontSize: 7,
    fontWeight: "900",
    letterSpacing: 1.0,
  },

  greeting: {
    color: "#FFFFFF",
    fontSize: 27,
    lineHeight: 32,
    fontWeight: "900",
    letterSpacing: -0.6,
  },

  greetingWide: {
    fontSize: 32,
    lineHeight: 38,
  },

  headerTitle: {
    marginTop: 3,
    color: "#E6FFFB",
    fontSize: 15,
    lineHeight: 21,
    fontWeight: "800",
  },

  headerTitleWide: {
    fontSize: 22,
    lineHeight: 28,
    color: "#FFFFFF",
  },

  headerSubtitle: {
    marginTop: 7,
    maxWidth: 280,
    color: "rgba(255,255,255,0.76)",
    fontSize: 9.4,
    lineHeight: 14,
    fontWeight: "500",
  },

  onlinePill: {
    alignSelf: "flex-start",
    marginTop: 11,
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 999,
    backgroundColor: "rgba(2,44,40,0.28)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.09)",
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },

  onlineText: {
    color: "#CCFBF1",
    fontSize: 8,
    fontWeight: "800",
  },

  decorHeartOne: {
    position: "absolute",
    right: 34,
    top: 142,
    transform: [{ rotate: "-8deg" }],
  },

  decorHeartTwo: {
    position: "absolute",
    right: 84,
    bottom: 38,
    transform: [{ rotate: "7deg" }],
  },

  decorPawOne: {
    position: "absolute",
    right: 18,
    bottom: 70,
    transform: [{ rotate: "-10deg" }],
  },

  decorPawTwo: {
    position: "absolute",
    left: 24,
    bottom: 58,
    transform: [{ rotate: "10deg" }],
  },

  decorSparkOne: {
    position: "absolute",
    right: 22,
    top: 112,
    transform: [{ rotate: "12deg" }],
  },

  heroDecorRow: {
    zIndex: 10,
    marginTop: 22,
    minHeight: 48,
    borderRadius: 18,
    paddingHorizontal: 12,
    paddingVertical: 9,
    backgroundColor: "rgba(2,44,40,0.22)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  heroDecorItem: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },

  heroDecorIcon: {
    width: 28,
    height: 28,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(167,243,208,0.10)",
  },

  heroDecorText: {
    color: "#D1FAE5",
    fontSize: 8.5,
    fontWeight: "800",
  },

  heroDecorDivider: {
    width: 1,
    height: 24,
    backgroundColor: "rgba(255,255,255,0.08)",
  },

  // PET SELECTOR
  petSelectorHeader: { marginTop: 20, paddingHorizontal: 18, flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  sectionLabel: { color: "#64748B", fontSize: 10, fontWeight: "900", letterSpacing: 1.3 },
  seeAll: { color: "#0F766E", fontSize: 11, fontWeight: "900" },
  petRow: { gap: 8, paddingHorizontal: 18, paddingTop: 10, paddingBottom: 2 },
  petChip: { minHeight: 43, paddingHorizontal: 9, paddingRight: 14, borderRadius: 15, borderWidth: 1, borderColor: "#DCE8E6", backgroundColor: "#FFFFFF", flexDirection: "row", alignItems: "center", gap: 7 },
  petChipActive: { borderColor: "#0F766E", backgroundColor: "#0F766E" },
  petChipAvatar: { width: 28, height: 28, borderRadius: 10, alignItems: "center", justifyContent: "center", backgroundColor: "#DFF7F4" },
  petChipAvatarActive: { backgroundColor: "rgba(255,255,255,0.18)" },
  petChipText: { color: "#334155", fontSize: 12, fontWeight: "900" },
  petChipTextActive: { color: "#FFFFFF" },
  addPetChip: { minHeight: 43, paddingHorizontal: 13, borderRadius: 15, borderWidth: 1, borderStyle: "dashed", borderColor: "#0F766E", backgroundColor: "#F0FDFA", flexDirection: "row", alignItems: "center", gap: 5 },
  addPetText: { color: "#0F766E", fontSize: 11, fontWeight: "900" },

  // CARD DO PET
  petHero: { marginHorizontal: 18, marginTop: 14, padding: 17, borderRadius: 24, borderWidth: 1, borderColor: "#D5EAE6" },
  petHeroTop: { flexDirection: "row", alignItems: "center" },
  bigAvatar: { width: 66, height: 66, borderRadius: 23, alignItems: "center", justifyContent: "center", backgroundColor: "#DFF7F4" },
  petIdentity: { flex: 1, marginLeft: 13 },
  petName: { color: "#0F172A", fontSize: 21, fontWeight: "900" },
  petDetails: { marginTop: 3, color: "#64748B", fontSize: 11, fontWeight: "600" },
  tags: { marginTop: 8, flexDirection: "row", flexWrap: "wrap", gap: 6 },
  tag: { paddingHorizontal: 7, paddingVertical: 5, borderRadius: 8, backgroundColor: "#E6F7F4", flexDirection: "row", alignItems: "center", gap: 4 },
  tagText: { color: "#0F766E", fontSize: 9, fontWeight: "800" },
  editButton: { width: 36, height: 36, borderRadius: 13, alignItems: "center", justifyContent: "center", backgroundColor: "#E6F7F4" },
  aiScoreRow: { marginTop: 15, paddingTop: 14, borderTopWidth: 1, borderTopColor: "#DDECE9", flexDirection: "row", alignItems: "center" },
  miniScore: { width: 42, height: 42, borderRadius: 15, borderWidth: 4, borderColor: "#14B8A6", alignItems: "center", justifyContent: "center", backgroundColor: "#FFFFFF" },
  miniScoreMedium: { borderColor: "#F59E0B" },
  miniScoreHigh: { borderColor: "#EF4444" },
  miniScoreValue: { color: "#0F172A", fontSize: 13, fontWeight: "900" },
  aiScoreText: { flex: 1, marginLeft: 10 },
  aiTitleRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  aiScoreTitle: { color: "#4C1D95", fontSize: 10, fontWeight: "900" },
  aiScoreSubtitle: { marginTop: 3, color: "#64748B", fontSize: 9 },

  // ACESSOS E SEÇÕES
  quickHeader: { marginHorizontal: 18, marginTop: 23 },
  sectionTitle: { color: "#0F172A", fontSize: 18, fontWeight: "900" },
  sectionHint: { marginTop: 3, color: "#64748B", fontSize: 10 },
  quickGrid: { marginHorizontal: 18, marginTop: 11, flexDirection: "row", gap: 8 },
  quickCard: { flex: 1, padding: 11, borderRadius: 18, borderWidth: 1, borderColor: "#E0ECEA", backgroundColor: "#FFFFFF" },
  quickIcon: { width: 38, height: 38, borderRadius: 13, alignItems: "center", justifyContent: "center" },
  quickLabel: { marginTop: 9, color: "#0F172A", fontSize: 11, fontWeight: "900" },
  quickCaption: { marginTop: 2, color: "#94A3B8", fontSize: 8 },
  sectionHeader: { marginHorizontal: 18, marginTop: 23, marginBottom: 10, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  updatedText: { color: "#94A3B8", fontSize: 8, fontWeight: "700" },
  nextCard: { marginHorizontal: 18, padding: 14, borderRadius: 21, borderWidth: 1, borderColor: "#DCE9E7", backgroundColor: "#FFFFFF", flexDirection: "row", alignItems: "center" },
  nextDate: { width: 55, height: 61, borderRadius: 17, backgroundColor: "#DFF7F4", alignItems: "center", justifyContent: "center" },
  nextDay: { color: "#0F766E", fontSize: 21, fontWeight: "900" },
  nextMonth: { marginTop: -2, color: "#0F766E", fontSize: 9, fontWeight: "900" },
  nextBody: { flex: 1, marginHorizontal: 12 },
  nextTitleRow: { flexDirection: "row", alignItems: "center", gap: 5 },
  nextTitle: { color: "#0F172A", fontSize: 13, fontWeight: "900" },
  nextDescription: { marginTop: 4, color: "#64748B", fontSize: 10, lineHeight: 15 },
  nextFullDate: { marginTop: 5, color: "#0F766E", fontSize: 9, fontWeight: "800" },
  noCareCard: { marginHorizontal: 18, padding: 14, borderRadius: 20, borderWidth: 1, borderColor: "#DCE9E7", backgroundColor: "#FFFFFF", flexDirection: "row", alignItems: "center" },
  noCareIcon: { width: 43, height: 43, borderRadius: 15, alignItems: "center", justifyContent: "center", backgroundColor: "#DFF7F4" },
  noCareText: { flex: 1, marginLeft: 10 },
  noCareTitle: { color: "#0F172A", fontSize: 12, fontWeight: "900" },
  noCareSubtitle: { marginTop: 3, color: "#64748B", fontSize: 9 },
  scheduleLink: { color: "#0F766E", fontSize: 10, fontWeight: "900" },
  metricsRow: { marginHorizontal: 18, flexDirection: "row", gap: 9 },
  metricCard: { flex: 1, padding: 12, borderRadius: 18, borderWidth: 1, borderColor: "#E0ECEA", backgroundColor: "#FFFFFF" },
  metricTopRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  metricAddIcon: { width: 23, height: 23, borderRadius: 8, alignItems: "center", justifyContent: "center", backgroundColor: "#F8FAFC" },
  metricIcon: { width: 35, height: 35, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  metricValue: { marginTop: 8, color: "#0F172A", fontSize: 20, fontWeight: "900" },
  metricLabel: { marginTop: 2, color: "#64748B", fontSize: 9, fontWeight: "700" },
  metricAddText: { marginTop: 7, fontSize: 8, fontWeight: "900" },
  healthOwnerHint: {
    marginHorizontal: 18,
    marginTop: 8,
    color: "#94A3B8",
    fontSize: 8.5,
    lineHeight: 13,
    textAlign: "center",
  },

  // MODAL - RESUMO DE SAÚDE
  healthModalBackdrop: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(15,23,42,0.45)",
  },
  healthModalCard: {
    padding: 20,
    paddingTop: 10,
    paddingBottom: 26,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    backgroundColor: "#FFFFFF",
  },
  healthModalHandle: {
    alignSelf: "center",
    width: 42,
    height: 5,
    marginBottom: 16,
    borderRadius: 3,
    backgroundColor: "#CBD5E1",
  },
  healthModalHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 17,
  },
  healthModalHeaderText: {
    flex: 1,
    paddingRight: 10,
  },
  healthModalEyebrow: {
    color: "#0F766E",
    fontSize: 8,
    fontWeight: "900",
    letterSpacing: 1.1,
  },
  healthModalTitle: {
    marginTop: 3,
    color: "#0F172A",
    fontSize: 22,
    fontWeight: "900",
  },
  healthModalSubtitle: {
    marginTop: 4,
    color: "#64748B",
    fontSize: 10,
    lineHeight: 15,
  },
  healthCloseButton: {
    width: 38,
    height: 38,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F1F5F9",
  },
  healthTypePreview: {
    marginBottom: 16,
    padding: 12,
    borderRadius: 17,
    borderWidth: 1,
    borderColor: "#DCEBE8",
    backgroundColor: "#F0FDFA",
    flexDirection: "row",
    alignItems: "center",
  },
  healthTypeIcon: {
    width: 42,
    height: 42,
    marginRight: 10,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
  },
  healthTypeTitle: {
    color: "#134E4A",
    fontSize: 13,
    fontWeight: "900",
  },
  healthTypeCaption: {
    marginTop: 2,
    color: "#64748B",
    fontSize: 9,
  },
  healthInputLabel: {
    marginBottom: 6,
    color: "#334155",
    fontSize: 10,
    fontWeight: "800",
  },
  healthInputBox: {
    minHeight: 49,
    marginBottom: 13,
    paddingHorizontal: 13,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: "#DCE8E6",
    backgroundColor: "#F8FBFB",
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  healthInput: {
    flex: 1,
    color: "#0F172A",
    fontSize: 12,
  },
  healthNotesBox: {
    minHeight: 76,
    alignItems: "flex-start",
    paddingTop: 13,
  },
  healthNotesInput: {
    minHeight: 52,
    textAlignVertical: "top",
  },
  healthInfoNote: {
    padding: 11,
    borderRadius: 14,
    backgroundColor: "#F8FAFC",
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 7,
  },
  healthInfoNoteText: {
    flex: 1,
    color: "#64748B",
    fontSize: 9,
    lineHeight: 14,
  },
  healthSaveButton: {
    minHeight: 51,
    marginTop: 16,
    borderRadius: 16,
    backgroundColor: "#0F766E",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
  },
  healthSaveButtonText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "900",
  },

  aiBanner: { marginHorizontal: 18, marginTop: 21, borderRadius: 22, overflow: "hidden" },
  aiBannerGradient: { padding: 16, flexDirection: "row", alignItems: "center" },
  aiBannerIcon: { width: 47, height: 47, borderRadius: 16, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(255,255,255,0.15)" },
  aiBannerText: { flex: 1, marginHorizontal: 11 },
  aiBannerTitle: { color: "#FFFFFF", fontSize: 14, fontWeight: "900" },
  aiBannerSubtitle: { marginTop: 4, color: "#DDD6FE", fontSize: 9, lineHeight: 14 },
});
