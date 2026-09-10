import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import React, { ReactNode, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Animated,
  FlatList,
  KeyboardAvoidingView,
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
import { useOwnerProfile } from "../hooks/useOwnerProfile";
import {
  useCreatePet,
  useSpecies,
  useUpdatePet,
} from "../hooks/usePets";
import {
  Pet,
  PetRequest,
  PetSex,
  PetSize,
  Species,
} from "../types/pet";

type Option<T> = {
  label: string;
  value: T;
};

type WeightUnit = "kg" | "g";

type SpeciesMeta = {
  icon: string;
  color: string;
  background: string;
  subtitle: string;
  breeds: string[];
  defaultWeightUnit?: WeightUnit;
};

const SEX_OPTIONS: Option<PetSex>[] = [
  { label: "Macho", value: "MALE" },
  { label: "Fêmea", value: "FEMALE" },
];

const SIZE_OPTIONS: Option<PetSize>[] = [
  { label: "Pequeno", value: "SMALL" },
  { label: "Médio", value: "MEDIUM" },
  { label: "Grande", value: "LARGE" },
];

const DEFAULT_SPECIES_META: SpeciesMeta = {
  icon: "paw",
  color: "#0F766E",
  background: "#DFF7F4",
  subtitle: "Animal de companhia",
  breeds: ["SRD", "Outra"],
};

const DOG_BREEDS = [
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
  "Outra",
];

const SPECIES_META: Record<string, SpeciesMeta> = {
  cao: {
    icon: "dog",
    color: "#0F766E",
    background: "#DFF7F4",
    subtitle: "Cães de todos os portes",
    breeds: DOG_BREEDS,
  },
  cachorro: {
    icon: "dog",
    color: "#0F766E",
    background: "#DFF7F4",
    subtitle: "Cães de todos os portes",
    breeds: DOG_BREEDS,
  },
  gato: {
    icon: "cat",
    color: "#7C3AED",
    background: "#F3E8FF",
    subtitle: "Felinos domésticos",
    breeds: [
      "SRD (Vira-lata)",
      "Persa",
      "Siamês",
      "Maine Coon",
      "Ragdoll",
      "Bengal",
      "Sphynx",
      "Scottish Fold",
      "Angorá",
      "Abissínio",
      "Outra",
    ],
  },
  hamster: {
    icon: "rodent",
    color: "#D97706",
    background: "#FEF3C7",
    subtitle: "Pequenos roedores",
    breeds: ["Sírio", "Anão Russo", "Chinês", "Roborovski", "Outra"],
    defaultWeightUnit: "g",
  },
  "porquinho da india": {
    icon: "rodent",
    color: "#EA580C",
    background: "#FFEDD5",
    subtitle: "Porquinhos-da-índia",
    breeds: ["Americano", "Abissínio", "Peruano", "Teddy", "Rex", "Skinny", "Outra"],
    defaultWeightUnit: "g",
  },
  coelho: {
    icon: "rabbit",
    color: "#DB2777",
    background: "#FCE7F3",
    subtitle: "Coelhos domésticos",
    breeds: ["Mini Coelho", "Angorá", "Holland Lop", "Rex", "Lionhead", "Netherland Dwarf", "Outra"],
  },
  tartaruga: {
    icon: "turtle",
    color: "#15803D",
    background: "#DCFCE7",
    subtitle: "Quelônios aquáticos",
    breeds: ["Tigre-d'água", "Orelha-vermelha", "Tartaruga-de-caixa", "Tartaruga-pintada", "Outra"],
  },
  jabuti: {
    icon: "turtle",
    color: "#4D7C0F",
    background: "#ECFCCB",
    subtitle: "Quelônios terrestres",
    breeds: ["Jabuti-piranga", "Jabuti-tinga", "Jabuti-do-chaco", "Outra"],
  },
  furao: {
    icon: "paw",
    color: "#92400E",
    background: "#FEF3C7",
    subtitle: "Furões domésticos",
    breeds: ["Europeu", "Doméstico", "Albino", "Outra"],
  },
  "rato twister": {
    icon: "rodent",
    color: "#475569",
    background: "#F1F5F9",
    subtitle: "Ratos domésticos",
    breeds: ["Padrão", "Rex", "Dumbo", "Hairless", "Outra"],
    defaultWeightUnit: "g",
  },
  chinchila: {
    icon: "rodent",
    color: "#64748B",
    background: "#F1F5F9",
    subtitle: "Chinchilas domésticas",
    breeds: ["Padrão Cinza", "Branca", "Bege", "Preta", "Outra"],
    defaultWeightUnit: "g",
  },
  ave: {
    icon: "bird",
    color: "#0284C7",
    background: "#E0F2FE",
    subtitle: "Aves domésticas e exóticas",
    breeds: ["Papagaio", "Calopsita", "Periquito", "Canário", "Agapornis", "Cacatua", "Arara", "Maritaca", "Outra"],
    defaultWeightUnit: "g",
  },
  peixe: {
    icon: "fish",
    color: "#0891B2",
    background: "#CFFAFE",
    subtitle: "Peixes ornamentais",
    breeds: ["Betta", "Goldfish", "Kinguio", "Guppy", "Tetra Neon", "Disco", "Arowana", "Oscar", "Outra"],
    defaultWeightUnit: "g",
  },
  porco: {
    icon: "pig",
    color: "#DB2777",
    background: "#FCE7F3",
    subtitle: "Suínos domésticos",
    breeds: ["Doméstico", "Vietnamita", "Pot-belly", "Outra"],
  },
  "mini porco": {
    icon: "pig",
    color: "#BE185D",
    background: "#FCE7F3",
    subtitle: "Mini pigs",
    breeds: ["Vietnamita", "Juliana", "KuneKune", "Pot-belly", "Outra"],
  },
  vaca: {
    icon: "cow",
    color: "#334155",
    background: "#E2E8F0",
    subtitle: "Bovinos",
    breeds: ["Nelore", "Gir", "Girolando", "Holandesa", "Jersey", "Angus", "Outra"],
  },
  "mini vaca": {
    icon: "cow",
    color: "#475569",
    background: "#E2E8F0",
    subtitle: "Bovinos de pequeno porte",
    breeds: ["Nelore", "Gir", "Girolando", "Holandesa", "Jersey", "Angus", "Outra"],
  },
  cabra: {
    icon: "sheep",
    color: "#7C2D12",
    background: "#FFEDD5",
    subtitle: "Caprinos",
    breeds: ["Saanen", "Toggenburg", "Anglo-nubiana", "Boer", "SRD", "Outra"],
  },
  cobra: {
    icon: "snake",
    color: "#166534",
    background: "#DCFCE7",
    subtitle: "Serpentes legalizadas",
    breeds: ["Jiboia", "Cobra Milho", "Píton Real", "Falsa Coral", "Cobra Rei", "Outra"],
  },
  lagarto: {
    icon: "lizard",
    color: "#65A30D",
    background: "#ECFCCB",
    subtitle: "Lagartos legalizados",
    breeds: ["Gecko-leopardo", "Dragão-barbudo", "Iguana-verde", "Teiú", "Camaleão", "Outra"],
  },
};

function normalizeText(value?: string | null) {
  return (value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase();
}

function getSpeciesMeta(name?: string | null) {
  return SPECIES_META[normalizeText(name)] ?? DEFAULT_SPECIES_META;
}

function formatDateInput(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 8);

  if (digits.length <= 2) return digits;
  if (digits.length <= 4) {
    return `${digits.slice(0, 2)}/${digits.slice(2)}`;
  }

  return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
}

function formatApiDateForDisplay(value?: string | null) {
  if (!value) return "";

  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!match) return formatDateInput(value);

  const [, year, month, day] = match;
  return `${day}/${month}/${year}`;
}

