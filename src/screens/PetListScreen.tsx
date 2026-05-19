import React, { useCallback, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  StatusBar,
} from "react-native";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect } from "@react-navigation/native";

const PETS_KEY = "@clyvocare_pets";
const HOME_PET_KEY = "@clyvocare_home_pet_id";

type SituacaoVacinal =
  | "com_carteirinha"
  | "sem_carteirinha"
  | "historico_desconhecido"
  | "resgatado";

type Castracao = "castrado" | "nao_castrado" | "nao_sei";

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
  foto?: string | null;
  carteiraVacina?: string | null;
  documentoAnimal?: string | null;
  observacoesDocumento?: string;
  situacaoVacinal?: SituacaoVacinal;
  castracao?: Castracao;
  observacoes?: string;
  vacinas?: Vacina[];
};

function getIconePet(especieId?: string) {
  switch (especieId) {
    case "cachorro":
      return "dog";
    case "gato":
      return "cat";
    case "coelho":
      return "rabbit";
    case "cobra":
      return "snake";
    case "lagarto":
      return "bug";
    case "ave":
      return "bird";
    case "peixe":
      return "fish";
    case "tartaruga":
    case "jabuti":
      return "turtle";
    case "porco":
    case "miniporco":
      return "pig";
    case "vaca":
    case "minivaca":
      return "cow";
    case "cabra":
      return "sheep";
    case "hamster":
    case "porquinho":
    case "rato":
    case "chinchila":
      return "rodent";
    case "furao":
      return "paw";
    default:
      return "paw";
  }
}

function permiteCastracao(especieId?: string) {
  return especieId === "cachorro" || especieId === "gato";
}

function temDocumentacao(especieId?: string) {
  return [
    "tartaruga",
    "jabuti",
    "furao",
    "ave",
    "cobra",
    "lagarto",
    "porco",
    "miniporco",
    "vaca",
    "minivaca",
    "cabra",
    "peixe",
  ].includes(especieId || "");
}

function usaSituacaoVacinal(especieId?: string) {
  return ![
    "hamster",
    "porquinho",
    "rato",
    "chinchila",
    "tartaruga",
    "jabuti",
    "cobra",
    "lagarto",
    "ave",
    "peixe",
  ].includes(especieId || "");
}

function calcularScore(pet: Pet) {
  const vacinas = pet.vacinas || [];
  const totalVacinas = vacinas.length;
  const vacinasEmDia = vacinas.filter((v) => v.emDia).length;

  const pontosVacina = totalVacinas > 0 ? Math.round((vacinasEmDia / totalVacinas) * 40) : 25;
  const pontosPeso = pet.peso?.trim() ? 10 : 5;
  const idadeNum = parseInt(pet.idade || "0", 10);
  const pontosIdade = !idadeNum ? 7 : idadeNum >= 12 ? 6 : idadeNum >= 8 ? 8 : 12;
  const pontosDocumento = temDocumentacao(pet.especieId) ? (pet.documentoAnimal ? 12 : 6) : 8;

  let penalidadeSituacao = 0;

  if (usaSituacaoVacinal(pet.especieId)) {
    if (pet.situacaoVacinal === "sem_carteirinha") penalidadeSituacao = 7;
    if (pet.situacaoVacinal === "historico_desconhecido") penalidadeSituacao = 12;
    if (pet.situacaoVacinal === "resgatado") penalidadeSituacao = 15;
  }

  let penalidadeCastracao = 0;
  if (permiteCastracao(pet.especieId) && pet.castracao === "nao_sei") {
    penalidadeCastracao = 4;
  }

  const score = 35 + pontosVacina + pontosPeso + pontosIdade + pontosDocumento - penalidadeSituacao - penalidadeCastracao;
  return Math.max(20, Math.min(100, Math.round(score)));
}

function getScoreColor(score: number) {
  if (score >= 80) return "#0F766E";
  if (score >= 60) return "#D97706";
  return "#EF4444";
}


