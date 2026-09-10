import { Ionicons } from "@expo/vector-icons";
import { NavigationContainer } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import { useAuth } from "../contexts/AuthContext";
import AlertScreen from "../screens/AlertScreen";
import HomeScreen from "../screens/HomeScreen";
import LoginScreen from "../screens/LoginScreen";
import PetListScreen from "../screens/PetListScreen";
import PetRegisterScreen from "../screens/PetRegisterScreen";
import ProfileScreen from "../screens/ProfileScreen";
import RegisterScreen from "../screens/RegisterScreen";
import ScheduleScreen from "../screens/ScheduleScreen";
import TimelineScreen from "../screens/TimelineScreen";

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

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
            <Ionicons name="home-outline" size={size} color={color} />
          ),
        }}
      />

      <Tab.Screen
        name="Pets"
        component={PetListScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="paw-outline" size={size} color={color} />
          ),
        }}
      />

      <Tab.Screen
        name="Agenda"
        component={ScheduleScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="calendar-outline" size={size} color={color} />
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
            <Ionicons name="person-outline" size={size} color={color} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}

function AuthNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Cadastro" component={RegisterScreen} />
    </Stack.Navigator>
  );
}

function AppNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        contentStyle: {
          backgroundColor: "#F6FBFA",
        },
      }}
    >
      <Stack.Screen name="Main" component={BottomTabs} />
      <Stack.Screen name="Cadastrar Pet" component={PetRegisterScreen} />
    </Stack.Navigator>
  );
}

export default function Navigation() {
  const { isAuthenticated } = useAuth();

  return (
    <NavigationContainer>
      {isAuthenticated ? <AppNavigator /> : <AuthNavigator />}
    </NavigationContainer>
  );
}