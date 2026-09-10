import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator, KeyboardAvoidingView, Platform, RefreshControl,
  ScrollView, StatusBar, StyleSheet, Text, TextInput, TouchableOpacity, View,
} from "react-native";
import {
  useAppointments, useExams, useLocalHistory, useReminders,
  useTreatments, useVaccinations,
} from "../hooks/useClinical";
import { useOwnerProfile } from "../hooks/useOwnerProfile";
import { usePets } from "../hooks/usePets";
import { CareInsight, analyzePetCare, answerCareQuestion } from "../utils/aiInsights";

const QUICK_QUESTIONS = [
  "As vacinas estão em dia?",
  "Qual é a próxima consulta?",
  "Existe algum cuidado atrasado?",
  "Há tratamento ativo?",
];

export default function AlertScreen({ navigation }: any) {
  const { data: owner, isLoading: ownerLoading } = useOwnerProfile();
  const { data: pets = [], isLoading: petsLoading, refetch: refetchPets } = usePets(owner?.id);
  const [selectedPetId, setSelectedPetId] = useState<number>();
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState<string | null>(null);
  const [expandedInsight, setExpandedInsight] = useState<string | null>(null);

  useEffect(() => {
    if (!pets.length) return setSelectedPetId(undefined);
    if (!pets.some((pet) => pet.id === selectedPetId)) setSelectedPetId(pets[0].id);
  }, [pets, selectedPetId]);

  useEffect(() => {
    setAnswer(null);
    setQuestion("");
  }, [selectedPetId]);

  const appointments = useAppointments(selectedPetId);
  const vaccinations = useVaccinations(selectedPetId);
  const exams = useExams(selectedPetId);
  const treatments = useTreatments(selectedPetId);
  const reminders = useReminders();
  const localHistory = useLocalHistory(selectedPetId);
  const selectedPet = pets.find((pet) => pet.id === selectedPetId);

  const careData = useMemo(() => selectedPet ? {
    pet: selectedPet,
    appointments: appointments.data ?? [],
    vaccinations: vaccinations.data ?? [],
    exams: exams.data ?? [],
    treatments: treatments.data ?? [],
    reminders: (reminders.data ?? []).filter((item) => item.petId === selectedPet.id),
    localHistory: localHistory.data ?? [],
  } : null, [selectedPet, appointments.data, vaccinations.data, exams.data, treatments.data, reminders.data, localHistory.data]);

  const analysis = useMemo(() => careData ? analyzePetCare(careData) : null, [careData]);
  const queries = [appointments, vaccinations, exams, treatments, reminders, localHistory];
  const isLoading = ownerLoading || petsLoading || (Boolean(selectedPetId) && queries.some((query) => query.isLoading));
  const isRefreshing = queries.some((query) => query.isRefetching);

  async function refresh() {
    await Promise.all([refetchPets(), ...queries.map((query) => query.refetch())]);
  }

  function ask(text = question) {
    if (!text.trim() || !analysis || !careData) return;
    setQuestion(text);
    setAnswer(answerCareQuestion(text, analysis, careData));
  }

  function openInsightAction(insight: CareInsight) {
    const action = insight.action.toLocaleLowerCase("pt-BR");
    navigation.navigate(action.includes("agenda") || action.includes("compromisso") ? "Agenda" : "Histórico");
  }

  if (isLoading) return <View style={styles.center}><ActivityIndicator size="large" color="#0F766E" /><Text style={styles.loadingText}>A Clyvo IA está analisando...</Text></View>;

  return <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === "ios" ? "padding" : undefined}>
    <StatusBar barStyle="light-content" backgroundColor="#092F2D" />
    <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false} refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={() => void refresh()} colors={["#0F766E"]} />} keyboardShouldPersistTaps="handled">
      <LinearGradient colors={["#092F2D", "#0F766E", "#14B8A6"]} style={styles.hero}>
        <View style={styles.heroGlowOne} /><View style={styles.heroGlowTwo} />
        <View style={styles.heroTop}><View style={styles.aiBadge}><Ionicons name="sparkles" size={14} color="#99F6E4" /><Text style={styles.aiBadgeText}>IA EXPLICÁVEL</Text></View><View style={styles.liveBadge}><View style={styles.liveDot} /><Text style={styles.liveText}>dados atuais</Text></View></View>
        <Text style={styles.heroTitle}>Clyvo IA</Text><Text style={styles.heroSubtitle}>Um copiloto preventivo que transforma o histórico do seu pet em cuidados claros e priorizados.</Text>
      </LinearGradient>

      {!pets.length ? <View style={styles.emptyCard}><View style={styles.emptyIcon}><Ionicons name="sparkles-outline" size={40} color="#0F766E" /></View><Text style={styles.emptyTitle}>A IA precisa conhecer seu pet</Text><Text style={styles.emptyText}>Cadastre o primeiro animal para receber uma análise personalizada.</Text><TouchableOpacity style={styles.primaryButton} onPress={() => navigation.navigate("Cadastrar Pet")}><Text style={styles.primaryButtonText}>Cadastrar pet</Text></TouchableOpacity></View> : <>
        <View style={styles.section}><Text style={styles.sectionLabel}>ANALISAR PET</Text><ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.petRow}>{pets.map((pet) => { const active = pet.id === selectedPetId; return <TouchableOpacity key={pet.id} style={[styles.petChip, active && styles.petChipActive]} onPress={() => setSelectedPetId(pet.id)}><View style={[styles.petAvatar, active && styles.petAvatarActive]}><Ionicons name="paw" size={17} color={active ? "#0F766E" : "#64748B"} /></View><View><Text style={[styles.petName, active && styles.petNameActive]}>{pet.name}</Text><Text style={styles.petSpecies}>{pet.speciesName}</Text></View></TouchableOpacity>; })}</ScrollView></View>

        {analysis && <>
          <View style={styles.scoreCard}>
            <View style={[styles.scoreCircle, analysis.level === "ATENCAO" && styles.scoreCircleHigh, analysis.level === "ACOMPANHAR" && styles.scoreCircleMedium]}><Text style={styles.scoreValue}>{analysis.score}</Text><Text style={styles.scoreOf}>/100</Text></View>
            <View style={styles.scoreContent}><View style={styles.scoreTop}><Text style={styles.scoreTitle}>Índice de organização</Text><View style={styles.explainBadge}><Ionicons name="bulb-outline" size={12} color="#7C3AED" /><Text style={styles.explainText}>explicável</Text></View></View><Text style={styles.scoreSummary}>{analysis.summary}</Text><Text style={styles.scoreFacts}>{analysis.factsAnalyzed} fatos do histórico analisados para {selectedPet?.name}</Text></View>
          </View>

          <View style={styles.safetyCard}><Ionicons name="shield-checkmark-outline" size={21} color="#0F766E" /><View style={styles.safetyText}><Text style={styles.safetyTitle}>Apoio preventivo, não diagnóstico</Text><Text style={styles.safetySubtitle}>Cada sugestão mostra quais dados foram considerados. Decisões clínicas continuam com o veterinário.</Text></View></View>

          <View style={styles.sectionHeader}><View><Text style={styles.sectionTitle}>Prioridades inteligentes</Text><Text style={styles.sectionSubtitle}>Ordenadas pelo que merece atenção primeiro</Text></View><View style={styles.insightCount}><Text style={styles.insightCountText}>{analysis.insights.length}</Text></View></View>

          <View style={styles.insights}>{analysis.insights.map((insight) => <InsightCard key={insight.id} insight={insight} expanded={expandedInsight === insight.id} onExpand={() => setExpandedInsight((current) => current === insight.id ? null : insight.id)} onAction={() => openInsightAction(insight)} />)}</View>

          <View style={styles.assistantCard}>
            <View style={styles.assistantHeader}><View style={styles.botAvatar}><Ionicons name="sparkles" size={23} color="#FFFFFF" /></View><View><Text style={styles.assistantTitle}>Pergunte à Clyvo</Text><Text style={styles.assistantSubtitle}>Respostas baseadas apenas nos dados de {selectedPet?.name}</Text></View></View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.questionsRow}>{QUICK_QUESTIONS.map((item) => <TouchableOpacity key={item} style={styles.questionChip} onPress={() => ask(item)}><Text style={styles.questionText}>{item}</Text></TouchableOpacity>)}</ScrollView>
            {answer && <View style={styles.answerBox}><View style={styles.answerIcon}><Ionicons name="sparkles" size={16} color="#0F766E" /></View><Text style={styles.answerText}>{answer}</Text></View>}
            <View style={styles.askRow}><TextInput style={styles.askInput} value={question} onChangeText={setQuestion} onSubmitEditing={() => ask()} placeholder="Pergunte sobre vacina, consulta..." placeholderTextColor="#94A3B8" returnKeyType="send" autoComplete="off" importantForAutofill="no" /><TouchableOpacity style={[styles.sendButton, !question.trim() && styles.sendDisabled]} onPress={() => ask()} disabled={!question.trim()}><Ionicons name="arrow-up" size={20} color="#FFFFFF" /></TouchableOpacity></View>
          </View>

          <View style={styles.methodCard}><View style={styles.methodTop}><Ionicons name="analytics-outline" size={20} color="#475569" /><Text style={styles.methodTitle}>Como esta análise foi criada?</Text></View><Text style={styles.methodText}>O protótipo combina cadastro, consultas, vacinas, exames, tratamentos, lembretes e informações fornecidas pelo tutor. As regras são auditáveis e não usam dados de outros usuários.</Text></View>
        </>}
      </>}
    </ScrollView>
  </KeyboardAvoidingView>;
}

