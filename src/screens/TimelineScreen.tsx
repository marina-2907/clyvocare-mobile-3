import React, { useCallback, useState } from "react";
import {
  Alert,
  Modal,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect } from "@react-navigation/native";
import Svg, { Circle, Line, Path, Text as SvgText } from "react-native-svg";

const PETS_KEY = "@clyvocare_pets";
const HISTORICO_KEY = "@clyvocare_historico_pets";

type Pet = {
  id: string;
  nome: string;
  especie?: string;
  especieId?: string;
  raca?: string;
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

const TIPOS: {
  id: TipoHistorico;
  label: string;
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
}[] = [
  { id: "consulta", label: "Consulta", icon: "stethoscope" },
  { id: "vacina", label: "Vacina", icon: "needle" },
  { id: "exame", label: "Exame", icon: "file-document-outline" },
  { id: "tratamento", label: "Tratamento", icon: "pill" },
];

export default function HistoryScreen({ navigation }: any) {
  const [pets, setPets] = useState<Pet[]>([]);
  const [petSelecionadoId, setPetSelecionadoId] = useState<string | null>(null);
  const [historico, setHistorico] = useState<HistoricoPet[]>([]);

  const [modalVisivel, setModalVisivel] = useState(false);
  const [tipo, setTipo] = useState<TipoHistorico>("consulta");
  const [titulo, setTitulo] = useState("");
  const [descricao, setDescricao] = useState("");
  const [data, setData] = useState("");
  const [scoreSaude, setScoreSaude] = useState("");

  const carregarDados = useCallback(async () => {
    try {
      const petsSalvos = await AsyncStorage.getItem(PETS_KEY);
      const historicoSalvo = await AsyncStorage.getItem(HISTORICO_KEY);

      const listaPets: Pet[] = petsSalvos ? JSON.parse(petsSalvos) : [];
      const listaHistorico: HistoricoPet[] = historicoSalvo
        ? JSON.parse(historicoSalvo)
        : [];

        console.log("HISTÓRICO CARREGADO:", listaHistorico);

      setPets(listaPets);
      setHistorico(listaHistorico);

      if (listaPets.length > 0 && !petSelecionadoId) {
        setPetSelecionadoId(listaPets[0].id);
      }
    } catch {
      setPets([]);
      setHistorico([]);
    }
  }, [petSelecionadoId]);

  useFocusEffect(
    useCallback(() => {
      carregarDados();
    }, [carregarDados]),
  );

  const petSelecionado = pets.find((pet) => pet.id === petSelecionadoId);

  const historicoDoPet = historico
    .filter((item) => item.petId === petSelecionadoId)
    .sort((a, b) => {
      const dataA = converterDataParaNumero(a.data);
      const dataB = converterDataParaNumero(b.data);
      return dataA - dataB;
    });

  const ultimoScore =
    historicoDoPet.length > 0
      ? historicoDoPet[historicoDoPet.length - 1].scoreSaude
      : 0;

  function abrirModal() {
    if (!petSelecionadoId) {
      Alert.alert("Atenção", "Cadastre um pet antes de adicionar histórico.");
      return;
    }

    setTipo("consulta");
    setTitulo("");
    setDescricao("");
    setData(new Date().toLocaleDateString("pt-BR"));
    setScoreSaude("");
    setModalVisivel(true);
  }

  async function salvarHistorico() {
    if (!petSelecionadoId) return;

    if (!titulo.trim()) {
      Alert.alert("Atenção", "Digite o título do registro.");
      return;
    }

    const dataValida = /^\d{2}\/\d{2}\/\d{4}$/.test(data.trim());

    if (!dataValida) {
      Alert.alert("Atenção", "Digite a data no formato DD/MM/AAAA.");
      return;
    }

    const scoreNumero = Number(scoreSaude.replace(",", "."));

    if (!scoreSaude.trim() || Number.isNaN(scoreNumero)) {
      Alert.alert("Atenção", "Digite uma nota de saúde entre 0 e 100.");
      return;
    }

    if (scoreNumero < 0 || scoreNumero > 100) {
      Alert.alert("Atenção", "A nota de saúde precisa estar entre 0 e 100.");
      return;
    }

    const novoRegistro: HistoricoPet = {
      id: Date.now().toString(),
      petId: petSelecionadoId,
      tipo,
      titulo: titulo.trim(),
      descricao: descricao.trim() || "Sem descrição informada.",
      data: data.trim(),
      scoreSaude: Math.round(scoreNumero),
    };

    const novoHistorico = [...historico, novoRegistro];

    console.log("HISTÓRICO SALVO:", novoRegistro);
    console.log("TOTAL DE REGISTROS:", novoHistorico.length);

    try {
      await AsyncStorage.setItem(HISTORICO_KEY, JSON.stringify(novoHistorico));
      setHistorico(novoHistorico);
      setModalVisivel(false);

      Alert.alert("Histórico salvo", "O registro foi adicionado com sucesso.");
    } catch {
      Alert.alert("Erro", "Não foi possível salvar o histórico.");
    }
  }

  async function excluirRegistro(id: string) {
    Alert.alert("Excluir registro", "Deseja remover este item do histórico?", [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Excluir",
        style: "destructive",
        onPress: async () => {
          const novoHistorico = historico.filter((item) => item.id !== id);
          await AsyncStorage.setItem(
            HISTORICO_KEY,
            JSON.stringify(novoHistorico),
          );
          setHistorico(novoHistorico);
        },
      },
    ]);
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
            <Text style={styles.pageTitle}>Histórico do Pet</Text>
            <Text style={styles.pageSubtitle}>
              Salve consultas, vacinas, exames e acompanhe a evolução da saúde.
            </Text>
          </View>

          <TouchableOpacity
            style={styles.headerButton}
            onPress={abrirModal}
            activeOpacity={0.85}
          >
            <Ionicons name="add" size={24} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        {pets.length === 0 ? (
          <View style={styles.emptyCard}>
            <MaterialCommunityIcons
              name="paw-outline"
              size={44}
              color="#00796B"
            />
            <Text style={styles.emptyTitle}>Nenhum pet cadastrado</Text>
            <Text style={styles.emptyText}>
              Cadastre um pet primeiro para começar a salvar o histórico.
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
            <View style={styles.petSelectorCard}>
              <View style={styles.petSelectorTop}>
                <View style={styles.petIconBox}>
                  <MaterialCommunityIcons
                    name={getIconePet(petSelecionado?.especieId)}
                    size={28}
                    color="#00796B"
                  />
                </View>

                <View style={{ flex: 1 }}>
                  <Text style={styles.petSelectorLabel}>Histórico de</Text>
                  <Text style={styles.petSelectorName}>
                    {petSelecionado?.nome || "Pet"}
                  </Text>
                  <Text style={styles.petSelectorBreed}>
                    {petSelecionado?.raca ||
                      petSelecionado?.especie ||
                      "Dados não informados"}
                  </Text>
                </View>

                <View style={styles.scoreBox}>
                  <Text style={styles.scoreNumber}>{ultimoScore || "--"}%</Text>
                  <Text style={styles.scoreLabel}>saúde</Text>
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

            <GraficoSaude dados={historicoDoPet} />

            <View style={styles.summaryGrid}>
              <ResumoCard
                label="Consultas"
                valor={
                  historicoDoPet.filter((item) => item.tipo === "consulta")
                    .length
                }
                icon="stethoscope"
              />

              <ResumoCard
                label="Vacinas"
                valor={
                  historicoDoPet.filter((item) => item.tipo === "vacina").length
                }
                icon="needle"
              />

              <ResumoCard
                label="Exames"
                valor={
                  historicoDoPet.filter((item) => item.tipo === "exame").length
                }
                icon="file-document-outline"
              />
            </View>

            <View style={styles.historyCard}>
              <View style={styles.historyHeader}>
                <View>
                  <Text style={styles.historySectionTitle}>
                    Registros salvos
                  </Text>
                  <Text style={styles.historySectionSubtitle}>
                    Histórico completo de {petSelecionado?.nome || "pet"}
                  </Text>
                </View>

                <TouchableOpacity
                  style={styles.addSmallButton}
                  onPress={abrirModal}
                  activeOpacity={0.85}
                >
                  <Ionicons name="add" size={21} color="#FFFFFF" />
                </TouchableOpacity>
              </View>

              {historicoDoPet.length === 0 ? (
                <View style={styles.emptyHistory}>
                  <Ionicons
                    name="document-text-outline"
                    size={34}
                    color="#00796B"
                  />
                  <Text style={styles.emptyHistoryTitle}>
                    Nenhum registro ainda
                  </Text>
                  <Text style={styles.emptyHistoryText}>
                    Toque no botão + para adicionar a primeira consulta, vacina,
                    exame ou tratamento.
                  </Text>
                </View>
              ) : (
                historicoDoPet
                  .slice()
                  .reverse()
                  .map((item) => (
                    <TouchableOpacity
                      key={item.id}
                      style={styles.historyItem}
                      activeOpacity={0.85}
                      onLongPress={() => excluirRegistro(item.id)}
                    >
                      <View style={styles.historyIcon}>
                        <MaterialCommunityIcons
                          name={getTipoIcon(item.tipo)}
                          size={22}
                          color="#00796B"
                        />
                      </View>

                      <View style={{ flex: 1 }}>
                        <View style={styles.historyTopLine}>
                          <Text style={styles.historyType}>
                            {getTipoLabel(item.tipo)}
                          </Text>
                          <Text style={styles.historyDate}>{item.data}</Text>
                        </View>

                        <Text style={styles.historyTitle}>{item.titulo}</Text>
                        <Text style={styles.historyDesc}>{item.descricao}</Text>
                      </View>

                      <TouchableOpacity
                        style={styles.deleteHistoryButton}
                        onPress={() => excluirRegistro(item.id)}
                        activeOpacity={0.85}
                      >
                        <Ionicons
                          name="trash-outline"
                          size={17}
                          color="#EF4444"
                        />
                      </TouchableOpacity>
                    </TouchableOpacity>
                  ))
              )}
            </View>
          </>
        )}
      </ScrollView>

      <Modal visible={modalVisivel} animationType="slide">
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity
              style={styles.modalBackButton}
              onPress={() => setModalVisivel(false)}
              activeOpacity={0.85}
            >
              <Ionicons name="arrow-back" size={22} color="#00796B" />
            </TouchableOpacity>

            <View style={{ flex: 1 }}>
              <Text style={styles.modalTitle}>Novo histórico</Text>
              <Text style={styles.modalSubtitle}>
                Registro para {petSelecionado?.nome || "pet"}
              </Text>
            </View>
          </View>

          <ScrollView
            style={styles.modalScroll}
            contentContainerStyle={styles.modalContent}
            showsVerticalScrollIndicator={false}
          >
            <Text style={styles.inputLabel}>Tipo de registro</Text>

            <View style={styles.tipoGrid}>
              {TIPOS.map((item) => {
                const ativo = tipo === item.id;

                return (
                  <TouchableOpacity
                    key={item.id}
                    style={[
                      styles.tipoButton,
                      ativo && styles.tipoButtonActive,
                    ]}
                    onPress={() => setTipo(item.id)}
                    activeOpacity={0.85}
                  >
                    <MaterialCommunityIcons
                      name={item.icon}
                      size={22}
                      color={ativo ? "#FFFFFF" : "#00796B"}
                    />
                    <Text
                      style={[
                        styles.tipoButtonText,
                        ativo && styles.tipoButtonTextActive,
                      ]}
                    >
                      {item.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <InputField
              label="Título"
              placeholder="Ex: Consulta de rotina"
              value={titulo}
              onChangeText={setTitulo}
            />

            <InputField
              label="Descrição"
              placeholder="Ex: Check-up geral, pet saudável"
              value={descricao}
              onChangeText={setDescricao}
              multiline
            />

            <InputField
              label="Data"
              placeholder="Ex: 19/05/2026"
              value={data}
              onChangeText={(text) => {
                const apenasNumeros = text.replace(/\D/g, "").slice(0, 8);

                let dataFormatada = apenasNumeros;

                if (apenasNumeros.length > 2) {
                  dataFormatada = `${apenasNumeros.slice(0, 2)}/${apenasNumeros.slice(2)}`;
                }

                if (apenasNumeros.length > 4) {
                  dataFormatada = `${apenasNumeros.slice(0, 2)}/${apenasNumeros.slice(2, 4)}/${apenasNumeros.slice(4)}`;
                }

                setData(dataFormatada);
              }}
              keyboardType="numeric"
              maxLength={10}
            />

            <InputField
              label="Nota de saúde do pet"
              placeholder="Ex: 85"
              value={scoreSaude}
              onChangeText={(text) =>
                setScoreSaude(text.replace(/[^0-9]/g, ""))
              }
              keyboardType="numeric"
              maxLength={3}
            />

            <View style={styles.scoreHint}>
              <Ionicons name="information-circle" size={18} color="#00796B" />
              <Text style={styles.scoreHintText}>
                Use uma nota de 0 a 100 para acompanhar a evolução da saúde no
                gráfico.
              </Text>
            </View>

            <TouchableOpacity
              style={styles.saveButton}
              onPress={salvarHistorico}
              activeOpacity={0.9}
            >
              <Ionicons name="save-outline" size={20} color="#FFFFFF" />
              <Text style={styles.saveButtonText}>Salvar histórico</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </Modal>
    </>
  );
}

function GraficoSaude({ dados }: { dados: HistoricoPet[] }) {
  const largura = 320;
  const altura = 170;
  const padding = 28;

  const dadosOrdenados = [...dados].slice(-6);

  if (dadosOrdenados.length === 0) {
    return (
      <View style={styles.chartCard}>
        <View style={styles.chartHeader}>
          <View>
            <Text style={styles.chartTitle}>Evolução da saúde</Text>
            <Text style={styles.chartSubtitle}>
              O gráfico será gerado após os registros.
            </Text>
          </View>

          <View style={styles.chartBadge}>
            <Text style={styles.chartBadgeText}>--</Text>
          </View>
        </View>

        <View style={styles.emptyChartBox}>
          <Ionicons name="analytics-outline" size={38} color="#00796B" />
          <Text style={styles.emptyChartText}>
            Nenhum dado de evolução ainda.
          </Text>
        </View>
      </View>
    );
  }

  const pontos = dadosOrdenados.map((item, index) => {
    const x =
      padding +
      (index * (largura - padding * 2)) /
        Math.max(dadosOrdenados.length - 1, 1);

    const y =
      altura - padding - (item.scoreSaude / 100) * (altura - padding * 2);

    return { x, y, score: item.scoreSaude };
  });

  const path = pontos
    .map((ponto, index) =>
      index === 0 ? `M ${ponto.x} ${ponto.y}` : `L ${ponto.x} ${ponto.y}`,
    )
    .join(" ");

  const ultimoScore = dadosOrdenados[dadosOrdenados.length - 1].scoreSaude;

  return (
    <View style={styles.chartCard}>
      <View style={styles.chartHeader}>
        <View>
          <Text style={styles.chartTitle}>Evolução da saúde</Text>
          <Text style={styles.chartSubtitle}>
            Últimos {dadosOrdenados.length} registros do pet
          </Text>
        </View>

        <View style={styles.chartBadge}>
          <Text style={styles.chartBadgeText}>{ultimoScore}%</Text>
        </View>
      </View>

      <Svg width="100%" height={altura} viewBox={`0 0 ${largura} ${altura}`}>
        <Line
          x1={padding}
          y1={altura - padding}
          x2={largura - padding}
          y2={altura - padding}
          stroke="#D9F3EF"
          strokeWidth="2"
        />

        <Line
          x1={padding}
          y1={padding}
          x2={padding}
          y2={altura - padding}
          stroke="#D9F3EF"
          strokeWidth="2"
        />

        <SvgText
          x={padding - 8}
          y={padding + 4}
          fontSize="10"
          fill="#64748B"
          textAnchor="end"
        >
          100
        </SvgText>

        <SvgText
          x={padding - 8}
          y={altura - padding + 4}
          fontSize="10"
          fill="#64748B"
          textAnchor="end"
        >
          0
        </SvgText>

        <Path
          d={path}
          fill="none"
          stroke="#00796B"
          strokeWidth="4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {pontos.map((ponto, index) => (
          <Circle key={index} cx={ponto.x} cy={ponto.y} r="6" fill="#00796B" />
        ))}
      </Svg>
    </View>
  );
}

function ResumoCard({
  label,
  valor,
  icon,
}: {
  label: string;
  valor: number;
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
}) {
  return (
    <View style={styles.summaryCard}>
      <View style={styles.summaryIcon}>
        <MaterialCommunityIcons name={icon} size={22} color="#00796B" />
      </View>

      <Text style={styles.summaryValue}>{valor}</Text>
      <Text style={styles.summaryLabel}>{label}</Text>
    </View>
  );
}

function InputField({
  label,
  placeholder,
  value,
  onChangeText,
  multiline,
  keyboardType,
  maxLength,
}: {
  label: string;
  placeholder: string;
  value: string;
  onChangeText: (text: string) => void;
  multiline?: boolean;
  keyboardType?: any;
  maxLength?: number;
}) {
  return (
    <View style={styles.inputGroup}>
      <Text style={styles.inputLabel}>{label}</Text>

      <TextInput
        style={[styles.input, multiline && styles.inputMultiline]}
        placeholder={placeholder}
        placeholderTextColor="#CBD5E1"
        value={value}
        onChangeText={onChangeText}
        multiline={multiline}
        keyboardType={keyboardType}
        maxLength={maxLength}
      />
    </View>
  );
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
    default:
      return "paw";
  }
}

function getTipoLabel(tipo: TipoHistorico) {
  switch (tipo) {
    case "consulta":
      return "Consulta";
    case "vacina":
      return "Vacina";
    case "exame":
      return "Exame";
    case "tratamento":
      return "Tratamento";
    default:
      return "Registro";
  }
}

function getTipoIcon(
  tipo: TipoHistorico,
): keyof typeof MaterialCommunityIcons.glyphMap {
  switch (tipo) {
    case "consulta":
      return "stethoscope";
    case "vacina":
      return "needle";
    case "exame":
      return "file-document-outline";
    case "tratamento":
      return "pill";
    default:
      return "clipboard-text-outline";
  }
}

function converterDataParaNumero(data: string) {
  const partes = data.split("/");

  if (partes.length !== 3) return 0;

  const [dia, mes, ano] = partes.map(Number);

  return new Date(ano, mes - 1, dia).getTime();
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

  headerButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "#00796B",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 4,
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

  petSelectorCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 28,
    padding: 18,
    borderWidth: 1,
    borderColor: "#D9F3EF",
    shadowColor: "#00796B",
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 2,
  },

  petSelectorTop: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },

  petIconBox: {
    width: 60,
    height: 60,
    borderRadius: 22,
    backgroundColor: "#E0F5F2",
    alignItems: "center",
    justifyContent: "center",
  },

  petSelectorLabel: {
    fontSize: 11,
    color: "#00796B",
    fontWeight: "900",
  },

  petSelectorName: {
    fontSize: 22,
    color: "#0F172A",
    fontWeight: "900",
    marginTop: 1,
    textTransform: "lowercase",
  },

  petSelectorBreed: {
    marginTop: 2,
    fontSize: 13,
    color: "#64748B",
    fontWeight: "800",
  },

  scoreBox: {
    backgroundColor: "#E0F5F2",
    borderRadius: 18,
    paddingHorizontal: 12,
    paddingVertical: 9,
    alignItems: "center",
  },

  scoreNumber: {
    fontSize: 17,
    color: "#00796B",
    fontWeight: "900",
  },

  scoreLabel: {
    fontSize: 10,
    color: "#00796B",
    fontWeight: "800",
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

  chartCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 28,
    padding: 18,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#D9F3EF",
    shadowColor: "#00796B",
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 2,
  },

  chartHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },

  chartTitle: {
    fontSize: 19,
    fontWeight: "900",
    color: "#0F172A",
  },

  chartSubtitle: {
    marginTop: 3,
    fontSize: 12,
    fontWeight: "700",
    color: "#64748B",
  },

  chartBadge: {
    backgroundColor: "#E0F5F2",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
  },

  chartBadgeText: {
    color: "#00796B",
    fontSize: 13,
    fontWeight: "900",
  },

  emptyChartBox: {
    height: 135,
    borderRadius: 22,
    backgroundColor: "#F8FFFE",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#E0F5F2",
  },

  emptyChartText: {
    marginTop: 8,
    color: "#64748B",
    fontSize: 13,
    fontWeight: "700",
  },

  summaryGrid: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 16,
  },

  summaryCard: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    borderRadius: 22,
    padding: 14,
    borderWidth: 1,
    borderColor: "#D9F3EF",
  },

  summaryIcon: {
    width: 40,
    height: 40,
    borderRadius: 15,
    backgroundColor: "#E0F5F2",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
  },

  summaryValue: {
    fontSize: 22,
    fontWeight: "900",
    color: "#0F172A",
  },

  summaryLabel: {
    marginTop: 2,
    fontSize: 11,
    color: "#64748B",
    fontWeight: "800",
  },

  historyCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 28,
    padding: 18,
    borderWidth: 1,
    borderColor: "#D9F3EF",
  },

  historyHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 14,
  },

  historySectionTitle: {
    fontSize: 19,
    fontWeight: "900",
    color: "#0F172A",
  },

  historySectionSubtitle: {
    marginTop: 3,
    fontSize: 12,
    color: "#64748B",
    fontWeight: "700",
  },

  addSmallButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "#00796B",
    alignItems: "center",
    justifyContent: "center",
  },

  emptyHistory: {
    paddingVertical: 26,
    alignItems: "center",
  },

  emptyHistoryTitle: {
    marginTop: 10,
    fontSize: 17,
    color: "#0F172A",
    fontWeight: "900",
  },

  emptyHistoryText: {
    marginTop: 5,
    color: "#64748B",
    fontSize: 13,
    fontWeight: "700",
    textAlign: "center",
    lineHeight: 20,
  },

  historyItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },

  historyIcon: {
    width: 46,
    height: 46,
    borderRadius: 17,
    backgroundColor: "#E0F5F2",
    alignItems: "center",
    justifyContent: "center",
  },

  historyTopLine: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 2,
  },

  historyType: {
    fontSize: 11,
    color: "#00796B",
    fontWeight: "900",
    textTransform: "uppercase",
  },

  historyDate: {
    fontSize: 11,
    color: "#94A3B8",
    fontWeight: "800",
  },

  historyTitle: {
    fontSize: 15,
    fontWeight: "900",
    color: "#0F172A",
  },

  historyDesc: {
    marginTop: 2,
    fontSize: 12,
    color: "#64748B",
    fontWeight: "700",
    lineHeight: 18,
  },

  historyScore: {
    backgroundColor: "#E0F5F2",
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 999,
  },

  historyScoreText: {
    color: "#00796B",
    fontSize: 12,
    fontWeight: "900",
  },

  modalContainer: {
    flex: 1,
    backgroundColor: "#F6FBFA",
  },

  modalHeader: {
    height: 118,
    backgroundColor: "#00796B",
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    paddingTop: 46,
    paddingHorizontal: 18,
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },

  modalBackButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
  },

  modalTitle: {
    fontSize: 24,
    color: "#FFFFFF",
    fontWeight: "900",
  },

  modalSubtitle: {
    marginTop: 2,
    fontSize: 13,
    color: "#E0FFFA",
    fontWeight: "700",
  },

  modalScroll: {
    flex: 1,
  },

  modalContent: {
    padding: 18,
    paddingBottom: 40,
  },

  inputLabel: {
    fontSize: 13,
    color: "#0F172A",
    fontWeight: "900",
    marginBottom: 8,
  },

  tipoGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginBottom: 18,
  },

  tipoButton: {
    width: "47%",
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#D9F3EF",
    borderRadius: 20,
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },

  tipoButtonActive: {
    backgroundColor: "#00796B",
    borderColor: "#00796B",
  },

  tipoButtonText: {
    color: "#00796B",
    fontSize: 13,
    fontWeight: "900",
  },

  tipoButtonTextActive: {
    color: "#FFFFFF",
  },

  inputGroup: {
    marginBottom: 14,
  },

  input: {
    minHeight: 54,
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#D9F3EF",
    paddingHorizontal: 14,
    fontSize: 15,
    color: "#0F172A",
    fontWeight: "700",
  },

  inputMultiline: {
    minHeight: 96,
    paddingTop: 14,
    textAlignVertical: "top",
  },

  scoreHint: {
    flexDirection: "row",
    gap: 8,
    backgroundColor: "#E0F5F2",
    borderRadius: 18,
    padding: 14,
    marginBottom: 18,
  },

  scoreHintText: {
    flex: 1,
    color: "#00796B",
    fontSize: 12,
    fontWeight: "800",
    lineHeight: 18,
  },

  saveButton: {
    backgroundColor: "#00796B",
    borderRadius: 20,
    paddingVertical: 16,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
  },

  saveButtonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "900",
  },
  deleteHistoryButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "#FEF2F2",
    alignItems: "center",
    justifyContent: "center",
  },
});
