import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "./src/contexts/AuthContext";
import Navigation from "./src/navigation/index";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: 1,
    },
    mutations: {
      retry: 0,
    },
  },
});

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Navigation />
      </AuthProvider>
    </QueryClientProvider>
  );
}