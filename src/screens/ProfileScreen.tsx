import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect } from "@react-navigation/native";
import React, { useCallback, useEffect, useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import {
  useOwnerProfile,
  useUpdateOwnerProfile,
} from "../hooks/useOwnerProfile";
import {
  ActivityIndicator,
  Alert,
  Modal,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

const PLANO_KEY = "@clyvocare_plano_atual";

type CicloPlano = "mensal" | "anual";

type PerfilUsuario = {
  nome: string;
  telefone: string;
  documento: string;
  cidade: string;
  cadastradoEm: string;
};

type PlanoSalvo = {
  id?: string;
  planoId?: string;
  nome?: string;
  ciclo: CicloPlano;
  preco?: string;
  adquiridoEm?: string;
  dataContratacao?: string;
};

type PlanoOpcao = {
  id: string;
  nome: string;
  subtitulo: string;
  precoMensal: string;
  precoAnual: string;
  descricao: string;
};

const PLANOS: PlanoOpcao[] = [
  {
    id: "basico",
    nome: "Básico",
    subtitulo: "Para rotina essencial",
    precoMensal: "R$ 39,90",
    precoAnual: "R$ 399,90",
    descricao: "Ideal para organizar vacinas, consultas e histórico do pet.",
  },
  {
    id: "pro",
    nome: "Pro",
    subtitulo: "Para cuidado inteligente",
    precoMensal: "R$ 59,90",
    precoAnual: "R$ 599,90",
    descricao:
      "Inclui alertas inteligentes, recomendações e relatórios mensais.",
  },
  {
    id: "premium",
    nome: "Premium",
    subtitulo: "Para cuidado completo",
    precoMensal: "R$ 89,90",
    precoAnual: "R$ 899,90",
    descricao:
      "Plano mais completo, com prioridade, suporte e histórico avançado.",
  },
];

const perfilVazio: PerfilUsuario = {
  nome: "",
  telefone: "",
  documento: "",
  cidade: "",
  cadastradoEm: "",
};

function getPlanoId(planoAtual: PlanoSalvo | null) {
  return planoAtual?.planoId || planoAtual?.id || "";
}

function getPlanoNome(planoAtual: PlanoSalvo | null) {
  const planoId = getPlanoId(planoAtual);

  return (
    planoAtual?.nome ||
    PLANOS.find((plano) => plano.id === planoId)?.nome ||
    "Plano ativo"
  );
}

export default function ProfileScreen({ navigation, route }: any) {
  const { logout } = useAuth();
  const {
    data: ownerProfile,
    isLoading: carregandoPerfil,
    isError: erroPerfil,
    refetch: recarregarPerfil,
  } = useOwnerProfile();
  const atualizarPerfil = useUpdateOwnerProfile();

  const [perfil, setPerfil] = useState<PerfilUsuario>(perfilVazio);
  const [perfilTemp, setPerfilTemp] = useState<PerfilUsuario>(perfilVazio);

  const [planoAtual, setPlanoAtual] = useState<PlanoSalvo | null>(null);
  const [modalPerfilVisivel, setModalPerfilVisivel] = useState(false);
  const [modalPlanoVisivel, setModalPlanoVisivel] = useState(false);
  const [cicloPlano, setCicloPlano] = useState<CicloPlano>("mensal");

  const carregarDados = useCallback(async () => {
    try {
      const planoSalvo = await AsyncStorage.getItem(PLANO_KEY);
      if (planoSalvo) {
        setPlanoAtual(JSON.parse(planoSalvo));
      } else {
        setPlanoAtual(null);
      }
    } catch {
      setPlanoAtual(null);
    }
  }, []);

  useEffect(() => {
    if (!ownerProfile) return;

    const perfilDaApi: PerfilUsuario = {
      nome: ownerProfile.name,
      telefone: ownerProfile.phone,
      documento: ownerProfile.document,
      cidade: ownerProfile.cityName ?? "",
      cadastradoEm: ownerProfile.registeredAt,
    };

    setPerfil(perfilDaApi);
    setPerfilTemp(perfilDaApi);
  }, [ownerProfile]);

  useFocusEffect(
    useCallback(() => {
      void carregarDados();
      void recarregarPerfil();

      if (route?.params?.abrirPlanos) {
        setModalPlanoVisivel(true);
        navigation.setParams({ abrirPlanos: false });
      }
    }, [carregarDados, navigation, recarregarPerfil, route?.params?.abrirPlanos]),
  );

  const perfilCriado = perfil.nome.trim().length > 0;
  const usuarioAutenticado = Boolean(ownerProfile);

  async function abrirAutenticacao() {
  try {
    await logout();
  } catch {
    Alert.alert("Erro", "Não foi possível abrir a tela de login.");
  }
}
  function abrirModalPerfil() {
    if (!usuarioAutenticado) {
      abrirAutenticacao();
      return;
    }

    setPerfilTemp(perfil);
    setModalPerfilVisivel(true);
  }

  async function salvarPerfil() {
    if (!usuarioAutenticado) {
      abrirAutenticacao();
      return;
    }

    if (!perfilTemp.nome.trim()) {
      Alert.alert("Atenção", "Digite pelo menos o nome do tutor.");
      return;
    }

    if (!perfilTemp.telefone.trim()) {
      Alert.alert("Atenção", "Digite o telefone do tutor.");
      return;
    }

    try {
      const perfilAtualizado = await atualizarPerfil.mutateAsync({
        name: perfilTemp.nome.trim(),
        phone: perfilTemp.telefone.trim(),
        cityId: null,
      });

      const perfilFormatado: PerfilUsuario = {
        nome: perfilAtualizado.name,
        telefone: perfilAtualizado.phone,
        documento: perfilAtualizado.document,
        cidade: perfilAtualizado.cityName ?? "",
        cadastradoEm: perfilAtualizado.registeredAt,
      };

      setPerfil(perfilFormatado);
      setPerfilTemp(perfilFormatado);
      setModalPerfilVisivel(false);

      Alert.alert("Perfil salvo", "Seu perfil foi atualizado com sucesso.");
    } catch {
      Alert.alert("Erro", "Não foi possível salvar o perfil.");
    }
  }

  async function alterarPlano(plano: PlanoOpcao) {
    const preco =
      cicloPlano === "mensal" ? plano.precoMensal : plano.precoAnual;

    const agora = new Date().toISOString();

    const novoPlano: PlanoSalvo = {
      id: plano.id,
      planoId: plano.id,
      nome: plano.nome,
      ciclo: cicloPlano,
      preco,
      adquiridoEm: agora,
      dataContratacao: agora,
    };

    try {
      await AsyncStorage.setItem(PLANO_KEY, JSON.stringify(novoPlano));
      setPlanoAtual(novoPlano);
      setModalPlanoVisivel(false);

      Alert.alert(
        "Plano adquirido",
        `Você agora está usando o plano ${plano.nome} ${
          cicloPlano === "mensal" ? "mensal" : "anual"
        }.`,
      );
    } catch {
      Alert.alert("Erro", "Não foi possível alterar o plano.");
    }
  }

  async function removerPlano() {
    Alert.alert("Remover plano", "Deseja realmente remover seu plano atual?", [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Remover",
        style: "destructive",
        onPress: async () => {
          try {
            await AsyncStorage.removeItem(PLANO_KEY);

            setPlanoAtual(null);
            setModalPlanoVisivel(false);

            Alert.alert("Pronto", "Plano removido com sucesso.");
          } catch {
            Alert.alert("Erro", "Não foi possível remover o plano.");
          }
        },
      },
    ]);
  }

  function getIniciais() {
    if (!perfil.nome.trim()) return "👤";

    const partes = perfil.nome.trim().split(" ");

    if (partes.length === 1) {
      return partes[0].charAt(0).toUpperCase();
    }

    return `${partes[0].charAt(0)}${partes[partes.length - 1].charAt(
      0,
    )}`.toUpperCase();
  }

  async function executarLogout() {
    try {
      await logout();
    } catch {
      Alert.alert("Erro", "Não foi possível encerrar sua sessão.");
    }
  }

  function sairDaConta() {
    if (Platform.OS === "web") {
      void executarLogout();
      return;
    }

    Alert.alert(
      "Sair da conta",
      "Deseja realmente encerrar sua sessão no ClyvoCare?",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Sair",
          style: "destructive",
          onPress: () => void executarLogout(),
        },
      ],
    );
  }

  if (carregandoPerfil) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0F766E" />
        <Text style={styles.loadingText}>Carregando seu perfil...</Text>
      </View>
    );
  }

  return (
    <>
      <StatusBar barStyle="light-content" backgroundColor="#0F766E" />

      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <View style={styles.headerBlobOne} />
          <View style={styles.headerBlobTwo} />

          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation?.goBack?.()}
            activeOpacity={0.85}
          >
            <Ionicons name="arrow-back" size={22} color="#0F766E" />
          </TouchableOpacity>

          <View style={styles.headerTextBox}>
            <Text style={styles.headerTitle}>Meu Perfil</Text>
            <Text style={styles.headerSubtitle}>
              Gerencie seus dados, pets e plano ClyvoCare
            </Text>
          </View>
        </View>

        {erroPerfil && !usuarioAutenticado && (
          <View style={styles.visitorCard}>
            <View style={styles.visitorIconBox}>
              <Ionicons name="person-outline" size={25} color="#0F766E" />
            </View>

            <View style={styles.visitorTextBox}>
              <Text style={styles.visitorTitle}>Você está como visitante</Text>
              <Text style={styles.visitorText}>
                Explore o ClyvoCare livremente. Entre para visualizar e editar
                seus dados pessoais.
              </Text>
            </View>

            <TouchableOpacity
              style={styles.visitorButton}
              onPress={abrirAutenticacao}
              activeOpacity={0.9}
            >
              <Text style={styles.visitorButtonText}>Entrar</Text>
            </TouchableOpacity>
          </View>
        )}

        {erroPerfil && usuarioAutenticado && (
          <View style={styles.connectionWarning}>
            <Ionicons name="cloud-offline-outline" size={22} color="#B45309" />
            <View style={styles.connectionWarningTextBox}>
              <Text style={styles.connectionWarningTitle}>
                Não foi possível atualizar agora
              </Text>
              <Text style={styles.connectionWarningText}>
                Seus últimos dados continuam disponíveis.
              </Text>
            </View>
            <TouchableOpacity onPress={() => void recarregarPerfil()}>
              <Text style={styles.connectionRetryText}>Tentar</Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.profileCard}>
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarText}>{getIniciais()}</Text>
          </View>

          <Text style={styles.name}>
            {perfilCriado ? perfil.nome : "Visitante"}
          </Text>

          <Text style={styles.email}>
            {usuarioAutenticado
              ? `CPF: ${perfil.documento || "Não informado"}`
              : "Entre para acessar seus dados pessoais"}
          </Text>

          <TouchableOpacity
            style={styles.editProfileButton}
            onPress={usuarioAutenticado ? abrirModalPerfil : abrirAutenticacao}
            activeOpacity={0.9}
          >
            <Ionicons
              name={usuarioAutenticado ? "create-outline" : "log-in-outline"}
              size={18}
              color="#FFFFFF"
            />
            <Text style={styles.editProfileButtonText}>
              {usuarioAutenticado ? "Editar perfil" : "Entrar ou criar conta"}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.resumeGrid}>
          <View style={styles.resumeCard}>
            <View style={styles.resumeIcon}>
              <Ionicons name="paw-outline" size={24} color="#0F766E" />
            </View>

            <Text style={styles.resumeNumber}>{ownerProfile?.petCount ?? 0}</Text>
            <Text style={styles.resumeLabel}>
              {ownerProfile?.petCount === 1
                ? "pet cadastrado"
                : "pets cadastrados"}
            </Text>
          </View>

          <View style={styles.resumeCard}>
            <View style={styles.resumeIcon}>
              <MaterialCommunityIcons
                name="crown-outline"
                size={24}
                color="#0F766E"
              />
            </View>

            <Text style={styles.resumeNumber}>
              {planoAtual ? getPlanoNome(planoAtual) : "Sem"}
            </Text>
            <Text style={styles.resumeLabel}>plano atual</Text>
          </View>
        </View>

        <View style={styles.infoCard}>
          <View style={styles.cardTitleRow}>
            <Text style={styles.cardTitle}>Informações pessoais</Text>

            <TouchableOpacity onPress={abrirModalPerfil} activeOpacity={0.8}>
              <Text style={styles.cardAction}>Editar</Text>
            </TouchableOpacity>
          </View>

          <InfoRow
            icon="person-outline"
            label="Nome"
            value={perfil.nome || "Não informado"}
          />

          <InfoRow
            icon="document-text-outline"
            label="Documento"
            value={perfil.documento || "Não informado"}
          />

          <InfoRow
            icon="call-outline"
            label="Telefone"
            value={perfil.telefone || "Não informado"}
          />

          <InfoRow
            icon="location-outline"
            label="Cidade"
            value={perfil.cidade || "Não informada"}
          />

          <InfoRow
            icon="calendar-outline"
            label="Cadastro"
            value={perfil.cadastradoEm || "Não informado"}
          />
        </View>

        <View style={styles.planCard}>
          <View style={styles.planTop}>
            <View style={{ flex: 1 }}>
              <Text style={styles.planCardTitle}>Plano ClyvoCare</Text>
              <Text style={styles.planSubtitle}>
                Você pode alterar seu plano quando quiser
              </Text>
            </View>

            <View style={styles.planIconBox}>
              <MaterialCommunityIcons
                name="crown-outline"
                size={26}
                color="#FFFFFF"
              />
            </View>
          </View>

          {planoAtual ? (
            <View style={styles.currentPlanBox}>
              <Text style={styles.currentPlanLabel}>Plano atual</Text>
              <Text style={styles.currentPlanName}>
                ClyvoCare {getPlanoNome(planoAtual)}
              </Text>
              <Text style={styles.currentPlanPrice}>
                {planoAtual.preco} /{" "}
                {planoAtual.ciclo === "mensal" ? "mês" : "ano"}
              </Text>

              <View style={styles.activeBadge}>
                <Ionicons name="checkmark-circle" size={16} color="#0F766E" />
                <Text style={styles.activeBadgeText}>Plano adquirido</Text>
              </View>
            </View>
          ) : (
            <View style={styles.noPlanBox}>
              <Ionicons name="alert-circle-outline" size={22} color="#D97706" />
              <Text style={styles.noPlanText}>
                Você ainda não possui um plano ativo.
              </Text>
            </View>
          )}

          <TouchableOpacity
            style={styles.changePlanButton}
            onPress={() => setModalPlanoVisivel(true)}
            activeOpacity={0.9}
          >
            <Text style={styles.changePlanButtonText}>
              {planoAtual ? "Alterar plano" : "Escolher plano"}
            </Text>
            <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        <View style={styles.actionsCard}>
          <Text style={styles.cardTitle}>Ações rápidas</Text>

          <ActionButton
            icon="paw-outline"
            title="Meus pets"
            subtitle="Ver ou cadastrar novos pets"
            onPress={() => navigation?.navigate?.("Pets")}
          />

          <ActionButton
            icon="calendar-outline"
            title="Agenda"
            subtitle="Consultar vacinas e consultas"
            onPress={() => navigation?.navigate?.("Agenda")}
          />

          <ActionButton
            icon="notifications-outline"
            title="Alertas IA"
            subtitle="Acompanhar recomendações inteligentes"
            onPress={() => navigation?.navigate?.("IA")}
          />
        </View>

        <TouchableOpacity
          style={[
            styles.logoutButton,
            !usuarioAutenticado && styles.loginButton,
          ]}
          onPress={usuarioAutenticado ? sairDaConta : abrirAutenticacao}
          activeOpacity={0.9}
        >
          <Ionicons
            name={usuarioAutenticado ? "log-out-outline" : "log-in-outline"}
            size={20}
            color={usuarioAutenticado ? "#EF4444" : "#FFFFFF"}
          />
          <Text
            style={[
              styles.logoutButtonText,
              !usuarioAutenticado && styles.loginButtonText,
            ]}
          >
            {usuarioAutenticado ? "Sair da conta" : "Entrar ou criar uma conta"}
          </Text>
        </TouchableOpacity>
      </ScrollView>

      <Modal visible={modalPerfilVisivel} animationType="slide">
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity
              style={styles.modalBackButton}
              onPress={() => setModalPerfilVisivel(false)}
              activeOpacity={0.85}
            >
              <Ionicons name="arrow-back" size={22} color="#0F766E" />
            </TouchableOpacity>

            <View style={{ flex: 1 }}>
              <Text style={styles.modalTitle}>Editar perfil</Text>
              <Text style={styles.modalSubtitle}>Atualize os dados do tutor</Text>
            </View>
          </View>

          <ScrollView
            style={styles.modalScroll}
            contentContainerStyle={styles.modalContent}
            showsVerticalScrollIndicator={false}
          >
            <InputField
              label="Nome do tutor"
              placeholder="Ex: Marina Magalhães"
              value={perfilTemp.nome}
              onChangeText={(text) =>
                setPerfilTemp((prev) => ({ ...prev, nome: text }))
              }
              icon="person-outline"
            />

            <InputField
              label="Telefone"
              placeholder="Ex: (11) 99999-9999"
              value={perfilTemp.telefone}
              onChangeText={(text) =>
                setPerfilTemp((prev) => ({ ...prev, telefone: text }))
              }
              icon="call-outline"
              keyboardType="phone-pad"
            />

            <TouchableOpacity
              style={[
                styles.saveButton,
                atualizarPerfil.isPending && styles.saveButtonDisabled,
              ]}
              onPress={salvarPerfil}
              disabled={atualizarPerfil.isPending}
              activeOpacity={0.9}
            >
              {atualizarPerfil.isPending ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <>
                  <Ionicons name="save-outline" size={20} color="#FFFFFF" />
                  <Text style={styles.saveButtonText}>Salvar perfil</Text>
                </>
              )}
            </TouchableOpacity>
          </ScrollView>
        </View>
      </Modal>

      <Modal visible={modalPlanoVisivel} animationType="slide">
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity
              style={styles.modalBackButton}
              onPress={() => setModalPlanoVisivel(false)}
              activeOpacity={0.85}
            >
              <Ionicons name="arrow-back" size={22} color="#0F766E" />
            </TouchableOpacity>

            <View style={{ flex: 1 }}>
              <Text style={styles.modalTitle}>Alterar plano</Text>
              <Text style={styles.modalSubtitle}>
                Escolha o melhor cuidado para seu pet
              </Text>
            </View>
          </View>

          <ScrollView
            style={styles.modalScroll}
            contentContainerStyle={styles.modalContent}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.cicloBox}>
              <TouchableOpacity
                style={[
                  styles.cicloButton,
                  cicloPlano === "mensal" && styles.cicloButtonActive,
                ]}
                onPress={() => setCicloPlano("mensal")}
                activeOpacity={0.85}
              >
                <Text
                  style={[
                    styles.cicloButtonText,
                    cicloPlano === "mensal" && styles.cicloButtonTextActive,
                  ]}
                >
                  Mensal
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.cicloButton,
                  cicloPlano === "anual" && styles.cicloButtonActive,
                ]}
                onPress={() => setCicloPlano("anual")}
                activeOpacity={0.85}
              >
                <Text
                  style={[
                    styles.cicloButtonText,
                    cicloPlano === "anual" && styles.cicloButtonTextActive,
                  ]}
                >
                  Anual
                </Text>
              </TouchableOpacity>
            </View>

            {PLANOS.map((plano) => {
              const planoSelecionado = getPlanoId(planoAtual) === plano.id;
              const preco =
                cicloPlano === "mensal" ? plano.precoMensal : plano.precoAnual;

              return (
                <View
                  key={plano.id}
                  style={[
                    styles.planOptionCard,
                    planoSelecionado && styles.planOptionCardActive,
                  ]}
                >
                  <View style={styles.planOptionTop}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.planOptionName}>
                        ClyvoCare {plano.nome}
                      </Text>
                      <Text style={styles.planOptionSubtitle}>
                        {plano.subtitulo}
                      </Text>
                    </View>

                    <View style={styles.planOptionIcon}>
                      <MaterialCommunityIcons
                        name={
                          plano.id === "premium"
                            ? "crown"
                            : plano.id === "pro"
                              ? "heart-pulse"
                              : "paw-outline"
                        }
                        size={26}
                        color="#0F766E"
                      />
                    </View>
                  </View>

                  <Text style={styles.planOptionDescription}>
                    {plano.descricao}
                  </Text>

                  <View style={styles.planPriceRow}>
                    <Text style={styles.planPrice}>{preco}</Text>
                    <Text style={styles.planPeriod}>
                      /{cicloPlano === "mensal" ? "mês" : "ano"}
                    </Text>
                  </View>

                  <TouchableOpacity
                    style={[
                      styles.subscribeButton,
                      planoSelecionado && styles.subscribeButtonActive,
                    ]}
                    onPress={() => {
                      if (!planoSelecionado) {
                        alterarPlano(plano);
                      }
                    }}
                    activeOpacity={0.9}
                  >
                    <Text style={styles.subscribeButtonText}>
                      {planoSelecionado
                        ? "Plano adquirido"
                        : `Assinar ${plano.nome}`}
                    </Text>
                  </TouchableOpacity>
                </View>
              );
            })}

            {planoAtual && (
              <TouchableOpacity
                style={styles.removePlanButton}
                onPress={removerPlano}
                activeOpacity={0.9}
              >
                <Ionicons name="trash-outline" size={18} color="#EF4444" />
                <Text style={styles.removePlanButtonText}>Remover plano</Text>
              </TouchableOpacity>
            )}
          </ScrollView>
        </View>
      </Modal>
    </>
  );
}

