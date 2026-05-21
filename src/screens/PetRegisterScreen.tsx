import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  Image,
  StatusBar,
  Modal,
  FlatList,
} from "react-native";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as ImagePicker from "expo-image-picker";

const PETS_KEY = "@clyvocare_pets";

type SituacaoVacinal =
  | "com_carteirinha"
  | "sem_carteirinha"
  | "historico_desconhecido"
  | "resgatado";

type Castracao = "castrado" | "nao_castrado" | "nao_sei";

type TipoDocumentacao =
  | "origem_legal"
  | "sanitaria_transporte"
  | "origem_peixe"
  | null;

function permiteCastracaoDaEspecie(especieId?: string | null) {
  return especieId === "cachorro" || especieId === "gato";
}

function usaSituacaoVacinalDaEspecie(especieId?: string | null) {
  return !(
    especieId === "hamster" ||
    especieId === "porquinho" ||
    especieId === "rato" ||
    especieId === "chinchila" ||
    especieId === "tartaruga" ||
    especieId === "jabuti" ||
    especieId === "cobra" ||
    especieId === "lagarto" ||
    especieId === "ave" ||
    especieId === "peixe"
  );
}

function getTipoDocumentacaoDaEspecie(
  especieId?: string | null,
): TipoDocumentacao {
  if (
    especieId === "tartaruga" ||
    especieId === "jabuti" ||
    especieId === "furao" ||
    especieId === "ave" ||
    especieId === "cobra" ||
    especieId === "lagarto"
  ) {
    return "origem_legal";
  }

  if (
    especieId === "porco" ||
    especieId === "miniporco" ||
    especieId === "vaca" ||
    especieId === "minivaca" ||
    especieId === "cabra"
  ) {
    return "sanitaria_transporte";
  }

  if (especieId === "peixe") {
    return "origem_peixe";
  }

  return null;
}

function getInfoDocumentacao(especieId?: string | null) {
  const tipo = getTipoDocumentacaoDaEspecie(especieId);

  if (tipo === "origem_legal") {
    return {
      titulo: "Documentação de origem legal",
      descricao:
        "Este animal pode ter documentação de origem legal. Anexe nota fiscal, certificado de origem, autorização do criadouro ou documento equivalente, se houver.",
      placeholder:
        "Ex: número da nota fiscal, criadouro autorizado, certificado de origem, microchip, anilha, data de emissão ou qualquer informação importante para o veterinário...",
    };
  }

  if (tipo === "sanitaria_transporte") {
    return {
      titulo: "Documentação sanitária ou de transporte",
      descricao:
        "Este animal pode ter documentação sanitária, de transporte ou de origem. Anexe GTA, nota fiscal, comprovante de origem ou documento veterinário, se houver.",
      placeholder:
        "Ex: GTA, nota fiscal, comprovante de origem, vacinação sanitária, exames, restrições de transporte ou observações do veterinário...",
    };
  }

  if (tipo === "origem_peixe") {
    return {
      titulo: "Documentação, se aplicável",
      descricao:
        "Algumas espécies podem exigir comprovação de origem. Anexe nota fiscal, comprovante de compra ou documento do criador, se houver.",
      placeholder:
        "Ex: nota fiscal, loja/criadouro de origem, espécie, data da compra, cuidados específicos ou informações importantes para o veterinário...",
    };
  }

  return null;
}

function normalizarPesoSalvo(
  pesoSalvo?: string | null,
  unidadeSalva?: "kg" | "g",
) {
  const valorOriginal = String(pesoSalvo || "")
    .trim()
    .toLowerCase();

  let unidadeFinal: "kg" | "g" = unidadeSalva || "kg";

  if (valorOriginal.endsWith("kg")) {
    unidadeFinal = "kg";
  } else if (valorOriginal.endsWith("g")) {
    unidadeFinal = "g";
  }

  const pesoLimpo = valorOriginal.replace(/kg/g, "").replace(/g/g, "").trim();

  return {
    peso: pesoLimpo,
    unidadePeso: unidadeFinal,
  };
}

// Peso máximo razoável em kg por espécie
const PESO_MAX_KG: Record<string, number> = {
  cachorro: 120,
  gato: 20,
  coelho: 10,
  hamster: 0.7,
  porquinho: 2,
  rato: 0.6,
  chinchila: 0.9,
  furao: 2.5,
  ave: 2,
  peixe: 5,
  tartaruga: 30,
  jabuti: 50,
  cobra: 100,
  lagarto: 25,
  porco: 300,
  miniporco: 30,
  vaca: 1200,
  minivaca: 400,
  cabra: 120,
};

// Espécies tão pequenas que só faz sentido registrar em gramas
const ESPECIE_SO_GRAMAS = ["hamster", "rato", "porquinho", "chinchila"];

type Especie = {
  id: string;
  label: string;
  icone: string;
  racas: string[];
  vacinasPadrao: string[];
  labelRaca?: string;
};