function InsightCard({ insight, expanded, onExpand, onAction }: { insight: CareInsight; expanded: boolean; onExpand: () => void; onAction: () => void }) {
  const color = insight.priority === "HIGH" ? "#DC2626" : insight.priority === "MEDIUM" ? "#D97706" : "#0F766E";
  const label = insight.priority === "HIGH" ? "Prioridade alta" : insight.priority === "MEDIUM" ? "Acompanhar" : "Preventivo";
  return <View style={styles.insightCard}><View style={[styles.insightIcon, { backgroundColor: `${color}12` }]}><Ionicons name={insight.icon} size={23} color={color} /></View><View style={styles.insightBody}><View style={styles.insightTop}><View style={[styles.priorityPill, { backgroundColor: `${color}12` }]}><Text style={[styles.priorityText, { color }]}>{label}</Text></View><TouchableOpacity onPress={onExpand}><Ionicons name={expanded ? "chevron-up" : "information-circle-outline"} size={20} color="#64748B" /></TouchableOpacity></View><Text style={styles.insightTitle}>{insight.title}</Text><Text style={styles.insightMessage}>{insight.message}</Text>{expanded && <View style={styles.evidenceBox}><Text style={styles.evidenceLabel}>POR QUE A IA SUGERIU ISSO?</Text><Text style={styles.evidenceText}>{insight.evidence}</Text></View>}<TouchableOpacity style={styles.insightAction} onPress={onAction}><Text style={[styles.insightActionText, { color }]}>{insight.action}</Text><Ionicons name="arrow-forward" size={15} color={color} /></TouchableOpacity></View></View>;
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F4F9F8" }, content: { paddingBottom: 44 }, center: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: "#F4F9F8" }, loadingText: { marginTop: 12, color: "#475569", fontWeight: "700" },
  hero: { paddingTop: 52, paddingHorizontal: 20, paddingBottom: 30, borderBottomLeftRadius: 31, borderBottomRightRadius: 31, overflow: "hidden" }, heroGlowOne: { position: "absolute", width: 150, height: 150, borderRadius: 75, right: -45, top: -30, backgroundColor: "rgba(153,246,228,0.13)" }, heroGlowTwo: { position: "absolute", width: 90, height: 90, borderRadius: 45, right: 75, bottom: -45, backgroundColor: "rgba(255,255,255,0.08)" }, heroTop: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" }, aiBadge: { paddingHorizontal: 9, paddingVertical: 6, borderRadius: 9, backgroundColor: "rgba(4,47,46,0.45)", flexDirection: "row", alignItems: "center", gap: 5 }, aiBadgeText: { color: "#CCFBF1", fontSize: 9, fontWeight: "900", letterSpacing: 1 }, liveBadge: { flexDirection: "row", alignItems: "center", gap: 5 }, liveDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: "#A7F3D0" }, liveText: { color: "#CCFBF1", fontSize: 9, fontWeight: "700" }, heroTitle: { marginTop: 18, color: "#FFFFFF", fontSize: 31, fontWeight: "900" }, heroSubtitle: { marginTop: 8, maxWidth: 315, color: "#CCFBF1", fontSize: 13, lineHeight: 20, fontWeight: "600" },
  section: { marginTop: 20, paddingHorizontal: 18 }, sectionLabel: { marginBottom: 9, color: "#64748B", fontSize: 10, fontWeight: "900", letterSpacing: 1.3 }, petRow: { gap: 10, paddingRight: 12 }, petChip: { minWidth: 132, padding: 10, paddingRight: 15, borderRadius: 18, borderWidth: 1, borderColor: "#DCE9E7", backgroundColor: "#FFFFFF", flexDirection: "row", alignItems: "center", gap: 9 }, petChipActive: { borderColor: "#0F766E", backgroundColor: "#E6F7F4" }, petAvatar: { width: 35, height: 35, borderRadius: 13, alignItems: "center", justifyContent: "center", backgroundColor: "#F1F5F4" }, petAvatarActive: { backgroundColor: "#FFFFFF" }, petName: { color: "#334155", fontSize: 14, fontWeight: "900" }, petNameActive: { color: "#0F766E" }, petSpecies: { marginTop: 1, color: "#94A3B8", fontSize: 10, fontWeight: "600" },
  scoreCard: { marginHorizontal: 18, marginTop: 17, padding: 17, borderRadius: 23, backgroundColor: "#FFFFFF", borderWidth: 1, borderColor: "#DDEAE8", flexDirection: "row", alignItems: "center" }, scoreCircle: { width: 78, height: 78, borderRadius: 39, borderWidth: 7, borderColor: "#14B8A6", backgroundColor: "#ECFDF5", alignItems: "center", justifyContent: "center" }, scoreCircleMedium: { borderColor: "#F59E0B", backgroundColor: "#FFFBEB" }, scoreCircleHigh: { borderColor: "#EF4444", backgroundColor: "#FEF2F2" }, scoreValue: { color: "#0F172A", fontSize: 25, fontWeight: "900" }, scoreOf: { marginTop: -4, color: "#64748B", fontSize: 9, fontWeight: "800" }, scoreContent: { flex: 1, marginLeft: 15 }, scoreTop: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" }, scoreTitle: { color: "#0F172A", fontSize: 14, fontWeight: "900" }, explainBadge: { paddingHorizontal: 7, paddingVertical: 4, borderRadius: 8, backgroundColor: "#F3E8FF", flexDirection: "row", alignItems: "center", gap: 3 }, explainText: { color: "#7C3AED", fontSize: 8, fontWeight: "900" }, scoreSummary: { marginTop: 5, color: "#475569", fontSize: 11, lineHeight: 16 }, scoreFacts: { marginTop: 7, color: "#0F766E", fontSize: 9, fontWeight: "800" },
  safetyCard: { marginHorizontal: 18, marginTop: 12, padding: 13, borderRadius: 17, backgroundColor: "#E9F8F5", flexDirection: "row", alignItems: "flex-start", gap: 9 }, safetyText: { flex: 1 }, safetyTitle: { color: "#134E4A", fontSize: 11, fontWeight: "900" }, safetySubtitle: { marginTop: 3, color: "#0F766E", fontSize: 9, lineHeight: 14 }, sectionHeader: { marginHorizontal: 18, marginTop: 23, marginBottom: 11, flexDirection: "row", alignItems: "center", justifyContent: "space-between" }, sectionTitle: { color: "#0F172A", fontSize: 18, fontWeight: "900" }, sectionSubtitle: { marginTop: 3, color: "#64748B", fontSize: 10 }, insightCount: { width: 31, height: 31, borderRadius: 11, alignItems: "center", justifyContent: "center", backgroundColor: "#DFF7F4" }, insightCountText: { color: "#0F766E", fontSize: 13, fontWeight: "900" }, insights: { paddingHorizontal: 18, gap: 11 },
  insightCard: { padding: 15, borderRadius: 21, borderWidth: 1, borderColor: "#DEEAE8", backgroundColor: "#FFFFFF", flexDirection: "row", alignItems: "flex-start" }, insightIcon: { width: 44, height: 44, borderRadius: 15, alignItems: "center", justifyContent: "center" }, insightBody: { flex: 1, marginLeft: 12 }, insightTop: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" }, priorityPill: { paddingHorizontal: 7, paddingVertical: 4, borderRadius: 7 }, priorityText: { fontSize: 8, fontWeight: "900", textTransform: "uppercase", letterSpacing: 0.4 }, insightTitle: { marginTop: 8, color: "#0F172A", fontSize: 14, fontWeight: "900" }, insightMessage: { marginTop: 4, color: "#64748B", fontSize: 10, lineHeight: 16 }, evidenceBox: { marginTop: 9, padding: 9, borderRadius: 11, backgroundColor: "#F8FAFC" }, evidenceLabel: { color: "#7C3AED", fontSize: 7, fontWeight: "900", letterSpacing: 0.6 }, evidenceText: { marginTop: 4, color: "#475569", fontSize: 9, lineHeight: 14 }, insightAction: { marginTop: 10, flexDirection: "row", alignItems: "center", gap: 5 }, insightActionText: { fontSize: 10, fontWeight: "900" },
  assistantCard: { marginHorizontal: 18, marginTop: 22, padding: 17, borderRadius: 24, backgroundColor: "#FFFFFF", borderWidth: 1, borderColor: "#DDEAE8" }, assistantHeader: { flexDirection: "row", alignItems: "center" }, botAvatar: { width: 46, height: 46, borderRadius: 16, alignItems: "center", justifyContent: "center", backgroundColor: "#0F766E" }, assistantTitle: { marginLeft: 11, color: "#0F172A", fontSize: 16, fontWeight: "900" }, assistantSubtitle: { marginLeft: 11, marginTop: 2, color: "#64748B", fontSize: 9 }, questionsRow: { gap: 7, marginTop: 15, paddingRight: 8 }, questionChip: { paddingHorizontal: 12, paddingVertical: 9, borderRadius: 12, backgroundColor: "#EDF8F6" }, questionText: { color: "#0F766E", fontSize: 9, fontWeight: "800" }, answerBox: { marginTop: 13, padding: 12, borderRadius: 15, backgroundColor: "#F0FDFA", flexDirection: "row", alignItems: "flex-start", gap: 8 }, answerIcon: { width: 27, height: 27, borderRadius: 10, alignItems: "center", justifyContent: "center", backgroundColor: "#FFFFFF" }, answerText: { flex: 1, color: "#134E4A", fontSize: 11, lineHeight: 17 }, askRow: { marginTop: 13, minHeight: 48, paddingLeft: 13, paddingRight: 5, borderRadius: 16, borderWidth: 1, borderColor: "#DCE8E6", backgroundColor: "#F8FBFB", flexDirection: "row", alignItems: "center" }, askInput: { flex: 1, color: "#0F172A", fontSize: 11 }, sendButton: { width: 38, height: 38, borderRadius: 13, alignItems: "center", justifyContent: "center", backgroundColor: "#0F766E" }, sendDisabled: { opacity: 0.4 },
  methodCard: { marginHorizontal: 18, marginTop: 13, padding: 15, borderRadius: 19, borderWidth: 1, borderColor: "#E2E8F0", backgroundColor: "#F8FAFC" }, methodTop: { flexDirection: "row", alignItems: "center", gap: 7 }, methodTitle: { color: "#334155", fontSize: 11, fontWeight: "900" }, methodText: { marginTop: 7, color: "#64748B", fontSize: 9, lineHeight: 15 },
  emptyCard: { margin: 18, padding: 30, borderRadius: 25, borderWidth: 1, borderColor: "#DCEBE8", backgroundColor: "#FFFFFF", alignItems: "center" }, emptyIcon: { width: 80, height: 80, borderRadius: 28, backgroundColor: "#DFF7F4", alignItems: "center", justifyContent: "center" }, emptyTitle: { marginTop: 17, color: "#0F172A", fontSize: 18, fontWeight: "900", textAlign: "center" }, emptyText: { marginTop: 7, color: "#64748B", fontSize: 12, lineHeight: 19, textAlign: "center" }, primaryButton: { marginTop: 18, minHeight: 47, paddingHorizontal: 20, borderRadius: 15, backgroundColor: "#0F766E", alignItems: "center", justifyContent: "center" }, primaryButtonText: { color: "#FFFFFF", fontSize: 13, fontWeight: "900" },
});
