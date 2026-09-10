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
import { useRegisterOwner } from "../hooks/useAuthMutations";

type FieldProps = {
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  placeholder: string;
  value: string;
  onChangeText: (value: string) => void;
  keyboardType?: "default" | "phone-pad" | "numeric";
  secureTextEntry?: boolean;
  maxLength?: number;
};

function AuthField({
  label,
  icon,
  placeholder,
  value,
  onChangeText,
  keyboardType = "default",
  secureTextEntry = false,
  maxLength,
}: FieldProps) {
  return (
    <View style={authStyles.fieldContainer}>
      <Text style={authStyles.label}>{label}</Text>

      <View style={authStyles.inputContainer}>
        <Ionicons name={icon} size={20} color="#64748B" />

        <TextInput
          style={authStyles.input}
          placeholder={placeholder}
          placeholderTextColor="#94A3B8"
          value={value}
          onChangeText={onChangeText}
          keyboardType={keyboardType}
          secureTextEntry={secureTextEntry}
          autoCapitalize="none"
          maxLength={maxLength}
        />
      </View>
    </View>
  );
}

export default function RegisterScreen({ navigation }: any) {
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [phone, setPhone] = useState("");
  const [document, setDocument] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const registerMutation = useRegisterOwner();

  function handleRegister() {
    const formattedName = name.trim();
    const formattedUsername = username.trim();
    const phoneNumbers = phone.replace(/\D/g, "");
    const documentNumbers = document.replace(/\D/g, "");

    if (
      !formattedName ||
      !formattedUsername ||
      !phoneNumbers ||
      !documentNumbers ||
      !password ||
      !confirmPassword
    ) {
      Alert.alert("Atenção", "Preencha todos os campos.");
      return;
    }

    if (formattedUsername.length < 4) {
      Alert.alert(
        "Usuário inválido",
        "O usuário deve possuir pelo menos 4 caracteres.",
      );
      return;
    }

    if (documentNumbers.length !== 11) {
      Alert.alert("CPF inválido", "Digite os 11 números do CPF.");
      return;
    }

    if (password.length < 6) {
      Alert.alert(
        "Senha inválida",
        "A senha deve possuir pelo menos 6 caracteres.",
      );
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert("Senhas diferentes", "As senhas precisam ser iguais.");
      return;
    }

    registerMutation.mutate(
      {
        username: formattedUsername,
        password,
        name: formattedName,
        phone: phoneNumbers,
        document: documentNumbers,
        cityId: null,
      },
      {
        onSuccess: () => {
          Alert.alert(
            "Conta criada!",
            "Seu cadastro foi salvo. Agora você pode entrar.",
            [
              {
                text: "Ir para o login",
                onPress: () => navigation.navigate("Login"),
              },
            ],
          );
        },
        onError: (error) => {
          Alert.alert(
            "Não foi possível criar a conta",
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
      title="Crie sua conta"
      subtitle="Cadastre-se para começar a cuidar dos seus pets."
    >
      <AuthField
        label="Nome completo"
        icon="person-outline"
        placeholder="Digite seu nome"
        value={name}
        onChangeText={setName}
      />

      <AuthField
        label="Usuário"
        icon="at-outline"
        placeholder="Escolha um usuário"
        value={username}
        onChangeText={setUsername}
      />

      <AuthField
        label="Telefone"
        icon="call-outline"
        placeholder="Somente números"
        value={phone}
        onChangeText={(value) => setPhone(value.replace(/\D/g, ""))}
        keyboardType="phone-pad"
        maxLength={20}
      />

      <AuthField
        label="CPF"
        icon="document-text-outline"
        placeholder="11 números"
        value={document}
        onChangeText={(value) => setDocument(value.replace(/\D/g, ""))}
        keyboardType="numeric"
        maxLength={11}
      />

      <AuthField
        label="Senha"
        icon="lock-closed-outline"
        placeholder="Mínimo de 6 caracteres"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />

      <AuthField
        label="Confirme a senha"
        icon="shield-checkmark-outline"
        placeholder="Digite a senha novamente"
        value={confirmPassword}
        onChangeText={setConfirmPassword}
        secureTextEntry
      />

      <TouchableOpacity
        style={[
          authStyles.primaryButton,
          registerMutation.isPending && authStyles.primaryButtonDisabled,
        ]}
        onPress={handleRegister}
        disabled={registerMutation.isPending}
        activeOpacity={0.85}
      >
        {registerMutation.isPending ? (
          <ActivityIndicator color="#FFFFFF" />
        ) : (
          <Text style={authStyles.primaryButtonText}>Criar minha conta</Text>
        )}
      </TouchableOpacity>

      <View style={authStyles.centerRow}>
        <Text style={authStyles.secondaryText}>Já possui uma conta?</Text>

        <TouchableOpacity onPress={() => navigation.navigate("Login")}>
          <Text style={authStyles.link}> Entrar</Text>
        </TouchableOpacity>
      </View>
    </AuthLayout>
  );
}