import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import AuthLayout, { authStyles } from "../components/AuthLayout";
import { useLogin } from "../hooks/useAuthMutations";

export default function LoginScreen({ navigation }: any) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const loginMutation = useLogin();

  function handleLogin() {
    const formattedUsername = username.trim();

    if (!formattedUsername || !password) {
      Alert.alert("Atenção", "Preencha o usuário e a senha.");
      return;
    }

    loginMutation.mutate(
      {
        username: formattedUsername,
        password,
      },
      {
        onError: (error) => {
          Alert.alert(
            "Não foi possível entrar",
            error instanceof Error
              ? error.message
              : "Confira os dados e tente novamente.",
          );
        },
      },
    );
  }

  return (
    <AuthLayout
      title="Bem-vindo de volta!"
      subtitle="Entre para acompanhar a saúde dos seus pets."
    >
      <View style={authStyles.fieldContainer}>
        <Text style={authStyles.label}>Usuário</Text>

        <View style={authStyles.inputContainer}>
          <Ionicons name="person-outline" size={20} color="#64748B" />

          <TextInput
            style={authStyles.input}
            placeholder="Digite seu usuário"
            placeholderTextColor="#94A3B8"
            value={username}
            onChangeText={setUsername}
            autoCapitalize="none"
            autoCorrect={false}
          />
        </View>
      </View>

      <View style={authStyles.fieldContainer}>
        <Text style={authStyles.label}>Senha</Text>

        <View style={authStyles.inputContainer}>
          <Ionicons name="lock-closed-outline" size={20} color="#64748B" />

          <TextInput
            style={authStyles.input}
            placeholder="Digite sua senha"
            placeholderTextColor="#94A3B8"
            value={password}
            onChangeText={setPassword}
            secureTextEntry={!showPassword}
            autoCapitalize="none"
          />

          <TouchableOpacity
            onPress={() => setShowPassword((current) => !current)}
          >
            <Ionicons
              name={showPassword ? "eye-off-outline" : "eye-outline"}
              size={22}
              color="#64748B"
            />
          </TouchableOpacity>
        </View>
      </View>

      <TouchableOpacity
        style={[
          authStyles.primaryButton,
          loginMutation.isPending && authStyles.primaryButtonDisabled,
        ]}
        onPress={handleLogin}
        disabled={loginMutation.isPending}
        activeOpacity={0.85}
      >
        {loginMutation.isPending ? (
          <ActivityIndicator color="#FFFFFF" />
        ) : (
          <Text style={authStyles.primaryButtonText}>Entrar</Text>
        )}
      </TouchableOpacity>

      <View style={authStyles.centerRow}>
        <Text style={authStyles.secondaryText}>Ainda não possui conta?</Text>

        <TouchableOpacity onPress={() => navigation.navigate("Cadastro")}>
          <Text style={authStyles.link}> Cadastre-se</Text>
        </TouchableOpacity>
      </View>
    </AuthLayout>
  );
}