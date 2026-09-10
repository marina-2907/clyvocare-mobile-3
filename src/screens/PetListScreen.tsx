import { Ionicons } from "@expo/vector-icons";
import React from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useOwnerProfile } from "../hooks/useOwnerProfile";
import { useDeletePet, usePets } from "../hooks/usePets";
import { Pet } from "../types/pet";

function formatDate(date?: string | null) {
  if (!date) return "Nascimento não informado";

  const [year, month, day] = date.split("-");
  return `${day}/${month}/${year}`;
}

function getSexLabel(sex?: Pet["sex"]) {
  if (sex === "MALE") return "Macho";
  if (sex === "FEMALE") return "Fêmea";
  return "Sexo não informado";
}

export default function PetListScreen({ navigation }: any) {
  const {
    data: ownerProfile,
    isLoading: ownerLoading,
    isError: ownerError,
    refetch: refetchOwner,
  } = useOwnerProfile();
  const {
    data: pets = [],
    isLoading: petsLoading,
    isError: petsError,
    isRefetching,
    refetch: refetchPets,
  } = usePets(ownerProfile?.id);

  const deletePet = useDeletePet(ownerProfile?.id ?? 0);

 function openPetRegistration() {
  const parentNavigation = navigation.getParent();

  if (parentNavigation) {
    parentNavigation.navigate("Cadastrar Pet");
    return;
  }

  navigation.navigate("Cadastrar Pet");
}

function openPetEdition(pet: Pet) {
  const parentNavigation = navigation.getParent();

  if (parentNavigation) {
    parentNavigation.navigate("Cadastrar Pet", { pet });
    return;
  }

  navigation.navigate("Cadastrar Pet", { pet });
}

  function confirmDelete(pet: Pet) {
    Alert.alert(
      "Excluir pet",
      `Deseja realmente excluir ${pet.name}?`,
      [
        {
          text: "Cancelar",
          style: "cancel",
        },
        {
          text: "Excluir",
          style: "destructive",
          onPress: async () => {
            try {
              await deletePet.mutateAsync(pet.id);
              Alert.alert("Pet excluído", `${pet.name} foi removido.`);
            } catch (error) {
              const message =
                error instanceof Error
                  ? error.message
                  : "Não foi possível excluir o pet.";

              Alert.alert("Erro", message);
            }
          },
        },
      ],
    );
  }

  async function reload() {
    await Promise.all([refetchOwner(), refetchPets()]);
  }

  if (ownerLoading || petsLoading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#0F766E" />
        <Text style={styles.loadingText}>Carregando seus pets...</Text>
      </View>
    );
  }

  if (ownerError || petsError) {
    return (
      <View style={styles.centerContainer}>
        <Ionicons name="cloud-offline-outline" size={48} color="#EF4444" />

        <Text style={styles.errorTitle}>
          Não foi possível carregar os pets
        </Text>

        <Text style={styles.errorText}>
          Confira se a API Java está funcionando.
        </Text>

        <TouchableOpacity
          style={styles.retryButton}
          onPress={() => void reload()}
        >
          <Text style={styles.retryButtonText}>Tentar novamente</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Meus pets</Text>
          <Text style={styles.headerSubtitle}>
            {pets.length === 1
              ? "1 pet cadastrado"
              : `${pets.length} pets cadastrados`}
          </Text>
        </View>

        <TouchableOpacity
          style={styles.addButton}
          onPress={openPetRegistration}
          activeOpacity={0.85}
        >
          <Ionicons name="add" size={25} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      <FlatList
        data={pets}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={[
          styles.listContent,
          pets.length === 0 && styles.emptyListContent,
        ]}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={() => void reload()}
            colors={["#0F766E"]}
            tintColor="#0F766E"
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIcon}>
              <Ionicons name="paw-outline" size={50} color="#0F766E" />
            </View>

            <Text style={styles.emptyTitle}>Nenhum pet cadastrado</Text>

            <Text style={styles.emptyText}>
              Cadastre seu primeiro pet para acompanhar os cuidados dele.
            </Text>

            <TouchableOpacity
              style={styles.primaryButton}
              onPress={openPetRegistration}
              activeOpacity={0.9}
            >
              <Ionicons name="add-circle-outline" size={21} color="#FFFFFF" />
              <Text style={styles.primaryButtonText}>Cadastrar pet</Text>
            </TouchableOpacity>
          </View>
        }
        renderItem={({ item }) => {
          const deleting =
            deletePet.isPending && deletePet.variables === item.id;

          return (
            <View style={styles.petCard}>
              <View style={styles.petIcon}>
                <Ionicons name="paw" size={28} color="#0F766E" />
              </View>

              <View style={styles.petContent}>
                <Text style={styles.petName}>{item.name}</Text>

                <Text style={styles.petDetails}>
                  {item.speciesName}
                  {item.breed ? ` • ${item.breed}` : ""}
                </Text>

                <Text style={styles.petDetails}>
                  {getSexLabel(item.sex)} • {formatDate(item.birthDate)}
                </Text>

                {item.currentWeight !== null && (
                  <Text style={styles.petWeight}>
                    Peso atual: {item.currentWeight} kg
                  </Text>
                )}
              </View>

              <View style={styles.actions}>
                <TouchableOpacity
                  style={styles.editButton}
                  onPress={() => openPetEdition(item)}
                  disabled={deleting}
                >
                  <Ionicons
                    name="create-outline"
                    size={21}
                    color="#0F766E"
                  />
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.deleteButton}
                  onPress={() => confirmDelete(item)}
                  disabled={deleting}
                >
                  {deleting ? (
                    <ActivityIndicator size="small" color="#EF4444" />
                  ) : (
                    <Ionicons
                      name="trash-outline"
                      size={21}
                      color="#EF4444"
                    />
                  )}
                </TouchableOpacity>
              </View>
            </View>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F6FBFA",
  },

  centerContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 28,
    backgroundColor: "#F6FBFA",
  },

  header: {
    paddingTop: 54,
    paddingBottom: 22,
    paddingHorizontal: 20,
    backgroundColor: "#0F766E",
    borderBottomLeftRadius: 26,
    borderBottomRightRadius: 26,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  headerTitle: {
    color: "#FFFFFF",
    fontSize: 27,
    fontWeight: "900",
  },

  headerSubtitle: {
    marginTop: 3,
    color: "#CCFBF1",
    fontSize: 13,
    fontWeight: "700",
  },

  addButton: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#14B8A6",
  },

  listContent: {
    padding: 18,
    paddingBottom: 36,
  },

  emptyListContent: {
    flexGrow: 1,
  },

  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 22,
  },

  emptyIcon: {
    width: 94,
    height: 94,
    borderRadius: 47,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#DFF7F4",
  },

  emptyTitle: {
    marginTop: 18,
    color: "#0F172A",
    fontSize: 21,
    fontWeight: "900",
  },

  emptyText: {
    marginTop: 8,
    color: "#64748B",
    fontSize: 14,
    lineHeight: 21,
    textAlign: "center",
  },

  primaryButton: {
    marginTop: 20,
    minHeight: 50,
    paddingHorizontal: 22,
    borderRadius: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#0F766E",
  },

  primaryButtonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "900",
  },

  petCard: {
    marginBottom: 14,
    padding: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#DDF1EE",
    backgroundColor: "#FFFFFF",
    flexDirection: "row",
    alignItems: "center",
  },

  petIcon: {
    width: 54,
    height: 54,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#DFF7F4",
  },

  petContent: {
    flex: 1,
    marginLeft: 13,
  },

  petName: {
    color: "#0F172A",
    fontSize: 18,
    fontWeight: "900",
  },

  petDetails: {
    marginTop: 3,
    color: "#64748B",
    fontSize: 12,
    fontWeight: "600",
  },

  petWeight: {
    marginTop: 6,
    color: "#0F766E",
    fontSize: 12,
    fontWeight: "800",
  },

  actions: {
    marginLeft: 8,
    gap: 7,
  },

  editButton: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#E0F5F2",
  },

  deleteButton: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FEE2E2",
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
    fontSize: 19,
    fontWeight: "900",
    textAlign: "center",
  },

  errorText: {
    marginTop: 8,
    color: "#64748B",
    fontSize: 14,
    textAlign: "center",
  },

  retryButton: {
    marginTop: 18,
    paddingVertical: 13,
    paddingHorizontal: 22,
    borderRadius: 15,
    backgroundColor: "#0F766E",
  },

  retryButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "900",
  },
});
