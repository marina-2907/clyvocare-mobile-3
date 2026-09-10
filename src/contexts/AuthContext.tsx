import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  View,
} from "react-native";
import {
  authService,
  StoredSession,
} from "../services/authService";

type AuthContextData = {
  session: StoredSession | null;
  isAuthenticated: boolean;
  completeLogin: (session: StoredSession) => void;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextData | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<StoredSession | null>(null);
  const [isRestoringSession, setIsRestoringSession] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function restoreSession() {
      try {
        const storedSession = await authService.getStoredSession();

        if (isMounted) {
          setSession(storedSession);
        }
      } finally {
        if (isMounted) {
          setIsRestoringSession(false);
        }
      }
    }

    restoreSession();

    return () => {
      isMounted = false;
    };
  }, []);

  const completeLogin = useCallback((newSession: StoredSession) => {
    setSession(newSession);
  }, []);

  const logout = useCallback(async () => {
    await authService.logout();
    setSession(null);
  }, []);

  const value = useMemo(
    () => ({
      session,
      isAuthenticated: Boolean(session),
      completeLogin,
      logout,
    }),
    [session, completeLogin, logout],
  );

  if (isRestoringSession) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0F766E" />
        <Text style={styles.loadingText}>Carregando sua sessão...</Text>
      </View>
    );
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth deve ser usado dentro de AuthProvider.");
  }

  return context;
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F6FBFA",
  },
  loadingText: {
    marginTop: 12,
    color: "#475569",
    fontSize: 15,
  },
});