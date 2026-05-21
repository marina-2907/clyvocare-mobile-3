import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ScrollView,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  Image,
  Animated,
  Modal,
} from "react-native";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Svg, {
  Circle,
  Defs,
  LinearGradient,
  Stop,
  Rect,
  Path,
} from "react-native-svg";
import { useFocusEffect } from "@react-navigation/native";

const PETS_KEY = "@clyvocare_pets";
const HOME_PET_KEY = "@clyvocare_home_pet_id";
const PLANO_KEY = "@clyvocare_plano_atual";
const PROFILE_KEY = "@clyvocare_perfil_usuario";

const LOGO = require("../../assets/images/logo-paw.png");

type Vacina = {
  nome: string;
  emDia: boolean;
};

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
  unidadePeso?: "kg" | "g";
  foto?: string | null;
  carteiraVacina?: string | null;
  situacaoVacinal?: SituacaoVacinal;
  castracao?: Castracao;
  observacoes?: string;
  vacinas?: Vacina[];
  scoreManual?: string;
  principal?: boolean;
};

type CicloPlano = "mensal" | "anual";

type PlanoAdquirido = {
  planoId?: string;
  id?: string;
  nome?: string;
  ciclo: CicloPlano;
  preco?: string;
  dataContratacao?: string;
  adquiridoEm?: string;
};

type PerfilUsuario = {
  nome: string;
  email: string;
  telefone?: string;
  cidade?: string;
  estado?: string;
  clinica?: string;
};

type Plano = {
  id: string;
  nome: string;
  subtitulo: string;
  precoMensal: string;
  precoAnual: string;
  economiaAnual: string;
  destaque?: boolean;
  descricao: string;
  beneficios: string[];
};

const CUIDADOS = [
  {
    id: "1",
    titulo: "Vacina pendente",
    data: "Verifique a carteira de vacinação",
    icone: "needle",
    cor: "#F97316",
    bg: "#FFF7ED",
    status: "Atenção",
    statusCor: "#EA580C",
    statusBg: "#FFEDD5",
  },
  {
    id: "2",
    titulo: "Check-up anual",
    data: "Mantenha os exames em dia",
    icone: "stethoscope",
    cor: "#0F766E",
    bg: "#F0FDFA",
    status: "Saúde",
    statusCor: "#0F766E",
    statusBg: "#CCFBF1",
  },
  {
    id: "3",
    titulo: "Vermífugo",
    data: "Acompanhe os cuidados preventivos",
    icone: "pill",
    cor: "#6366F1",
    bg: "#EEF2FF",
    status: "Lembrete",
    statusCor: "#4F46E5",
    statusBg: "#E0E7FF",
  },
];

const ACESSO_RAPIDO = [
  { label: "Agenda", icon: "calendar-outline", screen: "Agenda" },
  { label: "Histórico", icon: "document-text-outline", screen: "Histórico" },
  { label: "Alertas IA", icon: "notifications-outline", screen: "IA" },
  { label: "Meus Pets", icon: "paw-outline", screen: "Pets" },
];

const PLANOS: Plano[] = [
  {
    id: "basico",
    nome: "Básico",
    subtitulo: "Para rotina essencial",
    precoMensal: "R$ 39,90",
    precoAnual: "R$ 399,90",
    economiaAnual: "Economize 2 meses",
    descricao:
      "Ideal para donos que querem organizar vacinas, consultas e cuidados essenciais do pet.",
    beneficios: [
      "Cadastro de até 3 pets",
      "Lembretes de vacinas",
      "Histórico básico de saúde",
      "Agenda de consultas",
      "Alertas de cuidados preventivos",
    ],
  },
  {
    id: "plus",
    nome: "Plus",
    subtitulo: "Para cuidado inteligente",
    precoMensal: "R$ 59,90",
    precoAnual: "R$ 599,90",
    economiaAnual: "Economize 2 meses",
    destaque: true,
    descricao:
      "Plano completo para acompanhar rotina, vacinas, consultas e alertas inteligentes.",
    beneficios: [
      "Cadastro de até 5 pets",
      "Todos os benefícios do Básico",
      "Alertas inteligentes por fase de vida",
      "Recomendações por espécie",
      "Relatório mensal de saúde",
      "Organização de tratamentos",
    ],
  },
  {
    id: "premium",
    nome: "Premium",
    subtitulo: "Para cuidado profissional",
    precoMensal: "R$ 89,90",
    precoAnual: "R$ 899,90",
    economiaAnual: "Economize 2 meses",
    descricao:
      "Para donos e clínicas que querem acompanhamento mais completo, histórico avançado e suporte premium.",
    beneficios: [
      "Pets ilimitados",
      "Todos os benefícios do Plus",
      "Relatório anual completo",
      "Histórico preparado para clínicas",
      "Prioridade em alertas de risco",
      "Suporte premium",
      "Dashboard avançado de acompanhamento",
    ],
  },
];

function getPlanoId(planoAtual: PlanoAdquirido | null) {
  return planoAtual?.planoId || planoAtual?.id || "";
}

function getPlanoNome(planoAtual: PlanoAdquirido | null) {
  const planoId = getPlanoId(planoAtual);
  return (
    planoAtual?.nome ||
    PLANOS.find((plano) => plano.id === planoId)?.nome ||
    "Plano ativo"
  );
}

function getPrimeiroNome(nome?: string) {
  const nomeLimpo = (nome || "").trim();
  if (!nomeLimpo) return "Tutor";
  return nomeLimpo.split(" ")[0];
}

function calcularScore(pet: Pet | null): number {
  if (!pet) return 0;

  const vacinas = pet.vacinas || [];
  const totalVacinas = vacinas.length;
  const vacinasEmDia = vacinas.filter((v) => v.emDia).length;
  const pontosVacina =
    totalVacinas > 0 ? Math.round((vacinasEmDia / totalVacinas) * 40) : 0;

  const idadeNum = parseInt(pet.idade || "0", 10);
  let pontosIdade = 12;

  if (!idadeNum) {
    pontosIdade = 7;
  } else if (idadeNum >= 12) {
    pontosIdade = 6;
  } else if (idadeNum >= 8) {
    pontosIdade = 8;
  }

  const pontosPeso = pet.peso?.trim() ? 10 : 5;
  const pontosCarteira = pet.carteiraVacina ? 13 : 4;

  let penalidadeSituacao = 0;

  if (pet.situacaoVacinal === "sem_carteirinha") penalidadeSituacao = 7;
  if (pet.situacaoVacinal === "historico_desconhecido") penalidadeSituacao = 12;
  if (pet.situacaoVacinal === "resgatado") penalidadeSituacao = 15;

  let penalidadeCastracao = 0;
  const especiePermiteCastracao =
    pet.especieId === "cachorro" || pet.especieId === "gato";

  if (especiePermiteCastracao && pet.castracao === "nao_sei") {
    penalidadeCastracao = 4;
  }

  const textoObs = (pet.observacoes || "").toLowerCase();
  const palavrasDeAtencao = [
    "alergia",
    "alérgico",
    "alergico",
    "convulsão",
    "convulsao",
    "diabetes",
    "cardíaco",
    "cardiaco",
    "rim",
    "renal",
    "tumor",
    "câncer",
    "cancer",
    "asma",
    "epilepsia",
    "doença",
    "doenca",
    "cirurgia",
    "dor",
    "tratamento",
    "ferida",
    "machucado",
    "sarna",
    "carrapato",
    "pulga",
  ];

  const temHistoricoClinico = palavrasDeAtencao.some((palavra) =>
    textoObs.includes(palavra),
  );

  const penalidadeHistorico = temHistoricoClinico ? 8 : 0;

  const score =
    35 +
    pontosVacina +
    pontosIdade +
    pontosPeso +
    pontosCarteira -
    penalidadeSituacao -
    penalidadeCastracao -
    penalidadeHistorico;

  return Math.max(20, Math.min(100, Math.round(score)));
}

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

