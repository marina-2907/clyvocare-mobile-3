import React, { useCallback, useState } from "react";
import {
  ScrollView,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  FlatList,
} from "react-native";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect } from "@react-navigation/native";

const PETS_KEY = "@clyvocare_pets";

type EventType = "Vacina" | "Consulta" | "Tratamento" | "Exame" | "Castração";

type EventStatus =
  | "Hoje"
  | "Atrasado"
  | "Pendente"
  | "Agendado"
  | "Concluído"
  | "Recorrente"
  | "Sugerido";

type SituacaoVacinal =
  | "com_carteirinha"
  | "sem_carteirinha"
  | "historico_desconhecido"
  | "resgatado";

type Castracao = "castrado" | "nao_castrado" | "nao_sei";

type Pet = {
  id: string;
  nome: string;
  especie?: string;
  especieId?: string;
  raca?: string;
  idade?: string;
  peso?: string;
  foto?: string | null;
  carteiraVacina?: string | null;
  situacaoVacinal?: SituacaoVacinal;
  castracao?: Castracao;
  observacoes?: string;
  vacinas?: {
    nome: string;
    emDia: boolean;
  }[];
};

type Event = {
  id: string;
  title: string;
  pet: string;
  date: string;
  hour: string;
  status: EventStatus;
  type: EventType;
  place: string;
  priority: "Alta" | "Média" | "Baixa";
  note: string;
};

function getIconePet(especieId?: string) {
  switch (especieId) {
    case "cachorro": return "dog";
    case "gato": return "cat";
    case "coelho": return "rabbit";
    case "cobra": return "snake";
    case "lagarto": return "bug";
    case "ave": return "bird";
    case "peixe": return "fish";
    case "tartaruga":
    case "jabuti": return "turtle";
    case "porco":
    case "miniporco": return "pig";
    case "vaca": return "cow";
    case "cabra": return "sheep";
    case "hamster":
    case "porquinho":
    case "rato":
    case "chinchila": return "rodent";
    default: return "paw";
  }
}

