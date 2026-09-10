import { Ionicons } from "@expo/vector-icons";
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
  View,
} from "react-native";

import {
  useAppointments,
  useCancelAppointment,
  useClinics,
  useScheduleAppointment,
  useVeterinarians,
} from "../hooks/useClinical";

import { useOwnerProfile } from "../hooks/useOwnerProfile";
import { usePets } from "../hooks/usePets";
import { AppointmentType } from "../types/clinical";

import {
  decodeReasonWithTime,
  displayDateToApi,
  encodeReasonWithTime,
  formatDateInput,
  formatTimeInput,
  isValidDisplayDate,
  isValidTime,
} from "../utils/date";

type AgendaItem = {
  key: string;
  sourceId: number;
  kind: "APPOINTMENT";
  date: string;
  time: string | null;
  title: string;
  description: string;
  professional: string | null;
  clinic: string | null;
  status: "OVERDUE" | "TODAY" | "UPCOMING";
  canCancel: boolean;
};

const APPOINTMENT_TYPES: {
  label: string;
  value: AppointmentType;
  icon: keyof typeof Ionicons.glyphMap;
}[] = [
  {
    label: "Rotina",
    value: "ROUTINE",
    icon: "heart-outline",
  },
  {
    label: "Retorno",
    value: "FOLLOW_UP",
    icon: "refresh-outline",
  },
  {
    label: "Urgência",
    value: "EMERGENCY",
    icon: "medical-outline",
  },
];

function appointmentLabel(type: AppointmentType) {
  if (type === "FOLLOW_UP") {
    return "Consulta de retorno";
  }

  if (type === "EMERGENCY") {
    return "Atendimento de urgência";
  }

  return "Consulta de rotina";
}

function statusLabel(status: AgendaItem["status"]) {
  if (status === "OVERDUE") {
    return "Em atraso";
  }

  if (status === "TODAY") {
    return "Hoje";
  }

  return "Programado";
}

/**
 * Retorna a data atual considerando o fuso de São Paulo.
 *
 * Isso evita o emulador Android usar UTC e considerar o dia seguinte
 * depois das 21h no horário de Brasília.
 */