function getScoreColor(score: number) {
  if (score >= 80) return "#0F766E";
  if (score >= 60) return "#F59E0B";
  return "#EF4444";
}

function getScoreLabel(score: number) {
  if (score >= 80) return "Excelente";
  if (score >= 60) return "Regular";
  return "Atenção";
}

function DonutScore({
  score = 0,
  size = 90,
  color = "#0F766E",
}: {
  score?: number;
  size?: number;
  color?: string;
}) {
  const strokeWidth = 8;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = (score / 100) * circumference;

  return (
    <Svg width={size} height={size}>
      <Circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        stroke="#E2F8F5"
        strokeWidth={strokeWidth}
        fill="none"
      />

      <Circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        stroke={color}
        strokeWidth={strokeWidth}
        fill="none"
        strokeDasharray={`${progress} ${circumference}`}
        strokeLinecap="round"
        rotation="-90"
        origin={`${size / 2}, ${size / 2}`}
      />
    </Svg>
  );
}

function HeaderHero({ navigation, planoAtual, perfilUsuario }: any) {
  return (
    <View style={styles.topHeroWrap}>
      <Svg height="124" width="100%" style={StyleSheet.absoluteFillObject}>
        <Defs>
          <LinearGradient id="heroGrad" x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0" stopColor="#BFF7EE" stopOpacity="1" />
            <Stop offset="0.48" stopColor="#20C7B5" stopOpacity="1" />
            <Stop offset="1" stopColor="#00796B" stopOpacity="1" />
          </LinearGradient>
        </Defs>

        <Rect width="100%" height="124" fill="url(#heroGrad)" />
        <Circle cx="430" cy="-35" r="145" fill="rgba(255,255,255,0.13)" />
        <Circle cx="650" cy="115" r="180" fill="rgba(255,255,255,0.09)" />
        <Circle cx="80" cy="135" r="120" fill="rgba(255,255,255,0.12)" />

        <Path
          d="M0 72 C130 20, 260 95, 410 45 C540 2, 690 42, 780 -20 L780 135 L0 135 Z"
          fill="rgba(255,255,255,0.13)"
        />
      </Svg>

      <View style={styles.topHeroContent}>
        <View style={styles.headerBrand}>
          <View style={styles.headerLogoCircle}>
            <Image
              source={LOGO}
              style={styles.headerLogoImg}
              resizeMode="contain"
            />
          </View>

          <View>
            <Text style={styles.headerBrandName}>ClyvoCare </Text>
          </View>
        </View>

        <TouchableOpacity
          style={styles.headerProfile}
          onPress={() => navigation.navigate("Perfil", { planoAtual })}
          activeOpacity={0.85}
        >
          <View style={styles.headerAvatar}>
            <Ionicons name="person-circle" size={32} color="#00796B" />
          </View>

          <View style={styles.headerProfileTextBox}>
            <Text style={styles.headerProfileName}>
              {getPrimeiroNome(perfilUsuario?.nome)}
            </Text>
            <Text style={styles.headerProfileSub}>Ver perfil</Text>
          </View>

          <Ionicons name="chevron-down" size={20} color="#FFFFFF" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

function PlanoCard({
  plano,
  ciclo,
  onOpen,
  planoAtual,
}: {
  plano: Plano;
  ciclo: CicloPlano;
  onOpen: () => void;
  planoAtual: PlanoAdquirido | null;
}) {
  const preco = ciclo === "mensal" ? plano.precoMensal : plano.precoAnual;
  const periodo = ciclo === "mensal" ? "/mês" : "/ano";
  const planoAdquirido = getPlanoId(planoAtual) === plano.id;

  return (
    <TouchableOpacity
      style={[
        styles.planoCard,
        plano.destaque && styles.planoCardDestaque,
        planoAdquirido && styles.planoCardAdquirido,
      ]}
      activeOpacity={0.9}
      onPress={onOpen}
    >
      {plano.destaque && !planoAdquirido && (
        <View style={styles.planoBadge}>
          <Ionicons name="star" size={12} color="#FFFFFF" />
          <Text style={styles.planoBadgeText}>Mais escolhido</Text>
        </View>
      )}

      {planoAdquirido && (
        <View style={styles.planoAdquiridoBadge}>
          <Ionicons name="checkmark-circle" size={13} color="#FFFFFF" />
          <Text style={styles.planoAdquiridoBadgeText}>
            Plano adquirido •{" "}
            {planoAtual?.ciclo === "mensal" ? "Mensal" : "Anual"}
          </Text>
        </View>
      )}

      <View style={styles.planoTop}>
        <View style={styles.planoIconBox}>
          <MaterialCommunityIcons
            name={
              plano.id === "basico"
                ? "paw-outline"
                : plano.id === "medio"
                  ? "heart-pulse"
                  : "crown-outline"
            }
            size={24}
            color="#0F766E"
          />
        </View>

        <View>
          <Text style={styles.planoNome}>{plano.nome}</Text>
          <Text style={styles.planoSubtitulo}>{plano.subtitulo}</Text>
        </View>
      </View>

      <View style={styles.planoPrecoRow}>
        <Text style={styles.planoPreco}>{preco}</Text>
        <Text style={styles.planoPeriodo}>{periodo}</Text>
      </View>

      {ciclo === "anual" && (
        <Text style={styles.planoEconomia}>{plano.economiaAnual}</Text>
      )}

      <Text style={styles.planoDescricao}>{plano.descricao}</Text>

      <View style={styles.planoBeneficios}>
        {plano.beneficios.slice(0, 4).map((beneficio) => (
          <View key={beneficio} style={styles.planoBeneficioRow}>
            <Ionicons name="checkmark-circle" size={16} color="#0F766E" />
            <Text style={styles.planoBeneficioText}>{beneficio}</Text>
          </View>
        ))}
      </View>

      <View style={styles.planoFooter}>
        <Text style={styles.planoFooterText}>
          {planoAdquirido ? "Alterar plano" : "Ver detalhes"}
        </Text>
        <Ionicons name="arrow-forward" size={15} color="#0F766E" />
      </View>
    </TouchableOpacity>
  );
}

function PlanosSection({
  ciclo,
  setCiclo,
  onOpen,
  planoAtual,
}: {
  ciclo: CicloPlano;
  setCiclo: (ciclo: CicloPlano) => void;
  onOpen: () => void;
  planoAtual: PlanoAdquirido | null;
}) {
  return (
    <View style={styles.planosSection}>
      <View style={styles.planosHeader}>
        <View>
          <View style={styles.planosTag}>
            <MaterialCommunityIcons
              name="crown-outline"
              size={15}
              color="#0F766E"
            />
            <Text style={styles.planosTagText}>Planos ClyvoCare</Text>
          </View>

          <Text style={styles.planosTitulo}>Escolha o cuidado ideal</Text>
          <Text style={styles.planosTexto}>
            {planoAtual
              ? `Plano atual: ${getPlanoNome(planoAtual)} ${planoAtual.ciclo === "mensal" ? "Mensal" : "Anual"}. Você pode alterar quando quiser.`
              : "Planos para donos que querem deixar vacinas, consultas, histórico e alertas sempre organizados."}
          </Text>
        </View>
      </View>

      <View style={styles.cicloBox}>
        <TouchableOpacity
          style={[styles.cicloBtn, ciclo === "mensal" && styles.cicloBtnAtivo]}
          onPress={() => setCiclo("mensal")}
          activeOpacity={0.85}
        >
          <Text
            style={[
              styles.cicloBtnText,
              ciclo === "mensal" && styles.cicloBtnTextAtivo,
            ]}
          >
            Mensal
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.cicloBtn, ciclo === "anual" && styles.cicloBtnAtivo]}
          onPress={() => setCiclo("anual")}
          activeOpacity={0.85}
        >
          <Text
            style={[
              styles.cicloBtnText,
              ciclo === "anual" && styles.cicloBtnTextAtivo,
            ]}
          >
            Anual
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.planosGrid}>
        {PLANOS.map((plano) => (
          <PlanoCard
            key={plano.id}
            plano={plano}
            ciclo={ciclo}
            onOpen={onOpen}
            planoAtual={planoAtual}
          />
        ))}
      </View>
    </View>
  );
}