export default function ScheduleScreen() {
  const [filter, setFilter] = useState<"Todos" | EventType>("Todos");
  const [petSelecionado, setPetSelecionado] = useState<Pet | null>(null);
  const [todosPets, setTodosPets] = useState<Pet[]>([]);
  const [modalPets, setModalPets] = useState(false);

  useFocusEffect(
    useCallback(() => {
      async function carregarPets() {
        try {
          const stored = await AsyncStorage.getItem(PETS_KEY);
          const lista: Pet[] = stored ? JSON.parse(stored) : [];

          setTodosPets(lista);

          // Mantém o pet selecionado se ainda existir, senão pega o último
          setPetSelecionado((atual) => {
            if (atual) {
              const aindaExiste = lista.find((p) => p.id === atual.id);
              if (aindaExiste) return aindaExiste;
            }
            return lista.length > 0 ? lista[lista.length - 1] : null;
          });
        } catch {
          setTodosPets([]);
          setPetSelecionado(null);
        }
      }

      carregarPets();
    }, [])
  );

  function permiteCastracao(pet: Pet) {
    return pet.especieId === "cachorro" || pet.especieId === "gato";
  }

  function gerarEventosDoPet(pet: Pet): Event[] {
    const eventos: Event[] = [];
    const nomePet = pet.nome || "Pet";

    const situacaoVacinal = pet.situacaoVacinal || "historico_desconhecido";
    const castracao = pet.castracao || "nao_sei";
    const vacinas = pet.vacinas || [];
    const observacoes = pet.observacoes || "";

    if (situacaoVacinal === "resgatado") {
      eventos.push({
        id: `${pet.id}-consulta-resgate`,
        title: "Consulta inicial de resgate",
        pet: nomePet,
        date: "O quanto antes",
        hour: "--:--",
        status: "Sugerido",
        type: "Consulta",
        place: "Clínica veterinária",
        priority: "Alta",
        note: "Pet resgatado recentemente. Avaliar estado geral, pele, peso, hidratação, pulgas, carrapatos e possíveis doenças.",
      });

      eventos.push({
        id: `${pet.id}-exames-resgate`,
        title: "Exames iniciais",
        pet: nomePet,
        date: "Após consulta",
        hour: "--:--",
        status: "Sugerido",
        type: "Exame",
        place: "Laboratório veterinário",
        priority: "Alta",
        note: "Indicado para pets resgatados ou sem histórico completo de saúde.",
      });

      eventos.push({
        id: `${pet.id}-vermifugo-resgate`,
        title: "Vermífugo e antipulgas",
        pet: nomePet,
        date: "Após orientação",
        hour: "--:--",
        status: "Pendente",
        type: "Tratamento",
        place: "Clínica ou em casa",
        priority: "Alta",
        note: "Verificar necessidade de vermífugo, antipulgas e controle de parasitas com orientação veterinária.",
      });
    }

    if (
      situacaoVacinal === "resgatado" ||
      situacaoVacinal === "historico_desconhecido" ||
      situacaoVacinal === "sem_carteirinha"
    ) {
      eventos.push({
        id: `${pet.id}-revisao-vacinal`,
        title: "Revisão de vacinação",
        pet: nomePet,
        date: "Após avaliação",
        hour: "--:--",
        status: "Pendente",
        type: "Vacina",
        place: "Clínica veterinária",
        priority: "Alta",
        note: "Histórico vacinal incompleto ou desconhecido. O veterinário deve orientar o calendário correto.",
      });
    }

    if (situacaoVacinal === "com_carteirinha") {
      const vacinasPendentes = vacinas.filter((v) => !v.emDia);

      if (vacinasPendentes.length > 0) {
        vacinasPendentes.forEach((vacina, index) => {
          eventos.push({
            id: `${pet.id}-vacina-${index}`,
            title: vacina.nome,
            pet: nomePet,
            date: "Agendar reforço",
            hour: "--:--",
            status: "Pendente",
            type: "Vacina",
            place: "Clínica veterinária",
            priority: "Média",
            note: `A vacina ou cuidado "${vacina.nome}" ainda não foi marcado como em dia.`,
          });
        });
      } else {
        eventos.push({
          id: `${pet.id}-checkup-preventivo`,
          title: "Check-up preventivo",
          pet: nomePet,
          date: "Próximo mês",
          hour: "--:--",
          status: "Sugerido",
          type: "Consulta",
          place: "Clínica veterinária",
          priority: "Baixa",
          note: "Pet com vacinas em dia. Manter acompanhamento preventivo.",
        });
      }
    }

    if (permiteCastracao(pet)) {
      if (castracao === "nao_castrado") {
        eventos.push({
          id: `${pet.id}-avaliar-castracao`,
          title: "Avaliar castração",
          pet: nomePet,
          date: "Próxima consulta",
          hour: "--:--",
          status: "Sugerido",
          type: "Castração",
          place: "Clínica veterinária",
          priority: "Média",
          note: "Tutor informou que o pet não é castrado. Veterinário pode orientar riscos, benefícios e momento adequado.",
        });
      }

      if (castracao === "nao_sei") {
        eventos.push({
          id: `${pet.id}-verificar-castracao`,
          title: "Verificar se é castrado",
          pet: nomePet,
          date: "Na consulta",
          hour: "--:--",
          status: "Sugerido",
          type: "Castração",
          place: "Clínica veterinária",
          priority: "Média",
          note: "Tutor não sabe se o pet é castrado. Recomendado verificar durante avaliação veterinária.",
        });
      }
    }

    if (observacoes.trim()) {
      eventos.push({
        id: `${pet.id}-historico-saude`,
        title: "Revisar histórico de saúde",
        pet: nomePet,
        date: "Na próxima consulta",
        hour: "--:--",
        status: "Sugerido",
        type: "Consulta",
        place: "Clínica veterinária",
        priority: "Média",
        note: observacoes,
      });
    }

    return eventos;
  }

  const events: Event[] = petSelecionado ? gerarEventosDoPet(petSelecionado) : [];

  const filteredEvents =
    filter === "Todos" ? events : events.filter((event) => event.type === filter);

  const pendentes = events.filter((e) => e.status === "Pendente").length;
  const sugeridos = events.filter((e) => e.status === "Sugerido").length;
  const altaPrioridade = events.filter((e) => e.priority === "Alta").length;

  const proximo = events[0];

  function getTypeIcon(type: EventType) {
    if (type === "Vacina") return "needle";
    if (type === "Consulta") return "stethoscope";
    if (type === "Tratamento") return "pill";
    if (type === "Castração") return "heart-pulse";
    return "test-tube";
  }

  function getTypeColor(type: EventType) {
    if (type === "Vacina") return "#0F766E";
    if (type === "Consulta") return "#2563EB";
    if (type === "Tratamento") return "#9333EA";
    if (type === "Castração") return "#DB2777";
    return "#EA580C";
  }

  function getStatusStyle(status: EventStatus) {
    if (status === "Atrasado") return { bg: "#FEE2E2", color: "#DC2626" };
    if (status === "Pendente") return { bg: "#FEF3C7", color: "#D97706" };
    if (status === "Concluído") return { bg: "#DCFCE7", color: "#166534" };
    if (status === "Hoje") return { bg: "#DBEAFE", color: "#1D4ED8" };
    if (status === "Sugerido") return { bg: "#FCE7F3", color: "#BE185D" };
    return { bg: "#E0F2FE", color: "#0369A1" };
  }

  function getPriorityColor(priority: "Alta" | "Média" | "Baixa") {
    if (priority === "Alta") return "#EF4444";
    if (priority === "Média") return "#F59E0B";
    return "#22C55E";
  }

  const filters: ("Todos" | EventType)[] = [
    "Todos",
    "Vacina",
    "Consulta",
    "Exame",
    "Tratamento",
  ];

  if (petSelecionado && permiteCastracao(petSelecionado)) {
    filters.push("Castração");
  }

  return (
    <>
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>Agenda do Pet</Text>
            <Text style={styles.subtitle}>
              Veja os cuidados sugeridos para cada pet cadastrado.
            </Text>
          </View>

          <View style={styles.calendarIcon}>
            <Ionicons name="calendar-outline" size={26} color="#0F766E" />
          </View>
        </View>

        {/* Seletor de pet */}
        <TouchableOpacity
          style={styles.petSelectorCard}
          onPress={() => todosPets.length > 0 && setModalPets(true)}
          activeOpacity={0.85}
        >
          <View style={styles.petSelectorLeft}>
            <View style={styles.petSelectorIconBox}>
              <MaterialCommunityIcons
                name={getIconePet(petSelecionado?.especieId) as any}
                size={26}
                color="#0F766E"
              />
            </View>

            <View style={{ flex: 1 }}>
              <Text style={styles.petSelectorLabel}>Agenda de</Text>
              <Text style={styles.petSelectorNome}>
                {petSelecionado ? petSelecionado.nome : "Nenhum pet cadastrado"}
              </Text>
              <Text style={styles.petSelectorSub}>
                {petSelecionado
                  ? petSelecionado.raca || petSelecionado.especie || "Dados não informados"
                  : "Cadastre um pet para gerar recomendações"}
              </Text>
            </View>
          </View>

          {todosPets.length > 1 && (
            <View style={styles.petSelectorBadge}>
              <Text style={styles.petSelectorBadgeText}>
                {todosPets.length} pets
              </Text>
              <Ionicons name="chevron-down" size={15} color="#0F766E" />
            </View>
          )}
        </TouchableOpacity>

        {/* Pills dos pets (atalho rápido quando tem poucos) */}
        {todosPets.length > 1 && todosPets.length <= 5 && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.petPillsScroll}
          >
            {todosPets.map((pet) => (
              <TouchableOpacity
                key={pet.id}
                style={[
                  styles.petPill,
                  petSelecionado?.id === pet.id && styles.petPillActive,
                ]}
                onPress={() => {
                  setPetSelecionado(pet);
                  setFilter("Todos");
                }}
                activeOpacity={0.85}
              >
                <MaterialCommunityIcons
                  name={getIconePet(pet.especieId) as any}
                  size={15}
                  color={petSelecionado?.id === pet.id ? "#FFFFFF" : "#0F766E"}
                />
                <Text
                  style={[
                    styles.petPillText,
                    petSelecionado?.id === pet.id && styles.petPillTextActive,
                  ]}
                >
                  {pet.nome}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}

        <View style={styles.summaryCard}>
          <View style={styles.summaryTop}>
            <View style={{ flex: 1 }}>
              <Text style={styles.summaryLabel}>Próximo cuidado sugerido</Text>
              <Text style={styles.summaryTitle}>
                {proximo ? proximo.title : "Nenhum evento"}
              </Text>
              <Text style={styles.summaryInfo}>
                {proximo
                  ? `${proximo.pet} • ${proximo.date}`
                  : "Cadastre um pet para gerar a agenda"}
              </Text>
            </View>

            <View style={styles.summaryBadge}>
              <Text style={styles.summaryBadgeText}>
                {proximo ? proximo.priority : "--"}
              </Text>
            </View>
          </View>

          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{pendentes}</Text>
              <Text style={styles.statLabel}>Pendentes</Text>
            </View>

            <View style={styles.statDivider} />

            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{sugeridos}</Text>
              <Text style={styles.statLabel}>Sugeridos</Text>
            </View>

            <View style={styles.statDivider} />

            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{altaPrioridade}</Text>
              <Text style={styles.statLabel}>Alta prioridade</Text>
            </View>
          </View>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.filtersScroll}
        >
          {filters.map((item) => (
            <TouchableOpacity
              key={item}
              style={[styles.filterButton, filter === item && styles.filterActive]}
              onPress={() => setFilter(item)}
              activeOpacity={0.85}
            >
              <Text
                style={[
                  styles.filterText,
                  filter === item && styles.filterTextActive,
                ]}
              >
                {item}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Compromissos inteligentes</Text>
          <Text style={styles.sectionCount}>{filteredEvents.length} eventos</Text>
        </View>

        {filteredEvents.length === 0 && (
          <View style={styles.emptyBox}>
            <Ionicons name="paw-outline" size={34} color="#0F766E" />
            <Text style={styles.emptyTitle}>Nenhum evento gerado ainda</Text>
            <Text style={styles.emptyText}>
              Cadastre um pet e preencha situação vacinal, castração e histórico de
              saúde para a agenda criar recomendações automáticas.
            </Text>
          </View>
        )}

        {filteredEvents.map((event) => {
          const statusStyle = getStatusStyle(event.status);
          const typeColor = getTypeColor(event.type);

          return (
            <View key={event.id} style={styles.card}>
              <View style={styles.cardTop}>
                <View style={[styles.iconBox, { backgroundColor: `${typeColor}18` }]}>
                  <MaterialCommunityIcons
                    name={getTypeIcon(event.type) as any}
                    size={27}
                    color={typeColor}
                  />
                </View>

                <View style={styles.cardContent}>
                  <Text style={[styles.type, { color: typeColor }]}>
                    {event.type}
                  </Text>
                  <Text style={styles.eventTitle}>{event.title}</Text>
                  <Text style={styles.petInfo}>
                    {event.pet} • {event.date} às {event.hour}
                  </Text>
                </View>

                <View style={[styles.statusBox, { backgroundColor: statusStyle.bg }]}>
                  <Text style={[styles.statusText, { color: statusStyle.color }]}>
                    {event.status}
                  </Text>
                </View>
              </View>

              <View style={styles.cardBottom}>
                <View style={styles.infoLine}>
                  <Ionicons name="location-outline" size={15} color="#64748B" />
                  <Text style={styles.infoText}>{event.place}</Text>
                </View>

                <View style={styles.infoLine}>
                  <Ionicons name="document-text-outline" size={15} color="#64748B" />
                  <Text style={styles.infoText}>{event.note}</Text>
                </View>
              </View>

              <View style={styles.priorityRow}>
                <View
                  style={[
                    styles.priorityDot,
                    { backgroundColor: getPriorityColor(event.priority) },
                  ]}
                />
                <Text style={styles.priorityText}>
                  Prioridade {event.priority.toLowerCase()}
                </Text>
              </View>
            </View>
          );
        })}

        <View style={styles.aiBox}>
          <View style={styles.aiIcon}>
            <Ionicons name="sparkles-outline" size={24} color="#0F766E" />
          </View>

          <View style={{ flex: 1 }}>
            <Text style={styles.aiTitle}>Agenda inteligente ClyvoCare</Text>
            <Text style={styles.aiText}>
              Selecione qualquer pet cadastrado para ver os cuidados recomendados.
              Para cães e gatos, castração também é considerada.
            </Text>
          </View>
        </View>

        <View style={styles.tipBox}>
          <Text style={styles.tipTitle}>Como funciona</Text>
          <Text style={styles.tipText}>
            Toque no card do pet no topo ou nas pílulas de atalho para alternar entre
            os seus pets e ver a agenda personalizada de cada um.
          </Text>
        </View>
      </ScrollView>

      {/* Modal de seleção de pet */}
      <Modal visible={modalPets} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Escolher pet</Text>
              <TouchableOpacity onPress={() => setModalPets(false)}>
                <Ionicons name="close" size={25} color="#64748B" />
              </TouchableOpacity>
            </View>

            <FlatList
              data={todosPets}
              keyExtractor={(item) => item.id}
              showsVerticalScrollIndicator={false}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.modalItem,
                    petSelecionado?.id === item.id && styles.modalItemActive,
                  ]}
                  onPress={() => {
                    setPetSelecionado(item);
                    setFilter("Todos");
                    setModalPets(false);
                  }}
                  activeOpacity={0.85}
                >
                  <View style={[
                    styles.modalItemIcon,
                    petSelecionado?.id === item.id && styles.modalItemIconActive,
                  ]}>
                    <MaterialCommunityIcons
                      name={getIconePet(item.especieId) as any}
                      size={22}
                      color={petSelecionado?.id === item.id ? "#FFFFFF" : "#0F766E"}
                    />
                  </View>

                  <View style={{ flex: 1 }}>
                    <Text style={[
                      styles.modalItemNome,
                      petSelecionado?.id === item.id && styles.modalItemNomeActive,
                    ]}>
                      {item.nome}
                    </Text>
                    <Text style={styles.modalItemSub}>
                      {item.raca || item.especie || "Dados não informados"}
                    </Text>
                  </View>

                  {petSelecionado?.id === item.id && (
                    <Ionicons name="checkmark-circle" size={22} color="#0F766E" />
                  )}
                </TouchableOpacity>
              )}
            />
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F3FAFA",
    paddingHorizontal: 20,
  },

  header: {
    marginTop: 55,
    marginBottom: 20,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },

  title: {
    fontSize: 31,
    fontWeight: "900",
    color: "#0F766E",
    letterSpacing: -0.8,
  },

  subtitle: {
    color: "#64748B",
    marginTop: 7,
    lineHeight: 21,
    fontWeight: "600",
    width: 270,
  },

  calendarIcon: {
    width: 52,
    height: 52,
    borderRadius: 20,
    backgroundColor: "#E0F5F2",
    alignItems: "center",
    justifyContent: "center",
  },

  petSelectorCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 22,
    padding: 16,
    marginBottom: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
    borderColor: "#E2F8F5",
    shadowColor: "#0F766E",
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 2,
  },

  petSelectorLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },

  petSelectorIconBox: {
    width: 50,
    height: 50,
    borderRadius: 17,
    backgroundColor: "#E0F5F2",
    alignItems: "center",
    justifyContent: "center",
  },

  petSelectorLabel: {
    fontSize: 11,
    color: "#0F766E",
    fontWeight: "900",
    textTransform: "uppercase",
  },

  petSelectorNome: {
    fontSize: 19,
    fontWeight: "900",
    color: "#0F172A",
    marginTop: 1,
  },

  petSelectorSub: {
    fontSize: 12,
    color: "#64748B",
    fontWeight: "700",
    marginTop: 2,
  },

  petSelectorBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#E0F5F2",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 14,
  },

  petSelectorBadgeText: {
    color: "#0F766E",
    fontSize: 12,
    fontWeight: "900",
  },

  petPillsScroll: {
    marginBottom: 14,
  },

  petPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 999,
    marginRight: 8,
    borderWidth: 1,
    borderColor: "#E2F8F5",
  },

  petPillActive: {
    backgroundColor: "#0F766E",
    borderColor: "#0F766E",
  },

  petPillText: {
    fontSize: 13,
    fontWeight: "900",
    color: "#0F766E",
  },

  petPillTextActive: {
    color: "#FFFFFF",
  },

  summaryCard: {
    backgroundColor: "#0F766E",
    borderRadius: 28,
    padding: 20,
    marginBottom: 18,
    shadowColor: "#0F766E",
    shadowOpacity: 0.24,
    shadowRadius: 14,
    elevation: 4,
  },

  summaryTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
  },

  summaryLabel: {
    color: "#BFF6EE",
    fontSize: 12,
    fontWeight: "800",
    marginBottom: 4,
  },

  summaryTitle: {
    color: "#FFFFFF",
    fontSize: 22,
    fontWeight: "900",
  },

  summaryInfo: {
    color: "#DDFCF8",
    fontSize: 13,
    marginTop: 4,
    fontWeight: "600",
  },

  summaryBadge: {
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 14,
    height: 34,
  },

  summaryBadgeText: {
    color: "#EF4444",
    fontWeight: "900",
    fontSize: 12,
  },

  statsRow: {
    marginTop: 22,
    backgroundColor: "rgba(255,255,255,0.13)",
    borderRadius: 22,
    paddingVertical: 14,
    flexDirection: "row",
    alignItems: "center",
  },

  statItem: {
    flex: 1,
    alignItems: "center",
  },

  statNumber: {
    color: "#FFFFFF",
    fontSize: 22,
    fontWeight: "900",
  },

  statLabel: {
    color: "#DDFCF8",
    fontSize: 11,
    fontWeight: "700",
    marginTop: 2,
    textAlign: "center",
  },

  statDivider: {
    width: 1,
    height: 32,
    backgroundColor: "rgba(255,255,255,0.25)",
  },

  filtersScroll: {
    marginBottom: 20,
  },

  filterButton: {
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 16,
    marginRight: 10,
    borderWidth: 1,
    borderColor: "#E2F8F5",
  },

  filterActive: {
    backgroundColor: "#0F766E",
    borderColor: "#0F766E",
  },

  filterText: {
    color: "#64748B",
    fontWeight: "800",
    fontSize: 13,
  },

  filterTextActive: {
    color: "#FFFFFF",
  },

  sectionHeader: {
    marginBottom: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  sectionTitle: {
    fontSize: 20,
    fontWeight: "900",
    color: "#0F172A",
  },

  sectionCount: {
    fontSize: 12,
    fontWeight: "800",
    color: "#94A3B8",
  },

  emptyBox: {
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    padding: 22,
    marginBottom: 16,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E2F8F5",
  },

  emptyTitle: {
    marginTop: 10,
    fontSize: 16,
    fontWeight: "900",
    color: "#0F172A",
  },

  emptyText: {
    marginTop: 6,
    fontSize: 12,
    color: "#64748B",
    fontWeight: "600",
    lineHeight: 18,
    textAlign: "center",
  },

  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: "#E2F8F5",
    shadowColor: "#0F766E",
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },

  cardTop: {
    flexDirection: "row",
    alignItems: "center",
  },

  iconBox: {
    width: 54,
    height: 54,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 13,
  },

  cardContent: {
    flex: 1,
  },

  type: {
    fontWeight: "900",
    fontSize: 11,
    marginBottom: 3,
    textTransform: "uppercase",
  },

  eventTitle: {
    fontSize: 17,
    fontWeight: "900",
    color: "#0F172A",
  },

  petInfo: {
    color: "#64748B",
    marginTop: 3,
    fontSize: 12,
    fontWeight: "600",
  },

  statusBox: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 14,
  },

  statusText: {
    fontWeight: "900",
    fontSize: 11,
  },

  cardBottom: {
    marginTop: 14,
    backgroundColor: "#F8FAFC",
    borderRadius: 18,
    padding: 12,
    gap: 8,
  },

  infoLine: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
  },

  infoText: {
    flex: 1,
    color: "#64748B",
    fontSize: 12,
    fontWeight: "600",
    lineHeight: 17,
  },

  priorityRow: {
    marginTop: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
  },

  priorityDot: {
    width: 9,
    height: 9,
    borderRadius: 5,
  },

  priorityText: {
    color: "#475569",
    fontSize: 12,
    fontWeight: "800",
  },

  aiBox: {
    backgroundColor: "#ECFEFF",
    borderColor: "#A5F3FC",
    borderWidth: 1,
    borderRadius: 24,
    padding: 18,
    marginTop: 8,
    marginBottom: 14,
    flexDirection: "row",
    gap: 13,
  },

  aiIcon: {
    width: 46,
    height: 46,
    borderRadius: 18,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
  },

  aiTitle: {
    color: "#155E75",
    fontWeight: "900",
    fontSize: 17,
    marginBottom: 5,
  },

  aiText: {
    color: "#155E75",
    lineHeight: 20,
    fontWeight: "600",
    fontSize: 12,
  },

  tipBox: {
    backgroundColor: "#FFFFFF",
    borderRadius: 22,
    padding: 17,
    marginBottom: 45,
    borderWidth: 1,
    borderColor: "#E2F8F5",
  },

  tipTitle: {
    color: "#0F172A",
    fontSize: 15,
    fontWeight: "900",
    marginBottom: 5,
  },

  tipText: {
    color: "#64748B",
    fontSize: 12,
    fontWeight: "600",
    lineHeight: 19,
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.45)",
    justifyContent: "flex-end",
  },

  modalBox: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    padding: 20,
    maxHeight: "70%",
  },

  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingBottom: 16,
  },

  modalTitle: {
    fontSize: 19,
    fontWeight: "900",
    color: "#0F172A",
  },

  modalItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 13,
    paddingVertical: 13,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },

  modalItemActive: {
    backgroundColor: "#F0FDFA",
    borderRadius: 16,
    borderBottomColor: "transparent",
    paddingHorizontal: 12,
  },

  modalItemIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: "#E0F5F2",
    alignItems: "center",
    justifyContent: "center",
  },

  modalItemIconActive: {
    backgroundColor: "#0F766E",
  },

  modalItemNome: {
    fontSize: 16,
    fontWeight: "900",
    color: "#64748B",
  },

  modalItemNomeActive: {
    color: "#0F172A",
  },

  modalItemSub: {
    fontSize: 12,
    color: "#94A3B8",
    fontWeight: "600",
    marginTop: 2,
  },
});
