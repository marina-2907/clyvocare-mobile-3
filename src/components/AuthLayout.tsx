import { Ionicons } from "@expo/vector-icons";
import { ReactNode } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

type AuthLayoutProps = {
  title: string;
  subtitle: string;
  children: ReactNode;
};

export default function AuthLayout({
  title,
  subtitle,
  children,
}: AuthLayoutProps) {
  return (
    <SafeAreaView style={authStyles.safeArea}>
      <KeyboardAvoidingView
        style={authStyles.keyboard}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          contentContainerStyle={authStyles.container}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={authStyles.brandContainer}>
            <View style={authStyles.logoCircle}>
              <Ionicons name="paw" size={42} color="#0F766E" />
            </View>

            <Text style={authStyles.brand}>ClyvoCare</Text>

            <Text style={authStyles.brandDescription}>
              Cuidado e carinho em cada fase da vida do seu pet.
            </Text>
          </View>

          <View style={authStyles.card}>
            <Text style={authStyles.title}>{title}</Text>
            <Text style={authStyles.subtitle}>{subtitle}</Text>
            {children}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

export const authStyles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#F0FDFA",
  },
  keyboard: {
    flex: 1,
  },
  container: {
    flexGrow: 1,
    justifyContent: "center",
    padding: 22,
  },
  brandContainer: {
    alignItems: "center",
    marginBottom: 22,
  },
  logoCircle: {
    width: 82,
    height: 82,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 41,
    backgroundColor: "#CCFBF1",
  },
  brand: {
    marginTop: 10,
    color: "#0F766E",
    fontSize: 29,
    fontWeight: "900",
  },
  brandDescription: {
    maxWidth: 300,
    marginTop: 6,
    color: "#64748B",
    lineHeight: 19,
    textAlign: "center",
  },
  card: {
    padding: 21,
    borderRadius: 23,
    backgroundColor: "#FFFFFF",
    elevation: 5,
    shadowColor: "#0F172A",
    shadowOpacity: 0.08,
    shadowRadius: 14,
  },
  title: {
    color: "#0F172A",
    fontSize: 24,
    fontWeight: "900",
  },
  subtitle: {
    marginTop: 5,
    marginBottom: 21,
    color: "#64748B",
    lineHeight: 20,
  },
  fieldContainer: {
    marginBottom: 15,
  },
  label: {
    marginBottom: 7,
    color: "#334155",
    fontSize: 14,
    fontWeight: "800",
  },
  inputContainer: {
    minHeight: 54,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: "#CBD5E1",
    borderRadius: 14,
    backgroundColor: "#F8FAFC",
  },
  input: {
    flex: 1,
    color: "#0F172A",
    fontSize: 15,
  },
  primaryButton: {
    minHeight: 54,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 6,
    borderRadius: 14,
    backgroundColor: "#0F766E",
  },
  primaryButtonDisabled: {
    opacity: 0.65,
  },
  primaryButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "900",
  },
  centerRow: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 21,
  },
  secondaryText: {
    color: "#64748B",
  },
  link: {
    color: "#0F766E",
    fontWeight: "800",
  },
});