function PlanosModal({
  visible,
  onClose,
  ciclo,
  setCiclo,
  planoAtual,
  onContratarPlano,
}: {
  visible: boolean;
  onClose: () => void;
  ciclo: CicloPlano;
  setCiclo: (ciclo: CicloPlano) => void;
  planoAtual: PlanoAdquirido | null;
  onContratarPlano: (planoId: string) => void;
}) {
  return (
    <Modal visible={visible} animationType="slide">
      <View style={styles.modalContainer}>
        <StatusBar barStyle="light-content" backgroundColor="#0F766E" />

        <View style={styles.modalHeader}>
          <Svg height="120" width="100%" style={StyleSheet.absoluteFillObject}>
            <Defs>
              <LinearGradient id="modalGrad" x1="0" y1="0" x2="1" y2="1">
                <Stop offset="0" stopColor="#0F766E" stopOpacity="1" />
                <Stop offset="1" stopColor="#14B8A6" stopOpacity="1" />
              </LinearGradient>
            </Defs>

            <Rect width="100%" height="120" fill="url(#modalGrad)" />
            <Circle cx="560" cy="-60" r="160" fill="rgba(255,255,255,0.12)" />
            <Circle cx="90" cy="120" r="120" fill="rgba(255,255,255,0.10)" />
          </Svg>

          <TouchableOpacity
            style={styles.modalBackBtn}
            onPress={onClose}
            activeOpacity={0.85}
          >
            <Ionicons name="arrow-back" size={22} color="#0F766E" />
          </TouchableOpacity>

          <View style={styles.modalHeaderText}>
            <Text style={styles.modalTitle}>Planos ClyvoCare</Text>
            <Text style={styles.modalSubtitle}>
              Volte pela setinha ou escolha um plano
            </Text>
          </View>
        </View>

        <ScrollView
          style={styles.modalScroll}
          contentContainerStyle={styles.modalContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.modalIntroCard}>
            <View style={styles.modalIntroIcon}>
              <MaterialCommunityIcons
                name="heart-pulse"
                size={26}
                color="#0F766E"
              />
            </View>

            <View style={{ flex: 1 }}>
              <Text style={styles.modalIntroTitle}>
                Cuidado contínuo e organizado
              </Text>
              <Text style={styles.modalIntroText}>
                Escolha entre Básico, Plus e Premium. Todos possuem opção mensal
                ou anual.
              </Text>
            </View>
          </View>

          <View style={styles.modalCicloBox}>
            <TouchableOpacity
              style={[
                styles.modalCicloBtn,
                ciclo === "mensal" && styles.modalCicloBtnAtivo,
              ]}
              onPress={() => setCiclo("mensal")}
            >
              <Text
                style={[
                  styles.modalCicloText,
                  ciclo === "mensal" && styles.modalCicloTextAtivo,
                ]}
              >
                Mensal
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.modalCicloBtn,
                ciclo === "anual" && styles.modalCicloBtnAtivo,
              ]}
              onPress={() => setCiclo("anual")}
            >
              <Text
                style={[
                  styles.modalCicloText,
                  ciclo === "anual" && styles.modalCicloTextAtivo,
                ]}
              >
                Anual
              </Text>
            </TouchableOpacity>
          </View>

          {PLANOS.map((plano) => {
            const preco =
              ciclo === "mensal" ? plano.precoMensal : plano.precoAnual;
            const periodo = ciclo === "mensal" ? "/mês" : "/ano";
            const planoAdquirido = getPlanoId(planoAtual) === plano.id;

            return (
              <View
                key={plano.id}
                style={[
                  styles.modalPlanCard,
                  plano.destaque && styles.modalPlanCardDestaque,
                  planoAdquirido && styles.modalPlanCardAdquirido,
                ]}
              >
                {plano.destaque && !planoAdquirido && (
                  <View style={styles.modalPlanBadge}>
                    <Ionicons name="sparkles" size={13} color="#FFFFFF" />
                    <Text style={styles.modalPlanBadgeText}>Recomendado</Text>
                  </View>
                )}

                {planoAdquirido && (
                  <View style={styles.modalPlanoAdquiridoBadge}>
                    <Ionicons
                      name="checkmark-circle"
                      size={14}
                      color="#FFFFFF"
                    />
                    <Text style={styles.modalPlanoAdquiridoText}>
                      Plano adquirido •{" "}
                      {planoAtual?.ciclo === "mensal" ? "Mensal" : "Anual"}
                    </Text>
                  </View>
                )}

                <View style={styles.modalPlanTop}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.modalPlanName}>{plano.nome}</Text>
                    <Text style={styles.modalPlanDesc}>{plano.descricao}</Text>
                  </View>

                  <View style={styles.modalPlanIcon}>
                    <MaterialCommunityIcons
                      name={
                        plano.id === "basico"
                          ? "paw-outline"
                          : plano.id === "plus"
                            ? "heart-pulse"
                            : "crown-outline"
                      }
                      size={28}
                      color="#0F766E"
                    />
                  </View>
                </View>

                <View style={styles.modalPriceRow}>
                  <Text style={styles.modalPlanPrice}>{preco}</Text>
                  <Text style={styles.modalPlanPeriod}>{periodo}</Text>
                </View>

                {ciclo === "anual" && (
                  <Text style={styles.modalEconomy}>{plano.economiaAnual}</Text>
                )}

                <View style={styles.modalBenefits}>
                  {plano.beneficios.map((beneficio) => (
                    <View key={beneficio} style={styles.modalBenefitRow}>
                      <Ionicons
                        name="checkmark-circle"
                        size={18}
                        color="#0F766E"
                      />
                      <Text style={styles.modalBenefitText}>{beneficio}</Text>
                    </View>
                  ))}
                </View>

                <TouchableOpacity
                  style={[
                    styles.modalSubscribeBtn,
                    plano.destaque && styles.modalSubscribeBtnDestaque,
                    planoAdquirido && styles.modalSubscribeBtnAdquirido,
                  ]}
                  activeOpacity={0.9}
                  onPress={() => onContratarPlano(plano.id)}
                >
                  <Text style={styles.modalSubscribeText}>
                    {planoAdquirido
                      ? "Plano adquirido"
                      : `Assinar ${plano.nome} ${ciclo === "mensal" ? "Mensal" : "Anual"}`}
                  </Text>
                </TouchableOpacity>
              </View>
            );
          })}

          <TouchableOpacity
            style={styles.modalReturnBtn}
            onPress={onClose}
            activeOpacity={0.9}
          >
            <Ionicons name="arrow-back" size={18} color="#0F766E" />
            <Text style={styles.modalReturnText}>Voltar para o app</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    </Modal>
  );
}