function formatDisplayDateForApi(value: string) {
  const match = value.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (!match) return null;

  const [, day, month, year] = match;
  return `${year}-${month}-${day}`;
}

function validateDate(value: string) {
  if (!/^\d{2}\/\d{2}\/\d{4}$/.test(value)) return false;

  const [day, month, year] = value.split("/").map(Number);
  const parsedDate = new Date(year, month - 1, day);

  return (
    parsedDate.getFullYear() === year &&
    parsedDate.getMonth() === month - 1 &&
    parsedDate.getDate() === day &&
    parsedDate <= new Date()
  );
}

export default function PetRegisterScreen({ navigation, route }: any) {
  const pet = route?.params?.pet as Pet | undefined;
  const editing = Boolean(pet);
  const fadeAnimation = useRef(new Animated.Value(0)).current;
  const slideAnimation = useRef(new Animated.Value(22)).current;

  const {
    data: ownerProfile,
    isLoading: ownerLoading,
    isError: ownerError,
    refetch: refetchOwner,
  } = useOwnerProfile();

  const {
    data: species = [],
    isLoading: speciesLoading,
    isError: speciesError,
    refetch: refetchSpecies,
  } = useSpecies();

  const createPet = useCreatePet(ownerProfile?.id ?? 0);
  const updatePet = useUpdatePet(ownerProfile?.id ?? 0);

  const [name, setName] = useState(pet?.name ?? "");
  const [birthDate, setBirthDate] = useState(
    formatApiDateForDisplay(pet?.birthDate),
  );
  const [birthDateUnknown, setBirthDateUnknown] = useState(
    Boolean(pet && !pet.birthDate),
  );
  const [breed, setBreed] = useState(pet?.breed ?? "");
  const [weight, setWeight] = useState(
    pet?.currentWeight !== null && pet?.currentWeight !== undefined
      ? String(pet.currentWeight)
      : "",
  );
  const [weightUnit, setWeightUnit] = useState<WeightUnit>("kg");
  const [microchip, setMicrochip] = useState(pet?.microchip ?? "");
  const [sex, setSex] = useState<PetSex | null>(pet?.sex ?? null);
  const [size, setSize] = useState<PetSize | null>(pet?.size ?? null);
  const [speciesId, setSpeciesId] = useState<number | null>(null);
  const [speciesModalVisible, setSpeciesModalVisible] = useState(false);
  const [breedModalVisible, setBreedModalVisible] = useState(false);
  const [speciesSearch, setSpeciesSearch] = useState("");
  const [customBreed, setCustomBreed] = useState("");

  const selectedSpecies = useMemo(
    () => species.find((item) => item.id === speciesId) ?? null,
    [species, speciesId],
  );
  const selectedSpeciesMeta = getSpeciesMeta(selectedSpecies?.name);

  const filteredSpecies = useMemo(() => {
    const search = normalizeText(speciesSearch);
    if (!search) return species;
    return species.filter((item) => normalizeText(item.name).includes(search));
  }, [species, speciesSearch]);

  const completedFields = [
    name.trim(),
    speciesId,
    breed.trim(),
    birthDateUnknown || birthDate.trim(),
    sex,
    size,
    weight.trim(),
  ].filter(Boolean).length;

  const progress = Math.round((completedFields / 7) * 100);
  const saving = createPet.isPending || updatePet.isPending;
  const loading = ownerLoading || speciesLoading;
  const loadingError = ownerError || speciesError;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnimation, {
        toValue: 1,
        duration: 450,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnimation, {
        toValue: 0,
        damping: 18,
        stiffness: 125,
        useNativeDriver: true,
      }),
    ]).start();
  }, [fadeAnimation, slideAnimation]);

  useEffect(() => {
    if (species.length === 0 || speciesId !== null) return;
    if (pet) {
      const petSpecies = species.find(
        (item) => normalizeText(item.name) === normalizeText(pet.speciesName),
      );
      setSpeciesId(petSpecies?.id ?? species[0].id);
      return;
    }
    setSpeciesId(species[0].id);
  }, [pet, species, speciesId]);

  function selectSpecies(item: Species) {
    if (speciesId !== item.id) {
      setBreed("");
      setCustomBreed("");
      setWeightUnit(getSpeciesMeta(item.name).defaultWeightUnit ?? "kg");
    }
    setSpeciesId(item.id);
    setSpeciesModalVisible(false);
    setSpeciesSearch("");
  }

  function selectBreed(value: string) {
    if (value === "Outra") {
      setCustomBreed(breed === "Outra" ? "" : breed);
      return;
    }
    setBreed(value);
    setCustomBreed("");
    setBreedModalVisible(false);
  }

  function saveCustomBreed() {
    const normalizedBreed = customBreed.trim();
    if (!normalizedBreed) {
      Alert.alert("Atenção", "Digite a raça ou identificação do pet.");
      return;
    }
    setBreed(normalizedBreed);
    setBreedModalVisible(false);
  }

  function validateForm() {
    if (!name.trim()) {
      Alert.alert("Nome obrigatório", "Digite o nome do pet.");
      return false;
    }
    if (!speciesId) {
      Alert.alert("Espécie obrigatória", "Selecione a espécie do pet.");
      return false;
    }
    if (
      !birthDateUnknown &&
      birthDate.trim() &&
      !validateDate(birthDate.trim())
    ) {
      Alert.alert(
        "Data inválida",
        "Informe uma data real, que não esteja no futuro, no formato DD/MM/AAAA.",
      );
      return false;
    }
    const parsedWeight = Number(weight.replace(",", "."));
    if (weight.trim() && (Number.isNaN(parsedWeight) || parsedWeight < 0)) {
      Alert.alert("Peso inválido", "Digite um peso válido.");
      return false;
    }
    return true;
  }

  async function savePet() {
    if (!validateForm() || !ownerProfile || !speciesId) return;

    const typedWeight = weight.trim()
      ? Number(weight.replace(",", "."))
      : null;
    const weightInKg =
      typedWeight === null
        ? null
        : weightUnit === "g"
          ? typedWeight / 1000
          : typedWeight;

    const data: PetRequest = {
      name: name.trim(),
      birthDate:
        birthDateUnknown || !birthDate.trim()
          ? null
          : formatDisplayDateForApi(birthDate.trim()),
      sex,
      currentWeight: weightInKg,
      microchip: microchip.trim() || null,
      breed: breed.trim() || null,
      size,
      photoUrl: pet?.photoUrl ?? null,
      ownerId: ownerProfile.id,
      speciesId,
    };

    try {
      if (pet) {
        await updatePet.mutateAsync({ petId: pet.id, data });
      } else {
        await createPet.mutateAsync(data);
      }
      Alert.alert(
        editing ? "Pet atualizado!" : "Pet cadastrado!",
        editing
          ? `As informações de ${data.name} foram atualizadas.`
          : `${data.name} agora faz parte da família ClyvoCare.`,
        [{ text: "Ver meus pets", onPress: () => navigation.goBack() }],
      );
    } catch (error) {
      Alert.alert(
        "Não foi possível salvar",
        error instanceof Error
          ? error.message
          : "Ocorreu um erro ao salvar o pet.",
      );
    }
  }

  async function reloadForm() {
    await Promise.all([refetchOwner(), refetchSpecies()]);
  }

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <View style={styles.loadingIconBox}>
          <MaterialCommunityIcons name="paw" size={38} color="#0F766E" />
        </View>
        <ActivityIndicator size="large" color="#0F766E" />
        <Text style={styles.loadingTitle}>Preparando o cadastro</Text>
        <Text style={styles.loadingText}>Buscando as espécies na API...</Text>
      </View>
    );
  }

  if (loadingError) {
    return (
      <View style={styles.centerContainer}>
        <Ionicons name="cloud-offline-outline" size={50} color="#EF4444" />
        <Text style={styles.errorTitle}>Não foi possível abrir o formulário</Text>
        <Text style={styles.errorText}>
          Confira se a API Java está funcionando na porta 8080.
        </Text>
        <TouchableOpacity style={styles.retryButton} onPress={() => void reloadForm()}>
          <Ionicons name="refresh" size={19} color="#FFFFFF" />
          <Text style={styles.retryButtonText}>Tentar novamente</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <StatusBar barStyle="light-content" backgroundColor="#064E4A" />

      <LinearGradient
        colors={["#064E4A", "#0F766E", "#14B8A6"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <View style={styles.headerCircleOne} />
        <View style={styles.headerCircleTwo} />
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          activeOpacity={0.85}
        >
          <Ionicons name="arrow-back" size={22} color="#0F766E" />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.headerEyebrow}>
            {editing ? "ATUALIZAÇÃO DE CADASTRO" : "NOVO MEMBRO DA FAMÍLIA"}
          </Text>
          <Text style={styles.headerTitle}>
            {editing ? "Editar pet" : "Cadastrar pet"}
          </Text>
          <Text style={styles.headerSubtitle}>
            Um perfil completo ajuda a personalizar todos os cuidados.
          </Text>
        </View>
      </LinearGradient>

      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Animated.View
          style={{
            opacity: fadeAnimation,
            transform: [{ translateY: slideAnimation }],
          }}
        >
          <View style={styles.summaryCard}>
            <View
              style={[
                styles.summaryIcon,
                { backgroundColor: selectedSpeciesMeta.background },
              ]}
            >
              <MaterialCommunityIcons
                name={selectedSpeciesMeta.icon as any}
                size={38}
                color={selectedSpeciesMeta.color}
              />
            </View>
            <View style={styles.summaryContent}>
              <Text style={styles.summaryLabel}>PERFIL DO PET</Text>
              <Text style={styles.summaryName}>{name.trim() || "Seu novo pet"}</Text>
              <Text style={styles.summaryDetails}>
                {selectedSpecies?.name || "Selecione a espécie"}
                {breed.trim() ? ` • ${breed.trim()}` : ""}
              </Text>
            </View>
            <View style={styles.progressBadge}>
              <Text style={styles.progressBadgeValue}>{progress}%</Text>
              <Text style={styles.progressBadgeLabel}>completo</Text>
            </View>
          </View>

          <View style={styles.progressTrack}>
            <View
              style={[
                styles.progressFill,
                { width: `${progress}%` as `${number}%` },
              ]}
            />
          </View>

          <SectionCard
            number="01"
            icon="paw-outline"
            title="Identificação"
            subtitle="Como devemos chamar seu pet?"
          >
            <FormField
              label="Nome do pet"
              required
              value={name}
              onChangeText={setName}
              placeholder="Ex: Luna"
              icon="heart-outline"
              maxLength={100}
            />

            <Text style={styles.fieldLabel}>
              Espécie <Text style={styles.required}>*</Text>
            </Text>
            <TouchableOpacity
              style={styles.selector}
              onPress={() => setSpeciesModalVisible(true)}
              activeOpacity={0.85}
            >
              <View
                style={[
                  styles.selectorIcon,
                  { backgroundColor: selectedSpeciesMeta.background },
                ]}
              >
                <MaterialCommunityIcons
                  name={selectedSpeciesMeta.icon as any}
                  size={25}
                  color={selectedSpeciesMeta.color}
                />
              </View>
              <View style={styles.selectorContent}>
                <Text
                  style={[
                    styles.selectorValue,
                    !selectedSpecies && styles.selectorPlaceholder,
                  ]}
                >
                  {selectedSpecies?.name || "Escolha uma espécie"}
                </Text>
                <Text style={styles.selectorHint}>
                  {selectedSpecies
                    ? selectedSpeciesMeta.subtitle
                    : `${species.length} opções disponíveis pela API`}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={21} color="#94A3B8" />
            </TouchableOpacity>
          </SectionCard>

          <SectionCard
            number="02"
            icon="sparkles-outline"
            title="Características"
            subtitle="Conte um pouco mais sobre ele"
          >
            <Text style={styles.fieldLabel}>Raça ou identificação</Text>
            <TouchableOpacity
              style={styles.selector}
              onPress={() => {
                if (!selectedSpecies) {
                  Alert.alert("Primeiro a espécie", "Selecione a espécie antes da raça.");
                  return;
                }
                setBreedModalVisible(true);
              }}
              activeOpacity={0.85}
            >
              <View style={styles.selectorIconNeutral}>
                <Ionicons name="ribbon-outline" size={23} color="#0F766E" />
              </View>
              <View style={styles.selectorContent}>
                <Text
                  style={[
                    styles.selectorValue,
                    !breed && styles.selectorPlaceholder,
                  ]}
                >
                  {breed || "Selecionar raça"}
                </Text>
                <Text style={styles.selectorHint}>Escolha na lista ou digite outra</Text>
              </View>
              <Ionicons name="chevron-forward" size={21} color="#94A3B8" />
            </TouchableOpacity>

            <Text style={styles.fieldLabel}>Sexo</Text>
            <View style={styles.twoColumns}>
              {SEX_OPTIONS.map((option) => (
                <OptionButton
                  key={option.value}
                  label={option.label}
                  selected={sex === option.value}
                  onPress={() => setSex(option.value)}
                />
              ))}
            </View>

            <Text style={styles.fieldLabel}>Porte</Text>
            <View style={styles.sizeSelector}>
              {SIZE_OPTIONS.map((option) => {
                const selected = size === option.value;

                return (
                  <TouchableOpacity
                    key={option.value}
                    style={[
                      styles.sizeOption,
                      selected && styles.sizeOptionSelected,
                    ]}
                    onPress={() => setSize(option.value)}
                    activeOpacity={0.85}
                    accessibilityRole="button"
                    accessibilityState={{ selected }}
                  >
                    <Text
                      style={[
                        styles.sizeOptionText,
                        selected && styles.sizeOptionTextSelected,
                      ]}
                    >
                      {option.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
            <Text style={styles.sizeHelper}>
              Toque para selecionar o porte aproximado do pet.
            </Text>
          </SectionCard>

          <SectionCard
            number="03"
            icon="fitness-outline"
            title="Saúde e medidas"
            subtitle="Informações úteis para o acompanhamento"
          >
            <FormField
              label="Data de nascimento"
              value={birthDate}
              onChangeText={(value) => setBirthDate(formatDateInput(value))}
              placeholder={birthDateUnknown ? "Data não informada" : "DD/MM/AAAA"}
              helper={
                birthDateUnknown
                  ? "Sem problema: você poderá atualizar essa informação depois."
                  : "Exemplo: 10/05/2022. As barras aparecem automaticamente."
              }
              icon="calendar-outline"
              keyboardType="number-pad"
              maxLength={10}
              editable={!birthDateUnknown}
            />

            <TouchableOpacity
              style={[
                styles.unknownDateButton,
                birthDateUnknown && styles.unknownDateButtonSelected,
              ]}
              onPress={() => {
                const nextValue = !birthDateUnknown;
                setBirthDateUnknown(nextValue);
                if (nextValue) setBirthDate("");
              }}
              activeOpacity={0.85}
              accessibilityRole="checkbox"
              accessibilityState={{ checked: birthDateUnknown }}
            >
              <View
                style={[
                  styles.unknownDateCheckbox,
                  birthDateUnknown && styles.unknownDateCheckboxSelected,
                ]}
              >
                {birthDateUnknown && (
                  <Ionicons name="checkmark" size={15} color="#FFFFFF" />
                )}
              </View>
              <View style={styles.unknownDateContent}>
                <Text
                  style={[
                    styles.unknownDateTitle,
                    birthDateUnknown && styles.unknownDateTitleSelected,
                  ]}
                >
                  Não sei a data exata
                </Text>
                <Text style={styles.unknownDateText}>
                  Ideal para pets resgatados ou adotados sem histórico.
                </Text>
              </View>
            </TouchableOpacity>

            <Text style={styles.fieldLabel}>Peso atual</Text>
            <View style={styles.weightRow}>
              <View style={styles.weightInputBox}>
                <Ionicons name="scale-outline" size={21} color="#0F766E" />
                <TextInput
                  style={styles.weightInput}
                  value={weight}
                  onChangeText={setWeight}
                  placeholder={weightUnit === "kg" ? "Ex: 8,5" : "Ex: 350"}
                  placeholderTextColor="#94A3B8"
                  keyboardType="decimal-pad"
                  autoComplete="off"
                  importantForAutofill="no"
                  textContentType="none"
                />
              </View>
              <View style={styles.unitSelector}>
                {(["kg", "g"] as WeightUnit[]).map((unit) => (
                  <TouchableOpacity
                    key={unit}
                    style={[
                      styles.unitButton,
                      weightUnit === unit && styles.unitButtonSelected,
                    ]}
                    onPress={() => setWeightUnit(unit)}
                  >
                    <Text
                      style={[
                        styles.unitButtonText,
                        weightUnit === unit && styles.unitButtonTextSelected,
                      ]}
                    >
                      {unit}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
            <Text style={styles.fieldHelper}>
              O peso é convertido para kg antes de ser enviado à API.
            </Text>
          </SectionCard>

          <SectionCard
            number="04"
            icon="shield-checkmark-outline"
            title="Identificação segura"
            subtitle="Campo opcional para facilitar a localização"
          >
            <FormField
              label="Número do microchip"
              value={microchip}
              onChangeText={setMicrochip}
              placeholder="Opcional"
              helper="Informe somente se o animal possuir microchip."
              icon="hardware-chip-outline"
              maxLength={80}
            />
            <View style={styles.apiNotice}>
              <View style={styles.apiNoticeIcon}>
                <Ionicons name="cloud-done-outline" size={22} color="#0F766E" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.apiNoticeTitle}>Cadastro integrado</Text>
                <Text style={styles.apiNoticeText}>
                  Os dados serão salvos na API ClyvoCare e vinculados ao tutor logado.
                </Text>
              </View>
            </View>
          </SectionCard>

          <TouchableOpacity
            style={[styles.saveButton, saving && styles.saveButtonDisabled]}
            onPress={savePet}
            disabled={saving}
            activeOpacity={0.9}
          >
            <LinearGradient
              colors={saving ? ["#94A3B8", "#64748B"] : ["#0F766E", "#14B8A6"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.saveButtonGradient}
            >
              {saving ? (
                <>
                  <ActivityIndicator size="small" color="#FFFFFF" />
                  <Text style={styles.saveButtonText}>Salvando na API...</Text>
                </>
              ) : (
                <>
                  <Ionicons
                    name={editing ? "save-outline" : "checkmark-circle-outline"}
                    size={23}
                    color="#FFFFFF"
                  />
                  <Text style={styles.saveButtonText}>
                    {editing ? "Salvar alterações" : "Finalizar cadastro"}
                  </Text>
                  <Ionicons name="arrow-forward" size={21} color="#FFFFFF" />
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>
          <Text style={styles.footerText}>
            Os campos com <Text style={styles.required}>*</Text> são obrigatórios.
          </Text>
        </Animated.View>
      </ScrollView>

      <Modal
        visible={speciesModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setSpeciesModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => setSpeciesModalVisible(false)}
            >
              <Ionicons name="close" size={23} color="#0F766E" />
            </TouchableOpacity>
            <View style={{ flex: 1 }}>
              <Text style={styles.modalTitle}>Escolha a espécie</Text>
              <Text style={styles.modalSubtitle}>
                Opções cadastradas na API ClyvoCare
              </Text>
            </View>
          </View>

          <View style={styles.searchBox}>
            <Ionicons name="search" size={20} color="#64748B" />
            <TextInput
              style={styles.searchInput}
              value={speciesSearch}
              onChangeText={setSpeciesSearch}
              placeholder="Pesquisar espécie..."
              placeholderTextColor="#94A3B8"
              autoCapitalize="none"
              autoComplete="off"
              importantForAutofill="no"
              textContentType="none"
            />
            {speciesSearch.length > 0 && (
              <TouchableOpacity onPress={() => setSpeciesSearch("")}>
                <Ionicons name="close-circle" size={20} color="#94A3B8" />
              </TouchableOpacity>
            )}
          </View>

          <FlatList
            data={filteredSpecies}
            keyExtractor={(item) => String(item.id)}
            numColumns={2}
            columnWrapperStyle={styles.speciesRow}
            contentContainerStyle={styles.speciesList}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              <View style={styles.modalEmpty}>
                <Ionicons name="search-outline" size={42} color="#94A3B8" />
                <Text style={styles.modalEmptyTitle}>Nenhuma espécie encontrada</Text>
              </View>
            }
            renderItem={({ item }) => {
              const meta = getSpeciesMeta(item.name);
              const selected = speciesId === item.id;
              return (
                <TouchableOpacity
                  style={[
                    styles.speciesCard,
                    selected && styles.speciesCardSelected,
                  ]}
                  onPress={() => selectSpecies(item)}
                  activeOpacity={0.85}
                >
                  <View
                    style={[
                      styles.speciesCardIcon,
                      { backgroundColor: meta.background },
                    ]}
                  >
                    <MaterialCommunityIcons
                      name={meta.icon as any}
                      size={34}
                      color={meta.color}
                    />
                  </View>
                  <Text style={styles.speciesCardName}>{item.name}</Text>
                  <Text style={styles.speciesCardSubtitle} numberOfLines={2}>
                    {meta.subtitle}
                  </Text>
                  {selected && (
                    <View style={styles.selectedBadge}>
                      <Ionicons name="checkmark" size={14} color="#FFFFFF" />
                    </View>
                  )}
                </TouchableOpacity>
              );
            }}
          />
        </View>
      </Modal>

      <Modal
        visible={breedModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setBreedModalVisible(false)}
      >
        <KeyboardAvoidingView
          style={styles.modalContainer}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          <View style={styles.modalHeader}>
            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => setBreedModalVisible(false)}
            >
              <Ionicons name="close" size={23} color="#0F766E" />
            </TouchableOpacity>
            <View style={{ flex: 1 }}>
              <Text style={styles.modalTitle}>Raça ou identificação</Text>
              <Text style={styles.modalSubtitle}>
                Sugestões para {selectedSpecies?.name ?? "o pet"}
              </Text>
            </View>
          </View>

          <ScrollView
            contentContainerStyle={styles.breedList}
            keyboardShouldPersistTaps="handled"
          >
            {selectedSpeciesMeta.breeds.map((item) => {
              const isOther = item === "Outra";
              const selected = breed === item && !isOther;
              return (
                <TouchableOpacity
                  key={item}
                  style={[
                    styles.breedOption,
                    selected && styles.breedOptionSelected,
                  ]}
                  onPress={() => selectBreed(item)}
                >
                  <View style={styles.breedOptionIcon}>
                    <MaterialCommunityIcons
                      name={isOther ? "pencil-outline" : "paw-outline"}
                      size={20}
                      color={selected ? "#FFFFFF" : "#0F766E"}
                    />
                  </View>
                  <Text
                    style={[
                      styles.breedOptionText,
                      selected && styles.breedOptionTextSelected,
                    ]}
                  >
                    {isOther ? "Outra raça ou identificação" : item}
                  </Text>
                  {!isOther && selected && (
                    <Ionicons name="checkmark-circle" size={21} color="#FFFFFF" />
                  )}
                </TouchableOpacity>
              );
            })}

            <View style={styles.customBreedCard}>
              <Text style={styles.customBreedTitle}>Não encontrou na lista?</Text>
              <Text style={styles.customBreedSubtitle}>
                Digite a raça, variedade ou identificação usada pelo tutor.
              </Text>
              <View style={styles.customBreedInputBox}>
                <Ionicons name="create-outline" size={20} color="#0F766E" />
                <TextInput
                  style={styles.customBreedInput}
                  value={customBreed}
                  onChangeText={setCustomBreed}
                  placeholder="Digite aqui..."
                  placeholderTextColor="#94A3B8"
                  maxLength={100}
                  autoComplete="off"
                  importantForAutofill="no"
                  textContentType="none"
                />
              </View>
              <TouchableOpacity style={styles.customBreedButton} onPress={saveCustomBreed}>
                <Text style={styles.customBreedButtonText}>Usar esta identificação</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </Modal>
    </KeyboardAvoidingView>
  );
}

function SectionCard({
  number,
  icon,
  title,
  subtitle,
  children,
}: {
  number: string;
  icon: string;
  title: string;
  subtitle: string;
  children: ReactNode;
}) {
  return (
    <View style={styles.sectionCard}>
      <View style={styles.sectionHeader}>
        <View style={styles.sectionIconBox}>
          <Ionicons name={icon as any} size={21} color="#0F766E" />
        </View>
        <View style={styles.sectionHeaderContent}>
          <Text style={styles.sectionEyebrow}>ETAPA {number}</Text>
          <Text style={styles.sectionTitle}>{title}</Text>
          <Text style={styles.sectionSubtitle}>{subtitle}</Text>
        </View>
      </View>
      <View style={styles.sectionDivider} />
      {children}
    </View>
  );
}

function FormField({
  label,
  required,
  value,
  onChangeText,
  placeholder,
  helper,
  icon,
  keyboardType,
  maxLength,
  editable = true,
}: {
  label: string;
  required?: boolean;
  value: string;
  onChangeText: (value: string) => void;
  placeholder: string;
  helper?: string;
  icon: string;
  keyboardType?: any;
  maxLength?: number;
  editable?: boolean;
}) {
  return (
    <View style={styles.formField}>
      <Text style={styles.fieldLabel}>
        {label} {required && <Text style={styles.required}>*</Text>}
      </Text>
      <View style={[styles.inputBox, !editable && styles.inputBoxDisabled]}>
        <Ionicons name={icon as any} size={21} color="#0F766E" />
        <TextInput
          style={[styles.input, !editable && styles.inputDisabled]}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor="#94A3B8"
          keyboardType={keyboardType}
          maxLength={maxLength}
          editable={editable}
          selectTextOnFocus={editable}
          autoComplete="off"
          importantForAutofill="no"
          textContentType="none"
        />
        {editable && value.length > 0 && (
          <Ionicons name="checkmark-circle" size={19} color="#10B981" />
        )}
      </View>
      {helper && <Text style={styles.fieldHelper}>{helper}</Text>}
    </View>
  );
}

function OptionButton({
  label,
  selected,
  onPress,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      style={[
        styles.optionButton,
        selected && styles.optionButtonSelected,
      ]}
      onPress={onPress}
      activeOpacity={0.85}
      accessibilityRole="button"
      accessibilityState={{ selected }}
    >
      <Text
        style={[
          styles.optionButtonText,
          selected && styles.optionButtonTextSelected,
        ]}
      >
        {label}
      </Text>
      {selected && (
        <Ionicons name="checkmark-circle" size={19} color="#FFFFFF" />
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F3FAF9" },
  centerContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 30,
    backgroundColor: "#F3FAF9",
  },
  loadingIconBox: {
    width: 82,
    height: 82,
    marginBottom: 18,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#DFF7F4",
  },
  loadingTitle: { marginTop: 14, color: "#0F172A", fontSize: 19, fontWeight: "900" },
  loadingText: { marginTop: 6, color: "#64748B", fontSize: 14, textAlign: "center" },
  errorTitle: { marginTop: 16, color: "#0F172A", fontSize: 20, fontWeight: "900", textAlign: "center" },
  errorText: { marginTop: 8, color: "#64748B", fontSize: 14, lineHeight: 21, textAlign: "center" },
  retryButton: {
    minHeight: 48,
    marginTop: 20,
    paddingHorizontal: 22,
    borderRadius: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#0F766E",
  },
  retryButtonText: { color: "#FFFFFF", fontSize: 14, fontWeight: "900" },
  header: {
    minHeight: 178,
    paddingTop: 50,
    paddingHorizontal: 18,
    paddingBottom: 28,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 14,
    overflow: "hidden",
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
  },
  headerCircleOne: {
    position: "absolute",
    width: 190,
    height: 190,
    top: -85,
    right: -52,
    borderRadius: 95,
    backgroundColor: "rgba(255,255,255,0.10)",
  },
  headerCircleTwo: {
    position: "absolute",
    width: 110,
    height: 110,
    bottom: -54,
    left: 76,
    borderRadius: 55,
    backgroundColor: "rgba(255,255,255,0.08)",
  },
  backButton: {
    width: 43,
    height: 43,
    zIndex: 2,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
    shadowColor: "#022C22",
    shadowOpacity: 0.18,
    shadowRadius: 7,
    elevation: 4,
  },
  headerContent: { flex: 1, zIndex: 2, paddingTop: 1 },
  headerEyebrow: { color: "#99F6E4", fontSize: 10, fontWeight: "900", letterSpacing: 1.15 },
  headerTitle: { marginTop: 4, color: "#FFFFFF", fontSize: 27, fontWeight: "900", letterSpacing: -0.6 },
  headerSubtitle: { maxWidth: 280, marginTop: 5, color: "#D9FFFA", fontSize: 12, fontWeight: "600", lineHeight: 17 },
  content: { paddingHorizontal: 16, paddingTop: 18, paddingBottom: 48 },
  summaryCard: {
    minHeight: 104,
    padding: 15,
    borderWidth: 1,
    borderColor: "#D9EEEB",
    borderRadius: 23,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    shadowColor: "#0F766E",
    shadowOpacity: 0.07,
    shadowRadius: 13,
    elevation: 3,
  },
  summaryIcon: { width: 67, height: 67, borderRadius: 22, alignItems: "center", justifyContent: "center" },
  summaryContent: { flex: 1, marginLeft: 13 },
  summaryLabel: { color: "#0F766E", fontSize: 9, fontWeight: "900", letterSpacing: 1 },
  summaryName: { marginTop: 3, color: "#0F172A", fontSize: 19, fontWeight: "900" },
  summaryDetails: { marginTop: 3, color: "#64748B", fontSize: 11, fontWeight: "700" },
  progressBadge: { minWidth: 54, paddingHorizontal: 8, paddingVertical: 9, borderRadius: 14, alignItems: "center", backgroundColor: "#ECFDF5" },
  progressBadgeValue: { color: "#047857", fontSize: 15, fontWeight: "900" },
  progressBadgeLabel: { marginTop: 1, color: "#059669", fontSize: 8, fontWeight: "800" },
  progressTrack: { height: 6, marginTop: 10, marginHorizontal: 7, marginBottom: 18, borderRadius: 999, overflow: "hidden", backgroundColor: "#DDEEEB" },
  progressFill: { height: "100%", borderRadius: 999, backgroundColor: "#14B8A6" },
  sectionCard: {
    marginBottom: 16,
    padding: 17,
    borderWidth: 1,
    borderColor: "#DDEEEB",
    borderRadius: 23,
    backgroundColor: "#FFFFFF",
    shadowColor: "#0F766E",
    shadowOpacity: 0.045,
    shadowRadius: 10,
    elevation: 2,
  },
  sectionHeader: { flexDirection: "row", alignItems: "center" },
  sectionIconBox: { width: 45, height: 45, borderRadius: 15, alignItems: "center", justifyContent: "center", backgroundColor: "#DFF7F4" },
  sectionHeaderContent: { flex: 1, marginLeft: 11 },
  sectionEyebrow: { color: "#14B8A6", fontSize: 9, fontWeight: "900", letterSpacing: 0.9 },
  sectionTitle: { marginTop: 1, color: "#0F172A", fontSize: 17, fontWeight: "900" },
  sectionSubtitle: { marginTop: 2, color: "#64748B", fontSize: 11, fontWeight: "600" },
  sectionDivider: { height: 1, marginVertical: 16, backgroundColor: "#ECF3F2" },
  formField: { marginBottom: 16 },
  fieldLabel: { marginBottom: 8, color: "#334155", fontSize: 12, fontWeight: "900" },
  required: { color: "#EF4444" },
  inputBox: {
    minHeight: 54,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: "#D7E9E7",
    borderRadius: 17,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: "#F8FCFB",
  },
  inputBoxDisabled: {
    borderColor: "#E2E8F0",
    backgroundColor: "#F1F5F4",
  },
  input: { flex: 1, color: "#0F172A", fontSize: 14, fontWeight: "600" },
  inputDisabled: { color: "#94A3B8" },
  fieldHelper: { marginTop: 6, color: "#94A3B8", fontSize: 10, fontWeight: "600", lineHeight: 15 },
  unknownDateButton: {
    minHeight: 66,
    marginTop: -3,
    marginBottom: 18,
    paddingHorizontal: 13,
    paddingVertical: 11,
    borderWidth: 1,
    borderColor: "#D7E9E7",
    borderRadius: 17,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F8FCFB",
  },
  unknownDateButtonSelected: {
    borderColor: "#5EEAD4",
    backgroundColor: "#F0FDFA",
  },
  unknownDateCheckbox: {
    width: 24,
    height: 24,
    borderWidth: 2,
    borderColor: "#94A3B8",
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
  },
  unknownDateCheckboxSelected: {
    borderColor: "#0F766E",
    backgroundColor: "#0F766E",
  },
  unknownDateContent: { flex: 1, marginLeft: 11 },
  unknownDateTitle: {
    color: "#334155",
    fontSize: 12,
    fontWeight: "900",
  },
  unknownDateTitleSelected: { color: "#0F766E" },
  unknownDateText: {
    marginTop: 3,
    color: "#64748B",
    fontSize: 10,
    lineHeight: 14,
    fontWeight: "600",
  },
  selector: {
    minHeight: 64,
    marginBottom: 17,
    padding: 10,
    paddingRight: 13,
    borderWidth: 1,
    borderColor: "#D7E9E7",
    borderRadius: 18,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F8FCFB",
  },
  selectorIcon: { width: 45, height: 45, borderRadius: 15, alignItems: "center", justifyContent: "center" },
  selectorIconNeutral: { width: 45, height: 45, borderRadius: 15, alignItems: "center", justifyContent: "center", backgroundColor: "#DFF7F4" },
  selectorContent: { flex: 1, marginLeft: 11 },
  selectorValue: { color: "#0F172A", fontSize: 14, fontWeight: "900" },
  selectorPlaceholder: { color: "#64748B" },
  selectorHint: { marginTop: 3, color: "#94A3B8", fontSize: 10, fontWeight: "600" },
  twoColumns: { marginBottom: 17, flexDirection: "row", gap: 9 },
  optionButton: {
    flex: 1,
    minHeight: 52,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: "#D7E9E7",
    borderRadius: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
    backgroundColor: "#F8FCFB",
  },
  optionButtonSelected: { borderColor: "#0F766E", backgroundColor: "#0F766E" },
  optionButtonText: { color: "#475569", fontSize: 12, fontWeight: "900" },
  optionButtonTextSelected: { color: "#FFFFFF" },
  sizeSelector: {
    minHeight: 60,
    padding: 5,
    borderWidth: 1,
    borderColor: "#D7E9E7",
    borderRadius: 19,
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "#EAF5F3",
  },
  sizeOption: {
    flex: 1,
    minHeight: 48,
    paddingHorizontal: 7,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "transparent",
  },
  sizeOptionSelected: {
    backgroundColor: "#0F766E",
    shadowColor: "#064E4A",
    shadowOpacity: 0.18,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3,
  },
  sizeOptionText: {
    color: "#52636F",
    fontSize: 11,
    fontWeight: "900",
  },
  sizeOptionTextSelected: { color: "#FFFFFF" },
  sizeHelper: {
    marginTop: 7,
    color: "#94A3B8",
    fontSize: 10,
    fontWeight: "600",
    textAlign: "center",
  },
  weightRow: { flexDirection: "row", alignItems: "center", gap: 9 },
  weightInputBox: {
    flex: 1,
    minHeight: 54,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: "#D7E9E7",
    borderRadius: 17,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: "#F8FCFB",
  },
  weightInput: { flex: 1, color: "#0F172A", fontSize: 15, fontWeight: "700" },
  unitSelector: { height: 54, padding: 4, borderRadius: 16, flexDirection: "row", alignItems: "center", backgroundColor: "#E2F3F1" },
  unitButton: { minWidth: 42, height: 46, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  unitButtonSelected: { backgroundColor: "#FFFFFF", shadowColor: "#0F766E", shadowOpacity: 0.1, shadowRadius: 4, elevation: 2 },
  unitButtonText: { color: "#64748B", fontSize: 12, fontWeight: "900" },
  unitButtonTextSelected: { color: "#0F766E" },
  apiNotice: { padding: 13, borderWidth: 1, borderColor: "#A7F3D0", borderRadius: 17, flexDirection: "row", alignItems: "center", gap: 10, backgroundColor: "#ECFDF5" },
  apiNoticeIcon: { width: 42, height: 42, borderRadius: 14, alignItems: "center", justifyContent: "center", backgroundColor: "#D1FAE5" },
  apiNoticeTitle: { color: "#065F46", fontSize: 12, fontWeight: "900" },
  apiNoticeText: { marginTop: 3, color: "#047857", fontSize: 10, lineHeight: 15, fontWeight: "600" },
  saveButton: { marginTop: 4, borderRadius: 19, overflow: "hidden", shadowColor: "#0F766E", shadowOpacity: 0.2, shadowRadius: 11, elevation: 5 },
  saveButtonDisabled: { opacity: 0.72 },
  saveButtonGradient: { minHeight: 58, paddingHorizontal: 18, borderRadius: 19, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10 },
  saveButtonText: { color: "#FFFFFF", fontSize: 15, fontWeight: "900" },
  footerText: { marginTop: 15, color: "#94A3B8", fontSize: 10, textAlign: "center", fontWeight: "600" },
  modalContainer: { flex: 1, backgroundColor: "#F6FBFA" },
  modalHeader: {
    minHeight: 110,
    paddingTop: 48,
    paddingHorizontal: 18,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#DDEEEB",
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: "#FFFFFF",
  },
  modalCloseButton: { width: 42, height: 42, borderRadius: 21, alignItems: "center", justifyContent: "center", backgroundColor: "#DFF7F4" },
  modalTitle: { color: "#0F172A", fontSize: 21, fontWeight: "900" },
  modalSubtitle: { marginTop: 3, color: "#64748B", fontSize: 11, fontWeight: "600" },
  searchBox: { minHeight: 52, margin: 16, marginBottom: 4, paddingHorizontal: 14, borderWidth: 1, borderColor: "#D7E9E7", borderRadius: 17, flexDirection: "row", alignItems: "center", gap: 9, backgroundColor: "#FFFFFF" },
  searchInput: { flex: 1, color: "#0F172A", fontSize: 14 },
  speciesList: { padding: 16, paddingBottom: 36 },
  speciesRow: { gap: 11 },
  speciesCard: { flex: 1, minHeight: 158, marginBottom: 11, padding: 14, borderWidth: 1, borderColor: "#DDEEEB", borderRadius: 20, alignItems: "center", justifyContent: "center", backgroundColor: "#FFFFFF" },
  speciesCardSelected: { borderWidth: 2, borderColor: "#0F766E", backgroundColor: "#F0FDFA" },
  speciesCardIcon: { width: 61, height: 61, borderRadius: 21, alignItems: "center", justifyContent: "center" },
  speciesCardName: { marginTop: 10, color: "#0F172A", fontSize: 14, fontWeight: "900", textAlign: "center" },
  speciesCardSubtitle: { marginTop: 4, color: "#64748B", fontSize: 9, lineHeight: 13, fontWeight: "600", textAlign: "center" },
  selectedBadge: { position: "absolute", top: 9, right: 9, width: 23, height: 23, borderRadius: 12, alignItems: "center", justifyContent: "center", backgroundColor: "#0F766E" },
  modalEmpty: { paddingTop: 80, alignItems: "center" },
  modalEmptyTitle: { marginTop: 12, color: "#64748B", fontSize: 14, fontWeight: "800" },
  breedList: { padding: 16, paddingBottom: 40 },
  breedOption: { minHeight: 54, marginBottom: 9, paddingHorizontal: 13, borderWidth: 1, borderColor: "#DDEEEB", borderRadius: 16, flexDirection: "row", alignItems: "center", gap: 10, backgroundColor: "#FFFFFF" },
  breedOptionSelected: { borderColor: "#0F766E", backgroundColor: "#0F766E" },
  breedOptionIcon: { width: 36, height: 36, borderRadius: 12, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(255,255,255,0.18)" },
  breedOptionText: { flex: 1, color: "#334155", fontSize: 13, fontWeight: "800" },
  breedOptionTextSelected: { color: "#FFFFFF" },
  customBreedCard: { marginTop: 10, padding: 16, borderWidth: 1, borderColor: "#99F6E4", borderRadius: 20, backgroundColor: "#F0FDFA" },
  customBreedTitle: { color: "#115E59", fontSize: 15, fontWeight: "900" },
  customBreedSubtitle: { marginTop: 4, color: "#0F766E", fontSize: 10, lineHeight: 15, fontWeight: "600" },
  customBreedInputBox: { minHeight: 51, marginTop: 13, paddingHorizontal: 13, borderWidth: 1, borderColor: "#A7F3D0", borderRadius: 15, flexDirection: "row", alignItems: "center", gap: 9, backgroundColor: "#FFFFFF" },
  customBreedInput: { flex: 1, color: "#0F172A", fontSize: 14 },
  customBreedButton: { minHeight: 48, marginTop: 11, borderRadius: 15, alignItems: "center", justifyContent: "center", backgroundColor: "#0F766E" },
  customBreedButtonText: { color: "#FFFFFF", fontSize: 12, fontWeight: "900" },
});
