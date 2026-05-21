import React, { useCallback, useMemo, useState } from "react";
import {
  Alert,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect } from "@react-navigation/native";

const PETS_KEY = "@clyvocare_pets";
const HISTORICO_KEY = "@clyvocare_historico_pets";
const ALERTAS_RESOLVIDOS_KEY = "@clyvocare_alertas_resolvidos";

type Vacina = {
  nome: string;
  emDia: boolean;
};

type Pet = {
  id: string;
  nome: string;
  especie?: string;
  especieId?: string;
  raca?: string;
  idade?: string;
  peso?: string;
  unidadePeso?: "kg" | "g";
  vacinas?: Vacina[];
  observacoes?: string;
  situacaoVacinal?: string;
  castracao?: string;
};

type TipoHistorico = "consulta" | "vacina" | "exame" | "tratamento";

type HistoricoPet = {
  id: string;
  petId: string;
  tipo: TipoHistorico;
  titulo: string;
  descricao: string;
  data: string;
  scoreSaude: number;
};

type NivelAlerta = "baixo" | "medio" | "alto";

type AlertaIA = {
  id: string;
  petId: string;
  titulo: string;
  descricao: string;
  nivel: NivelAlerta;
  categoria: string;
  icone: keyof typeof MaterialCommunityIcons.glyphMap;
};