const ESPECIES: Especie[] = [
  {
    id: "cachorro",
    label: "Cachorro",
    icone: "dog",
    racas: [
      "SRD (Vira-lata)",
      "Golden Retriever",
      "Labrador",
      "Bulldog Francês",
      "Poodle",
      "Shih Tzu",
      "Yorkshire",
      "Husky Siberiano",
      "Pastor Alemão",
      "Beagle",
      "Dachshund",
      "Maltês",
      "Pit Bull",
      "Rottweiler",
      "Border Collie",
    ],
    vacinasPadrao: [
      "V10 / V8",
      "Antirrábica",
      "Vermífugo",
      "Giardia",
      "Gripe (Bordetella)",
    ],
  },
  {
    id: "gato",
    label: "Gato",
    icone: "cat",
    racas: [
      "SRD (Vira-lata)",
      "Persa",
      "Siamês",
      "Maine Coon",
      "Ragdoll",
      "Bengal",
      "Sphynx (Sem pelo)",
      "Scottish Fold",
      "Angorá",
      "Abissínio",
    ],
    vacinasPadrao: [
      "Tríplice Felina (V3)",
      "Antirrábica",
      "Vermífugo",
      "Leucemia Felina (FeLV)",
      "Quádrupla Felina",
    ],
  },
  {
    id: "hamster",
    label: "Hamster",
    icone: "rodent",
    racas: [
      "Hamster Sírio",
      "Hamster Anão Russo",
      "Hamster Chinês",
      "Hamster Roborovski",
    ],
    vacinasPadrao: ["Vermífugo", "Check-up semestral"],
  },
  {
    id: "porquinho",
    label: "Porquinho da Índia",
    icone: "rodent",
    racas: ["Americano", "Abissínio", "Peruano", "Teddy", "Rex", "Skinny"],
    vacinasPadrao: ["Vermífugo", "Check-up semestral"],
  },
  {
    id: "coelho",
    label: "Coelho",
    icone: "rabbit",
    racas: [
      "Mini Coelho",
      "Angorá",
      "Holland Lop",
      "Rex",
      "Lionhead",
      "Netherland Dwarf",
    ],
    vacinasPadrao: ["Mixomatose", "Doença Hemorrágica Viral", "Vermífugo"],
  },
  {
    id: "tartaruga",
    label: "Tartaruga",
    icone: "turtle",
    racas: [
      "Tigre d'água",
      "Tartaruga-da-orelha-vermelha",
      "Tartaruga-de-caixa",
      "Tartaruga-pintada",
    ],
    vacinasPadrao: ["Check-up anual", "Vermífugo"],
  },
  {
    id: "jabuti",
    label: "Jabuti",
    icone: "turtle",
    racas: ["Jabuti-piranga", "Jabuti-tinga", "Jabuti-do-chaco"],
    vacinasPadrao: ["Check-up anual", "Vermífugo", "Exame de sangue"],
  },
  {
    id: "furao",
    label: "Furão",
    icone: "paw",
    racas: ["Furão-europeu", "Furão-doméstico", "Furão albino"],
    vacinasPadrao: [
      "Antirrábica",
      "Cinomose",
      "Vermífugo",
      "Check-up semestral",
    ],
  },
  {
    id: "rato",
    label: "Rato Twister",
    icone: "rodent",
    racas: ["Rato Twister padrão", "Rato Rex", "Rato Dumbo", "Rato Hairless"],
    vacinasPadrao: ["Vermífugo", "Check-up semestral"],
  },
  {
    id: "chinchila",
    label: "Chinchila",
    icone: "rodent",
    racas: [
      "Chinchila Padrão Cinza",
      "Chinchila Branca",
      "Chinchila Bege",
      "Chinchila Preta",
    ],
    vacinasPadrao: ["Vermífugo", "Check-up semestral"],
  },
  {
    id: "ave",
    label: "Ave",
    icone: "bird",
    racas: [
      "Papagaio",
      "Calopsita",
      "Periquito Australiano",
      "Canário",
      "Agapornis",
      "Cacatua",
      "Arara",
      "Maritaca",
      "Manon",
      "Rouxinol",
    ],
    vacinasPadrao: [
      "Newcastle",
      "Bouba Aviária",
      "Vermífugo",
      "Check-up semestral",
    ],
    labelRaca: "Qual ave?",
  },
  {
    id: "peixe",
    label: "Peixe",
    icone: "fish",
    racas: [
      "Betta",
      "Goldfish",
      "Kinguio",
      "Guppy",
      "Tetra Neon",
      "Disco",
      "Arowana",
      "Oscar",
      "Platy",
      "Corydoras",
    ],
    vacinasPadrao: ["Tratamento preventivo de parasitas", "Check-up da água"],
    labelRaca: "Qual peixe?",
  },
  {
    id: "porco",
    label: "Porco",
    icone: "pig",
    racas: ["Porco doméstico", "Porco vietnamita", "Porco pot-belly"],
    vacinasPadrao: [
      "Febre Aftosa",
      "Parvovirose Suína",
      "Erisipela",
      "Vermífugo",
      "Check-up semestral",
    ],
  },
  {
    id: "miniporco",
    label: "Mini Porco",
    icone: "pig",
    racas: [
      "Mini Pig Vietnamita",
      "Mini Pig Juliana",
      "Mini Pig KuneKune",
      "Mini Pig Pot-belly",
    ],
    vacinasPadrao: [
      "Febre Aftosa",
      "Parvovirose Suína",
      "Erisipela",
      "Vermífugo",
      "Check-up semestral",
    ],
  },
  {
    id: "vaca",
    label: "Vaca",
    icone: "cow",
    racas: ["Nelore", "Gir", "Girolando", "Holstein", "Jersey", "Angus"],
    vacinasPadrao: [
      "Febre Aftosa",
      "Brucelose",
      "Raiva",
      "Botulismo",
      "Vermífugo",
    ],
  },
  {
    id: "minivaca",
    label: "Mini Vaca",
    icone: "cow",
    racas: ["Nelore", "Gir", "Girolando", "Holstein", "Jersey", "Angus"],
    vacinasPadrao: [
      "Febre Aftosa",
      "Brucelose",
      "Raiva",
      "Botulismo",
      "Vermífugo",
      "Check-up semestral",
    ],
  },
  {
    id: "cabra",
    label: "Cabra",
    icone: "sheep",
    racas: ["Saanen", "Toggenburg", "Anglo-nubiana", "Boer", "Cabra SRD"],
    vacinasPadrao: [
      "Febre Aftosa",
      "Carbúnculo Sintomático",
      "Pneumonia",
      "Vermífugo",
    ],
  },
  {
    id: "cobra",
    label: "Cobra",
    icone: "snake",
    racas: [
      "Jiboia",
      "Cobra Milho",
      "Píton da Índia",
      "Píton Real",
      "Falsa Coral",
      "Cobra Rei",
      "Cobra Nariz-de-porco",
    ],
    vacinasPadrao: ["Vermífugo", "Check-up semestral", "Exame de fezes"],
    labelRaca: "Qual cobra?",
  },
  {
    id: "lagarto",
    label: "Lagarto",
    icone: "bug",
    racas: [
      "Gecko-leopardo",
      "Dragão-barbudo",
      "Iguana-verde",
      "Teiú",
      "Gecko Tokay",
      "Camaleão-velado",
      "Monitor de Savana",
    ],
    vacinasPadrao: ["Vermífugo", "Check-up semestral", "Exame de fezes"],
    labelRaca: "Qual lagarto?",
  },
];

type Vacina = {
  nome: string;
  emDia: boolean;
};

export type Pet = {
  id: string;
  nome: string;
  especie: string;
  especieId: string;
  raca: string;
  idade: string;
  peso: string;
  unidadePeso?: "kg" | "g";
  foto: string | null;
  carteiraVacina: string | null;
  documentoAnimal?: string | null;
  observacoesDocumento?: string;
  situacaoVacinal: SituacaoVacinal;
  castracao: Castracao;
  observacoes: string;
  vacinas: Vacina[];
};

type ScoreParams = {
  vacinas: Vacina[];
  idade: string;
  peso: string;
  observacoes: string;
  carteiraVacina: string | null;
  documentoAnimal?: string | null;
  observacoesDocumento?: string;
  situacaoVacinal: SituacaoVacinal;
  castracao: Castracao;
  especieId?: string | null;
};

