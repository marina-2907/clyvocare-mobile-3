import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import React from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from "react-native";

type EmptyHomeProps = {
  ownerName?: string;
  onAddPet: () => void;
  onOpenAgenda: () => void;
  onOpenHistory: () => void;
  onOpenAi: () => void;
  onOpenPlans: () => void;
};

const BENEFITS = [
  {
    key: "agenda",
    icon: "calendar-outline" as const,
    title: "Agenda",
    text: "Consultas e lembretes",
    color: "#0F766E",
    background: "#E6F7F4",
  },
  {
    key: "history",
    icon: "document-text-outline" as const,
    title: "Histórico",
    text: "Saúde em um só lugar",
    color: "#7C3AED",
    background: "#F3E8FF",
  },
  {
    key: "ai",
    icon: "sparkles-outline" as const,
    title: "Clyvo IA",
    text: "Cuidados mais claros",
    color: "#2563EB",
    background: "#EFF6FF",
  },
];

const PLANS = [
  {
    name: "Básico",
    description: "Rotina essencial",
    icon: "leaf-outline" as const,
    color: "#0F766E",
    background: "#E6F7F4",
  },
  {
    name: "Pro",
    description: "IA e alertas",
    icon: "sparkles" as const,
    color: "#7C3AED",
    background: "#F3E8FF",
    featured: true,
  },
  {
    name: "Premium",
    description: "Cuidado completo",
    icon: "diamond-outline" as const,
    color: "#D97706",
    background: "#FFF7ED",
  },
];

function firstName(name?: string) {
  return name?.trim().split(/\s+/)[0] || "Tutor";
}

