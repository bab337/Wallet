import { createRoot } from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "./contexts/theme-context";
import App from "./App";
import "./index.css";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes
      retry: (failureCount, error: any) => {
        if (failureCount < 3) {
          const delay = Math.min(1000 * Math.pow(2, failureCount), 10000);
          setTimeout(() => {}, delay);
          return true;
        }
        return false;
      },
    },
  },
});

createRoot(document.getElementById("root")!).render(
  <QueryClientProvider client={queryClient}>
    <ThemeProvider defaultTheme="system" storageKey="wallet-checker-theme">
      <App />
    </ThemeProvider>
  </QueryClientProvider>
);
