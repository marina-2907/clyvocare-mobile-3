import Constants from "expo-constants";
import { Ionicons } from "@expo/vector-icons";
import { ScrollView, StyleSheet, Text, View } from "react-native";

const commit = process.env.EXPO_PUBLIC_GIT_COMMIT_SHA || "Não informado no build";
const version = Constants.expoConfig?.version ?? "1.0.0";

export default function AboutScreen() {
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Ionicons name="paw" size={40} color="#FFFFFF" />
        <Text style={styles.title}>Sobre o ClyvoCare</Text>
        <Text style={styles.subtitle}>Saúde e organização dos cuidados dos seus pets.</Text>
      </View>
      <View style={styles.card}>
        <Text style={styles.label}>Versão do aplicativo</Text>
        <Text style={styles.value}>{version}</Text>
        <Text style={styles.label}>Commit da versão publicada</Text>
        <Text selectable style={styles.hash}>{commit}</Text>
        <Text style={styles.hint}>
          Este identificador deve corresponder ao commit usado para gerar e publicar o APK no Firebase App Distribution.
        </Text>
      </View>
      <Text style={styles.footer}>ClyvoCare OS • Projeto acadêmico FIAP</Text>
    </ScrollView>
  );
}
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F4F9F8" },
  content: { paddingBottom: 40 },
  header: { backgroundColor: "#0F766E", paddingTop: 64, paddingBottom: 36, paddingHorizontal: 24, alignItems: "center", gap: 12 },
  title: { color: "#FFFFFF", fontWeight: "800", fontSize: 26 },
  subtitle: { color: "#CCFBF1", textAlign: "center", fontSize: 14 },
  card: { margin: 20, padding: 22, backgroundColor: "#FFFFFF", borderRadius: 18, gap: 10 },
  label: { fontSize: 13, color: "#64748B", fontWeight: "700", marginTop: 8 },
  value: { fontSize: 20, fontWeight: "800", color: "#134E4A" },
  hash: { fontSize: 14, color: "#0F766E", fontWeight: "700" },
  hint: { marginTop: 8, fontSize: 12, color: "#64748B", lineHeight: 19 },
  footer: { textAlign: "center", color: "#64748B", fontSize: 12 }
});
