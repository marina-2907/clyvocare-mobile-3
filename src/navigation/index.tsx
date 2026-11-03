
import { Ionicons } from "@expo/vector-icons";
import * as Notifications from "expo-notifications";
import { useCallback, useEffect, useRef } from "react";

import {
  createNavigationContainerRef,
  NavigationContainer,
  NavigatorScreenParams,
} from "@react-navigation/native";

import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import { useAuth } from "../contexts/AuthContext";

import AlertScreen from "../screens/AlertScreen";
import AboutScreen from "../screens/AboutScreen";
import HomeScreen from "../screens/HomeScreen";
import LoginScreen from "../screens/LoginScreen";
import PetListScreen from "../screens/PetListScreen";
import PetRegisterScreen from "../screens/PetRegisterScreen";
import ProfileScreen from "../screens/ProfileScreen";
import RegisterScreen from "../screens/RegisterScreen";
import ScheduleScreen from "../screens/ScheduleScreen";
import TimelineScreen from "../screens/TimelineScreen";

// =====================================================
// TIPOS DA NAVEGAÇÃO
// =====================================================

type TabRoutes = {
  Home: undefined;
  Pets: undefined;
  Agenda: undefined;
  IA: undefined;
  Histórico: undefined;
  Perfil: undefined;
};

type AppStackRoutes = {
  Main: NavigatorScreenParams<TabRoutes>;
  "Cadastrar Pet": undefined;
  "Sobre o App": undefined;
};

type AuthStackRoutes = {
  Login: undefined;
  Cadastro: undefined;
};

// =====================================================
// NAVEGADORES
// =====================================================

const AppStack = createNativeStackNavigator<AppStackRoutes>();
const AuthStack = createNativeStackNavigator<AuthStackRoutes>();
const Tab = createBottomTabNavigator<TabRoutes>();

const navigationRef =
  createNavigationContainerRef<AppStackRoutes>();

// =====================================================
// ABAS PRINCIPAIS
// =====================================================

function BottomTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          height: 70,
          paddingBottom: 10,
          paddingTop: 10,
          backgroundColor: "#FFFFFF",
          borderTopWidth: 0,
          elevation: 10,
        },
        tabBarActiveTintColor: "#0F766E",
        tabBarInactiveTintColor: "#94A3B8",
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: "600",
        },
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Ionicons
              name="home-outline"
              size={size}
              color={color}
            />
          ),
        }}
      />

      <Tab.Screen
        name="Pets"
        component={PetListScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Ionicons
              name="paw-outline"
              size={size}
              color={color}
            />
          ),
        }}
      />

      <Tab.Screen
        name="Agenda"
        component={ScheduleScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Ionicons
              name="calendar-outline"
              size={size}
              color={color}
            />
          ),
        }}
      />

      <Tab.Screen
        name="IA"
        component={AlertScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Ionicons
              name="notifications-outline"
              size={size}
              color={color}
            />
          ),
        }}
      />

      <Tab.Screen
        name="Histórico"
        component={TimelineScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Ionicons
              name="document-text-outline"
              size={size}
              color={color}
            />
          ),
        }}
      />

      <Tab.Screen
        name="Perfil"
        component={ProfileScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Ionicons
              name="person-outline"
              size={size}
              color={color}
            />
          ),
        }}
      />
    </Tab.Navigator>
  );
}

// =====================================================
// TELAS DE AUTENTICAÇÃO
// =====================================================

function AuthNavigator() {
  return (
    <AuthStack.Navigator
      screenOptions={{ headerShown: false }}
    >
      <AuthStack.Screen
        name="Login"
        component={LoginScreen}
      />

      <AuthStack.Screen
        name="Cadastro"
        component={RegisterScreen}
      />
    </AuthStack.Navigator>
  );
}

// =====================================================
// TELAS DO APLICATIVO
// =====================================================

function AppNavigator() {
  return (
    <AppStack.Navigator
      screenOptions={{
        headerShown: false,
        contentStyle: {
          backgroundColor: "#F6FBFA",
        },
      }}
    >
      <AppStack.Screen
        name="Main"
        component={BottomTabs}
      />

      <AppStack.Screen
        name="Cadastrar Pet"
        component={PetRegisterScreen}
      />

      <AppStack.Screen
        name="Sobre o App"
        component={AboutScreen}
        options={{
          headerShown: true,
          title: "Sobre o App",
        }}
      />
    </AppStack.Navigator>
  );
}

// =====================================================
// NAVEGAÇÃO POR NOTIFICAÇÃO
// =====================================================

export default function Navigation() {
  const { isAuthenticated } = useAuth();

  // Captura notificações tocadas mesmo se o app
  // estava fechado antes de ser aberto.
  const ultimaResposta =
    Notifications.useLastNotificationResponse();

  // Guarda a intenção de abrir a Agenda
  // enquanto o app ou o login não estiver pronto.
  const agendaPendente = useRef(false);

  const abrirAgendaPendente = useCallback(() => {
    if (
      !agendaPendente.current ||
      !isAuthenticated ||
      !navigationRef.isReady()
    ) {
      return;
    }

    // Limpa a pendência antes de navegar.
    agendaPendente.current = false;

    navigationRef.navigate("Main", {
      screen: "Agenda",
    });

    console.log(
      "[CLYVO] Notificação aberta: navegando para Agenda."
    );

    // Impede que a notificação antiga seja
    // processada novamente no futuro.
    void Notifications.clearLastNotificationResponseAsync()
      .catch((error) => {
        console.warn(
          "[CLYVO] Não foi possível limpar a resposta:",
          error
        );
      });
  }, [isAuthenticated]);

  useEffect(() => {
    if (!ultimaResposta) {
      return;
    }

    // Processa somente o toque normal na notificação.
    if (
      ultimaResposta.actionIdentifier !==
      Notifications.DEFAULT_ACTION_IDENTIFIER
    ) {
      return;
    }

    const dados =
      ultimaResposta.notification.request.content.data;

    // Outras notificações não alteram a navegação.
    if (dados?.tela !== "Agenda") {
      return;
    }

    agendaPendente.current = true;

    // Abre imediatamente se o usuário já está logado.
    abrirAgendaPendente();
  }, [ultimaResposta, abrirAgendaPendente]);

  return (
    <NavigationContainer
      ref={navigationRef}
      onReady={abrirAgendaPendente}
      onStateChange={abrirAgendaPendente}
    >
      {isAuthenticated ? (
        <AppNavigator />
      ) : (
        <AuthNavigator />
      )}
    </NavigationContainer>
  );
}