export default function IAScreen({ navigation }: any) {
  const [pets, setPets] = useState<Pet[]>([]);
  const [historico, setHistorico] = useState<HistoricoPet[]>([]);
  const [petSelecionadoId, setPetSelecionadoId] = useState<string | null>(null);
  const [alertasResolvidos, setAlertasResolvidos] = useState<string[]>([]);

  const carregarDados = useCallback(async () => {
    try {
      const petsSalvos = await AsyncStorage.getItem(PETS_KEY);
      const historicoSalvo = await AsyncStorage.getItem(HISTORICO_KEY);
      const resolvidosSalvos = await AsyncStorage.getItem(
        ALERTAS_RESOLVIDOS_KEY,
      );

      const listaPets: Pet[] = petsSalvos ? JSON.parse(petsSalvos) : [];
      const listaHistorico: HistoricoPet[] = historicoSalvo
        ? JSON.parse(historicoSalvo)
        : [];
      const listaResolvidos: string[] = resolvidosSalvos
        ? JSON.parse(resolvidosSalvos)
        : [];

      setPets(listaPets);
      setHistorico(listaHistorico);
      setAlertasResolvidos(listaResolvidos);

      if (listaPets.length > 0 && !petSelecionadoId) {
        setPetSelecionadoId(listaPets[0].id);
      }
    } catch {
      setPets([]);
      setHistorico([]);
      setAlertasResolvidos([]);
    }
  }, [petSelecionadoId]);

  useFocusEffect(
    useCallback(() => {
      carregarDados();
    }, [carregarDados]),
  );

  const petSelecionado = pets.find((pet) => pet.id === petSelecionadoId);

  const historicoDoPet = useMemo(() => {
    return historico.filter((item) => item.petId === petSelecionadoId);
  }, [historico, petSelecionadoId]);

  const alertasGerados = useMemo(() => {
    if (!petSelecionado) return [];

    return gerarAlertasInteligentes(petSelecionado, historicoDoPet);
  }, [petSelecionado, historicoDoPet]);

  const alertasAtivos = alertasGerados.filter(
    (alerta) => !alertasResolvidos.includes(alerta.id),
  );

  const alertasResolvidosDoPet = alertasGerados.filter((alerta) =>
    alertasResolvidos.includes(alerta.id),
  );

  const totalAlto = alertasAtivos.filter(
    (alerta) => alerta.nivel === "alto",
  ).length;
  const totalMedio = alertasAtivos.filter(
    (alerta) => alerta.nivel === "medio",
  ).length;
  const totalBaixo = alertasAtivos.filter(
    (alerta) => alerta.nivel === "baixo",
  ).length;

  async function resolverAlerta(alertaId: string) {
    const novaLista = [...alertasResolvidos, alertaId];

    try {
      await AsyncStorage.setItem(
        ALERTAS_RESOLVIDOS_KEY,
        JSON.stringify(novaLista),
      );

      setAlertasResolvidos(novaLista);
    } catch {
      Alert.alert("Erro", "Não foi possível marcar o alerta como resolvido.");
    }
  }

  async function limparAlertasResolvidos() {
    if (!petSelecionadoId) return;

    Alert.alert(
      "Restaurar alertas",
      "Deseja exibir novamente os alertas resolvidos deste pet?",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Restaurar",
          onPress: async () => {
            const novaLista = alertasResolvidos.filter(
              (id) => !id.startsWith(`${petSelecionadoId}-`),
            );

            await AsyncStorage.setItem(
              ALERTAS_RESOLVIDOS_KEY,
              JSON.stringify(novaLista),
            );

            setAlertasResolvidos(novaLista);
          },
        },
      ],
    );
  }

  return (
    <>
      <StatusBar barStyle="dark-content" backgroundColor="#F6FBFA" />

      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <View style={{ flex: 1 }}>
            <Text style={styles.pageTitle}>Alertas IA</Text>
            <Text style={styles.pageSubtitle}>
              Receba recomendações inteligentes com base no perfil, histórico e
              cuidados do pet.
            </Text>
          </View>

          <View style={styles.headerIcon}>
            <MaterialCommunityIcons
              name="robot-happy-outline"
              size={28}
              color="#00796B"
            />
          </View>
        </View>

        {pets.length === 0 ? (
          <View style={styles.emptyCard}>
            <MaterialCommunityIcons
              name="paw-outline"
              size={46}
              color="#00796B"
            />
            <Text style={styles.emptyTitle}>Nenhum pet cadastrado</Text>
            <Text style={styles.emptyText}>
              Cadastre um pet para a IA gerar alertas personalizados de saúde,
              vacinação e rotina.
            </Text>

            <TouchableOpacity
              style={styles.emptyButton}
              onPress={() => navigation.navigate("Cadastrar Pet")}
              activeOpacity={0.85}
            >
              <Text style={styles.emptyButtonText}>Cadastrar pet</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            <View style={styles.aiHeroCard}>
              <View style={styles.aiHeroTop}>
                <View style={styles.aiIconBox}>
                  <MaterialCommunityIcons
                    name="brain"
                    size={30}
                    color="#FFFFFF"
                  />
                </View>

                <View style={{ flex: 1 }}>
                  <Text style={styles.aiHeroLabel}>IA ClyvoCare</Text>
                  <Text style={styles.aiHeroTitle}>
                    Monitoramento inteligente
                  </Text>
                  <Text style={styles.aiHeroText}>
                    A IA analisa dados do pet e sugere cuidados preventivos.
                  </Text>
                </View>
              </View>
            </View>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.petTabs}
            >
              {pets.map((pet) => {
                const ativo = petSelecionadoId === pet.id;

                return (
                  <TouchableOpacity
                    key={pet.id}
                    style={[styles.petTab, ativo && styles.petTabActive]}
                    onPress={() => setPetSelecionadoId(pet.id)}
                    activeOpacity={0.85}
                  >
                    <MaterialCommunityIcons
                      name="paw"
                      size={15}
                      color={ativo ? "#FFFFFF" : "#00796B"}
                    />
                    <Text
                      style={[
                        styles.petTabText,
                        ativo && styles.petTabTextActive,
                      ]}
                    >
                      {pet.nome}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            <View style={styles.petCard}>
              <View style={styles.petIcon}>
                <MaterialCommunityIcons
                  name={getIconePet(petSelecionado?.especieId)}
                  size={30}
                  color="#00796B"
                />
              </View>

              <View style={{ flex: 1 }}>
                <Text style={styles.petLabel}>Análise de</Text>
                <Text style={styles.petName}>
                  {petSelecionado?.nome || "Pet"}
                </Text>
                <Text style={styles.petSub}>
                  {petSelecionado?.raca ||
                    petSelecionado?.especie ||
                    "Dados não informados"}
                </Text>
              </View>

              <View style={styles.petStatusBadge}>
                <Text style={styles.petStatusText}>
                  {alertasAtivos.length} alerta(s)
                </Text>
              </View>
            </View>

            <View style={styles.summaryGrid}>
              <RiskCard label="Alto" value={totalAlto} nivel="alto" />
              <RiskCard label="Médio" value={totalMedio} nivel="medio" />
              <RiskCard label="Baixo" value={totalBaixo} nivel="baixo" />
            </View>

            <View style={styles.sectionHeader}>
              <View>
                <Text style={styles.sectionTitle}>Alertas ativos</Text>
                <Text style={styles.sectionSubtitle}>
                  Recomendações geradas para {petSelecionado?.nome || "o pet"}
                </Text>
              </View>

              {alertasResolvidos.length > 0 && (
                <TouchableOpacity onPress={limparAlertasResolvidos}>
                  <Text style={styles.restoreText}>Restaurar</Text>
                </TouchableOpacity>
              )}
            </View>

            {alertasAtivos.length === 0 ? (
              <View style={styles.noAlertsCard}>
                <Ionicons name="checkmark-circle" size={42} color="#00796B" />
                <Text style={styles.noAlertsTitle}>Tudo certo por aqui</Text>
                <Text style={styles.noAlertsText}>
                  Não encontramos alertas ativos para este pet no momento.
                </Text>
              </View>
            ) : (
              alertasAtivos.map((alerta) => (
                <AlertaCard
                  key={alerta.id}
                  alerta={alerta}
                  onResolver={() => resolverAlerta(alerta.id)}
                />
              ))
            )}

            {alertasResolvidosDoPet.length > 0 && (
              <View style={styles.resolvedCard}>
                <Text style={styles.resolvedTitle}>Alertas resolvidos</Text>

                {alertasResolvidosDoPet.map((alerta) => (
                  <View key={alerta.id} style={styles.resolvedItem}>
                    <Ionicons
                      name="checkmark-circle"
                      size={18}
                      color="#00796B"
                    />
                    <Text style={styles.resolvedText}>{alerta.titulo}</Text>
                  </View>
                ))}
              </View>
            )}
          </>
        )}
      </ScrollView>
    </>
  );
}

function gerarAlertasInteligentes(
  pet: Pet,
  historicoDoPet: HistoricoPet[],
): AlertaIA[] {
  const alertas: AlertaIA[] = [];

  const petId = pet.id;
  const nome = pet.nome || "Seu pet";
  const observacoes = (pet.observacoes || "").toLowerCase();
  const idade = Number(pet.idade || 0);
  const vacinas = pet.vacinas || [];
  const vacinasPendentes = vacinas.filter((vacina) => !vacina.emDia);

  const consultas = historicoDoPet.filter((item) => item.tipo === "consulta");
  const vacinasHistorico = historicoDoPet.filter(
    (item) => item.tipo === "vacina",
  );
  const exames = historicoDoPet.filter((item) => item.tipo === "exame");

  const ultimoRegistro =
    historicoDoPet.length > 0
      ? historicoDoPet[historicoDoPet.length - 1]
      : null;

  if (vacinasPendentes.length > 0) {
    alertas.push({
      id: `${petId}-vacinas-pendentes`,
      petId,
      titulo: "Vacinas pendentes",
      descricao: `${nome} possui ${vacinasPendentes.length} vacina(s) marcada(s) como pendente(s). Verifique a carteirinha e atualize a proteção.`,
      nivel: "alto",
      categoria: "Vacinação",
      icone: "needle",
    });
  }

  if (pet.situacaoVacinal === "sem_carteirinha") {
    alertas.push({
      id: `${petId}-sem-carteirinha`,
      petId,
      titulo: "Carteirinha não cadastrada",
      descricao:
        "A IA identificou que a carteirinha de vacinação não está registrada. Isso pode dificultar o acompanhamento preventivo.",
      nivel: "medio",
      categoria: "Documentação",
      icone: "file-document-alert-outline",
    });
  }

  if (historicoDoPet.length === 0) {
    alertas.push({
      id: `${petId}-sem-historico`,
      petId,
      titulo: "Histórico ainda vazio",
      descricao:
        "Adicione consultas, exames, vacinas ou tratamentos para a IA acompanhar melhor a evolução da saúde do pet.",
      nivel: "baixo",
      categoria: "Histórico",
      icone: "clipboard-text-outline",
    });
  }

  if (consultas.length === 0) {
    alertas.push({
      id: `${petId}-sem-consulta`,
      petId,
      titulo: "Nenhuma consulta registrada",
      descricao:
        "Não há consultas salvas no histórico. Um check-up ajuda a prevenir problemas e manter os cuidados em dia.",
      nivel: "medio",
      categoria: "Consulta",
      icone: "stethoscope",
    });
  }

  if (exames.length === 0 && idade >= 7) {
    alertas.push({
      id: `${petId}-idoso-sem-exame`,
      petId,
      titulo: "Pet sênior sem exames",
      descricao:
        "Pets mais velhos precisam de acompanhamento preventivo. Considere registrar exames de rotina para acompanhar a saúde.",
      nivel: "alto",
      categoria: "Prevenção",
      icone: "heart-pulse",
    });
  }

  if (idade >= 8) {
    alertas.push({
      id: `${petId}-pet-senior`,
      petId,
      titulo: "Atenção para fase sênior",
      descricao:
        "Pela idade informada, a IA recomenda check-ups mais frequentes, atenção ao peso, mobilidade e comportamento.",
      nivel: "medio",
      categoria: "Fase de vida",
      icone: "calendar-heart",
    });
  }

  if (
    observacoes.includes("alergia") ||
    observacoes.includes("alérgico") ||
    observacoes.includes("alergico")
  ) {
    alertas.push({
      id: `${petId}-alergia`,
      petId,
      titulo: "Histórico de alergia",
      descricao:
        "Foi identificada menção a alergia nas observações. Evite mudanças bruscas de ração, medicamentos sem orientação e produtos desconhecidos.",
      nivel: "medio",
      categoria: "Alergia",
      icone: "alert-circle-outline",
    });
  }

  if (
    observacoes.includes("diabetes") ||
    observacoes.includes("renal") ||
    observacoes.includes("cardiaco") ||
    observacoes.includes("cardíaco") ||
    observacoes.includes("convuls")
  ) {
    alertas.push({
      id: `${petId}-condicao-clinica`,
      petId,
      titulo: "Condição clínica importante",
      descricao:
        "A IA encontrou uma condição sensível nas observações. Mantenha acompanhamento veterinário e registre tratamentos no histórico.",
      nivel: "alto",
      categoria: "Saúde",
      icone: "medical-bag",
    });
  }

  if (ultimoRegistro && ultimoRegistro.scoreSaude < 60) {
    alertas.push({
      id: `${petId}-score-baixo`,
      petId,
      titulo: "Evolução de saúde em atenção",
      descricao:
        "O último registro de saúde ficou abaixo de 60%. Acompanhe sinais clínicos e considere uma avaliação veterinária.",
      nivel: "alto",
      categoria: "Evolução",
      icone: "chart-line",
    });
  }

  if (historicoDoPet.length >= 2) {
    const ultimos = historicoDoPet.slice(-2);
    const anterior = ultimos[0].scoreSaude;
    const atual = ultimos[1].scoreSaude;

    if (atual < anterior - 15) {
      alertas.push({
        id: `${petId}-queda-score`,
        petId,
        titulo: "Queda na saúde detectada",
        descricao: `A pontuação de saúde caiu de ${anterior}% para ${atual}%. A IA recomenda observar comportamento, alimentação e sintomas.`,
        nivel: "alto",
        categoria: "Evolução",
        icone: "trending-down",
      });
    }
  }

  if (vacinasHistorico.length === 0 && vacinasPendentes.length === 0) {
    alertas.push({
      id: `${petId}-vacinas-nao-registradas`,
      petId,
      titulo: "Vacinas não registradas no histórico",
      descricao:
        "Mesmo que esteja tudo bem, registrar vacinas aplicadas ajuda a manter a linha do tempo de cuidados completa.",
      nivel: "baixo",
      categoria: "Organização",
      icone: "shield-check-outline",
    });
  }

  if (alertas.length === 0) {
    alertas.push({
      id: `${petId}-rotina-ok`,
      petId,
      titulo: "Rotina bem organizada",
      descricao:
        "A IA não identificou riscos importantes. Continue registrando consultas, vacinas e cuidados para manter o acompanhamento.",
      nivel: "baixo",
      categoria: "Rotina",
      icone: "check-decagram-outline",
    });
  }

  return alertas;
}

function AlertaCard({
  alerta,
  onResolver,
}: {
  alerta: AlertaIA;
  onResolver: () => void;
}) {
  const cor = getNivelColor(alerta.nivel);
  const bg = getNivelBg(alerta.nivel);

  return (
    <View style={[styles.alertCard, { borderColor: bg }]}>
      <View style={styles.alertTop}>
        <View style={[styles.alertIcon, { backgroundColor: bg }]}>
          <MaterialCommunityIcons name={alerta.icone} size={24} color={cor} />
        </View>

        <View style={{ flex: 1 }}>
          <View style={styles.alertMetaRow}>
            <Text style={[styles.alertLevel, { color: cor }]}>
              {getNivelLabel(alerta.nivel)}
            </Text>
            <Text style={styles.alertCategory}>{alerta.categoria}</Text>
          </View>

          <Text style={styles.alertTitle}>{alerta.titulo}</Text>
        </View>
      </View>

      <Text style={styles.alertDescription}>{alerta.descricao}</Text>

      <TouchableOpacity
        style={[styles.resolveButton, { backgroundColor: cor }]}
        onPress={onResolver}
        activeOpacity={0.85}
      >
        <Ionicons name="checkmark-circle-outline" size={18} color="#FFFFFF" />
        <Text style={styles.resolveButtonText}>Marcar como resolvido</Text>
      </TouchableOpacity>
    </View>
  );
}

function RiskCard({
  label,
  value,
  nivel,
}: {
  label: string;
  value: number;
  nivel: NivelAlerta;
}) {
  const cor = getNivelColor(nivel);
  const bg = getNivelBg(nivel);

  return (
    <View style={styles.riskCard}>
      <View style={[styles.riskIcon, { backgroundColor: bg }]}>
        <Ionicons name="alert-circle" size={20} color={cor} />
      </View>

      <Text style={styles.riskValue}>{value}</Text>
      <Text style={styles.riskLabel}>{label}</Text>
    </View>
  );
}

function getNivelLabel(nivel: NivelAlerta) {
  if (nivel === "alto") return "Risco alto";
  if (nivel === "medio") return "Risco médio";
  return "Risco baixo";
}

function getNivelColor(nivel: NivelAlerta) {
  if (nivel === "alto") return "#DC2626";
  if (nivel === "medio") return "#D97706";
  return "#00796B";
}

function getNivelBg(nivel: NivelAlerta) {
  if (nivel === "alto") return "#FEE2E2";
  if (nivel === "medio") return "#FEF3C7";
  return "#E0F5F2";
}

function getIconePet(
  especieId?: string,
): keyof typeof MaterialCommunityIcons.glyphMap {
  switch (especieId) {
    case "cachorro":
      return "dog";
    case "gato":
      return "cat";
    case "coelho":
      return "rabbit";
    case "cobra":
      return "snake";
    case "ave":
      return "bird";
    case "peixe":
      return "fish";
    case "tartaruga":
    case "jabuti":
      return "turtle";
    default:
      return "paw";
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F6FBFA",
  },

  content: {
    padding: 18,
    paddingBottom: 120,
  },

  header: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 14,
    marginTop: 16,
    marginBottom: 22,
  },

  pageTitle: {
    fontSize: 31,
    fontWeight: "900",
    color: "#00796B",
    letterSpacing: -0.8,
    lineHeight: 36,
  },

  pageSubtitle: {
    marginTop: 8,
    fontSize: 15,
    color: "#64748B",
    fontWeight: "800",
    lineHeight: 23,
  },

  headerIcon: {
    width: 54,
    height: 54,
    borderRadius: 22,
    backgroundColor: "#E0F5F2",
    alignItems: "center",
    justifyContent: "center",
  },

  emptyCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 28,
    padding: 24,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#D9F3EF",
  },

  emptyTitle: {
    marginTop: 12,
    fontSize: 20,
    fontWeight: "900",
    color: "#0F172A",
  },

  emptyText: {
    marginTop: 6,
    fontSize: 13,
    color: "#64748B",
    fontWeight: "700",
    textAlign: "center",
    lineHeight: 20,
  },

  emptyButton: {
    marginTop: 18,
    backgroundColor: "#00796B",
    paddingHorizontal: 20,
    paddingVertical: 13,
    borderRadius: 999,
  },

  emptyButtonText: {
    color: "#FFFFFF",
    fontWeight: "900",
    fontSize: 14,
  },

  aiHeroCard: {
    backgroundColor: "#00796B",
    borderRadius: 30,
    padding: 20,
    marginBottom: 14,
    overflow: "hidden",
  },

  aiHeroTop: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },

  aiIconBox: {
    width: 58,
    height: 58,
    borderRadius: 21,
    backgroundColor: "rgba(255,255,255,0.18)",
    alignItems: "center",
    justifyContent: "center",
  },

  aiHeroLabel: {
    color: "#CCFBF1",
    fontSize: 12,
    fontWeight: "900",
    textTransform: "uppercase",
  },

  aiHeroTitle: {
    marginTop: 2,
    color: "#FFFFFF",
    fontSize: 22,
    fontWeight: "900",
    letterSpacing: -0.5,
  },

  aiHeroText: {
    marginTop: 4,
    color: "#E0FFFA",
    fontSize: 13,
    fontWeight: "700",
    lineHeight: 19,
  },

  petTabs: {
    paddingVertical: 14,
    gap: 10,
  },

  petTab: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 18,
    paddingVertical: 11,
    borderRadius: 999,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#D9F3EF",
  },

  petTabActive: {
    backgroundColor: "#00796B",
    borderColor: "#00796B",
  },

  petTabText: {
    color: "#00796B",
    fontSize: 14,
    fontWeight: "900",
    textTransform: "lowercase",
  },

  petTabTextActive: {
    color: "#FFFFFF",
  },

  petCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 28,
    padding: 18,
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    borderWidth: 1,
    borderColor: "#D9F3EF",
    marginBottom: 16,
    shadowColor: "#00796B",
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 2,
  },

  petIcon: {
    width: 58,
    height: 58,
    borderRadius: 21,
    backgroundColor: "#E0F5F2",
    alignItems: "center",
    justifyContent: "center",
  },

  petLabel: {
    fontSize: 11,
    color: "#00796B",
    fontWeight: "900",
    textTransform: "uppercase",
  },

  petName: {
    marginTop: 1,
    fontSize: 22,
    fontWeight: "900",
    color: "#0F172A",
    textTransform: "lowercase",
  },

  petSub: {
    marginTop: 2,
    fontSize: 13,
    color: "#64748B",
    fontWeight: "800",
  },

  petStatusBadge: {
    backgroundColor: "#E0F5F2",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
  },

  petStatusText: {
    color: "#00796B",
    fontSize: 12,
    fontWeight: "900",
  },

  summaryGrid: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 18,
  },

  riskCard: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    borderRadius: 22,
    padding: 14,
    borderWidth: 1,
    borderColor: "#D9F3EF",
  },

  riskIcon: {
    width: 38,
    height: 38,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
  },

  riskValue: {
    fontSize: 22,
    fontWeight: "900",
    color: "#0F172A",
  },

  riskLabel: {
    marginTop: 2,
    fontSize: 11,
    color: "#64748B",
    fontWeight: "800",
  },

  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },

  sectionTitle: {
    fontSize: 20,
    fontWeight: "900",
    color: "#0F172A",
  },

  sectionSubtitle: {
    marginTop: 2,
    fontSize: 12,
    color: "#64748B",
    fontWeight: "700",
  },

  restoreText: {
    fontSize: 13,
    color: "#00796B",
    fontWeight: "900",
  },

  noAlertsCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 26,
    padding: 24,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#D9F3EF",
  },

  noAlertsTitle: {
    marginTop: 10,
    fontSize: 18,
    color: "#0F172A",
    fontWeight: "900",
  },

  noAlertsText: {
    marginTop: 5,
    fontSize: 13,
    color: "#64748B",
    fontWeight: "700",
    textAlign: "center",
    lineHeight: 20,
  },

  alertCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 26,
    padding: 18,
    borderWidth: 1.5,
    marginBottom: 14,
    shadowColor: "#00796B",
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },

  alertTop: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },

  alertIcon: {
    width: 52,
    height: 52,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
  },

  alertMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },

  alertLevel: {
    fontSize: 11,
    fontWeight: "900",
    textTransform: "uppercase",
  },

  alertCategory: {
    fontSize: 11,
    color: "#94A3B8",
    fontWeight: "900",
    textTransform: "uppercase",
  },

  alertTitle: {
    marginTop: 3,
    fontSize: 17,
    fontWeight: "900",
    color: "#0F172A",
  },

  alertDescription: {
    marginTop: 12,
    fontSize: 13,
    color: "#64748B",
    fontWeight: "700",
    lineHeight: 20,
  },

  resolveButton: {
    marginTop: 16,
    borderRadius: 18,
    paddingVertical: 13,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 7,
  },

  resolveButtonText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "900",
  },

  resolvedCard: {
    marginTop: 4,
    backgroundColor: "#FFFFFF",
    borderRadius: 26,
    padding: 18,
    borderWidth: 1,
    borderColor: "#D9F3EF",
  },

  resolvedTitle: {
    fontSize: 18,
    fontWeight: "900",
    color: "#0F172A",
    marginBottom: 12,
  },

  resolvedItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 8,
  },

  resolvedText: {
    flex: 1,
    color: "#64748B",
    fontSize: 13,
    fontWeight: "700",
  },
});