export default function HomeScreen({ navigation }: any) {
  const [petPrincipal, setPetPrincipal] = useState<Pet | null>(null);
  const [totalPets, setTotalPets] = useState(0);
  const [planosVisiveis, setPlanosVisiveis] = useState(false);
  const [cicloPlano, setCicloPlano] = useState<CicloPlano>("mensal");
  const [planoAtual, setPlanoAtual] = useState<PlanoAdquirido | null>(null);
  const [perfilUsuario, setPerfilUsuario] = useState<PerfilUsuario | null>(
    null,
  );

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(18)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 450,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 450,
        useNativeDriver: true,
      }),
    ]).start();
  }, [fadeAnim, slideAnim]);

  const carregarPerfilUsuario = useCallback(async () => {
    try {
      const storedPerfil = await AsyncStorage.getItem(PROFILE_KEY);

      if (storedPerfil) {
        const perfilSalvo: PerfilUsuario = JSON.parse(storedPerfil);
        setPerfilUsuario(perfilSalvo);
      } else {
        setPerfilUsuario(null);
      }
    } catch {
      setPerfilUsuario(null);
    }
  }, []);

  const carregarPlanoAtual = useCallback(async () => {
    try {
      const storedPlano = await AsyncStorage.getItem(PLANO_KEY);

      if (storedPlano) {
        const planoSalvo: PlanoAdquirido = JSON.parse(storedPlano);
        const planoNormalizado: PlanoAdquirido = {
          ...planoSalvo,
          planoId: planoSalvo.planoId || planoSalvo.id,
          dataContratacao: planoSalvo.dataContratacao || planoSalvo.adquiridoEm,
        };

        setPlanoAtual(planoNormalizado);

        if (planoNormalizado.ciclo) {
          setCicloPlano(planoNormalizado.ciclo);
        }
      } else {
        setPlanoAtual(null);
      }
    } catch {
      setPlanoAtual(null);
    }
  }, []);

  const contratarPlano = useCallback(
    async (planoId: string) => {
      try {
        const planoEscolhido = PLANOS.find((plano) => plano.id === planoId);
        const preco =
          cicloPlano === "mensal"
            ? planoEscolhido?.precoMensal
            : planoEscolhido?.precoAnual;

        const novoPlano: PlanoAdquirido = {
          planoId,
          id: planoId,
          nome: planoEscolhido?.nome,
          ciclo: cicloPlano,
          preco,
          dataContratacao: new Date().toISOString(),
          adquiridoEm: new Date().toISOString(),
        };

        await AsyncStorage.setItem(PLANO_KEY, JSON.stringify(novoPlano));
        setPlanoAtual(novoPlano);
      } catch {
        console.log("Erro ao salvar plano contratado");
      }
    },
    [cicloPlano],
  );

  const carregarPetPrincipal = useCallback(async () => {
    try {
      const stored = await AsyncStorage.getItem(PETS_KEY);
      const homePetId = await AsyncStorage.getItem(HOME_PET_KEY);

      let pets: Pet[] = [];

      if (stored) {
        try {
          pets = JSON.parse(stored);
        } catch {
          pets = [];
        }
      }

      let petDaHome: Pet | null = null;

      if (homePetId) {
        petDaHome = pets.find((pet) => pet.id === homePetId) || null;
      }

      if (!petDaHome) {
        petDaHome = pets.find((pet) => (pet as any).principal) || null;
      }

      if (!petDaHome && pets.length > 0) {
        petDaHome = pets[pets.length - 1];
      }

      if (petDaHome?.id) {
        await AsyncStorage.setItem(HOME_PET_KEY, petDaHome.id);
      }

      setTotalPets(pets.length);
      setPetPrincipal(petDaHome);
    } catch {
      setTotalPets(0);
      setPetPrincipal(null);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      carregarPetPrincipal();
      carregarPlanoAtual();
      carregarPerfilUsuario();
    }, [carregarPetPrincipal, carregarPlanoAtual, carregarPerfilUsuario]),
  );

  const vacinas = petPrincipal?.vacinas || [];
  const totalVacinas = vacinas.length;
  const vacinasEmDia = vacinas.filter((v) => v.emDia).length;

  const progressoVacinas =
    totalVacinas > 0 ? (vacinasEmDia / totalVacinas) * 100 : 0;

  const scorePet = petPrincipal ? calcularScore(petPrincipal) : 0;

  const scoreColor = getScoreColor(scorePet);
  const scoreStatusLabel = getScoreLabel(scorePet);

  return (
    <>
      <ScrollView
        style={styles.container}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <StatusBar barStyle="light-content" backgroundColor="#0F766E" />

        <HeaderHero
          navigation={navigation}
          planoAtual={planoAtual}
          perfilUsuario={perfilUsuario}
        />

        <Animated.View
          style={[
            styles.greetingRow,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          <View>
            <Text style={styles.greeting}>
              Olá, {getPrimeiroNome(perfilUsuario?.nome)}!
            </Text>
            <Text style={styles.greetingSub}>
              {petPrincipal
                ? "Acompanhe a saúde do seu pet em tempo real"
                : "Comece criando o perfil do seu pet"}
            </Text>
          </View>

          <TouchableOpacity
            style={styles.bellBtn}
            onPress={() => navigation.navigate("IA")}
            activeOpacity={0.8}
          >
            <Ionicons name="notifications-outline" size={22} color="#0F766E" />
            <View style={styles.bellDot} />
          </TouchableOpacity>
        </Animated.View>

        {planoAtual && (
          <TouchableOpacity
            style={styles.planoPerfilCard}
            onPress={() => setPlanosVisiveis(true)}
            activeOpacity={0.9}
          >
            <View style={styles.planoPerfilIcon}>
              <MaterialCommunityIcons
                name="crown-outline"
                size={22}
                color="#0F766E"
              />
            </View>

            <View style={{ flex: 1 }}>
              <Text style={styles.planoPerfilLabel}>Seu plano atual</Text>
              <Text style={styles.planoPerfilNome}>
                {getPlanoNome(planoAtual)}{" "}
                {planoAtual.ciclo === "mensal" ? "Mensal" : "Anual"}
              </Text>
            </View>

            <Text style={styles.planoPerfilAlterar}>Alterar</Text>
          </TouchableOpacity>
        )}

        {!petPrincipal ? (
          <Animated.View
            style={[
              styles.emptyHero,
              {
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }],
              },
            ]}
          >
            <View style={styles.heroBlobOne} />
            <View style={styles.heroBlobTwo} />
            <View style={styles.heroBlobThree} />

            <View style={styles.heroContent}>
              <View style={styles.heroTag}>
                <Ionicons name="sparkles-outline" size={15} color="#0F766E" />
                <Text style={styles.heroTagText}>Cuidado inteligente</Text>
              </View>

              <Text style={styles.heroTitle}>
                Organize a saúde do seu pet de forma simples
              </Text>

              <Text style={styles.heroText}>
                Cadastre seu bichinho para acompanhar vacinas, consultas,
                histórico, lembretes, planos e alertas personalizados.
              </Text>

              <View style={styles.heroStatsRow}>
                <View style={styles.heroStatCard}>
                  <View style={styles.heroStatIcon}>
                    <Ionicons
                      name="shield-checkmark-outline"
                      size={20}
                      color="#0F766E"
                    />
                  </View>
                  <Text style={styles.heroStatTitle}>Vacinas</Text>
                  <Text style={styles.heroStatSub}>em dia</Text>
                </View>

                <View style={styles.heroStatCard}>
                  <View style={styles.heroStatIcon}>
                    <Ionicons
                      name="calendar-outline"
                      size={20}
                      color="#0F766E"
                    />
                  </View>
                  <Text style={styles.heroStatTitle}>Agenda</Text>
                  <Text style={styles.heroStatSub}>organizada</Text>
                </View>

                <View style={styles.heroStatCard}>
                  <View style={styles.heroStatIcon}>
                    <MaterialCommunityIcons
                      name="robot-outline"
                      size={20}
                      color="#0F766E"
                    />
                  </View>
                  <Text style={styles.heroStatTitle}>IA</Text>
                  <Text style={styles.heroStatSub}>alertas</Text>
                </View>
              </View>

              <View style={styles.heroButtonsRow}>
                <TouchableOpacity
                  style={styles.heroMainButton}
                  onPress={() => navigation.navigate("Cadastrar Pet")}
                  activeOpacity={0.9}
                >
                  <Ionicons
                    name="add-circle-outline"
                    size={22}
                    color="#FFFFFF"
                  />
                  <Text style={styles.heroMainButtonText}>
                    Criar perfil do pet
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.heroSecondaryButton}
                  onPress={() => navigation.navigate("Pets")}
                  activeOpacity={0.9}
                >
                  <Ionicons name="paw-outline" size={18} color="#0F766E" />
                  <Text style={styles.heroSecondaryButtonText}>
                    Ver meus pets
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </Animated.View>
        ) : (
          <>
            <Animated.View
              style={[
                {
                  opacity: fadeAnim,
                  transform: [{ translateY: slideAnim }],
                },
              ]}
            >
              <TouchableOpacity
                style={styles.petCard}
                activeOpacity={0.92}
                onPress={() => navigation.navigate("Pets")}
              >
                <View style={styles.petPhotoWrap}>
                  <View style={styles.petPhotoCircle}>
                    <MaterialCommunityIcons
                      name={getIconePet(petPrincipal.especieId) as any}
                      size={54}
                      color="#0F9D8E"
                    />
                  </View>

                  <View style={styles.heartBadge}>
                    <Ionicons name="heart" size={13} color="#EF4444" />
                  </View>
                </View>

                <View style={styles.petInfoBlock}>
                  <Text style={styles.petLabel}>Pet em destaque</Text>
                  <Text style={styles.petName}>{petPrincipal.nome}</Text>
                  <Text style={styles.petBreed}>
                    {petPrincipal.raca ||
                      petPrincipal.especie ||
                      "Dados não informados"}
                  </Text>

                  <View style={styles.petMetaRow}>
                    <View style={styles.petMetaPill}>
                      <Ionicons name="time-outline" size={13} color="#0F766E" />
                      <Text style={styles.petMetaText}>
                        {petPrincipal.idade || "Não informado"} anos
                      </Text>
                    </View>

                    <View style={styles.petMetaPill}>
                      <MaterialCommunityIcons
                        name="weight-kilogram"
                        size={13}
                        color="#0F766E"
                      />
                      <Text style={styles.petMetaText}>
                        {petPrincipal.peso
                          ? `${petPrincipal.peso} ${petPrincipal.unidadePeso || "kg"}`
                          : "Não informado"}
                      </Text>
                    </View>
                  </View>
                </View>

                <TouchableOpacity
                  style={styles.editBtn}
                  onPress={() =>
                    navigation.navigate("Cadastrar Pet", {
                      petId: petPrincipal.id,
                    })
                  }
                  activeOpacity={0.8}
                >
                  <Ionicons name="pencil" size={14} color="#0F766E" />
                </TouchableOpacity>
              </TouchableOpacity>
            </Animated.View>

            <Animated.View style={[styles.saudeCard, { opacity: fadeAnim }]}>
              <View style={styles.saudeLeft}>
                <Text style={styles.saudeTitle}>Saúde do pet</Text>
                <Text style={styles.saudeSub}>Score baseado nos cuidados</Text>

                <Text style={[styles.saudePercent, { color: scoreColor }]}>
                  {scorePet}%
                </Text>

                <Text style={[styles.saudeLabel, { color: scoreColor }]}>
                  {scoreStatusLabel}
                </Text>
              </View>

              <View style={styles.donutWrap}>
                <DonutScore score={scorePet} size={92} color={scoreColor} />
                <Text style={styles.donutCenter}>{scorePet}%</Text>
              </View>
            </Animated.View>

            <View style={styles.vacinasResumoCard}>
              <View style={styles.vacinasResumoTop}>
                <View>
                  <Text style={styles.vacinasTitle}>Vacinação</Text>
                  <Text style={styles.vacinasSub}>
                    {vacinasEmDia}/{totalVacinas} cuidados em dia
                  </Text>
                </View>

                <View style={styles.vacinaIconBox}>
                  <Ionicons
                    name="shield-checkmark-outline"
                    size={22}
                    color="#0F766E"
                  />
                </View>
              </View>

              <View style={styles.progressBg}>
                <View
                  style={[
                    styles.progressFill,
                    {
                      width: `${progressoVacinas}%`,
                      backgroundColor: scoreColor,
                    },
                  ]}
                />
              </View>
            </View>
          </>
        )}

        <View style={styles.sectionRow}>
          <Text style={styles.sectionTitle}>Próximos cuidados</Text>
          <TouchableOpacity onPress={() => navigation.navigate("Agenda")}>
            <Text style={styles.sectionLink}>Ver todos</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.cuidadosCard}>
          {CUIDADOS.map((item, idx) => (
            <TouchableOpacity
              key={item.id}
              style={[
                styles.cuidadoRow,
                idx < CUIDADOS.length - 1 && styles.cuidadoBorder,
              ]}
              onPress={() => navigation.navigate("Agenda")}
              activeOpacity={0.75}
            >
              <View style={[styles.cuidadoIcon, { backgroundColor: item.bg }]}>
                <MaterialCommunityIcons
                  name={item.icone as any}
                  size={22}
                  color={item.cor}
                />
              </View>

              <View style={styles.cuidadoText}>
                <Text style={styles.cuidadoTitulo}>{item.titulo}</Text>
                <Text style={styles.cuidadoData}>{item.data}</Text>
              </View>

              <View
                style={[styles.statusPill, { backgroundColor: item.statusBg }]}
              >
                <Text style={[styles.statusText, { color: item.statusCor }]}>
                  {item.status}
                </Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.sectionRow}>
          <Text style={styles.sectionTitle}>Acesso rápido</Text>
        </View>

        <View style={styles.acessoGrid}>
          {ACESSO_RAPIDO.map((item) => (
            <TouchableOpacity
              key={item.label}
              style={styles.acessoBtn}
              onPress={() => navigation.navigate(item.screen)}
              activeOpacity={0.85}
            >
              <View style={styles.acessoIconBox}>
                <Ionicons name={item.icon as any} size={26} color="#0F766E" />
              </View>

              <Text style={styles.acessoLabel}>{item.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity
          style={styles.iaBanner}
          onPress={() => navigation.navigate("IA")}
          activeOpacity={0.9}
        >
          <View style={styles.iaBlob1} />
          <View style={styles.iaBlob2} />

          <View style={styles.iaTop}>
            <View style={styles.iaIconBox}>
              <MaterialCommunityIcons
                name="robot-outline"
                size={22}
                color="#FFFFFF"
              />
            </View>

            <View style={styles.iaTag}>
              <Text style={styles.iaTagText}>IA ClyvoCare</Text>
            </View>
          </View>

          <Text style={styles.iaTitulo}>Cuidado inteligente para pets</Text>

          <Text style={styles.iaTexto}>
            O app organiza vacinas, consultas, lembretes, planos e histórico
            para ajudar no acompanhamento da saúde do seu bichinho.
          </Text>

          <View style={styles.iaFooter}>
            <View style={styles.iaBtn}>
              <Text style={styles.iaBtnText}>Ver alertas</Text>
              <Ionicons name="arrow-forward" size={14} color="#0F766E" />
            </View>

            <Text style={styles.iaTime}>
              {totalPets > 0
                ? `${totalPets} pet(s) cadastrado(s)`
                : "Comece agora"}
            </Text>
          </View>
        </TouchableOpacity>

        <PlanosSection
          ciclo={cicloPlano}
          setCiclo={setCicloPlano}
          onOpen={() => setPlanosVisiveis(true)}
          planoAtual={planoAtual}
        />
      </ScrollView>

      <PlanosModal
        visible={planosVisiveis}
        onClose={() => setPlanosVisiveis(false)}
        ciclo={cicloPlano}
        setCiclo={setCicloPlano}
        planoAtual={planoAtual}
        onContratarPlano={contratarPlano}
      />
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F6FBFA",
  },

  scrollContent: {
    paddingBottom: 120,
  },

  topHeroWrap: {
    height: 118,
    overflow: "hidden",
    backgroundColor: "#00796B",
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    marginBottom: 18,
  },

  topHeroContent: {
    flex: 1,
    paddingTop: 20,
    paddingHorizontal: 22,
    paddingBottom: 18,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  headerBrand: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },

  headerLogoCircle: {
    width: 62,
    height: 62,
    borderRadius: 22,
    backgroundColor: "rgba(255,255,255,0.96)",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#0F172A",
    shadowOpacity: 0.14,
    shadowRadius: 12,
    elevation: 5,
  },

  headerLogoImg: {
    width: 44,
    height: 44,
  },

  headerBrandName: {
    fontSize: 22,
    fontWeight: "900",
    color: "#064E4A",
    letterSpacing: -0.7,
  },

  headerBrandSub: {
    fontSize: 12,
    fontWeight: "800",
    color: "#0F766E",
    marginTop: 2,
  },

  headerProfile: {
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
    backgroundColor: "rgba(255,255,255,0.22)",
    paddingLeft: 10,
    paddingRight: 12,
    paddingVertical: 8,
    borderRadius: 26,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.34)",
    shadowColor: "#0F172A",
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 3,
  },

  headerAvatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
  },

  headerProfileTextBox: {
    minWidth: 62,
  },

  headerProfileName: {
    fontSize: 14,
    fontWeight: "900",
    color: "#FFFFFF",
  },

  headerProfileSub: {
    fontSize: 11,
    fontWeight: "700",
    color: "#ECFFFB",
    marginTop: 1,
  },

  greetingRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingBottom: 18,
  },

  greeting: {
    fontSize: 28,
    fontWeight: "900",
    color: "#0F172A",
    letterSpacing: -0.7,
  },

  greetingSub: {
    fontSize: 13,
    color: "#94A3B8",
    marginTop: 4,
    fontWeight: "700",
  },

  bellBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#E2F8F5",
    shadowColor: "#0F766E",
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 3,
  },

  bellDot: {
    position: "absolute",
    top: 10,
    right: 11,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#EF4444",
    borderWidth: 1.5,
    borderColor: "#F6FBFA",
  },

  emptyHero: {
    marginHorizontal: 18,
    backgroundColor: "#FFFFFF",
    borderRadius: 34,
    padding: 24,
    borderWidth: 1,
    borderColor: "#E2F8F5",
    shadowColor: "#0F766E",
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 4,
    marginBottom: 24,
    overflow: "hidden",
    position: "relative",
  },

  heroBlobOne: {
    position: "absolute",
    width: 210,
    height: 210,
    borderRadius: 105,
    backgroundColor: "#E0F5F2",
    top: -90,
    right: -65,
  },

  heroBlobTwo: {
    position: "absolute",
    width: 130,
    height: 130,
    borderRadius: 65,
    backgroundColor: "#F0FDFA",
    bottom: -50,
    left: -35,
  },

  heroBlobThree: {
    position: "absolute",
    width: 92,
    height: 92,
    borderRadius: 46,
    backgroundColor: "#ECFEFF",
    top: 140,
    right: 28,
  },

  heroContent: {
    zIndex: 2,
  },

  heroTag: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#E0F5F2",
    paddingHorizontal: 13,
    paddingVertical: 8,
    borderRadius: 999,
    marginBottom: 18,
  },

  heroTagText: {
    color: "#0F766E",
    fontSize: 12,
    fontWeight: "900",
  },

  heroTitle: {
    fontSize: 31,
    fontWeight: "900",
    color: "#0F172A",
    letterSpacing: -1,
    lineHeight: 37,
    maxWidth: 720,
  },

  heroText: {
    marginTop: 12,
    fontSize: 15,
    color: "#64748B",
    fontWeight: "700",
    lineHeight: 23,
    maxWidth: 760,
  },

  heroStatsRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 24,
    marginBottom: 18,
  },

  heroStatCard: {
    flex: 1,
    backgroundColor: "#F8FFFE",
    borderWidth: 1,
    borderColor: "#E2F8F5",
    borderRadius: 22,
    padding: 14,
  },

  heroStatIcon: {
    width: 40,
    height: 40,
    borderRadius: 15,
    backgroundColor: "#E0F5F2",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
  },

  heroStatTitle: {
    fontSize: 14,
    fontWeight: "900",
    color: "#0F172A",
  },

  heroStatSub: {
    fontSize: 11,
    color: "#94A3B8",
    fontWeight: "800",
    marginTop: 2,
  },

  heroButtonsRow: {
    gap: 12,
  },

  heroMainButton: {
    width: "100%",
    backgroundColor: "#0F766E",
    borderRadius: 22,
    paddingVertical: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    shadowColor: "#0F766E",
    shadowOpacity: 0.28,
    shadowRadius: 12,
    elevation: 4,
  },

  heroMainButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "900",
  },

  heroSecondaryButton: {
    width: "100%",
    backgroundColor: "#E0F5F2",
    borderRadius: 22,
    paddingVertical: 15,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },

  heroSecondaryButtonText: {
    color: "#0F766E",
    fontSize: 14,
    fontWeight: "900",
  },

  petCard: {
    marginHorizontal: 18,
    backgroundColor: "#FFFFFF",
    borderRadius: 28,
    padding: 20,
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    borderWidth: 1,
    borderColor: "#E2F8F5",
    shadowColor: "#0F766E",
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 3,
    marginBottom: 14,
    position: "relative",
  },

  petPhotoWrap: {
    position: "relative",
  },

  petPhotoCircle: {
    width: 94,
    height: 94,
    borderRadius: 47,
    backgroundColor: "#E0F5F2",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 3,
    borderColor: "#B2EEEA",
    overflow: "hidden",
  },

  petPhoto: {
    width: 94,
    height: 94,
    borderRadius: 47,
  },

  heartBadge: {
    position: "absolute",
    top: 2,
    right: 2,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#F1F5F9",
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },

  petInfoBlock: {
    flex: 1,
  },

  petLabel: {
    fontSize: 12,
    color: "#0F766E",
    fontWeight: "900",
    marginBottom: 3,
  },

  petName: {
    fontSize: 25,
    fontWeight: "900",
    color: "#0F172A",
    letterSpacing: -0.6,
  },

  petBreed: {
    fontSize: 14,
    color: "#64748B",
    fontWeight: "700",
    marginTop: 2,
  },

  petMetaRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 7,
    marginTop: 10,
  },

  petMetaPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#E0F5F2",
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 12,
  },

  petMetaText: {
    fontSize: 11,
    color: "#0F766E",
    fontWeight: "900",
  },

  editBtn: {
    position: "absolute",
    top: 14,
    right: 14,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#F0FDFA",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#CCFBF1",
  },

  saudeCard: {
    marginHorizontal: 18,
    backgroundColor: "#FFFFFF",
    borderRadius: 28,
    padding: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
    borderColor: "#E2F8F5",
    shadowColor: "#0F766E",
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 2,
    marginBottom: 14,
  },

  saudeLeft: {
    flex: 1,
  },

  saudeTitle: {
    fontSize: 17,
    fontWeight: "900",
    color: "#0F172A",
  },

  saudeSub: {
    fontSize: 12,
    color: "#94A3B8",
    marginTop: 3,
    fontWeight: "700",
  },

  saudePercent: {
    fontSize: 38,
    fontWeight: "900",
    marginTop: 8,
    letterSpacing: -1,
  },

  saudeLabel: {
    fontSize: 13,
    fontWeight: "900",
  },

  donutWrap: {
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },

  donutCenter: {
    position: "absolute",
    fontSize: 15,
    fontWeight: "900",
    color: "#0F172A",
  },

  vacinasResumoCard: {
    marginHorizontal: 18,
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    padding: 18,
    borderWidth: 1,
    borderColor: "#E2F8F5",
    marginBottom: 24,
  },

  vacinasResumoTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },

  vacinasTitle: {
    fontSize: 16,
    fontWeight: "900",
    color: "#0F172A",
  },

  vacinasSub: {
    fontSize: 12,
    color: "#94A3B8",
    fontWeight: "700",
    marginTop: 2,
  },

  vacinaIconBox: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: "#E0F5F2",
    alignItems: "center",
    justifyContent: "center",
  },

  progressBg: {
    height: 8,
    backgroundColor: "#F1F5F9",
    borderRadius: 10,
    overflow: "hidden",
  },

  progressFill: {
    height: "100%",
    borderRadius: 10,
  },

  sectionRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    marginBottom: 12,
  },

  sectionTitle: {
    fontSize: 19,
    fontWeight: "900",
    color: "#0F172A",
    letterSpacing: -0.3,
  },

  sectionLink: {
    fontSize: 13,
    color: "#0F766E",
    fontWeight: "900",
  },

  cuidadosCard: {
    marginHorizontal: 18,
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    paddingHorizontal: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: "#E2F8F5",
    shadowColor: "#0F766E",
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
    overflow: "hidden",
  },

  cuidadoRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    gap: 12,
  },

  cuidadoBorder: {
    borderBottomWidth: 1,
    borderBottomColor: "#F8FAFC",
  },

  cuidadoIcon: {
    width: 46,
    height: 46,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },

  cuidadoText: {
    flex: 1,
  },

  cuidadoTitulo: {
    fontSize: 15,
    fontWeight: "900",
    color: "#0F172A",
  },

  cuidadoData: {
    fontSize: 12,
    color: "#94A3B8",
    marginTop: 3,
    fontWeight: "700",
  },

  statusPill: {
    paddingHorizontal: 11,
    paddingVertical: 5,
    borderRadius: 20,
  },

  statusText: {
    fontSize: 11,
    fontWeight: "900",
  },

  acessoGrid: {
    flexDirection: "row",
    marginHorizontal: 18,
    gap: 10,
    marginBottom: 24,
  },

  acessoBtn: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    borderRadius: 22,
    paddingVertical: 16,
    alignItems: "center",
    gap: 8,
    borderWidth: 1,
    borderColor: "#E2F8F5",
    shadowColor: "#0F766E",
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },

  acessoIconBox: {
    width: 46,
    height: 46,
    borderRadius: 15,
    backgroundColor: "#E0F5F2",
    alignItems: "center",
    justifyContent: "center",
  },

  acessoLabel: {
    fontSize: 11,
    fontWeight: "900",
    color: "#0F172A",
    textAlign: "center",
  },

  iaBanner: {
    marginHorizontal: 18,
    backgroundColor: "#0F172A",
    borderRadius: 30,
    padding: 22,
    overflow: "hidden",
    position: "relative",
    marginBottom: 24,
  },

  iaBlob1: {
    position: "absolute",
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: "rgba(15,118,110,0.23)",
    top: -60,
    right: -40,
  },

  iaBlob2: {
    position: "absolute",
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: "rgba(99,102,241,0.14)",
    bottom: -20,
    left: 40,
  },

  iaTop: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 14,
  },

  iaIconBox: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: "#0F766E",
    alignItems: "center",
    justifyContent: "center",
  },

  iaTag: {
    backgroundColor: "rgba(255,255,255,0.08)",
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
  },

  iaTagText: {
    color: "#CBD5E1",
    fontSize: 12,
    fontWeight: "800",
  },

  iaTitulo: {
    fontSize: 21,
    fontWeight: "900",
    color: "#FFFFFF",
    letterSpacing: -0.5,
    marginBottom: 8,
  },

  iaTexto: {
    fontSize: 13,
    color: "#CBD5E1",
    lineHeight: 20,
    marginBottom: 18,
    fontWeight: "500",
  },

  iaFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  iaBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#CCFBF1",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },

  iaBtnText: {
    color: "#0F766E",
    fontWeight: "900",
    fontSize: 13,
  },

  iaTime: {
    color: "#64748B",
    fontSize: 12,
    fontWeight: "700",
  },

  planoPerfilCard: {
    marginHorizontal: 18,
    marginBottom: 18,
    backgroundColor: "#FFFFFF",
    borderRadius: 22,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderWidth: 1,
    borderColor: "#BBF7D0",
    shadowColor: "#0F766E",
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 2,
  },

  planoPerfilIcon: {
    width: 46,
    height: 46,
    borderRadius: 16,
    backgroundColor: "#DCFCE7",
    alignItems: "center",
    justifyContent: "center",
  },

  planoPerfilLabel: {
    fontSize: 12,
    color: "#16A34A",
    fontWeight: "900",
  },

  planoPerfilNome: {
    fontSize: 16,
    color: "#0F172A",
    fontWeight: "900",
    marginTop: 2,
  },

  planoPerfilAlterar: {
    fontSize: 13,
    color: "#0F766E",
    fontWeight: "900",
  },

  planosSection: {
    marginHorizontal: 18,
    backgroundColor: "#FFFFFF",
    borderRadius: 30,
    padding: 20,
    borderWidth: 1,
    borderColor: "#E2F8F5",
    shadowColor: "#0F766E",
    shadowOpacity: 0.08,
    shadowRadius: 14,
    elevation: 3,
    marginBottom: 24,
  },

  planosHeader: {
    marginBottom: 14,
  },

  planosTag: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#E0F5F2",
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 999,
    marginBottom: 12,
  },

  planosTagText: {
    color: "#0F766E",
    fontSize: 12,
    fontWeight: "900",
  },

  planosTitulo: {
    fontSize: 24,
    fontWeight: "900",
    color: "#0F172A",
    letterSpacing: -0.7,
  },

  planosTexto: {
    marginTop: 6,
    fontSize: 13,
    color: "#64748B",
    fontWeight: "700",
    lineHeight: 20,
  },

  cicloBox: {
    flexDirection: "row",
    backgroundColor: "#E0F5F2",
    padding: 5,
    borderRadius: 999,
    marginBottom: 16,
  },

  cicloBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 999,
    alignItems: "center",
  },

  cicloBtnAtivo: {
    backgroundColor: "#0F766E",
  },

  cicloBtnText: {
    color: "#0F766E",
    fontSize: 13,
    fontWeight: "900",
  },

  cicloBtnTextAtivo: {
    color: "#FFFFFF",
  },

  planosGrid: {
    gap: 14,
  },

  planoCard: {
    backgroundColor: "#F8FFFE",
    borderRadius: 24,
    padding: 18,
    borderWidth: 1,
    borderColor: "#E2F8F5",
    position: "relative",
  },

  planoCardDestaque: {
    backgroundColor: "#F0FDFA",
    borderColor: "#0F766E",
  },

  planoCardAdquirido: {
    borderColor: "#16A34A",
    backgroundColor: "#F0FDF4",
  },

  planoBadge: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "#0F766E",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    marginBottom: 12,
  },

  planoBadgeText: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "900",
  },

  planoAdquiridoBadge: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "#16A34A",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    marginBottom: 12,
  },

  planoAdquiridoBadgeText: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "900",
  },

  planoTop: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },

  planoIconBox: {
    width: 48,
    height: 48,
    borderRadius: 17,
    backgroundColor: "#E0F5F2",
    alignItems: "center",
    justifyContent: "center",
  },

  planoNome: {
    fontSize: 18,
    fontWeight: "900",
    color: "#0F172A",
  },

  planoSubtitulo: {
    fontSize: 12,
    color: "#94A3B8",
    fontWeight: "800",
    marginTop: 2,
  },

  planoPrecoRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    marginTop: 14,
  },

  planoPreco: {
    fontSize: 28,
    fontWeight: "900",
    color: "#0F766E",
    letterSpacing: -0.7,
  },

  planoPeriodo: {
    fontSize: 13,
    color: "#64748B",
    fontWeight: "800",
    marginBottom: 5,
  },

  planoEconomia: {
    marginTop: 3,
    fontSize: 12,
    color: "#D97706",
    fontWeight: "900",
  },

  planoDescricao: {
    marginTop: 10,
    fontSize: 13,
    color: "#64748B",
    fontWeight: "600",
    lineHeight: 20,
  },

  planoBeneficios: {
    marginTop: 14,
    gap: 8,
  },

  planoBeneficioRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },

  planoBeneficioText: {
    flex: 1,
    fontSize: 13,
    color: "#475569",
    fontWeight: "700",
  },

  planoFooter: {
    marginTop: 16,
    backgroundColor: "#E0F5F2",
    paddingVertical: 12,
    borderRadius: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },

  planoFooterText: {
    color: "#0F766E",
    fontSize: 13,
    fontWeight: "900",
  },

  modalContainer: {
    flex: 1,
    backgroundColor: "#F6FBFA",
  },

  modalHeader: {
    height: 120,
    paddingTop: 50,
    paddingHorizontal: 20,
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    overflow: "hidden",
  },

  modalBackBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 2,
  },

  modalHeaderText: {
    zIndex: 2,
    flex: 1,
  },

  modalTitle: {
    fontSize: 24,
    color: "#FFFFFF",
    fontWeight: "900",
    letterSpacing: -0.6,
  },

  modalSubtitle: {
    fontSize: 13,
    color: "#ECFFFB",
    fontWeight: "700",
    marginTop: 3,
  },

  modalScroll: {
    flex: 1,
  },

  modalContent: {
    padding: 18,
    paddingBottom: 40,
  },

  modalIntroCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    padding: 18,
    flexDirection: "row",
    gap: 14,
    borderWidth: 1,
    borderColor: "#E2F8F5",
    marginBottom: 16,
  },

  modalIntroIcon: {
    width: 50,
    height: 50,
    borderRadius: 18,
    backgroundColor: "#E0F5F2",
    alignItems: "center",
    justifyContent: "center",
  },

  modalIntroTitle: {
    fontSize: 16,
    fontWeight: "900",
    color: "#0F172A",
  },

  modalIntroText: {
    marginTop: 4,
    fontSize: 13,
    fontWeight: "600",
    color: "#64748B",
    lineHeight: 20,
  },

  modalCicloBox: {
    flexDirection: "row",
    backgroundColor: "#E0F5F2",
    padding: 5,
    borderRadius: 999,
    marginBottom: 16,
  },

  modalCicloBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 999,
    alignItems: "center",
  },

  modalCicloBtnAtivo: {
    backgroundColor: "#0F766E",
  },

  modalCicloText: {
    color: "#0F766E",
    fontSize: 13,
    fontWeight: "900",
  },

  modalCicloTextAtivo: {
    color: "#FFFFFF",
  },

  modalPlanCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 28,
    padding: 20,
    borderWidth: 1,
    borderColor: "#E2F8F5",
    marginBottom: 16,
    shadowColor: "#0F766E",
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 2,
  },

  modalPlanCardDestaque: {
    borderColor: "#0F766E",
    backgroundColor: "#F0FDFA",
  },

  modalPlanCardAdquirido: {
    borderColor: "#16A34A",
    backgroundColor: "#F0FDF4",
  },

  modalPlanBadge: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "#0F766E",
    paddingHorizontal: 11,
    paddingVertical: 6,
    borderRadius: 999,
    marginBottom: 12,
  },

  modalPlanBadgeText: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "900",
  },

  modalPlanoAdquiridoBadge: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#16A34A",
    paddingHorizontal: 11,
    paddingVertical: 6,
    borderRadius: 999,
    marginBottom: 12,
  },

  modalPlanoAdquiridoText: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "900",
  },

  modalPlanTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 14,
  },

  modalPlanName: {
    fontSize: 20,
    fontWeight: "900",
    color: "#0F172A",
  },

  modalPlanDesc: {
    marginTop: 5,
    fontSize: 13,
    color: "#64748B",
    fontWeight: "600",
    lineHeight: 19,
  },

  modalPlanIcon: {
    width: 54,
    height: 54,
    borderRadius: 18,
    backgroundColor: "#E0F5F2",
    alignItems: "center",
    justifyContent: "center",
  },

  modalPriceRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    marginTop: 16,
  },

  modalPlanPrice: {
    fontSize: 32,
    fontWeight: "900",
    color: "#0F766E",
    letterSpacing: -0.8,
  },

  modalPlanPeriod: {
    fontSize: 14,
    color: "#64748B",
    fontWeight: "800",
    marginBottom: 6,
  },

  modalEconomy: {
    fontSize: 12,
    color: "#D97706",
    fontWeight: "900",
    marginTop: 3,
  },

  modalBenefits: {
    gap: 10,
    marginTop: 18,
  },

  modalBenefitRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
  },

  modalBenefitText: {
    flex: 1,
    fontSize: 13,
    color: "#475569",
    fontWeight: "700",
    lineHeight: 18,
  },

  modalSubscribeBtn: {
    marginTop: 20,
    backgroundColor: "#0F766E",
    borderRadius: 18,
    paddingVertical: 15,
    alignItems: "center",
  },

  modalSubscribeBtnDestaque: {
    backgroundColor: "#064E4A",
  },

  modalSubscribeBtnAdquirido: {
    backgroundColor: "#16A34A",
  },

  modalSubscribeText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "900",
  },

  modalReturnBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#E0F5F2",
    paddingVertical: 15,
    borderRadius: 18,
  },

  modalReturnText: {
    color: "#0F766E",
    fontSize: 14,
    fontWeight: "900",
  },
});