function todayInBrazilApiDate() {
  try {
    const parts = new Intl.DateTimeFormat("en-US", {
      timeZone: "America/Sao_Paulo",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).formatToParts(new Date());

    const year = parts.find((part) => part.type === "year")?.value;
    const month = parts.find((part) => part.type === "month")?.value;
    const day = parts.find((part) => part.type === "day")?.value;

    if (year && month && day) {
      return `${year}-${month}-${day}`;
    }
  } catch {
    // Fallback para ambientes sem suporte completo a Intl/timeZone.
  }

  const brazilNow = new Date(Date.now() - 3 * 60 * 60 * 1000);

  const year = brazilNow.getUTCFullYear();
  const month = String(brazilNow.getUTCMonth() + 1).padStart(2, "0");
  const day = String(brazilNow.getUTCDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function todayInBrazilDisplayDate() {
  const [year, month, day] = todayInBrazilApiDate().split("-");
  return `${day}/${month}/${year}`;
}

/**
 * Calcula quantos dias faltam para uma consulta usando apenas as datas,
 * sem depender do fuso horário configurado no emulador.
 */
function daysUntilAppointment(date: string) {
  const [year, month, day] = date.split("-").map(Number);
  const [todayYear, todayMonth, todayDay] = todayInBrazilApiDate()
    .split("-")
    .map(Number);

  const appointmentUtc = Date.UTC(year, month - 1, day);
  const todayUtc = Date.UTC(todayYear, todayMonth - 1, todayDay);

  return Math.round(
    (appointmentUtc - todayUtc) / (1000 * 60 * 60 * 24),
  );
}

function appointmentDateRelation(
  date: string,
): AgendaItem["status"] {
  const days = daysUntilAppointment(date);

  if (days < 0) {
    return "OVERDUE";
  }

  if (days === 0) {
    return "TODAY";
  }

  return "UPCOMING";
}

/**
 * Texto exibido no card de contagem regressiva.
 */
function countdownLabel(days: number) {
  if (days === 0) {
    return "É hoje! 🐾";
  }

  if (days === 1) {
    return "É amanhã!";
  }

  return `Faltam ${days} dias`;
}

/**
 * Transforma AAAA-MM-DD em DD/MM/AAAA.
 */
function formatAppointmentDate(date: string) {
  const [year, month, day] = date.split("-");

  return `${day}/${month}/${year}`;
}

export default function ScheduleScreen({
  navigation,
}: any) {
  const {
    data: owner,
    isLoading: ownerLoading,
  } = useOwnerProfile();

  const {
    data: pets = [],
    isLoading: petsLoading,
    refetch: refetchPets,
  } = usePets(owner?.id);

  const [selectedPetId, setSelectedPetId] =
    useState<number>();

  const [modalVisible, setModalVisible] =
    useState(false);

  const [date, setDate] =
    useState(todayInBrazilDisplayDate());

  const [time, setTime] =
    useState("09:00");

  const [type, setType] =
    useState<AppointmentType>("ROUTINE");

  const [reason, setReason] =
    useState("");

  const [veterinarianId, setVeterinarianId] =
    useState<number | null>(null);

  const [clinicId, setClinicId] =
    useState<number | null>(null);

  /**
   * Seleciona automaticamente o primeiro pet.
   */
  useEffect(() => {
    if (!pets.length) {
      setSelectedPetId(undefined);
      return;
    }

    const selectedPetStillExists = pets.some(
      (pet) => pet.id === selectedPetId,
    );

    if (!selectedPetStillExists) {
      setSelectedPetId(pets[0].id);
    }
  }, [pets, selectedPetId]);

  const appointmentsQuery =
    useAppointments(selectedPetId);

  const veterinariansQuery =
    useVeterinarians();

  const clinicsQuery =
    useClinics();

  const scheduleAppointment =
    useScheduleAppointment();

  const cancelAppointment =
    useCancelAppointment();

  const selectedPet = pets.find(
    (pet) => pet.id === selectedPetId,
  );

  /**
   * Próxima consulta agendada do pet.
   */
  const nextAppointment = useMemo(() => {
    return (
      (appointmentsQuery.data ?? [])
        .filter(
          (item) =>
            item.status === "SCHEDULED" &&
            daysUntilAppointment(
              item.appointmentDate,
            ) >= 0,
        )
        .sort((a, b) =>
          a.appointmentDate.localeCompare(
            b.appointmentDate,
          ),
        )[0] ?? null
    );
  }, [appointmentsQuery.data]);

  /**
   * Informações usadas no card de lembrete.
   */
  const nextAppointmentInfo = useMemo(() => {
    if (!nextAppointment) {
      return null;
    }

    const parsed = decodeReasonWithTime(
      nextAppointment.reason,
    );

    return {
      days: daysUntilAppointment(
        nextAppointment.appointmentDate,
      ),
      time: parsed.time,
      reason: parsed.reason,
    };
  }, [nextAppointment]);

  /**
   * Agenda do pet selecionado.
   * Nesta versão mostramos somente consultas.
   */
  const agenda = useMemo<AgendaItem[]>(() => {
    return (appointmentsQuery.data ?? [])
      .filter((item) => item.status === "SCHEDULED")
      .map((item) => {
        const parsed = decodeReasonWithTime(item.reason);

        return {
          key: `appointment-${item.id}`,
          sourceId: item.id,
          kind: "APPOINTMENT" as const,
          date: item.appointmentDate,
          time: parsed.time,
          title: appointmentLabel(item.type),
          description: parsed.reason,
          professional: item.veterinarianName,
          clinic: item.clinicName,
          status: appointmentDateRelation(item.appointmentDate),
          canCancel: true,
        };
      })
      .sort((a, b) =>
        `${a.date}${a.time ?? "23:59"}`.localeCompare(
          `${b.date}${b.time ?? "23:59"}`,
        ),
      );
  }, [appointmentsQuery.data]);

  const overdueCount = agenda.filter(
    (item) => item.status === "OVERDUE",
  ).length;

  const upcomingCount = agenda.filter(
    (item) => item.status !== "OVERDUE",
  ).length;

  const isRefreshing =
    appointmentsQuery.isRefetching;

  const isLoading =
    ownerLoading ||
    petsLoading ||
    (Boolean(selectedPetId) &&
      appointmentsQuery.isLoading);

  async function refresh() {
    await Promise.all([
      refetchPets(),
      appointmentsQuery.refetch(),
    ]);
  }

  function resetForm() {
    setDate(todayInBrazilDisplayDate());
    setTime("09:00");
    setType("ROUTINE");
    setReason("");
    setVeterinarianId(null);
    setClinicId(null);
  }

  /**
   * Agenda nova consulta.
   */
  async function submitAppointment() {
    if (!selectedPetId) {
      return;
    }

    if (!isValidDisplayDate(date)) {
      return Alert.alert(
        "Data inválida",
        "Digite a data no formato dia/mês/ano.",
      );
    }

    if (!isValidTime(time)) {
      return Alert.alert(
        "Horário inválido",
        "Digite um horário entre 00:00 e 23:59.",
      );
    }

    if (!reason.trim()) {
      return Alert.alert(
        "Motivo obrigatório",
        "Conte brevemente por que deseja agendar.",
      );
    }

    const appointmentDate =
      displayDateToApi(date);

    if (
      !appointmentDate ||
      appointmentDate < todayInBrazilApiDate()
    ) {
      return Alert.alert(
        "Data inválida",
        "A consulta não pode ser agendada no passado.",
      );
    }

    try {
      await scheduleAppointment.mutateAsync({
        appointmentDate,
        type,
        reason: encodeReasonWithTime(
          reason,
          time,
        ),
        petId: selectedPetId,
        veterinarianId,
        clinicId,
      });

      setModalVisible(false);

      resetForm();

      Alert.alert(
        "Consulta agendada",
        `O compromisso de ${
          selectedPet?.name ?? "seu pet"
        } foi salvo.`,
      );
    } catch (error) {
      Alert.alert(
        "Não foi possível agendar",
        error instanceof Error
          ? error.message
          : "Tente novamente.",
      );
    }
  }

  /**
   * Cancela consulta.
   */
  function askCancel(item: AgendaItem) {
    Alert.alert(
      "Cancelar consulta",
      "Deseja realmente cancelar este agendamento?",
      [
        {
          text: "Voltar",
          style: "cancel",
        },
        {
          text: "Cancelar consulta",
          style: "destructive",

          onPress: async () => {
            if (!selectedPetId) {
              return;
            }

            try {
              await cancelAppointment.mutateAsync({
                appointmentId:
                  item.sourceId,
                petId: selectedPetId,
              });
            } catch (error) {
              Alert.alert(
                "Erro",
                error instanceof Error
                  ? error.message
                  : "Não foi possível cancelar.",
              );
            }
          },
        },
      ],
    );
  }

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator
          size="large"
          color="#0F766E"
        />

        <Text style={styles.loadingText}>
          Organizando sua agenda...
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar
        barStyle="light-content"
        backgroundColor="#0F766E"
      />

      {/* HEADER */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerEyebrow}>
            CUIDADO CONTÍNUO
          </Text>

          <Text style={styles.headerTitle}>
            Agenda
          </Text>

          <Text style={styles.headerSubtitle}>
            Consultas e próximos cuidados
          </Text>
        </View>

        <TouchableOpacity
          style={[
            styles.addButton,
            pets.length === 0 &&
              styles.disabledButton,
          ]}
          onPress={() =>
            setModalVisible(true)
          }
          disabled={pets.length === 0}
        >
          <Ionicons
            name="add"
            size={27}
            color="#FFFFFF"
          />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={() => void refresh()}
            colors={["#0F766E"]}
          />
        }
      >
        {pets.length === 0 ? (
          <EmptyPets
            onAdd={() =>
              navigation.navigate(
                "Cadastrar Pet",
              )
            }
          />
        ) : (
          <>
            {/* PETS */}
            <Text style={styles.sectionLabel}>
              AGENDA DE
            </Text>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={
                false
              }
              contentContainerStyle={
                styles.petRow
              }
            >
              {pets.map((pet) => {
                const active =
                  pet.id === selectedPetId;

                return (
                  <TouchableOpacity
                    key={pet.id}
                    style={[
                      styles.petChip,
                      active &&
                        styles.petChipActive,
                    ]}
                    onPress={() =>
                      setSelectedPetId(
                        pet.id,
                      )
                    }
                  >
                    <View
                      style={[
                        styles.petAvatar,
                        active &&
                          styles.petAvatarActive,
                      ]}
                    >
                      <Ionicons
                        name="paw"
                        size={17}
                        color={
                          active
                            ? "#0F766E"
                            : "#64748B"
                        }
                      />
                    </View>

                    <View>
                      <Text
                        style={[
                          styles.petName,
                          active &&
                            styles.petNameActive,
                        ]}
                      >
                        {pet.name}
                      </Text>

                      <Text
                        style={[
                          styles.petSpecies,
                          active &&
                            styles.petSpeciesActive,
                        ]}
                      >
                        {pet.speciesName}
                      </Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            {/* RESUMO */}
            <View style={styles.summaryCard}>
              <View
                style={styles.summaryIcon}
              >
                <Ionicons
                  name="calendar"
                  size={25}
                  color="#0F766E"
                />
              </View>

              <View style={styles.summaryText}>
                <Text
                  style={styles.summaryTitle}
                >
                  {upcomingCount === 0
                    ? "Agenda livre"
                    : `${upcomingCount} cuidado${
                        upcomingCount > 1
                          ? "s"
                          : ""
                      } programado${
                        upcomingCount > 1
                          ? "s"
                          : ""
                      }`}
                </Text>

                <Text
                  style={
                    styles.summarySubtitle
                  }
                >
                  {overdueCount > 0
                    ? `${overdueCount} item${
                        overdueCount > 1
                          ? "s precisam"
                          : " precisa"
                      } de atenção`
                    : `Tudo organizado para ${selectedPet?.name}`}
                </Text>
              </View>

              <View
                style={[
                  styles.countBadge,
                  overdueCount > 0 &&
                    styles.countBadgeWarning,
                ]}
              >
                <Text
                  style={[
                    styles.countText,
                    overdueCount > 0 &&
                      styles.countTextWarning,
                  ]}
                >
                  {agenda.length}
                </Text>
              </View>
            </View>

            {/* CONTAGEM REGRESSIVA */}
            {nextAppointment &&
              nextAppointmentInfo && (
                <View
                  style={
                    styles.countdownCard
                  }
                >
                  <View
                    style={
                      styles.countdownTop
                    }
                  >
                    <View
                      style={
                        styles.countdownBell
                      }
                    >
                      <Ionicons
                        name="calendar-outline"
                        size={21}
                        color="#0F766E"
                      />
                    </View>

                    <View
                      style={
                        styles.countdownHeading
                      }
                    >
                      <Text
                        style={
                          styles.countdownEyebrow
                        }
                      >
                        SUA CONSULTA ESTÁ SE
                        APROXIMANDO
                      </Text>

                      <Text
                        style={
                          styles.countdownPet
                        }
                      >
                        {selectedPet?.name} •{" "}
                        {appointmentLabel(
                          nextAppointment.type,
                        )}
                      </Text>
                    </View>
                  </View>

                  <View
                    style={
                      styles.countdownMain
                    }
                  >
                    <Text
                      style={[
                        styles.countdownNumber,
                        nextAppointmentInfo.days <=
                          1 &&
                          styles.countdownNumberUrgent,
                      ]}
                    >
                      {countdownLabel(
                        nextAppointmentInfo.days,
                      )}
                    </Text>

                    <Text
                      style={
                        styles.countdownDate
                      }
                    >
                      {formatAppointmentDate(
                        nextAppointment.appointmentDate,
                      )}

                      {nextAppointmentInfo.time
                        ? ` às ${nextAppointmentInfo.time}`
                        : ""}
                    </Text>

                    {nextAppointmentInfo
                      .reason ? (
                      <Text
                        style={
                          styles.countdownReason
                        }
                      >
                        {
                          nextAppointmentInfo.reason
                        }
                      </Text>
                    ) : null}
                  </View>

                  <View
                    style={
                      styles.countdownDivider
                    }
                  />

                  <View
                    style={
                      styles.countdownFooter
                    }
                  >
                    <Ionicons
                      name="bag-check-outline"
                      size={19}
                      color="#0F766E"
                    />

                    <Text
                      style={
                        styles.countdownFooterText
                      }
                    >
                      {nextAppointmentInfo.days ===
                      0
                        ? "Chegou o dia! Separe a carteirinha e os documentos do seu pet."
                        : nextAppointmentInfo.days ===
                            1
                          ? "Está quase na hora. Deixe tudo preparado para amanhã."
                          : "Tudo preparado para o próximo cuidado? Separe carteirinha e exames."}
                    </Text>
                  </View>
                </View>
              )}

            {/* AGENDA */}
            {agenda.length === 0 ? (
              <View
                style={styles.emptyAgenda}
              >
                <View
                  style={
                    styles.emptyAgendaIcon
                  }
                >
                  <Ionicons
                    name="calendar-clear-outline"
                    size={38}
                    color="#0F766E"
                  />
                </View>

                <Text
                  style={styles.emptyTitle}
                >
                  Nada pendente por aqui
                </Text>

                <Text
                  style={
                    styles.emptyDescription
                  }
                >
                  Agende uma consulta para acompanhar
                  os próximos cuidados do seu pet.
                </Text>

                <TouchableOpacity
                  style={
                    styles.primaryButton
                  }
                  onPress={() =>
                    setModalVisible(true)
                  }
                >
                  <Ionicons
                    name="add-circle-outline"
                    size={20}
                    color="#FFFFFF"
                  />

                  <Text
                    style={
                      styles.primaryButtonText
                    }
                  >
                    Agendar consulta
                  </Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.timeline}>
                {agenda.map((item) => (
                  <AgendaCard
                    key={item.key}
                    item={item}
                    busy={cancelAppointment.isPending}
                    onCancel={() => askCancel(item)}
                  />
                ))}
              </View>
            )}

            {/* HISTÓRICO */}
            <TouchableOpacity
              style={styles.historyBanner}
              onPress={() =>
                navigation.navigate(
                  "Histórico",
                )
              }
            >
              <View
                style={styles.historyIcon}
              >
                <Ionicons
                  name="time-outline"
                  size={22}
                  color="#0F766E"
                />
              </View>

              <View
                style={styles.historyText}
              >
                <Text
                  style={styles.historyTitle}
                >
                  Procurando um cuidado antigo?
                </Text>

                <Text
                  style={
                    styles.historySubtitle
                  }
                >
                  Veja o prontuário e as
                  lembranças de{" "}
                  {selectedPet?.name}
                </Text>
              </View>

              <Ionicons
                name="chevron-forward"
                size={20}
                color="#0F766E"
              />
            </TouchableOpacity>
          </>
        )}
      </ScrollView>

      {/* MODAL NOVA CONSULTA */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={() =>
          setModalVisible(false)
        }
      >
        <KeyboardAvoidingView
          style={styles.modalBackdrop}
          behavior={
            Platform.OS === "ios"
              ? "padding"
              : undefined
          }
        >
          <View style={styles.modalCard}>
            <View
              style={styles.modalHandle}
            />

            <View
              style={styles.modalHeader}
            >
              <View>
                <Text
                  style={styles.modalTitle}
                >
                  Nova consulta
                </Text>

                <Text
                  style={
                    styles.modalSubtitle
                  }
                >
                  Agendar para{" "}
                  {selectedPet?.name}
                </Text>
              </View>

              <TouchableOpacity
                style={styles.closeButton}
                onPress={() =>
                  setModalVisible(false)
                }
              >
                <Ionicons
                  name="close"
                  size={22}
                  color="#334155"
                />
              </TouchableOpacity>
            </View>

            <ScrollView
              showsVerticalScrollIndicator={
                false
              }
              keyboardShouldPersistTaps="handled"
            >
              <Text
                style={styles.inputLabel}
              >
                Tipo de atendimento
              </Text>

              <View style={styles.typeRow}>
                {APPOINTMENT_TYPES.map(
                  (option) => {
                    const active =
                      type === option.value;

                    return (
                      <TouchableOpacity
                        key={option.value}
                        style={[
                          styles.typeOption,
                          active &&
                            styles.typeOptionActive,
                        ]}
                        onPress={() =>
                          setType(
                            option.value,
                          )
                        }
                      >
                        <Ionicons
                          name={
                            option.icon
                          }
                          size={20}
                          color={
                            active
                              ? "#FFFFFF"
                              : "#64748B"
                          }
                        />

                        <Text
                          style={[
                            styles.typeText,
                            active &&
                              styles.typeTextActive,
                          ]}
                        >
                          {option.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  },
                )}
              </View>

              <View
                style={styles.twoColumns}
              >
                <FormInput
                  label="Data"
                  icon="calendar-outline"
                  value={date}
                  onChangeText={(value) =>
                    setDate(
                      formatDateInput(value),
                    )
                  }
                  placeholder="DD/MM/AAAA"
                  keyboardType="numeric"
                  maxLength={10}
                />

                <FormInput
                  label="Horário"
                  icon="time-outline"
                  value={time}
                  onChangeText={(value) =>
                    setTime(
                      formatTimeInput(value),
                    )
                  }
                  placeholder="HH:MM"
                  keyboardType="numeric"
                  maxLength={5}
                />
              </View>

              <FormInput
                label="Motivo da consulta"
                icon="chatbubble-ellipses-outline"
                value={reason}
                onChangeText={setReason}
                placeholder="Ex.: check-up anual"
                multiline
              />

              <PickerSection title="Profissional (opcional)">
                <ChoiceChip
                  label="A definir"
                  active={
                    veterinarianId === null
                  }
                  onPress={() =>
                    setVeterinarianId(null)
                  }
                />

                {(
                  veterinariansQuery.data ??
                  []
                ).map((vet) => (
                  <ChoiceChip
                    key={vet.id}
                    label={vet.name}
                    caption={
                      vet.specialty ??
                      vet.licenseNumber
                    }
                    active={
                      veterinarianId ===
                      vet.id
                    }
                    onPress={() =>
                      setVeterinarianId(
                        vet.id,
                      )
                    }
                  />
                ))}
              </PickerSection>

              {(clinicsQuery.data ?? [])
                .length > 0 && (
                <PickerSection title="Clínica (opcional)">
                  <ChoiceChip
                    label="A definir"
                    active={
                      clinicId === null
                    }
                    onPress={() =>
                      setClinicId(null)
                    }
                  />

                  {(
                    clinicsQuery.data ?? []
                  ).map((clinic) => (
                    <ChoiceChip
                      key={clinic.id}
                      label={clinic.name}
                      caption={
                        clinic.cityName ??
                        undefined
                      }
                      active={
                        clinicId ===
                        clinic.id
                      }
                      onPress={() =>
                        setClinicId(
                          clinic.id,
                        )
                      }
                    />
                  ))}
                </PickerSection>
              )}

              <TouchableOpacity
                style={[
                  styles.saveButton,
                  scheduleAppointment.isPending &&
                    styles.disabledButton,
                ]}
                onPress={() =>
                  void submitAppointment()
                }
                disabled={
                  scheduleAppointment.isPending
                }
              >
                {scheduleAppointment.isPending ? (
                  <ActivityIndicator
                    color="#FFFFFF"
                  />
                ) : (
                  <>
                    <Ionicons
                      name="checkmark-circle-outline"
                      size={21}
                      color="#FFFFFF"
                    />

                    <Text
                      style={
                        styles.saveButtonText
                      }
                    >
                      Confirmar agendamento
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

function AgendaCard({
  item,
  busy,
  onCancel,
}: {
  item: AgendaItem;
  busy: boolean;
  onCancel: () => void;
}) {
  const warning =
    item.status === "OVERDUE";

  const today =
    item.status === "TODAY";

  const accent = warning
    ? "#DC2626"
    : today
      ? "#D97706"
      : "#0F766E";

  return (
    <View style={styles.agendaCard}>
      <View
        style={[
          styles.agendaAccent,
          {
            backgroundColor: accent,
          },
        ]}
      />

      <View
        style={[
          styles.dateBox,
          {
            backgroundColor: `${accent}12`,
          },
        ]}
      >
        <Text
          style={[
            styles.dateDay,
            { color: accent },
          ]}
        >
          {item.date.slice(8, 10)}
        </Text>

        <Text
          style={[
            styles.dateMonth,
            { color: accent },
          ]}
        >
          {new Date(
            `${item.date}T12:00:00`,
          )
            .toLocaleDateString("pt-BR", {
              month: "short",
            })
            .replace(".", "")
            .toUpperCase()}
        </Text>
      </View>

      <View style={styles.agendaContent}>
        <View style={styles.agendaTopRow}>
          <View
            style={[
              styles.statusPill,
              {
                backgroundColor: `${accent}12`,
              },
            ]}
          >
            <Text
              style={[
                styles.statusText,
                { color: accent },
              ]}
            >
              {statusLabel(item.status)}
            </Text>
          </View>

          <Ionicons
            name="medical-outline"
            size={19}
            color={accent}
          />
        </View>

        <Text style={styles.agendaTitle}>
          {item.title}
        </Text>

        <Text
          style={styles.agendaDescription}
        >
          {item.description}
        </Text>

        <View style={styles.metaWrap}>
          <View style={styles.metaItem}>
            <Ionicons
              name="time-outline"
              size={14}
              color="#64748B"
            />

            <Text style={styles.metaText}>
              {item.time ??
                "Horário a confirmar"}
            </Text>
          </View>

          {item.professional && (
            <View style={styles.metaItem}>
              <Ionicons
                name="person-outline"
                size={14}
                color="#64748B"
              />

              <Text style={styles.metaText}>
                {item.professional}
              </Text>
            </View>
          )}

          {item.clinic && (
            <View style={styles.metaItem}>
              <Ionicons
                name="business-outline"
                size={14}
                color="#64748B"
              />

              <Text style={styles.metaText}>
                {item.clinic}
              </Text>
            </View>
          )}
        </View>

        <TouchableOpacity
          disabled={busy}
          onPress={onCancel}
          style={styles.cardAction}
        >
          <Ionicons
            name="close-circle-outline"
            size={17}
            color="#B91C1C"
          />

          <Text
            style={[
              styles.cardActionText,
              styles.cancelText,
            ]}
          >
            Cancelar consulta
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

function EmptyPets({
  onAdd,
}: {
  onAdd: () => void;
}) {
  return (
    <View style={styles.emptyAgenda}>
      <View style={styles.emptyAgendaIcon}>
        <Ionicons
          name="paw-outline"
          size={40}
          color="#0F766E"
        />
      </View>

      <Text style={styles.emptyTitle}>
        Cadastre um pet primeiro
      </Text>

      <Text style={styles.emptyDescription}>
        A agenda é personalizada para cada
        animal.
      </Text>

      <TouchableOpacity
        style={styles.primaryButton}
        onPress={onAdd}
      >
        <Text
          style={styles.primaryButtonText}
        >
          Cadastrar pet
        </Text>
      </TouchableOpacity>
    </View>
  );
}

function FormInput({
  label,
  icon,
  multiline,
  ...props
}: {
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  multiline?: boolean;
} & React.ComponentProps<typeof TextInput>) {
  return (
    <View
      style={[
        styles.formField,
        multiline && styles.formFieldFull,
      ]}
    >
      <Text style={styles.inputLabel}>
        {label}
      </Text>

      <View
        style={[
          styles.inputBox,
          multiline &&
            styles.inputBoxMultiline,
        ]}
      >
        <Ionicons
          name={icon}
          size={18}
          color="#0F766E"
        />

        <TextInput
          {...props}
          multiline={multiline}
          style={[
            styles.input,
            multiline &&
              styles.inputMultiline,
          ]}
          placeholderTextColor="#94A3B8"
          autoComplete="off"
          importantForAutofill="no"
        />
      </View>
    </View>
  );
}

function PickerSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.pickerSection}>
      <Text style={styles.inputLabel}>
        {title}
      </Text>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={
          styles.choiceRow
        }
      >
        {children}
      </ScrollView>
    </View>
  );
}

function ChoiceChip({
  label,
  caption,
  active,
  onPress,
}: {
  label: string;
  caption?: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      style={[
        styles.choiceChip,
        active && styles.choiceChipActive,
      ]}
      onPress={onPress}
    >
      <Text
        style={[
          styles.choiceLabel,
          active &&
            styles.choiceLabelActive,
        ]}
      >
        {label}
      </Text>

      {caption && (
        <Text
          numberOfLines={1}
          style={[
            styles.choiceCaption,
            active &&
              styles.choiceCaptionActive,
          ]}
        >
          {caption}
        </Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5FAF9",
  },

  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F5FAF9",
  },

  loadingText: {
    marginTop: 12,
    color: "#475569",
    fontWeight: "700",
  },

  header: {
    paddingTop: 52,
    paddingBottom: 24,
    paddingHorizontal: 20,
    backgroundColor: "#0F766E",
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  headerEyebrow: {
    color: "#99F6E4",
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 1.5,
  },

  headerTitle: {
    marginTop: 2,
    color: "#FFFFFF",
    fontSize: 29,
    fontWeight: "900",
  },

  headerSubtitle: {
    marginTop: 3,
    color: "#CCFBF1",
    fontSize: 13,
    fontWeight: "600",
  },

  addButton: {
    width: 48,
    height: 48,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#14B8A6",
    elevation: 5,
  },

  disabledButton: {
    opacity: 0.55,
  },

  content: {
    padding: 18,
    paddingBottom: 42,
  },

  sectionLabel: {
    marginBottom: 9,
    color: "#64748B",
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 1.3,
  },

  petRow: {
    gap: 10,
    paddingRight: 12,
  },

  petChip: {
    minWidth: 132,
    padding: 10,
    paddingRight: 15,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#DCE9E7",
    backgroundColor: "#FFFFFF",
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
  },

  petChipActive: {
    borderColor: "#0F766E",
    backgroundColor: "#E6F7F4",
  },

  petAvatar: {
    width: 35,
    height: 35,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F1F5F4",
  },

  petAvatarActive: {
    backgroundColor: "#FFFFFF",
  },

  petName: {
    color: "#334155",
    fontSize: 14,
    fontWeight: "900",
  },

  petNameActive: {
    color: "#0F766E",
  },

  petSpecies: {
    marginTop: 1,
    color: "#94A3B8",
    fontSize: 10,
    fontWeight: "600",
  },

  petSpeciesActive: {
    color: "#0F766E",
  },

  summaryCard: {
    marginTop: 18,
    padding: 16,
    borderRadius: 22,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E0EFEC",
    flexDirection: "row",
    alignItems: "center",
  },

  summaryIcon: {
    width: 48,
    height: 48,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#DFF7F4",
  },

  summaryText: {
    flex: 1,
    marginLeft: 12,
  },

  summaryTitle: {
    color: "#0F172A",
    fontSize: 15,
    fontWeight: "900",
  },

  summarySubtitle: {
    marginTop: 3,
    color: "#64748B",
    fontSize: 12,
    fontWeight: "600",
  },

  countBadge: {
    minWidth: 35,
    height: 35,
    paddingHorizontal: 9,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#DFF7F4",
  },

  countBadgeWarning: {
    backgroundColor: "#FEE2E2",
  },

  countText: {
    color: "#0F766E",
    fontSize: 16,
    fontWeight: "900",
  },

  countTextWarning: {
    color: "#DC2626",
  },

  /* NOVO CARD DE CONTAGEM REGRESSIVA */
  countdownCard: {
    marginTop: 14,
    padding: 17,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "#BFE4DF",
    backgroundColor: "#F0FDFA",
  },

  countdownTop: {
    flexDirection: "row",
    alignItems: "center",
  },

  countdownBell: {
    width: 43,
    height: 43,
    borderRadius: 15,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
  },

  countdownHeading: {
    flex: 1,
    marginLeft: 11,
  },

  countdownEyebrow: {
    color: "#0F766E",
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 0.8,
  },

  countdownPet: {
    marginTop: 3,
    color: "#334155",
    fontSize: 12,
    fontWeight: "700",
  },

  countdownMain: {
    marginTop: 18,
  },

  countdownNumber: {
    color: "#0F766E",
    fontSize: 28,
    fontWeight: "900",
  },

  countdownNumberUrgent: {
    color: "#D97706",
  },

  countdownDate: {
    marginTop: 4,
    color: "#475569",
    fontSize: 13,
    fontWeight: "800",
  },

  countdownReason: {
    marginTop: 5,
    color: "#64748B",
    fontSize: 12,
    lineHeight: 18,
  },

  countdownDivider: {
    height: 1,
    marginVertical: 14,
    backgroundColor: "#CCECE7",
  },

  countdownFooter: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
  },

  countdownFooterText: {
    flex: 1,
    color: "#475569",
    fontSize: 11,
    lineHeight: 17,
    fontWeight: "600",
  },

  filterRow: {
    marginTop: 16,
    padding: 4,
    borderRadius: 16,
    backgroundColor: "#E8F1EF",
    flexDirection: "row",
  },

  filterButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 13,
    alignItems: "center",
  },

  filterButtonActive: {
    backgroundColor: "#FFFFFF",
  },

  filterText: {
    color: "#64748B",
    fontSize: 12,
    fontWeight: "800",
  },

  filterTextActive: {
    color: "#0F766E",
  },

  timeline: {
    marginTop: 16,
    gap: 12,
  },

  agendaCard: {
    overflow: "hidden",
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "#E2ECEA",
    backgroundColor: "#FFFFFF",
    flexDirection: "row",
  },

  agendaAccent: {
    width: 5,
  },

  dateBox: {
    width: 58,
    height: 62,
    margin: 13,
    marginRight: 3,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
  },

  dateDay: {
    fontSize: 21,
    fontWeight: "900",
  },

  dateMonth: {
    marginTop: -2,
    fontSize: 9,
    fontWeight: "900",
  },

  agendaContent: {
    flex: 1,
    padding: 14,
    paddingLeft: 10,
  },

  agendaTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  statusPill: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },

  statusText: {
    fontSize: 9,
    fontWeight: "900",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },

  agendaTitle: {
    marginTop: 8,
    color: "#0F172A",
    fontSize: 16,
    fontWeight: "900",
  },

  agendaDescription: {
    marginTop: 4,
    color: "#475569",
    fontSize: 12,
    lineHeight: 18,
  },

  metaWrap: {
    marginTop: 9,
    gap: 5,
  },

  metaItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },

  metaText: {
    flex: 1,
    color: "#64748B",
    fontSize: 11,
    fontWeight: "600",
  },

  cardAction: {
    alignSelf: "flex-start",
    marginTop: 11,
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },

  cardActionText: {
    color: "#0F766E",
    fontSize: 11,
    fontWeight: "800",
  },

  cancelText: {
    color: "#B91C1C",
  },

  emptyAgenda: {
    marginTop: 28,
    alignItems: "center",
    padding: 28,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "#DCEBE8",
    backgroundColor: "#FFFFFF",
  },

  emptyAgendaIcon: {
    width: 78,
    height: 78,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#DFF7F4",
  },

  emptyTitle: {
    marginTop: 16,
    color: "#0F172A",
    fontSize: 18,
    fontWeight: "900",
    textAlign: "center",
  },

  emptyDescription: {
    marginTop: 7,
    color: "#64748B",
    fontSize: 13,
    lineHeight: 20,
    textAlign: "center",
  },

  primaryButton: {
    marginTop: 18,
    minHeight: 47,
    paddingHorizontal: 20,
    borderRadius: 15,
    backgroundColor: "#0F766E",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
  },

  primaryButtonText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "900",
  },

  historyBanner: {
    marginTop: 18,
    padding: 14,
    borderRadius: 19,
    borderWidth: 1,
    borderColor: "#BFE4DF",
    backgroundColor: "#EDFAF8",
    flexDirection: "row",
    alignItems: "center",
  },

  historyIcon: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
  },

  historyText: {
    flex: 1,
    marginHorizontal: 11,
  },

  historyTitle: {
    color: "#134E4A",
    fontSize: 13,
    fontWeight: "900",
  },

  historySubtitle: {
    marginTop: 3,
    color: "#0F766E",
    fontSize: 11,
    lineHeight: 16,
  },

  modalBackdrop: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(15,23,42,0.45)",
  },

  modalCard: {
    maxHeight: "92%",
    padding: 20,
    paddingTop: 10,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    backgroundColor: "#FFFFFF",
  },

  modalHandle: {
    alignSelf: "center",
    width: 42,
    height: 5,
    borderRadius: 3,
    backgroundColor: "#CBD5E1",
    marginBottom: 15,
  },

  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 20,
  },

  modalTitle: {
    color: "#0F172A",
    fontSize: 22,
    fontWeight: "900",
  },

  modalSubtitle: {
    marginTop: 3,
    color: "#64748B",
    fontSize: 12,
  },

  closeButton: {
    width: 38,
    height: 38,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F1F5F9",
  },

  inputLabel: {
    marginBottom: 7,
    color: "#334155",
    fontSize: 12,
    fontWeight: "800",
  },

  typeRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 17,
  },

  typeOption: {
    flex: 1,
    minHeight: 66,
    padding: 8,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#DCE8E6",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F8FBFB",
  },

  typeOptionActive: {
    borderColor: "#0F766E",
    backgroundColor: "#0F766E",
  },

  typeText: {
    marginTop: 4,
    color: "#64748B",
    fontSize: 10,
    fontWeight: "800",
  },

  typeTextActive: {
    color: "#FFFFFF",
  },

  twoColumns: {
    flexDirection: "row",
    gap: 10,
  },

  formField: {
    flex: 1,
    marginBottom: 15,
  },

  formFieldFull: {
    flex: 0,
  },

  inputBox: {
    minHeight: 50,
    paddingHorizontal: 13,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: "#DCE8E6",
    backgroundColor: "#F8FBFB",
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },

  inputBoxMultiline: {
    minHeight: 82,
    alignItems: "flex-start",
    paddingTop: 14,
  },

  input: {
    flex: 1,
    color: "#0F172A",
    fontSize: 13,
  },

  inputMultiline: {
    minHeight: 58,
    textAlignVertical: "top",
  },

  pickerSection: {
    marginBottom: 15,
  },

  choiceRow: {
    gap: 8,
    paddingRight: 8,
  },

  choiceChip: {
    minWidth: 105,
    maxWidth: 160,
    minHeight: 54,
    paddingHorizontal: 13,
    paddingVertical: 9,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: "#DCE8E6",
    backgroundColor: "#F8FBFB",
    justifyContent: "center",
  },

  choiceChipActive: {
    borderColor: "#0F766E",
    backgroundColor: "#E6F7F4",
  },

  choiceLabel: {
    color: "#334155",
    fontSize: 12,
    fontWeight: "800",
  },

  choiceLabelActive: {
    color: "#0F766E",
  },

  choiceCaption: {
    marginTop: 2,
    color: "#94A3B8",
    fontSize: 9,
  },

  choiceCaptionActive: {
    color: "#0F766E",
  },

  saveButton: {
    minHeight: 53,
    marginTop: 3,
    marginBottom: 18,
    borderRadius: 17,
    backgroundColor: "#0F766E",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },

  saveButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "900",
  },
});