export function calcularScoreSaude({
  vacinas,
  idade,
  peso,
  observacoes,
  carteiraVacina,
  situacaoVacinal,
  castracao,
  especieId,
}: ScoreParams): number {
  const totalVacinas = vacinas?.length || 0;
  const vacinasEmDia = vacinas?.filter((v) => v.emDia).length || 0;

  const pontosVacina =
    totalVacinas > 0 ? Math.round((vacinasEmDia / totalVacinas) * 40) : 0;

  const idadeNum = parseInt(idade || "0", 10);

  let pontosIdade = 12;

  if (!idadeNum) {
    pontosIdade = 7;
  } else if (idadeNum >= 12) {
    pontosIdade = 6;
  } else if (idadeNum >= 8) {
    pontosIdade = 8;
  }

  const pontosPeso = peso.trim() ? 10 : 5;
  const usaSituacaoVacinal = usaSituacaoVacinalDaEspecie(especieId);
  const pontosCarteira = usaSituacaoVacinal ? (carteiraVacina ? 13 : 4) : 10;

  let penalidadeSituacao = 0;

  if (usaSituacaoVacinal && situacaoVacinal === "sem_carteirinha") {
    penalidadeSituacao = 7;
  }

  if (usaSituacaoVacinal && situacaoVacinal === "historico_desconhecido") {
    penalidadeSituacao = 12;
  }

  if (usaSituacaoVacinal && situacaoVacinal === "resgatado") {
    penalidadeSituacao = 15;
  }

  let penalidadeCastracao = 0;

  if (permiteCastracaoDaEspecie(especieId) && castracao === "nao_sei") {
    penalidadeCastracao = 4;
  }

  const textoObs = observacoes.toLowerCase();

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

export default function PetRegisterScreen({ navigation, route }: any) {
  const petId = route?.params?.petId as string | undefined;

  const [nome, setNome] = useState("");
  const [especieSelecionada, setEspecieSelecionada] = useState<Especie | null>(
    null,
  );
  const [raca, setRaca] = useState("");
  const [racaCustom, setRacaCustom] = useState("");
  const [idade, setIdade] = useState("");
  const [peso, setPeso] = useState("");
  const [unidadePeso, setUnidadePeso] = useState<"kg" | "g">("kg");
  const [carteiraVacina, setCarteiraVacina] = useState<string | null>(null);
  const [documentoAnimal, setDocumentoAnimal] = useState<string | null>(null);
  const [observacoesDocumento, setObservacoesDocumento] = useState("");
  const [situacaoVacinal, setSituacaoVacinal] =
    useState<SituacaoVacinal>("com_carteirinha");
  const [castracao, setCastracao] = useState<Castracao>("nao_sei");
  const [observacoes, setObservacoes] = useState("");
  const [vacinas, setVacinas] = useState<Vacina[]>([]);
  const [salvando, setSalvando] = useState(false);

  const [modalEspecie, setModalEspecie] = useState(false);
  const [modalRaca, setModalRaca] = useState(false);

  const podeInformarCastracao = permiteCastracaoDaEspecie(
    especieSelecionada?.id,
  );
  const usaSituacaoVacinal = usaSituacaoVacinalDaEspecie(
    especieSelecionada?.id,
  );
  const documentacaoInfo = getInfoDocumentacao(especieSelecionada?.id);
  const podeInformarDocumentacao = !!documentacaoInfo;
  const soUsaGramas = ESPECIE_SO_GRAMAS.includes(especieSelecionada?.id || "");

  const scoreFinal = calcularScoreSaude({
    vacinas,
    idade,
    peso,
    observacoes,
    carteiraVacina,
    situacaoVacinal,
    castracao,
    especieId: especieSelecionada?.id,
  });

  const vacinasEmDia = vacinas.filter((v) => v.emDia).length;
  const totalVacinas = vacinas.length;

  const scoreColor =
    scoreFinal >= 85 ? "#0F766E" : scoreFinal >= 65 ? "#D97706" : "#EF4444";

  const scoreBg =
    scoreFinal >= 85 ? "#CCFBF1" : scoreFinal >= 65 ? "#FEF3C7" : "#FEE2E2";

  const scoreLabel =
    scoreFinal >= 85
      ? "Muito saudável"
      : scoreFinal >= 65
        ? "Acompanhar"
        : "Atenção";

  const scoreDescricao =
    scoreFinal >= 85
      ? "O score é atualizado conforme você preenche os dados do pet."
      : scoreFinal >= 65
        ? "Complete peso, vacinas, documentos e histórico para melhorar a análise."
        : "A IA recomenda revisar os dados e priorizar avaliação veterinária.";

  useEffect(() => {
    async function loadPet() {
      if (!petId) return;

      try {
        const stored = await AsyncStorage.getItem(PETS_KEY);
        const pets: any[] = stored ? JSON.parse(stored) : [];
        const pet = pets.find((p) => p.id === petId);

        if (pet) {
          const pesoNormalizado = normalizarPesoSalvo(
            pet.peso,
            pet.unidadePeso,
          );

          setNome(pet.nome || "");
          setEspecieSelecionada(
            ESPECIES.find((e) => e.id === pet.especieId) || null,
          );
          setRaca(pet.raca || "");
          setRacaCustom("");
          setIdade(pet.idade || "");
          setPeso(pesoNormalizado.peso);
          setUnidadePeso(pesoNormalizado.unidadePeso);
          setCarteiraVacina(pet.carteiraVacina || null);
          setDocumentoAnimal(pet.documentoAnimal || null);
          setObservacoesDocumento(pet.observacoesDocumento || "");
          setSituacaoVacinal(pet.situacaoVacinal || "com_carteirinha");
          setCastracao(pet.castracao || "nao_sei");
          setObservacoes(pet.observacoes || "");
          setVacinas(pet.vacinas || []);
        }
      } catch {
        Alert.alert("Erro", "Não foi possível carregar os dados do pet.");
      }
    }

    loadPet();
  }, [petId]);

  function selecionarEspecie(esp: Especie) {
    setEspecieSelecionada(esp);
    setRaca("");
    setRacaCustom("");
    setPeso("");
    setVacinas(esp.vacinasPadrao.map((nome) => ({ nome, emDia: false })));

    // Força gramas para animais muito pequenos
    if (ESPECIE_SO_GRAMAS.includes(esp.id)) {
      setUnidadePeso("g");
    } else {
      setUnidadePeso("kg");
    }

    if (!permiteCastracaoDaEspecie(esp.id)) {
      setCastracao("nao_sei");
    }

    if (!usaSituacaoVacinalDaEspecie(esp.id)) {
      setSituacaoVacinal("com_carteirinha");
      setCarteiraVacina(null);
    }

    if (!getTipoDocumentacaoDaEspecie(esp.id)) {
      setDocumentoAnimal(null);
      setObservacoesDocumento("");
    }

    setModalEspecie(false);
  }

  async function escolherCarteiraVacina() {
    try {
      const { status } =
        await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (status !== "granted") {
        Alert.alert(
          "Permissão necessária",
          "Precisamos de acesso à galeria para anexar a carteirinha de vacinação.",
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsEditing: false,
        quality: 0.5,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];

        if (asset.uri) {
          setCarteiraVacina(asset.uri);
        }
      }
    } catch {
      Alert.alert("Erro", "Não foi possível selecionar a carteirinha.");
    }
  }

  async function escolherDocumentoAnimal() {
    try {
      const { status } =
        await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (status !== "granted") {
        Alert.alert(
          "Permissão necessária",
          "Precisamos de acesso à galeria para anexar o documento do animal.",
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false,
        quality: 0.5,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];

        if (asset.uri) {
          setDocumentoAnimal(asset.uri);
        }
      }
    } catch {
      Alert.alert("Erro", "Não foi possível selecionar o documento do animal.");
    }
  }

  function removerCarteira() {
    Alert.alert(
      "Remover carteirinha",
      "Deseja remover a carteirinha de vacinação anexada?",
      [
        {
          text: "Cancelar",
          style: "cancel",
        },
        {
          text: "Remover",
          style: "destructive",
          onPress: () => setCarteiraVacina(null),
        },
      ],
    );
  }

  function removerDocumentoAnimal() {
    Alert.alert(
      "Remover documento",
      "Deseja remover o documento anexado deste animal?",
      [
        {
          text: "Cancelar",
          style: "cancel",
        },
        {
          text: "Remover",
          style: "destructive",
          onPress: () => setDocumentoAnimal(null),
        },
      ],
    );
  }

  function toggleVacina(index: number) {
    const novasVacinas = [...vacinas];
    novasVacinas[index].emDia = !novasVacinas[index].emDia;
    setVacinas(novasVacinas);
  }

  async function salvar() {
    if (salvando) return;

    if (!nome.trim()) {
      Alert.alert("Atenção", "Por favor, informe o nome do pet.");
      return;
    }

    if (!especieSelecionada) {
      Alert.alert("Atenção", "Por favor, selecione o tipo de animal.");
      return;
    }
    if (!peso.trim()) {
      Alert.alert(
        "Atenção",
        "Por favor, informe o peso do pet para calcular melhor o score de saúde.",
      );
      return;
    }
    const pesoLimpoValidacao = peso
      .replace(/kg/gi, "")
      .replace(/g/gi, "")
      .trim();

    const pesoNum = parseFloat(pesoLimpoValidacao.replace(",", "."));

    if (isNaN(pesoNum) || pesoNum <= 0) {
      Alert.alert(
        "Peso inválido",
        "Informe um peso maior que zero para continuar o cadastro.",
      );
      return;
    }

    const limiteKg = PESO_MAX_KG[especieSelecionada.id];
    const pesoEmKg = unidadePeso === "g" ? pesoNum / 1000 : pesoNum;

    if (limiteKg !== undefined && pesoEmKg > limiteKg) {
      Alert.alert(
        "Peso incomum",
        `O peso informado (${pesoLimpoValidacao}${unidadePeso}) parece muito alto para um ${especieSelecionada.label}. Verifique se a unidade está correta.`,
      );
      return;
    }

    setSalvando(true);

    try {
      const stored = await AsyncStorage.getItem(PETS_KEY);

      let pets: Pet[] = [];

      if (stored) {
        try {
          pets = JSON.parse(stored);
        } catch {
          pets = [];
        }
      }

      const racaFinal = racaCustom.trim() || raca;
      const pesoLimpo = peso.replace(/kg/gi, "").replace(/g/gi, "").trim();

      const novoPet: Pet = {
        id: petId || Date.now().toString(),
        nome: nome.trim(),
        especie: especieSelecionada.label,
        especieId: especieSelecionada.id,
        raca: racaFinal,
        idade: idade.trim(),
        peso: pesoLimpo,
        unidadePeso,
        foto: null,
        documentoAnimal: getTipoDocumentacaoDaEspecie(especieSelecionada.id)
          ? documentoAnimal
          : null,
        observacoesDocumento: getTipoDocumentacaoDaEspecie(
          especieSelecionada.id,
        )
          ? observacoesDocumento.trim()
          : "",
        situacaoVacinal: usaSituacaoVacinalDaEspecie(especieSelecionada.id)
          ? situacaoVacinal
          : "com_carteirinha",
        carteiraVacina: usaSituacaoVacinalDaEspecie(especieSelecionada.id)
          ? carteiraVacina
          : null,
        castracao: permiteCastracaoDaEspecie(especieSelecionada.id)
          ? castracao
          : "nao_sei",
        observacoes: observacoes.trim(),
        vacinas,
      };

      if (petId) {
        pets = pets.map((p) => (p.id === petId ? novoPet : p));
      } else {
        pets.push(novoPet);
      }

      await AsyncStorage.setItem(PETS_KEY, JSON.stringify(pets));

      setSalvando(false);

      if (navigation.canGoBack()) {
        navigation.goBack();
      } else {
        navigation.navigate("Home");
      }
    } catch (erro: any) {
      setSalvando(false);

      Alert.alert(
        "Erro ao salvar",
        erro?.message ||
          "Não foi possível salvar o pet. Tente cadastrar sem foto e sem carteirinha primeiro.",
      );
    }
  }

  async function excluir() {
    if (!petId) return;

    Alert.alert("Excluir pet", `Tem certeza que quer remover ${nome}?`, [
      {
        text: "Cancelar",
        style: "cancel",
      },
      {
        text: "Excluir",
        style: "destructive",
        onPress: async () => {
          try {
            const stored = await AsyncStorage.getItem(PETS_KEY);

            if (stored) {
              let pets: any[] = JSON.parse(stored);
              pets = pets.filter((p) => p.id !== petId);
              await AsyncStorage.setItem(PETS_KEY, JSON.stringify(pets));
            }

            navigation.reset({
              index: 0,
              routes: [{ name: "Main" }],
            });
          } catch {
            Alert.alert("Erro", "Não foi possível excluir o pet.");
          }
        },
      },
    ]);
  }

  function getSituacaoTitulo() {
    if (situacaoVacinal === "com_carteirinha") return "Carteirinha disponível";
    if (situacaoVacinal === "sem_carteirinha") return "Sem carteirinha";
    if (situacaoVacinal === "historico_desconhecido")
      return "Histórico desconhecido";
    return "Pet resgatado";
  }

  function getCastracaoTitulo() {
    if (castracao === "castrado") return "Castrado";
    if (castracao === "nao_castrado") return "Não castrado";
    return "Castração não informada";
  }

  function selecionarRaca(racaSelecionada: string) {
    setRaca(racaSelecionada);
    setRacaCustom("");
    setModalRaca(false);
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <StatusBar barStyle="dark-content" backgroundColor="#F6FBFA" />

      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => navigation.goBack()}
          activeOpacity={0.8}
        >
          <Ionicons name="arrow-back" size={20} color="#0F766E" />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>
          {petId ? "Editar Pet" : "Novo Pet"}
        </Text>

        {petId ? (
          <TouchableOpacity
            style={styles.deleteBtn}
            onPress={excluir}
            activeOpacity={0.8}
          >
            <Ionicons name="trash-outline" size={19} color="#EF4444" />
          </TouchableOpacity>
        ) : (
          <View style={{ width: 42 }} />
        )}
      </View>

      <View style={styles.heroCard}>
        <View style={styles.fotoSection}>
          <View style={styles.fotoWrap}>
            <View style={styles.fotoPlaceholder}>
              <MaterialCommunityIcons
                name={
                  especieSelecionada ? (especieSelecionada.icone as any) : "paw"
                }
                size={52}
                color="#0F9D8E"
              />
            </View>
          </View>

          <Text style={styles.fotoTitle}>
            {especieSelecionada ? especieSelecionada.label : "Ícone do pet"}
          </Text>

          <Text style={styles.fotoHint}>
            O ClyvoCare usa um ícone automático conforme o tipo de animal.
          </Text>
        </View>

        <View style={styles.scorePreview}>
          <View style={{ flex: 1 }}>
            <Text style={styles.scoreTitle}>Score inteligente em tempo real</Text>
            <Text style={styles.scoreSub}>{scoreDescricao}</Text>

            <View style={styles.scoreDetails}>
              <View style={styles.scoreMiniItem}>
                <Ionicons
                  name="shield-checkmark-outline"
                  size={14}
                  color="#0F766E"
                />
                <Text style={styles.scoreMiniText}>
                  {totalVacinas > 0
                    ? `${vacinasEmDia}/${totalVacinas} cuidados em dia`
                    : "Escolha a espécie para exibir os cuidados"}
                </Text>
              </View>

              {usaSituacaoVacinal ? (
                <View style={styles.scoreMiniItem}>
                  <Ionicons
                    name="document-attach-outline"
                    size={14}
                    color="#0F766E"
                  />
                  <Text style={styles.scoreMiniText}>
                    {getSituacaoTitulo()}
                  </Text>
                </View>
              ) : (
                <View style={styles.scoreMiniItem}>
                  <Ionicons name="medkit-outline" size={14} color="#0F766E" />
                  <Text style={styles.scoreMiniText}>Cuidados preventivos</Text>
                </View>
              )}

              {podeInformarCastracao && (
                <View style={styles.scoreMiniItem}>
                  <Ionicons name="heart-outline" size={14} color="#0F766E" />
                  <Text style={styles.scoreMiniText}>
                    {getCastracaoTitulo()}
                  </Text>
                </View>
              )}

              {podeInformarDocumentacao && documentacaoInfo && (
                <View style={styles.scoreMiniItem}>
                  <Ionicons
                    name="folder-open-outline"
                    size={14}
                    color="#0F766E"
                  />
                  <Text style={styles.scoreMiniText}>
                    {documentoAnimal
                      ? "Documento anexado"
                      : documentacaoInfo.titulo}
                  </Text>
                </View>
              )}
            </View>
          </View>

          <View style={[styles.scoreBadge, { backgroundColor: scoreBg }]}>
            <Text style={[styles.scoreNum, { color: scoreColor }]}>
              {scoreFinal}%
            </Text>
            <Text style={[styles.scoreLabel, { color: scoreColor }]}>
              {scoreLabel}
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Informações básicas</Text>
        <Text style={styles.sectionSub}>
          Preencha os dados principais para montar o perfil de saúde do pet.
        </Text>

        <View style={styles.fieldWrap}>
          <Text style={styles.label}>Nome do pet *</Text>

          <View style={styles.inputWrap}>
            <Ionicons
              name="paw-outline"
              size={18}
              color="#0F766E"
              style={styles.inputIcon}
            />

            <TextInput
              style={styles.input}
              placeholder="Ex: Thor, Mia, Mel..."
              placeholderTextColor="#CBD5E1"
              value={nome}
              onChangeText={setNome}
            />
          </View>
        </View>

        <View style={styles.fieldWrap}>
          <Text style={styles.label}>Tipo de animal *</Text>

          <TouchableOpacity
            style={styles.selectorWrap}
            onPress={() => setModalEspecie(true)}
            activeOpacity={0.85}
          >
            <MaterialCommunityIcons
              name={
                especieSelecionada
                  ? (especieSelecionada.icone as any)
                  : "paw-outline"
              }
              size={19}
              color="#0F766E"
              style={styles.inputIcon}
            />

            <Text
              style={[
                styles.selectorText,
                !especieSelecionada && styles.selectorPlaceholder,
              ]}
            >
              {especieSelecionada
                ? especieSelecionada.label
                : "Selecione o animal..."}
            </Text>

            <Ionicons name="chevron-down" size={19} color="#94A3B8" />
          </TouchableOpacity>
        </View>

        {especieSelecionada && (
          <View style={styles.fieldWrap}>
            <Text style={styles.label}>
              {especieSelecionada.labelRaca || "Raça"}
            </Text>

            <TouchableOpacity
              style={styles.selectorWrap}
              onPress={() => setModalRaca(true)}
              activeOpacity={0.85}
            >
              <Ionicons
                name="list-outline"
                size={19}
                color="#0F766E"
                style={styles.inputIcon}
              />

              <Text
                style={[
                  styles.selectorText,
                  !raca && styles.selectorPlaceholder,
                ]}
              >
                {raca ||
                  `Selecione ${
                    especieSelecionada.labelRaca?.toLowerCase() || "a raça"
                  }...`}
              </Text>

              <Ionicons name="chevron-down" size={19} color="#94A3B8" />
            </TouchableOpacity>

            <View style={[styles.inputWrap, { marginTop: 10 }]}>
              <Ionicons
                name="create-outline"
                size={18}
                color="#0F766E"
                style={styles.inputIcon}
              />

              <TextInput
                style={styles.input}
                placeholder="Ou digite uma raça específica..."
                placeholderTextColor="#CBD5E1"
                value={racaCustom}
                onChangeText={setRacaCustom}
              />
            </View>
          </View>
        )}

        <View style={styles.row}>
          <View style={[styles.fieldWrap, { flex: 1 }]}>
            <Text style={styles.label}>Idade</Text>

            <View style={styles.inputWrap}>
              <Ionicons
                name="time-outline"
                size={18}
                color="#0F766E"
                style={styles.inputIcon}
              />

              <TextInput
                style={styles.input}
                placeholder="Ex: 2"
                placeholderTextColor="#CBD5E1"
                value={idade}
                onChangeText={(text) => {
                  const idadeLimpa = text.replace(/[^0-9]/g, "");
                  setIdade(idadeLimpa);
                }}
                keyboardType="numeric"
              />
            </View>
          </View>

          <View style={[styles.fieldWrap, { flex: 1 }]}>
            <Text style={styles.label}>Peso</Text>

            <View style={styles.inputWrap}>
              <MaterialCommunityIcons
                name="weight-kilogram"
                size={18}
                color="#0F766E"
                style={styles.inputIcon}
              />

              <TextInput
                style={styles.input}
                placeholder={unidadePeso === "kg" ? "Ex: 7" : "Ex: 300"}
                placeholderTextColor="#CBD5E1"
                value={peso}
                onChangeText={(text) => {
                  const pesoLimpo = text
                    .replace(/kg/gi, "")
                    .replace(/g/gi, "")
                    .replace(/[^0-9.,]/g, "")
                    .trim();

                  setPeso(pesoLimpo);
                }}
                keyboardType="numeric"
              />

              <View style={styles.unidadePesoBox}>
                <TouchableOpacity
                  style={[
                    styles.unidadePesoBtn,
                    unidadePeso === "kg" && styles.unidadePesoBtnActive,
                    soUsaGramas && styles.unidadePesoBtnDisabled,
                  ]}
                  onPress={() => {
                    if (!soUsaGramas) setUnidadePeso("kg");
                  }}
                  activeOpacity={soUsaGramas ? 1 : 0.85}
                >
                  <Text
                    style={[
                      styles.unidadePesoText,
                      unidadePeso === "kg" && styles.unidadePesoTextActive,
                      soUsaGramas && styles.unidadePesoTextDisabled,
                    ]}
                  >
                    kg
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.unidadePesoBtn,
                    unidadePeso === "g" && styles.unidadePesoBtnActive,
                  ]}
                  onPress={() => setUnidadePeso("g")}
                  activeOpacity={0.85}
                >
                  <Text
                    style={[
                      styles.unidadePesoText,
                      unidadePeso === "g" && styles.unidadePesoTextActive,
                    ]}
                  >
                    g
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {soUsaGramas && (
              <Text style={styles.pesoHint}>
                Para esta espécie, o peso é registrado em gramas.
              </Text>
            )}
          </View>
        </View>
      </View>

      {podeInformarCastracao && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Castração</Text>
          <Text style={styles.sectionSub}>
            Informe se o pet já é castrado ou não
          </Text>

          <View style={styles.optionList}>
            <TouchableOpacity
              style={[
                styles.optionCard,
                castracao === "castrado" && styles.optionCardActive,
              ]}
              onPress={() => setCastracao("castrado")}
              activeOpacity={0.85}
            >
              <Ionicons
                name="checkmark-circle-outline"
                size={22}
                color="#0F766E"
              />
              <View style={{ flex: 1 }}>
                <Text style={styles.optionTitle}>Sim, é castrado</Text>
                <Text style={styles.optionText}>
                  O app registra que o pet já passou pelo procedimento.
                </Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.optionCard,
                castracao === "nao_castrado" && styles.optionCardActive,
              ]}
              onPress={() => setCastracao("nao_castrado")}
              activeOpacity={0.85}
            >
              <Ionicons name="close-circle-outline" size={22} color="#D97706" />
              <View style={{ flex: 1 }}>
                <Text style={styles.optionTitle}>Não é castrado</Text>
                <Text style={styles.optionText}>
                  A agenda pode sugerir avaliação veterinária sobre castração.
                </Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.optionCard,
                castracao === "nao_sei" && styles.optionCardActive,
              ]}
              onPress={() => setCastracao("nao_sei")}
              activeOpacity={0.85}
            >
              <Ionicons name="help-circle-outline" size={22} color="#EA580C" />
              <View style={{ flex: 1 }}>
                <Text style={styles.optionTitle}>Não sei informar</Text>
                <Text style={styles.optionText}>
                  Ideal para pets resgatados ou adotados sem histórico completo.
                </Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {podeInformarDocumentacao && documentacaoInfo && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{documentacaoInfo.titulo}</Text>
          <Text style={styles.sectionSub}>{documentacaoInfo.descricao}</Text>

          <TouchableOpacity
            style={[
              styles.carteiraCard,
              documentoAnimal && styles.carteiraCardActive,
            ]}
            onPress={escolherDocumentoAnimal}
            activeOpacity={0.85}
          >
            {documentoAnimal ? (
              <>
                <Image
                  source={{ uri: documentoAnimal }}
                  style={styles.carteiraPreview}
                />

                <View style={styles.carteiraInfo}>
                  <View style={styles.carteiraIconActive}>
                    <Ionicons
                      name="checkmark-circle"
                      size={22}
                      color="#0F766E"
                    />
                  </View>

                  <View style={{ flex: 1 }}>
                    <Text style={styles.carteiraTitle}>Documento anexado</Text>
                    <Text style={styles.carteiraSub}>
                      Toque para substituir a imagem do documento.
                    </Text>
                  </View>
                </View>
              </>
            ) : (
              <View style={styles.carteiraEmpty}>
                <View style={styles.carteiraIcon}>
                  <Ionicons
                    name="folder-open-outline"
                    size={28}
                    color="#0F766E"
                  />
                </View>

                <Text style={styles.carteiraTitle}>
                  Anexar documento do animal
                </Text>
                <Text style={styles.carteiraSub}>
                  Envie uma foto do documento, se o tutor possuir.
                </Text>
              </View>
            )}
          </TouchableOpacity>

          {documentoAnimal && (
            <TouchableOpacity
              style={styles.removeCarteiraBtn}
              onPress={removerDocumentoAnimal}
              activeOpacity={0.85}
            >
              <Ionicons name="trash-outline" size={16} color="#EF4444" />
              <Text style={styles.removeCarteiraText}>Remover documento</Text>
            </TouchableOpacity>
          )}

          <View style={[styles.textAreaWrap, { marginTop: 12 }]}>
            <TextInput
              style={styles.textArea}
              placeholder={documentacaoInfo.placeholder}
              placeholderTextColor="#CBD5E1"
              value={observacoesDocumento}
              onChangeText={setObservacoesDocumento}
              multiline
              textAlignVertical="top"
            />
          </View>
        </View>
      )}

      {usaSituacaoVacinal && (
        <>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Situação vacinal</Text>
            <Text style={styles.sectionSub}>
              Informe o que você sabe sobre o histórico de vacinas do pet.
            </Text>

            <View style={styles.optionList}>
              <TouchableOpacity
                style={[
                  styles.optionCard,
                  situacaoVacinal === "com_carteirinha" &&
                    styles.optionCardActive,
                ]}
                onPress={() => setSituacaoVacinal("com_carteirinha")}
                activeOpacity={0.85}
              >
                <Ionicons
                  name="document-attach-outline"
                  size={22}
                  color="#0F766E"
                />
                <View style={{ flex: 1 }}>
                  <Text style={styles.optionTitle}>Tenho a carteirinha</Text>
                  <Text style={styles.optionText}>
                    Ideal para anexar a foto e marcar as vacinas em dia.
                  </Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.optionCard,
                  situacaoVacinal === "sem_carteirinha" &&
                    styles.optionCardActive,
                ]}
                onPress={() => setSituacaoVacinal("sem_carteirinha")}
                activeOpacity={0.85}
              >
                <Ionicons
                  name="help-circle-outline"
                  size={22}
                  color="#D97706"
                />
                <View style={{ flex: 1 }}>
                  <Text style={styles.optionTitle}>
                    Não tenho a carteirinha
                  </Text>
                  <Text style={styles.optionText}>
                    O app recomenda avaliação para revisar ou reiniciar o
                    protocolo.
                  </Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.optionCard,
                  situacaoVacinal === "historico_desconhecido" &&
                    styles.optionCardActive,
                ]}
                onPress={() => setSituacaoVacinal("historico_desconhecido")}
                activeOpacity={0.85}
              >
                <Ionicons
                  name="alert-circle-outline"
                  size={22}
                  color="#EA580C"
                />
                <View style={{ flex: 1 }}>
                  <Text style={styles.optionTitle}>Não sei o histórico</Text>
                  <Text style={styles.optionText}>
                    Para pets sem informações anteriores de vacina.
                  </Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.optionCard,
                  situacaoVacinal === "resgatado" && styles.optionCardActive,
                ]}
                onPress={() => setSituacaoVacinal("resgatado")}
                activeOpacity={0.85}
              >
                <Ionicons
                  name="heart-circle-outline"
                  size={22}
                  color="#EF4444"
                />
                <View style={{ flex: 1 }}>
                  <Text style={styles.optionTitle}>
                    Pet resgatado recentemente
                  </Text>
                  <Text style={styles.optionText}>
                    Gera prioridade para consulta, exames, vermífugo e avaliação
                    vacinal.
                  </Text>
                </View>
              </TouchableOpacity>
            </View>
          </View>

          {situacaoVacinal === "resgatado" && (
            <View style={styles.alertBox}>
              <Ionicons name="alert-circle-outline" size={22} color="#B91C1C" />
              <View style={{ flex: 1 }}>
                <Text style={styles.alertTitle}>
                  Atenção para pet resgatado
                </Text>
                <Text style={styles.alertText}>
                  Como o histórico pode ser desconhecido, recomendamos consulta
                  inicial, exame clínico, vermífugo e avaliação do protocolo de
                  vacinação com um veterinário.
                </Text>
              </View>
            </View>
          )}

          {situacaoVacinal === "historico_desconhecido" && (
            <View style={styles.warningBox}>
              <Ionicons
                name="information-circle-outline"
                size={22}
                color="#D97706"
              />
              <View style={{ flex: 1 }}>
                <Text style={styles.warningTitle}>Histórico desconhecido</Text>
                <Text style={styles.warningText}>
                  O ClyvoCare vai tratar esse pet como prioridade de revisão,
                  sugerindo conferência das vacinas e montagem de um novo
                  calendário preventivo.
                </Text>
              </View>
            </View>
          )}

          {situacaoVacinal === "sem_carteirinha" && (
            <View style={styles.infoSituationBox}>
              <Ionicons
                name="document-text-outline"
                size={22}
                color="#0F766E"
              />
              <View style={{ flex: 1 }}>
                <Text style={styles.infoSituationTitle}>Sem carteirinha</Text>
                <Text style={styles.infoSituationText}>
                  Mesmo sem documento, o tutor pode registrar o que lembra e
                  buscar orientação veterinária para criar um novo histórico
                  seguro.
                </Text>
              </View>
            </View>
          )}
        </>
      )}

      {vacinas.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            {usaSituacaoVacinal
              ? "Vacinas e cuidados preventivos"
              : "Cuidados preventivos"}
          </Text>
          <Text style={styles.sectionSub}>
            {usaSituacaoVacinal
              ? "Marque apenas os cuidados que você tem certeza que estão em dia."
              : "Para esta espécie, o foco é check-up, exames, controle de parasitas, ambiente adequado e acompanhamento veterinário."}
          </Text>

          <View style={styles.vacinasList}>
            {vacinas.map((vacina, index) => (
              <TouchableOpacity
                key={`${vacina.nome}-${index}`}
                style={[
                  styles.vacinaRow,
                  vacina.emDia && styles.vacinaRowActive,
                ]}
                onPress={() => toggleVacina(index)}
                activeOpacity={0.85}
              >
                <View
                  style={[
                    styles.vacinaCheck,
                    vacina.emDia && styles.vacinaCheckActive,
                  ]}
                >
                  {vacina.emDia && (
                    <Ionicons name="checkmark" size={15} color="#fff" />
                  )}
                </View>

                <View style={{ flex: 1 }}>
                  <Text
                    style={[
                      styles.vacinaNome,
                      vacina.emDia && styles.vacinaNomeActive,
                    ]}
                  >
                    {vacina.nome}
                  </Text>
                  <Text style={styles.vacinaDesc}>
                    {vacina.emDia
                      ? "Registrado como cuidado em dia"
                      : "Toque se este cuidado já foi realizado"}
                  </Text>
                </View>

                <View
                  style={[
                    styles.vacinaStatus,
                    {
                      backgroundColor: vacina.emDia ? "#CCFBF1" : "#F1F5F9",
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.vacinaStatusText,
                      {
                        color: vacina.emDia ? "#0F766E" : "#94A3B8",
                      },
                    ]}
                  >
                    {vacina.emDia ? "Em dia" : "Pendente"}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}

      {usaSituacaoVacinal && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Carteirinha de vacinação</Text>
          <Text style={styles.sectionSub}>
            Anexe uma foto da carteirinha, se tiver. Caso não tenha, o cadastro
            continua normalmente.
          </Text>

          <TouchableOpacity
            style={[
              styles.carteiraCard,
              carteiraVacina && styles.carteiraCardActive,
            ]}
            onPress={escolherCarteiraVacina}
            activeOpacity={0.85}
          >
            {carteiraVacina ? (
              <>
                <Image
                  source={{ uri: carteiraVacina }}
                  style={styles.carteiraPreview}
                />

                <View style={styles.carteiraInfo}>
                  <View style={styles.carteiraIconActive}>
                    <Ionicons
                      name="checkmark-circle"
                      size={22}
                      color="#0F766E"
                    />
                  </View>

                  <View style={{ flex: 1 }}>
                    <Text style={styles.carteiraTitle}>
                      Carteirinha anexada
                    </Text>
                    <Text style={styles.carteiraSub}>
                      Toque para substituir a imagem salva.
                    </Text>
                  </View>
                </View>
              </>
            ) : (
              <View style={styles.carteiraEmpty}>
                <View style={styles.carteiraIcon}>
                  <Ionicons
                    name="document-attach-outline"
                    size={28}
                    color="#0F766E"
                  />
                </View>

                <Text style={styles.carteiraTitle}>Adicionar carteirinha</Text>
                <Text style={styles.carteiraSub}>
                  Envie uma foto da página de vacinas, reforços ou exames.
                </Text>
              </View>
            )}
          </TouchableOpacity>

          {carteiraVacina && (
            <TouchableOpacity
              style={styles.removeCarteiraBtn}
              onPress={removerCarteira}
              activeOpacity={0.85}
            >
              <Ionicons name="trash-outline" size={16} color="#EF4444" />
              <Text style={styles.removeCarteiraText}>Remover carteirinha</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Histórico de saúde</Text>
        <Text style={styles.sectionSub}>
          Use este campo para registrar doenças anteriores, alergias, cirurgias,
          tratamentos ou cuidados especiais.
        </Text>

        <View style={styles.textAreaWrap}>
          <TextInput
            style={styles.textArea}
            placeholder="Ex: Foi resgatado na rua, estava com pulgas, tem alergia, já teve dermatite, usa remédio contínuo..."
            placeholderTextColor="#CBD5E1"
            value={observacoes}
            onChangeText={setObservacoes}
            multiline
            textAlignVertical="top"
          />
        </View>
      </View>

      <View style={styles.infoCard}>
        <View style={styles.infoIcon}>
          <Ionicons name="sparkles-outline" size={22} color="#0F766E" />
        </View>

        <View style={{ flex: 1 }}>
          <Text style={styles.infoTitle}>Como o score é calculado?</Text>
          <Text style={styles.infoText}>
            O ClyvoCare analisa os cuidados conforme a espécie: vacinas quando
            fizer sentido, check-ups, documentação do animal, idade, peso e
            possíveis alertas no histórico de saúde. Para cães e gatos, também
            considera a castração. Pets resgatados ou sem histórico recebem
            prioridade para revisão veterinária.
          </Text>
        </View>
      </View>

      <TouchableOpacity
        style={[styles.saveBtn, salvando && styles.saveBtnDisabled]}
        onPress={salvar}
        activeOpacity={0.9}
        disabled={salvando}
      >
        <Ionicons name="checkmark-circle-outline" size={22} color="#fff" />

        <Text style={styles.saveBtnText}>
          {salvando
            ? "Salvando..."
            : petId
              ? "Salvar alterações"
              : "Cadastrar pet"}
        </Text>
      </TouchableOpacity>

      <Modal visible={modalEspecie} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Tipo de animal</Text>

              <TouchableOpacity onPress={() => setModalEspecie(false)}>
                <Ionicons name="close" size={25} color="#64748B" />
              </TouchableOpacity>
            </View>

            <FlatList
              data={ESPECIES}
              keyExtractor={(item) => item.id}
              showsVerticalScrollIndicator={false}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.modalItem,
                    especieSelecionada?.id === item.id &&
                      styles.modalItemActive,
                  ]}
                  onPress={() => selecionarEspecie(item)}
                  activeOpacity={0.85}
                >
                  <MaterialCommunityIcons
                    name={item.icone as any}
                    size={24}
                    color={
                      especieSelecionada?.id === item.id ? "#0F766E" : "#64748B"
                    }
                  />

                  <Text
                    style={[
                      styles.modalItemText,
                      especieSelecionada?.id === item.id &&
                        styles.modalItemTextActive,
                    ]}
                  >
                    {item.label}
                  </Text>

                  {especieSelecionada?.id === item.id && (
                    <Ionicons
                      name="checkmark-circle"
                      size={20}
                      color="#0F766E"
                    />
                  )}
                </TouchableOpacity>
              )}
            />
          </View>
        </View>
      </Modal>

      <Modal visible={modalRaca} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {especieSelecionada?.labelRaca || "Selecionar raça"}
              </Text>

              <TouchableOpacity onPress={() => setModalRaca(false)}>
                <Ionicons name="close" size={25} color="#64748B" />
              </TouchableOpacity>
            </View>

            <FlatList
              data={especieSelecionada?.racas || []}
              keyExtractor={(item) => item}
              showsVerticalScrollIndicator={false}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.modalItem,
                    raca === item && styles.modalItemActive,
                  ]}
                  onPress={() => selecionarRaca(item)}
                  activeOpacity={0.85}
                >
                  <Text
                    style={[
                      styles.modalItemText,
                      raca === item && styles.modalItemTextActive,
                    ]}
                  >
                    {item}
                  </Text>

                  {raca === item && (
                    <Ionicons
                      name="checkmark-circle"
                      size={20}
                      color="#0F766E"
                    />
                  )}
                </TouchableOpacity>
              )}
            />
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F6FBFA",
  },

  content: {
    paddingBottom: 60,
  },

  header: {
    paddingTop: 56,
    paddingHorizontal: 20,
    paddingBottom: 18,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  backBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "#E0F5F2",
    alignItems: "center",
    justifyContent: "center",
  },

  headerTitle: {
    fontSize: 19,
    fontWeight: "900",
    color: "#061B3A",
    letterSpacing: -0.4,
  },

  deleteBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "#FEF2F2",
    alignItems: "center",
    justifyContent: "center",
  },

  heroCard: {
    marginHorizontal: 18,
    marginBottom: 22,
    backgroundColor: "#FFFFFF",
    borderRadius: 30,
    padding: 20,
    borderWidth: 1,
    borderColor: "#D8F7F2",
    shadowColor: "#0F766E",
    shadowOpacity: 0.1,
    shadowRadius: 18,
    elevation: 4,
  },

  fotoSection: {
    alignItems: "center",
  },

  fotoWrap: {
    position: "relative",
    marginBottom: 10,
  },

  fotoImg: {
    width: 118,
    height: 118,
    borderRadius: 59,
    borderWidth: 4,
    borderColor: "#B2EEEA",
  },

  fotoPlaceholder: {
    width: 118,
    height: 118,
    borderRadius: 59,
    backgroundColor: "#F0FDFA",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 4,
    borderColor: "#B2EEEA",
    borderStyle: "dashed",
  },

  cameraBtn: {
    position: "absolute",
    bottom: 5,
    right: 5,
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "#0F766E",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 3,
    borderColor: "#FFFFFF",
  },

  fotoTitle: {
    fontSize: 16,
    fontWeight: "900",
    color: "#0F172A",
  },

  fotoHint: {
    marginTop: 3,
    fontSize: 12,
    color: "#94A3B8",
    fontWeight: "600",
  },

  removePhotoBtn: {
    marginTop: 10,
    backgroundColor: "#FEF2F2",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 14,
  },

  removePhotoText: {
    color: "#EF4444",
    fontSize: 12,
    fontWeight: "900",
  },

  scorePreview: {
    marginTop: 22,
    backgroundColor: "#F8FFFE",
    borderRadius: 24,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderWidth: 1,
    borderColor: "#D8F7F2",
  },

  scoreTitle: {
    fontSize: 15,
    fontWeight: "900",
    color: "#0F172A",
  },

  scoreSub: {
    fontSize: 12,
    color: "#64748B",
    marginTop: 4,
    fontWeight: "600",
    lineHeight: 17,
  },

  scoreDetails: {
    marginTop: 12,
    gap: 6,
  },

  scoreMiniItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },

  scoreMiniText: {
    fontSize: 11,
    color: "#64748B",
    fontWeight: "700",
  },

  scoreBadge: {
    minWidth: 88,
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderRadius: 20,
    alignItems: "center",
  },

  scoreNum: {
    fontSize: 28,
    fontWeight: "900",
    letterSpacing: -0.6,
  },

  scoreLabel: {
    fontSize: 10,
    fontWeight: "900",
    marginTop: -1,
    textAlign: "center",
  },

  section: {
    marginHorizontal: 18,
    marginBottom: 22,
  },

  sectionTitle: {
    fontSize: 17,
    fontWeight: "900",
    color: "#0F172A",
    marginBottom: 4,
  },

  sectionSub: {
    fontSize: 12,
    color: "#94A3B8",
    fontWeight: "600",
    marginBottom: 13,
    lineHeight: 18,
  },

  row: {
    flexDirection: "row",
    gap: 10,
  },

  fieldWrap: {
    marginBottom: 13,
  },

  label: {
    fontSize: 12,
    fontWeight: "900",
    color: "#334155",
    marginBottom: 7,
  },

  inputWrap: {
    height: 52,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E2F8F5",
    paddingHorizontal: 14,
  },

  selectorWrap: {
    height: 52,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E2F8F5",
    paddingHorizontal: 14,
  },

  inputIcon: {
    marginRight: 10,
  },

  input: {
    flex: 1,
    fontSize: 14,
    color: "#0F172A",
    fontWeight: "700",
  },

  selectorText: {
    flex: 1,
    fontSize: 14,
    color: "#0F172A",
    fontWeight: "700",
  },

  selectorPlaceholder: {
    color: "#CBD5E1",
    fontWeight: "500",
  },

  optionList: {
    gap: 10,
  },

  optionCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 15,
    borderWidth: 1,
    borderColor: "#E2F8F5",
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
  },

  optionCardActive: {
    backgroundColor: "#F0FDFA",
    borderColor: "#0F766E",
  },

  optionTitle: {
    fontSize: 14,
    fontWeight: "900",
    color: "#0F172A",
    marginBottom: 3,
  },

  optionText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#64748B",
    lineHeight: 17,
  },

  alertBox: {
    marginHorizontal: 18,
    marginBottom: 22,
    backgroundColor: "#FEF2F2",
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: "#FECACA",
    flexDirection: "row",
    gap: 12,
  },

  alertTitle: {
    fontSize: 14,
    fontWeight: "900",
    color: "#991B1B",
    marginBottom: 4,
  },

  alertText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#7F1D1D",
    lineHeight: 18,
  },

  warningBox: {
    marginHorizontal: 18,
    marginBottom: 22,
    backgroundColor: "#FFFBEB",
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: "#FDE68A",
    flexDirection: "row",
    gap: 12,
  },

  warningTitle: {
    fontSize: 14,
    fontWeight: "900",
    color: "#92400E",
    marginBottom: 4,
  },

  warningText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#78350F",
    lineHeight: 18,
  },

  infoSituationBox: {
    marginHorizontal: 18,
    marginBottom: 22,
    backgroundColor: "#ECFEFF",
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: "#A5F3FC",
    flexDirection: "row",
    gap: 12,
  },

  infoSituationTitle: {
    fontSize: 14,
    fontWeight: "900",
    color: "#155E75",
    marginBottom: 4,
  },

  infoSituationText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#155E75",
    lineHeight: 18,
  },

  vacinasList: {
    gap: 9,
  },

  vacinaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: "#E2F8F5",
  },

  vacinaRowActive: {
    borderColor: "#99F6E4",
    backgroundColor: "#F0FDFA",
  },

  vacinaCheck: {
    width: 27,
    height: 27,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: "#CBD5E1",
    alignItems: "center",
    justifyContent: "center",
  },

  vacinaCheckActive: {
    backgroundColor: "#0F766E",
    borderColor: "#0F766E",
  },

  vacinaNome: {
    fontSize: 14,
    fontWeight: "900",
    color: "#64748B",
  },

  vacinaNomeActive: {
    color: "#0F172A",
  },

  vacinaDesc: {
    marginTop: 2,
    fontSize: 11,
    color: "#94A3B8",
    fontWeight: "600",
  },

  vacinaStatus: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },

  vacinaStatusText: {
    fontSize: 11,
    fontWeight: "900",
  },

  carteiraCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "#E2F8F5",
    overflow: "hidden",
  },

  carteiraCardActive: {
    borderColor: "#99F6E4",
    backgroundColor: "#F0FDFA",
  },

  carteiraEmpty: {
    minHeight: 150,
    alignItems: "center",
    justifyContent: "center",
    padding: 22,
  },

  carteiraIcon: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: "#E0F5F2",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },

  carteiraIconActive: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "#CCFBF1",
    alignItems: "center",
    justifyContent: "center",
  },

  carteiraPreview: {
    width: "100%",
    height: 190,
    backgroundColor: "#E2E8F0",
  },

  carteiraInfo: {
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },

  carteiraTitle: {
    fontSize: 15,
    fontWeight: "900",
    color: "#0F172A",
    textAlign: "center",
  },

  carteiraSub: {
    marginTop: 4,
    fontSize: 12,
    color: "#64748B",
    fontWeight: "600",
    lineHeight: 17,
    textAlign: "center",
  },

  removeCarteiraBtn: {
    marginTop: 10,
    alignSelf: "flex-start",
    backgroundColor: "#FEF2F2",
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },

  removeCarteiraText: {
    color: "#EF4444",
    fontSize: 12,
    fontWeight: "900",
  },

  textAreaWrap: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E2F8F5",
    paddingHorizontal: 14,
    paddingVertical: 12,
    minHeight: 120,
  },

  textArea: {
    flex: 1,
    minHeight: 95,
    fontSize: 14,
    color: "#0F172A",
    fontWeight: "600",
    lineHeight: 20,
  },

  infoCard: {
    marginHorizontal: 18,
    marginBottom: 24,
    backgroundColor: "#ECFEFF",
    borderRadius: 22,
    padding: 17,
    flexDirection: "row",
    gap: 13,
    borderWidth: 1,
    borderColor: "#CFFAFE",
  },

  infoIcon: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
  },

  infoTitle: {
    fontSize: 14,
    fontWeight: "900",
    color: "#0F172A",
    marginBottom: 4,
  },

  infoText: {
    fontSize: 12,
    color: "#475569",
    fontWeight: "600",
    lineHeight: 18,
  },

  saveBtn: {
    marginHorizontal: 18,
    marginTop: 2,
    backgroundColor: "#0F766E",
    borderRadius: 22,
    paddingVertical: 17,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    shadowColor: "#0F766E",
    shadowOpacity: 0.28,
    shadowRadius: 12,
    elevation: 4,
  },

  saveBtnDisabled: {
    opacity: 0.6,
  },

  saveBtnText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "900",
  },

  unidadePesoBox: {
    flexDirection: "row",
    backgroundColor: "#E0F5F2",
    borderRadius: 12,
    padding: 3,
    marginLeft: 8,
  },

  unidadePesoBtn: {
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 9,
  },

  unidadePesoBtnActive: {
    backgroundColor: "#0F766E",
  },

  unidadePesoBtnDisabled: {
    opacity: 0.3,
  },

  unidadePesoText: {
    fontSize: 11,
    fontWeight: "900",
    color: "#0F766E",
  },

  unidadePesoTextActive: {
    color: "#FFFFFF",
  },

  unidadePesoTextDisabled: {
    color: "#94A3B8",
  },

  pesoHint: {
    marginTop: 6,
    fontSize: 11,
    color: "#94A3B8",
    fontWeight: "600",
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
    maxHeight: "78%",
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
    gap: 14,
    paddingVertical: 15,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },

  modalItemActive: {
    backgroundColor: "#F0FDFA",
    borderRadius: 15,
    borderBottomColor: "transparent",
    paddingHorizontal: 12,
  },

  modalItemText: {
    flex: 1,
    fontSize: 15,
    color: "#64748B",
    fontWeight: "700",
  },

  modalItemTextActive: {
    color: "#0F172A",
    fontWeight: "900",
  },
});