export default function EmptyHome({
  ownerName,
  onAddPet,
  onOpenAgenda,
  onOpenHistory,
  onOpenAi,
  onOpenPlans,
}: EmptyHomeProps) {
  const { width } = useWindowDimensions();
  const wide = width >= 700;

  const benefitActions = {
    agenda: onOpenAgenda,
    history: onOpenHistory,
    ai: onOpenAi,
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={["#FFFFFF", "#F0FDFA", "#E3F7F3"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.welcomeCard, wide && styles.welcomeCardWide]}
      >
        <View pointerEvents="none" style={styles.decorCircleLarge} />
        <View pointerEvents="none" style={styles.decorCircleSmall} />

        <View
          style={[
            styles.welcomeContent,
            wide && styles.welcomeContentWide,
          ]}
        >
          <View style={styles.stepBadge}>
            <Ionicons
              name="checkmark-circle"
              size={14}
              color="#0F766E"
            />
            <Text style={styles.stepText}>PRIMEIRO CADASTRO</Text>
          </View>

          <Text style={styles.title}>
            Tudo começa com um cadastro simples
          </Text>

          <Text style={styles.description}>
            {firstName(ownerName)}, crie o perfil do seu pet para
            organizar agenda, histórico e cuidados em um único lugar.
          </Text>

          <View style={styles.registrationInfo}>
            <View style={styles.infoItem}>
              <Ionicons
                name="time-outline"
                size={14}
                color="#0F766E"
              />
              <Text style={styles.infoText}>
                Leva cerca de 2 minutos
              </Text>
            </View>

            <View style={styles.infoItem}>
              <Ionicons
                name="shield-checkmark-outline"
                size={14}
                color="#0F766E"
              />
              <Text style={styles.infoText}>Dados protegidos</Text>
            </View>
          </View>

          <TouchableOpacity
            style={styles.primaryButton}
            onPress={onAddPet}
            activeOpacity={0.88}
          >
            <View style={styles.buttonIcon}>
              <Ionicons name="add" size={18} color="#0F766E" />
            </View>

            <View style={styles.buttonContent}>
              <Text style={styles.primaryButtonText}>
                Cadastrar meu primeiro pet
              </Text>
              <Text style={styles.primaryButtonHint}>
                Começar agora
              </Text>
            </View>

            <Ionicons
              name="arrow-forward"
              size={18}
              color="#CCFBF1"
            />
          </TouchableOpacity>
        </View>

        {wide && (
          <View style={styles.registrationPanel}>
            <View style={styles.panelTop}>
              <Text style={styles.panelEyebrow}>ETAPA 1 DE 3</Text>

              <View style={styles.panelStatus}>
                <View style={styles.panelStatusDot} />
                <Text style={styles.panelStatusText}>
                  PRONTO PARA COMEÇAR
                </Text>
              </View>
            </View>

            <Text style={styles.panelNumber}>01</Text>
            <Text style={styles.panelTitle}>Perfil do pet</Text>

            <Text style={styles.panelDescription}>
              Nome, espécie, nascimento e informações essenciais para
              personalizar a experiência.
            </Text>

            <View style={styles.panelProgress}>
              <View style={styles.panelProgressActive} />
              <View style={styles.panelProgressIdle} />
              <View style={styles.panelProgressIdle} />
            </View>
          </View>
        )}
      </LinearGradient>

      <View style={styles.progressCard}>
        <View style={styles.progressItem}>
          <View style={[styles.progressCircle, styles.progressDone]}>
            <Ionicons name="checkmark" size={15} color="#FFFFFF" />
          </View>
          <Text style={styles.progressDoneText}>Conta criada</Text>
        </View>

        <View style={styles.progressLine} />

        <View style={styles.progressItem}>
          <View
            style={[styles.progressCircle, styles.progressCurrent]}
          >
            <Text style={styles.progressNumber}>2</Text>
          </View>
          <Text style={styles.progressCurrentText}>
            Cadastrar pet
          </Text>
        </View>

        <View style={styles.progressLine} />

        <View style={styles.progressItem}>
          <View style={styles.progressCircle}>
            <Text style={styles.progressIdleNumber}>3</Text>
          </View>
          <Text style={styles.progressIdleText}>
            Organizar cuidados
          </Text>
        </View>
      </View>

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>
          Tudo pronto para vocês
        </Text>
        <Text style={styles.sectionSubtitle}>
          Explore enquanto prepara o cadastro
        </Text>
      </View>

      <View
        style={[
          styles.benefitsList,
          wide && styles.benefitsListWide,
        ]}
      >
        {BENEFITS.map((item) => (
          <TouchableOpacity
            key={item.key}
            style={[
              styles.benefitCard,
              wide && styles.benefitCardWide,
            ]}
            onPress={
              benefitActions[
                item.key as keyof typeof benefitActions
              ]
            }
            activeOpacity={0.8}
          >
            <View
              style={[
                styles.benefitIcon,
                { backgroundColor: item.background },
              ]}
            >
              <Ionicons
                name={item.icon}
                size={22}
                color={item.color}
              />
            </View>

            <View style={styles.benefitContent}>
              <Text style={styles.benefitTitle}>
                {item.title}
              </Text>
              <Text style={styles.benefitText}>
                {item.text}
              </Text>
            </View>

            <Ionicons
              name="chevron-forward"
              size={17}
              color="#94A3B8"
            />
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.plansHeader}>
        <View>
          <Text style={styles.sectionTitle}>
            Um plano para cada cuidado
          </Text>
          <Text style={styles.sectionSubtitle}>
            Básico, Pro ou Premium — você escolhe
          </Text>
        </View>

        <TouchableOpacity
          onPress={onOpenPlans}
          activeOpacity={0.7}
        >
          <Text style={styles.seePlans}>Comparar</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.plansList}
      >
        {PLANS.map((plan) => (
          <TouchableOpacity
            key={plan.name}
            style={[
              styles.planCard,
              plan.featured && styles.featuredPlanCard,
            ]}
            onPress={onOpenPlans}
            activeOpacity={0.82}
          >
            {plan.featured && (
              <View style={styles.featuredBadge}>
                <Text style={styles.featuredBadgeText}>
                  MAIS ESCOLHIDO
                </Text>
              </View>
            )}

            <View
              style={[
                styles.planIcon,
                { backgroundColor: plan.background },
              ]}
            >
              <Ionicons
                name={plan.icon}
                size={20}
                color={plan.color}
              />
            </View>

            <Text style={styles.planName}>{plan.name}</Text>
            <Text style={styles.planDescription}>
              {plan.description}
            </Text>

            <View style={styles.planLinkRow}>
              <Text
                style={[
                  styles.planLink,
                  { color: plan.color },
                ]}
              >
                Conhecer
              </Text>
              <Ionicons
                name="arrow-forward"
                size={14}
                color={plan.color}
              />
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <View style={styles.securityCard}>
        <View style={styles.securityIcon}>
          <Ionicons
            name="shield-checkmark-outline"
            size={20}
            color="#0F766E"
          />
        </View>

        <View style={styles.securityContent}>
          <Text style={styles.securityTitle}>
            Seus dados, sua tranquilidade
          </Text>
          <Text style={styles.securityText}>
            Informações vinculadas ao seu perfil e sincronizadas com
            segurança.
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingTop: 18,
    paddingBottom: 28,
  },

  welcomeCard: {
    marginHorizontal: 18,
    minHeight: 250,
    overflow: "hidden",
    padding: 22,
    borderRadius: 28,
    borderWidth: 1,
    borderColor: "#C8E4DF",
    shadowColor: "#0F766E",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.08,
    shadowRadius: 22,
    elevation: 3,
  },

  welcomeCardWide: {
    minHeight: 285,
    padding: 28,
    flexDirection: "row",
    alignItems: "stretch",
    gap: 24,
  },

  decorCircleLarge: {
    position: "absolute",
    width: 230,
    height: 230,
    borderRadius: 115,
    right: -85,
    top: -95,
    backgroundColor: "rgba(20,184,166,0.09)",
  },

  decorCircleSmall: {
    position: "absolute",
    width: 84,
    height: 84,
    borderRadius: 42,
    right: 105,
    bottom: -44,
    backgroundColor: "rgba(15,118,110,0.06)",
  },

  welcomeContent: {
    zIndex: 2,
  },

  welcomeContentWide: {
    flex: 1,
    justifyContent: "center",
  },

  stepBadge: {
    alignSelf: "flex-start",
    paddingHorizontal: 9,
    paddingVertical: 6,
    borderRadius: 9,
    backgroundColor: "#DFF7F4",
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },

  stepText: {
    color: "#0F766E",
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 0.8,
  },

  title: {
    marginTop: 15,
    maxWidth: 520,
    color: "#0F172A",
    fontSize: 22,
    lineHeight: 28,
    fontWeight: "900",
  },

  description: {
    marginTop: 8,
    maxWidth: 540,
    color: "#526175",
    fontSize: 12,
    lineHeight: 18,
  },

  registrationInfo: {
    marginTop: 15,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },

  infoItem: {
    paddingHorizontal: 9,
    paddingVertical: 7,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#D3ECE7",
    backgroundColor: "rgba(255,255,255,0.72)",
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },

  infoText: {
    color: "#47615E",
    fontSize: 9,
    fontWeight: "800",
  },

  primaryButton: {
    alignSelf: "flex-start",
    minHeight: 49,
    minWidth: 250,
    marginTop: 18,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 16,
    backgroundColor: "#0F766E",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
    shadowColor: "#0F766E",
    shadowOffset: { width: 0, height: 7 },
    shadowOpacity: 0.18,
    shadowRadius: 12,
    elevation: 4,
  },

  buttonIcon: {
    width: 33,
    height: 33,
    borderRadius: 11,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
  },

  buttonContent: {
    flex: 1,
    marginLeft: 2,
  },

  primaryButtonText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "900",
  },

  primaryButtonHint: {
    marginTop: 2,
    color: "#99F6E4",
    fontSize: 8,
    fontWeight: "700",
  },

  registrationPanel: {
    zIndex: 2,
    width: "34%",
    minWidth: 245,
    padding: 20,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "rgba(15,118,110,0.13)",
    backgroundColor: "rgba(255,255,255,0.80)",
    shadowColor: "#0F766E",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 18,
    elevation: 2,
  },

  panelTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },

  panelEyebrow: {
    color: "#64748B",
    fontSize: 8,
    fontWeight: "900",
    letterSpacing: 0.8,
  },

  panelStatus: {
    paddingHorizontal: 7,
    paddingVertical: 5,
    borderRadius: 8,
    backgroundColor: "#E6F7F4",
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },

  panelStatusDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: "#14B8A6",
  },

  panelStatusText: {
    color: "#0F766E",
    fontSize: 6,
    fontWeight: "900",
  },

  panelNumber: {
    marginTop: 22,
    color: "#B7E1DA",
    fontSize: 45,
    lineHeight: 48,
    fontWeight: "900",
  },

  panelTitle: {
    marginTop: 2,
    color: "#0F172A",
    fontSize: 17,
    fontWeight: "900",
  },

  panelDescription: {
    marginTop: 7,
    color: "#64748B",
    fontSize: 9,
    lineHeight: 14,
  },

  panelProgress: {
    marginTop: "auto",
    paddingTop: 18,
    flexDirection: "row",
    gap: 6,
  },

  panelProgressActive: {
    flex: 1.7,
    height: 5,
    borderRadius: 3,
    backgroundColor: "#0F766E",
  },

  panelProgressIdle: {
    flex: 1,
    height: 5,
    borderRadius: 3,
    backgroundColor: "#DDE9E7",
  },

  progressCard: {
    marginHorizontal: 18,
    marginTop: 11,
    paddingHorizontal: 15,
    paddingVertical: 13,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#E0ECEA",
    backgroundColor: "#FFFFFF",
    flexDirection: "row",
    alignItems: "center",
  },

  progressItem: {
    flex: 1,
    alignItems: "center",
    gap: 5,
  },

  progressCircle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 1,
    borderColor: "#CBD5E1",
    backgroundColor: "#F8FAFC",
    alignItems: "center",
    justifyContent: "center",
  },

  progressDone: {
    borderColor: "#0F766E",
    backgroundColor: "#0F766E",
  },

  progressCurrent: {
    borderWidth: 2,
    borderColor: "#14B8A6",
    backgroundColor: "#E6F7F4",
  },

  progressNumber: {
    color: "#0F766E",
    fontSize: 10,
    fontWeight: "900",
  },

  progressIdleNumber: {
    color: "#94A3B8",
    fontSize: 10,
    fontWeight: "900",
  },

  progressDoneText: {
    color: "#0F766E",
    fontSize: 8,
    fontWeight: "800",
    textAlign: "center",
  },

  progressCurrentText: {
    color: "#0F172A",
    fontSize: 8,
    fontWeight: "900",
    textAlign: "center",
  },

  progressIdleText: {
    color: "#94A3B8",
    fontSize: 8,
    fontWeight: "700",
    textAlign: "center",
  },

  progressLine: {
    width: 22,
    height: 1,
    marginTop: -15,
    backgroundColor: "#DCE8E6",
  },

  sectionHeader: {
    marginHorizontal: 18,
    marginTop: 23,
  },

  sectionTitle: {
    color: "#0F172A",
    fontSize: 17,
    fontWeight: "900",
  },

  sectionSubtitle: {
    marginTop: 3,
    color: "#64748B",
    fontSize: 10,
  },

  benefitsList: {
    marginHorizontal: 18,
    marginTop: 11,
    gap: 9,
  },

  benefitsListWide: {
    flexDirection: "row",
  },

  benefitCard: {
    minHeight: 72,
    padding: 12,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#DFECEA",
    backgroundColor: "#FFFFFF",
    flexDirection: "row",
    alignItems: "center",
  },

  benefitCardWide: {
    flex: 1,
  },

  benefitIcon: {
    width: 43,
    height: 43,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },

  benefitContent: {
    flex: 1,
    marginLeft: 11,
  },

  benefitTitle: {
    color: "#172033",
    fontSize: 12,
    fontWeight: "900",
  },

  benefitText: {
    marginTop: 3,
    color: "#728096",
    fontSize: 9,
    lineHeight: 14,
  },

  plansHeader: {
    marginHorizontal: 18,
    marginTop: 24,
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
  },

  seePlans: {
    color: "#0F766E",
    fontSize: 10,
    fontWeight: "900",
  },

  plansList: {
    paddingHorizontal: 18,
    paddingTop: 12,
    paddingBottom: 3,
    gap: 9,
  },

  planCard: {
    width: 145,
    minHeight: 151,
    padding: 13,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#DFEAE8",
    backgroundColor: "#FFFFFF",
  },

  featuredPlanCard: {
    borderColor: "#C4B5FD",
    backgroundColor: "#FCFAFF",
  },

  featuredBadge: {
    position: "absolute",
    top: 10,
    right: 9,
    paddingHorizontal: 6,
    paddingVertical: 4,
    borderRadius: 7,
    backgroundColor: "#7C3AED",
  },

  featuredBadgeText: {
    color: "#FFFFFF",
    fontSize: 6,
    fontWeight: "900",
    letterSpacing: 0.45,
  },

  planIcon: {
    width: 38,
    height: 38,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
  },

  planName: {
    marginTop: 10,
    color: "#0F172A",
    fontSize: 13,
    fontWeight: "900",
  },

  planDescription: {
    marginTop: 3,
    color: "#64748B",
    fontSize: 9,
  },

  planLinkRow: {
    marginTop: "auto",
    paddingTop: 11,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },

  planLink: {
    fontSize: 9,
    fontWeight: "900",
  },

  securityCard: {
    marginHorizontal: 18,
    marginTop: 18,
    padding: 13,
    borderRadius: 18,
    backgroundColor: "#EAF7F5",
    flexDirection: "row",
    alignItems: "center",
  },

  securityIcon: {
    width: 40,
    height: 40,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#CDE7E2",
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
  },

  securityContent: {
    flex: 1,
    marginLeft: 10,
  },

  securityTitle: {
    color: "#24413D",
    fontSize: 10,
    fontWeight: "900",
  },

  securityText: {
    marginTop: 3,
    color: "#5D716E",
    fontSize: 9,
    lineHeight: 14,
  },
});