function getSituacaoTexto(pet: Pet) {
  if (!usaSituacaoVacinal(pet.especieId)) return "Cuidados preventivos";
  if (pet.situacaoVacinal === "com_carteirinha") return "Carteirinha disponível";
  if (pet.situacaoVacinal === "sem_carteirinha") return "Sem carteirinha";
  if (pet.situacaoVacinal === "historico_desconhecido") return "Histórico desconhecido";
  if (pet.situacaoVacinal === "resgatado") return "Pet resgatado";
  return "Situação não informada";
}

export default function PetsScreen({ navigation }: any) {
  const [pets, setPets] = useState<Pet[]>([]);
  const [homePetId, setHomePetId] = useState<string | null>(null);
  const [carregando, setCarregando] = useState(true);

  const carregarDados = useCallback(async () => {
    try {
      setCarregando(true);

      const storedPets = await AsyncStorage.getItem(PETS_KEY);
      const storedHomePetId = await AsyncStorage.getItem(HOME_PET_KEY);

      const lista: Pet[] = storedPets ? JSON.parse(storedPets) : [];

      const listaValida = Array.isArray(lista) ? lista : [];
      const petPrincipal = listaValida.find((pet) => (pet as any).principal);
      const idHomeFinal = storedHomePetId || petPrincipal?.id || null;

      if (!storedHomePetId && idHomeFinal) {
        await AsyncStorage.setItem(HOME_PET_KEY, idHomeFinal);
      }

      setPets(listaValida);
      setHomePetId(idHomeFinal);

      console.log("PETS CARREGADOS NA TELA PETS:", listaValida);
      console.log("PET ATUAL DA HOME:", idHomeFinal);
    } catch (erro) {
      console.log("ERRO AO CARREGAR PETS:", erro);
      setPets([]);
      setHomePetId(null);
    } finally {
      setCarregando(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      carregarDados();
    }, [carregarDados])
  );

  async function colocarPetNaHome(pet: Pet) {
    try {
      if (!pet.id) {
        Alert.alert("Erro", "Esse pet está sem ID e não pode ser colocado na Home.");
        return;
      }

      const listaAtualizada = pets.map((item) => ({
        ...item,
        principal: item.id === pet.id,
      }));

      await AsyncStorage.setItem(PETS_KEY, JSON.stringify(listaAtualizada));
      await AsyncStorage.setItem(HOME_PET_KEY, pet.id);

      setPets(listaAtualizada);
      setHomePetId(pet.id);

      console.log("PET DEFINIDO PARA HOME:", pet.id, pet.nome);

      Alert.alert("Pronto", `${pet.nome} agora está aparecendo na Home.`, [
        {
          text: "Ver Home",
          onPress: () => navigation.navigate("Home"),
        },
        {
          text: "Continuar aqui",
          style: "cancel",
        },
      ]);
    } catch (erro) {
      console.log("ERRO AO DEFINIR PET NA HOME:", erro);
      Alert.alert("Erro", "Não foi possível colocar esse pet na Home.");
    }
  }

  async function excluirPet(pet: Pet) {
    Alert.alert("Excluir pet", `Tem certeza que deseja excluir ${pet.nome}?`, [
      {
        text: "Cancelar",
        style: "cancel",
      },
      {
        text: "Excluir",
        style: "destructive",
        onPress: async () => {
          try {
            const novaLista = pets.filter((item) => item.id !== pet.id);
            await AsyncStorage.setItem(PETS_KEY, JSON.stringify(novaLista));

            if (homePetId === pet.id) {
              if (novaLista.length > 0) {
                const novoPetHome = novaLista[novaLista.length - 1];
                await AsyncStorage.setItem(HOME_PET_KEY, novoPetHome.id);
                setHomePetId(novoPetHome.id);
              } else {
                await AsyncStorage.removeItem(HOME_PET_KEY);
                setHomePetId(null);
              }
            }

            setPets(novaLista);
            Alert.alert("Pronto", "Pet excluído com sucesso.");
          } catch (erro) {
            console.log("ERRO AO EXCLUIR PET:", erro);
            Alert.alert("Erro", "Não foi possível excluir esse pet.");
          }
        },
      },
    ]);
  }

  function editarPet(pet: Pet) {
    navigation.navigate("Cadastrar Pet", { petId: pet.id });
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <StatusBar barStyle="dark-content" backgroundColor="#F6FBFA" />
<View style={styles.header}>
  <View style={styles.headerTextBox}>
    <Text style={styles.pageTitle}>Meus Pets</Text>

    <Text style={styles.pageSubtitle}>
      Organize os perfis dos pets aqui.
    </Text>
  </View>

  <TouchableOpacity
    style={styles.addButton}
    onPress={() => navigation.navigate("Cadastrar Pet")}
    activeOpacity={0.85}
  >
    <Ionicons name="add" size={24} color="#FFFFFF" />
  </TouchableOpacity>
</View>


      {carregando && (
        <View style={styles.emptyBox}>
          <Text style={styles.emptyTitle}>Carregando pets...</Text>
        </View>
      )}

      {!carregando && pets.length === 0 && (
        <View style={styles.emptyBox}>
          <View style={styles.emptyIcon}>
            <Ionicons name="paw-outline" size={34} color="#0F766E" />
          </View>

          <Text style={styles.emptyTitle}>Nenhum pet cadastrado</Text>
          <Text style={styles.emptyText}>
            Cadastre o primeiro pet para ele aparecer aqui e depois escolher qual
            ficará em destaque na Home.
          </Text>

          <TouchableOpacity
            style={styles.emptyButton}
            onPress={() => navigation.navigate("Cadastrar Pet")}
            activeOpacity={0.9}
          >
            <Ionicons name="add-circle-outline" size={20} color="#FFFFFF" />
            <Text style={styles.emptyButtonText}>Cadastrar pet</Text>
          </TouchableOpacity>
        </View>
      )}

      {pets.map((pet) => {
        const isHomePet = homePetId === pet.id;
        const score = calcularScore(pet);
        const scoreColor = getScoreColor(score);
        const vacinas = pet.vacinas || [];
        const totalVacinas = vacinas.length;
        const vacinasEmDia = vacinas.filter((v) => v.emDia).length;

        return (
          <View
            key={pet.id}
            style={[styles.petCard, isHomePet && styles.petCardSelected]}
          >
            <View style={styles.petTop}>
              <View style={styles.petPhotoWrap}>
                <View style={styles.petPhotoPlaceholder}>
                  <MaterialCommunityIcons
                    name={getIconePet(pet.especieId) as any}
                    size={38}
                    color="#0F766E"
                  />
                </View>

                {isHomePet && (
                  <View style={styles.homeBadgeSmall}>
                    <Ionicons name="home" size={13} color="#FFFFFF" />
                  </View>
                )}
              </View>

              <View style={styles.petInfo}>
                <View style={styles.petNameRow}>
                  <Text style={styles.petName}>{pet.nome || "Pet sem nome"}</Text>

                  {isHomePet && (
                    <View style={styles.homeBadge}>
                      <Text style={styles.homeBadgeText}>Na Home</Text>
                    </View>
                  )}
                </View>

                <Text style={styles.petBreed}>
                  {pet.raca || pet.especie || "Dados não informados"}
                </Text>

                <View style={styles.metaRow}>
                  <View style={styles.metaPill}>
                    <Ionicons name="time-outline" size={13} color="#0F766E" />
                    <Text style={styles.metaText}>
                      {pet.idade ? `${pet.idade} anos` : "Idade não informada"}
                    </Text>
                  </View>
                </View>
              </View>
            </View>

            <View style={styles.detailsGrid}>
              <View style={styles.detailCard}>
                <Text style={styles.detailLabel}>Score</Text>
                <Text style={[styles.detailValue, { color: scoreColor }]}>
                  {score}%
                </Text>
              </View>

              <View style={styles.detailCard}>
                <Text style={styles.detailLabel}>Cuidados</Text>
                <Text style={styles.detailValueSmall}>
                  {totalVacinas > 0 ? `${vacinasEmDia}/${totalVacinas}` : "--"}
                </Text>
              </View>

              <View style={styles.detailCardWide}>
                <Text style={styles.detailLabel}>Status</Text>
                <Text style={styles.detailValueSmall}>{getSituacaoTexto(pet)}</Text>
              </View>
            </View>

            {temDocumentacao(pet.especieId) && (
              <View style={styles.documentRow}>
                <Ionicons
                  name={pet.documentoAnimal ? "folder-open" : "folder-open-outline"}
                  size={16}
                  color={pet.documentoAnimal ? "#0F766E" : "#94A3B8"}
                />
                <Text
                  style={[
                    styles.documentText,
                    pet.documentoAnimal && styles.documentTextActive,
                  ]}
                >
                  {pet.documentoAnimal
                    ? "Documento do animal anexado"
                    : "Documento do animal não anexado"}
                </Text>
              </View>
            )}

            <View style={styles.actionsRow}>
              <TouchableOpacity
                style={[styles.homeButton, isHomePet && styles.homeButtonActive]}
                onPress={() => colocarPetNaHome(pet)}
                activeOpacity={0.9}
              >
                <Ionicons
                  name={isHomePet ? "home" : "home-outline"}
                  size={18}
                  color={isHomePet ? "#0F766E" : "#FFFFFF"}
                />
                <Text
                  style={[
                    styles.homeButtonText,
                    isHomePet && styles.homeButtonTextActive,
                  ]}
                >
                  {isHomePet ? "Aparecendo na Home" : "Aparecer na Home"}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.iconButton}
                onPress={() => editarPet(pet)}
                activeOpacity={0.85}
              >
                <Ionicons name="pencil-outline" size={20} color="#0F766E" />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.deleteButton}
                onPress={() => excluirPet(pet)}
                activeOpacity={0.85}
              >
                <Ionicons name="trash-outline" size={20} color="#EF4444" />
              </TouchableOpacity>
            </View>
          </View>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F6FBFA",
  },

  content: {
    paddingTop: 56,
    paddingHorizontal: 18,
    paddingBottom: 110,
  },

  header: {
  position: "relative",
  marginBottom: 20,
  paddingRight: 64,
},

headerTextBox: {
  paddingRight: 10,
},

  title: {
    fontSize: 31,
    fontWeight: "900",
    color: "#00796B",
    letterSpacing: -0.8,
    lineHeight: 36,
  },

  subtitle: {
    marginTop: 6,
    color: "#64748B",
    fontWeight: "700",
    lineHeight: 20,
    maxWidth: 280,
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
  fontSize: 16,
  fontWeight: "800",
  color: "#64748B",
  lineHeight: 24,
},

  addButton: {
  position: "absolute",
  right: 0,
  top: 4,
  width: 48,
  height: 48,
  borderRadius: 24,
  backgroundColor: "#00796B",
  alignItems: "center",
  justifyContent: "center",
},

 
  homeInfoTitle: {
    fontSize: 14,
    fontWeight: "900",
    color: "#0F172A",
    marginBottom: 3,
  },

  homeInfoText: {
    fontSize: 12,
    color: "#155E75",
    fontWeight: "600",
    lineHeight: 18,
  },

  emptyBox: {
    backgroundColor: "#FFFFFF",
    borderRadius: 28,
    padding: 24,
    borderWidth: 1,
    borderColor: "#E2F8F5",
    alignItems: "center",
    marginTop: 10,
  },

  emptyIcon: {
    width: 62,
    height: 62,
    borderRadius: 24,
    backgroundColor: "#E0F5F2",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },

  emptyTitle: {
    fontSize: 18,
    fontWeight: "900",
    color: "#0F172A",
    textAlign: "center",
  },

  emptyText: {
    marginTop: 6,
    fontSize: 13,
    color: "#64748B",
    fontWeight: "600",
    textAlign: "center",
    lineHeight: 20,
  },

  emptyButton: {
    marginTop: 18,
    backgroundColor: "#0F766E",
    paddingHorizontal: 18,
    paddingVertical: 13,
    borderRadius: 18,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },

  emptyButtonText: {
    color: "#FFFFFF",
    fontWeight: "900",
    fontSize: 14,
  },

  petCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 28,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#E2F8F5",
    shadowColor: "#0F766E",
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 2,
  },

  petCardSelected: {
    borderColor: "#0F766E",
    backgroundColor: "#F0FDFA",
  },

  petTop: {
    flexDirection: "row",
    gap: 14,
    alignItems: "center",
  },

  petPhotoWrap: {
    position: "relative",
  },

  petPhoto: {
    width: 82,
    height: 82,
    borderRadius: 41,
    borderWidth: 3,
    borderColor: "#99F6E4",
  },

  petPhotoPlaceholder: {
    width: 82,
    height: 82,
    borderRadius: 41,
    backgroundColor: "#E0F5F2",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 3,
    borderColor: "#99F6E4",
  },

  homeBadgeSmall: {
    position: "absolute",
    right: -2,
    top: -2,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#0F766E",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#FFFFFF",
  },

  petInfo: {
    flex: 1,
  },

  petNameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flexWrap: "wrap",
  },

  petName: {
    fontSize: 23,
    fontWeight: "900",
    color: "#0F172A",
    letterSpacing: -0.5,
  },

  homeBadge: {
    backgroundColor: "#CCFBF1",
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 999,
  },

  homeBadgeText: {
    color: "#0F766E",
    fontSize: 10,
    fontWeight: "900",
  },

  petBreed: {
    marginTop: 3,
    color: "#64748B",
    fontWeight: "700",
    fontSize: 13,
  },

  metaRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 7,
    marginTop: 10,
  },

  metaPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#E0F5F2",
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 12,
  },

  metaText: {
    color: "#0F766E",
    fontSize: 11,
    fontWeight: "900",
  },

  detailsGrid: {
    marginTop: 14,
    flexDirection: "row",
    gap: 9,
  },

  detailCard: {
    flex: 0.8,
    backgroundColor: "#F8FAFC",
    borderRadius: 16,
    padding: 11,
  },

  detailCardWide: {
    flex: 1.4,
    backgroundColor: "#F8FAFC",
    borderRadius: 16,
    padding: 11,
  },

  detailLabel: {
    fontSize: 10,
    color: "#94A3B8",
    fontWeight: "900",
    textTransform: "uppercase",
    marginBottom: 4,
  },

  detailValue: {
    fontSize: 20,
    fontWeight: "900",
  },

  detailValueSmall: {
    color: "#0F172A",
    fontSize: 13,
    fontWeight: "900",
  },

  documentRow: {
    marginTop: 12,
    backgroundColor: "#F8FAFC",
    borderRadius: 15,
    padding: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
  },

  documentText: {
    color: "#94A3B8",
    fontSize: 12,
    fontWeight: "800",
  },

  documentTextActive: {
    color: "#0F766E",
  },

  actionsRow: {
    marginTop: 14,
    flexDirection: "row",
    gap: 9,
    alignItems: "center",
  },

  homeButton: {
    flex: 1,
    backgroundColor: "#0F766E",
    paddingVertical: 13,
    borderRadius: 18,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
  },

  homeButtonActive: {
    backgroundColor: "#CCFBF1",
  },

  homeButtonText: {
    color: "#FFFFFF",
    fontWeight: "900",
    fontSize: 13,
  },

  homeButtonTextActive: {
    color: "#0F766E",
  },

  iconButton: {
    width: 46,
    height: 46,
    borderRadius: 17,
    backgroundColor: "#E0F5F2",
    alignItems: "center",
    justifyContent: "center",
  },

  deleteButton: {
    width: 46,
    height: 46,
    borderRadius: 17,
    backgroundColor: "#FEF2F2",
    alignItems: "center",
    justifyContent: "center",
  },
});