function InfoRow({
  icon,
  label,
  value,
}: {
  icon: any;
  label: string;
  value: string;
}) {
  return (
    <View style={styles.infoRow}>
      <View style={styles.infoIcon}>
        <Ionicons name={icon} size={20} color="#0F766E" />
      </View>

      <View style={{ flex: 1 }}>
        <Text style={styles.infoLabel}>{label}</Text>
        <Text style={styles.infoValue}>{value}</Text>
      </View>
    </View>
  );
}

function ActionButton({
  icon,
  title,
  subtitle,
  onPress,
}: {
  icon: any;
  title: string;
  subtitle: string;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      style={styles.actionButton}
      onPress={onPress}
      activeOpacity={0.85}
    >
      <View style={styles.actionIcon}>
        <Ionicons name={icon} size={22} color="#0F766E" />
      </View>

      <View style={{ flex: 1 }}>
        <Text style={styles.actionTitle}>{title}</Text>
        <Text style={styles.actionSubtitle}>{subtitle}</Text>
      </View>

      <Ionicons name="chevron-forward" size={20} color="#94A3B8" />
    </TouchableOpacity>
  );
}

function InputField({
  label,
  placeholder,
  value,
  onChangeText,
  icon,
  keyboardType,
  maxLength,
}: {
  label: string;
  placeholder: string;
  value: string;
  onChangeText: (text: string) => void;
  icon: any;
  keyboardType?: any;
  maxLength?: number;
}) {
  return (
    <View style={styles.inputGroup}>
      <Text style={styles.inputLabel}>{label}</Text>

      <View style={styles.inputBox}>
        <Ionicons name={icon} size={20} color="#0F766E" />

        <TextInput
          style={styles.input}
          placeholder={placeholder}
          placeholderTextColor="#CBD5E1"
          value={value}
          onChangeText={onChangeText}
          keyboardType={keyboardType}
          maxLength={maxLength}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 28,
    backgroundColor: "#F6FBFA",
  },

  loadingText: {
    marginTop: 12,
    color: "#475569",
    fontSize: 15,
    fontWeight: "700",
  },

  errorTitle: {
    marginTop: 14,
    color: "#0F172A",
    fontSize: 18,
    fontWeight: "900",
    textAlign: "center",
  },

  errorText: {
    marginTop: 8,
    color: "#64748B",
    fontSize: 14,
    lineHeight: 20,
    textAlign: "center",
  },

  retryButton: {
    marginTop: 18,
    borderRadius: 16,
    paddingHorizontal: 22,
    paddingVertical: 13,
    backgroundColor: "#0F766E",
  },

  retryButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "900",
  },

  visitorCard: {
    marginHorizontal: 18,
    marginTop: 16,
    padding: 16,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "#99F6E4",
    backgroundColor: "#ECFDF5",
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },

  visitorIconBox: {
    width: 48,
    height: 48,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#CCFBF1",
  },

  visitorTextBox: {
    flex: 1,
  },

  visitorTitle: {
    color: "#134E4A",
    fontSize: 14,
    fontWeight: "900",
  },

  visitorText: {
    marginTop: 3,
    color: "#47736F",
    fontSize: 11,
    lineHeight: 16,
    fontWeight: "600",
  },

  visitorButton: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 14,
    backgroundColor: "#0F766E",
  },

  visitorButtonText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "900",
  },

  connectionWarning: {
    marginHorizontal: 18,
    marginTop: 16,
    padding: 14,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#FCD34D",
    backgroundColor: "#FFFBEB",
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },

  connectionWarningTextBox: {
    flex: 1,
  },

  connectionWarningTitle: {
    color: "#92400E",
    fontSize: 13,
    fontWeight: "900",
  },

  connectionWarningText: {
    marginTop: 2,
    color: "#A16207",
    fontSize: 11,
    fontWeight: "600",
  },

  connectionRetryText: {
    color: "#92400E",
    fontSize: 12,
    fontWeight: "900",
  },

  container: {
    flex: 1,
    backgroundColor: "#F6FBFA",
  },

  content: {
    paddingBottom: 40,
  },

  header: {
    height: 115,
    backgroundColor: "#0F766E",
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    paddingTop: 34,
    paddingHorizontal: 18,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    overflow: "hidden",
  },

  headerBlobOne: {
    position: "absolute",
    width: 170,
    height: 170,
    borderRadius: 85,
    backgroundColor: "rgba(255,255,255,0.12)",
    top: -70,
    right: -30,
  },

  headerBlobTwo: {
    position: "absolute",
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "rgba(255,255,255,0.10)",
    bottom: -45,
    left: 70,
  },

  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 2,
  },

  headerTextBox: {
    flex: 1,
    zIndex: 2,
  },

  headerTitle: {
    fontSize: 24,
    fontWeight: "900",
    color: "#FFFFFF",
    letterSpacing: -0.5,
  },

  headerSubtitle: {
    marginTop: 2,
    fontSize: 11,
    color: "#ECFFFB",
    fontWeight: "700",
    lineHeight: 15,
  },

  profileCard: {
    marginHorizontal: 18,
    marginTop: 10,
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    paddingVertical: 14,
    paddingHorizontal: 18,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E2F8F5",
    shadowColor: "#0F766E",
    shadowOpacity: 0.07,
    shadowRadius: 12,
    elevation: 3,
  },

  avatarCircle: {
    width: 74,
    height: 74,
    borderRadius: 37,
    backgroundColor: "#E0F5F2",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 3,
    borderColor: "#B2EEEA",
    marginBottom: 8,
  },

  avatarText: {
    fontSize: 27,
    fontWeight: "900",
    color: "#0F766E",
  },

  name: {
    fontSize: 21,
    fontWeight: "900",
    color: "#0F172A",
    letterSpacing: -0.4,
  },

  email: {
    marginTop: 3,
    fontSize: 12,
    color: "#64748B",
    fontWeight: "700",
  },

  editProfileButton: {
    marginTop: 14,
    backgroundColor: "#0F766E",
    paddingHorizontal: 18,
    paddingVertical: 11,
    borderRadius: 999,
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
  },

  editProfileButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "900",
  },

  resumeGrid: {
    flexDirection: "row",
    gap: 12,
    marginHorizontal: 18,
    marginTop: 12,
  },

  resumeCard: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    padding: 18,
    borderWidth: 1,
    borderColor: "#E2F8F5",
  },

  resumeIcon: {
    width: 46,
    height: 46,
    borderRadius: 16,
    backgroundColor: "#E0F5F2",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },

  resumeNumber: {
    fontSize: 22,
    fontWeight: "900",
    color: "#0F172A",
  },

  resumeLabel: {
    marginTop: 3,
    fontSize: 12,
    color: "#64748B",
    fontWeight: "700",
  },

  infoCard: {
    marginHorizontal: 18,
    marginTop: 16,
    backgroundColor: "#FFFFFF",
    borderRadius: 28,
    padding: 20,
    borderWidth: 1,
    borderColor: "#E2F8F5",
  },

  cardTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },

  cardTitle: {
    fontSize: 19,
    fontWeight: "900",
    color: "#0F172A",
    letterSpacing: -0.3,
  },

  cardAction: {
    fontSize: 13,
    fontWeight: "900",
    color: "#0F766E",
  },

  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 13,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },

  infoIcon: {
    width: 42,
    height: 42,
    borderRadius: 15,
    backgroundColor: "#E0F5F2",
    alignItems: "center",
    justifyContent: "center",
  },

  infoLabel: {
    fontSize: 12,
    color: "#94A3B8",
    fontWeight: "800",
  },

  infoValue: {
    marginTop: 2,
    fontSize: 15,
    color: "#0F172A",
    fontWeight: "900",
  },

  planCard: {
    marginHorizontal: 18,
    marginTop: 16,
    backgroundColor: "#0F172A",
    borderRadius: 30,
    padding: 22,
    overflow: "hidden",
  },

  planTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
    marginBottom: 18,
  },

  planCardTitle: {
    fontSize: 19,
    fontWeight: "900",
    color: "#FFFFFF",
    letterSpacing: -0.3,
  },

  planSubtitle: {
    marginTop: 4,
    color: "#CBD5E1",
    fontSize: 13,
    fontWeight: "600",
    lineHeight: 19,
  },

  planIconBox: {
    width: 54,
    height: 54,
    borderRadius: 19,
    backgroundColor: "#0F766E",
    alignItems: "center",
    justifyContent: "center",
  },

  currentPlanBox: {
    backgroundColor: "rgba(255,255,255,0.08)",
    borderRadius: 22,
    padding: 18,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },

  currentPlanLabel: {
    fontSize: 12,
    color: "#94A3B8",
    fontWeight: "800",
  },

  currentPlanName: {
    marginTop: 4,
    fontSize: 24,
    color: "#FFFFFF",
    fontWeight: "900",
  },

  currentPlanPrice: {
    marginTop: 4,
    fontSize: 14,
    color: "#CCFBF1",
    fontWeight: "800",
  },

  activeBadge: {
    marginTop: 14,
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#CCFBF1",
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 999,
  },

  activeBadgeText: {
    color: "#0F766E",
    fontSize: 12,
    fontWeight: "900",
  },

  noPlanBox: {
    backgroundColor: "rgba(251,191,36,0.13)",
    borderRadius: 20,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },

  noPlanText: {
    flex: 1,
    color: "#FDE68A",
    fontSize: 13,
    fontWeight: "800",
    lineHeight: 18,
  },

  changePlanButton: {
    marginTop: 18,
    backgroundColor: "#0F766E",
    borderRadius: 18,
    paddingVertical: 15,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
  },

  changePlanButtonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "900",
  },

  actionsCard: {
    marginHorizontal: 18,
    marginTop: 16,
    backgroundColor: "#FFFFFF",
    borderRadius: 28,
    padding: 20,
    borderWidth: 1,
    borderColor: "#E2F8F5",
  },

  actionButton: {
    marginTop: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 14,
    backgroundColor: "#F8FFFE",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#E2F8F5",
  },

  actionIcon: {
    width: 44,
    height: 44,
    borderRadius: 15,
    backgroundColor: "#E0F5F2",
    alignItems: "center",
    justifyContent: "center",
  },

  actionTitle: {
    fontSize: 15,
    fontWeight: "900",
    color: "#0F172A",
  },

  actionSubtitle: {
    marginTop: 2,
    fontSize: 12,
    color: "#64748B",
    fontWeight: "700",
  },

  modalContainer: {
    flex: 1,
    backgroundColor: "#F6FBFA",
  },

  modalHeader: {
    height: 122,
    backgroundColor: "#0F766E",
    paddingTop: 48,
    paddingHorizontal: 20,
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
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
    marginTop: 3,
    fontSize: 13,
    color: "#ECFFFB",
    fontWeight: "700",
  },

  modalScroll: {
    flex: 1,
  },

  modalContent: {
    padding: 18,
    paddingBottom: 40,
  },

  inputGroup: {
    marginBottom: 14,
  },

  inputLabel: {
    fontSize: 13,
    color: "#0F172A",
    fontWeight: "900",
    marginBottom: 7,
  },

  inputBox: {
    height: 54,
    borderRadius: 18,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E2F8F5",
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 14,
  },

  input: {
    flex: 1,
    fontSize: 15,
    color: "#0F172A",
    fontWeight: "700",
  },

  inputRow: {
    flexDirection: "row",
    gap: 10,
  },

  saveButton: {
    marginTop: 10,
    backgroundColor: "#0F766E",
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

  saveButtonDisabled: {
    opacity: 0.65,
  },

  deleteProfileButton: {
    marginTop: 12,
    backgroundColor: "#FEE2E2",
    borderRadius: 20,
    paddingVertical: 15,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
  },

  deleteProfileButtonText: {
    color: "#EF4444",
    fontSize: 14,
    fontWeight: "900",
  },

  logoutButton: {
    marginHorizontal: 18,
    marginTop: 18,
    backgroundColor: "#FEE2E2",
    borderWidth: 1,
    borderColor: "#FCA5A5",
    borderRadius: 20,
    paddingVertical: 15,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
  },

  logoutButtonText: {
    color: "#EF4444",
    fontSize: 14,
    fontWeight: "900",
  },

  loginButton: {
    backgroundColor: "#0F766E",
    borderColor: "#0F766E",
  },

  loginButtonText: {
    color: "#FFFFFF",
  },

  cicloBox: {
    flexDirection: "row",
    backgroundColor: "#E0F5F2",
    padding: 5,
    borderRadius: 999,
    marginBottom: 16,
  },

  cicloButton: {
    flex: 1,
    paddingVertical: 11,
    borderRadius: 999,
    alignItems: "center",
  },

  cicloButtonActive: {
    backgroundColor: "#0F766E",
  },

  cicloButtonText: {
    color: "#0F766E",
    fontSize: 13,
    fontWeight: "900",
  },

  cicloButtonTextActive: {
    color: "#FFFFFF",
  },

  planOptionCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 26,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#E2F8F5",
  },

  planOptionCardActive: {
    borderColor: "#0F766E",
    backgroundColor: "#F0FDFA",
  },

  planOptionTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },

  planOptionName: {
    fontSize: 20,
    fontWeight: "900",
    color: "#0F172A",
  },

  planOptionSubtitle: {
    marginTop: 3,
    fontSize: 12,
    color: "#64748B",
    fontWeight: "800",
  },

  planOptionIcon: {
    width: 52,
    height: 52,
    borderRadius: 18,
    backgroundColor: "#E0F5F2",
    alignItems: "center",
    justifyContent: "center",
  },

  planOptionDescription: {
    marginTop: 14,
    fontSize: 13,
    color: "#64748B",
    fontWeight: "700",
    lineHeight: 20,
  },

  planPriceRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    marginTop: 14,
  },

  planPrice: {
    fontSize: 30,
    fontWeight: "900",
    color: "#0F766E",
    letterSpacing: -0.8,
  },

  planPeriod: {
    fontSize: 13,
    color: "#64748B",
    fontWeight: "800",
    marginBottom: 6,
  },

  subscribeButton: {
    marginTop: 16,
    backgroundColor: "#0F766E",
    borderRadius: 18,
    paddingVertical: 14,
    alignItems: "center",
  },

  subscribeButtonActive: {
    backgroundColor: "#064E4A",
  },

  subscribeButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "900",
  },

  removePlanButton: {
    marginTop: 4,
    borderRadius: 18,
    paddingVertical: 15,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
    backgroundColor: "#FEE2E2",
  },

  removePlanButtonText: {
    color: "#EF4444",
    fontSize: 14,
    fontWeight: "900",
  },
});
