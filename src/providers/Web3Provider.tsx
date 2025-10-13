import { WagmiProvider, createConfig, http } from "wagmi";
import {
  sepolia,
  baseSepolia,
  arbitrumSepolia,
  optimismSepolia,
  polygonAmoy,
} from "wagmi/chains";
import { ConnectKitProvider, getDefaultConfig } from "connectkit";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import NexusProvider from "./NexusProvider";

const walletConnectProjectId = import.meta.env.VITE_WALLETCONNECT_PROJECT_ID;

// Validate environment variable
if (!walletConnectProjectId) {
  console.warn("VITE_WALLETCONNECT_PROJECT_ID is not set. WalletConnect will not work.");
}

const config = createConfig(
  getDefaultConfig({
    chains: [sepolia, baseSepolia, arbitrumSepolia, optimismSepolia, polygonAmoy],
    transports: {
      [sepolia.id]: http(),
      [baseSepolia.id]: http(),
      [arbitrumSepolia.id]: http(),
      [optimismSepolia.id]: http(),
      [polygonAmoy.id]: http(),
    },
    walletConnectProjectId: walletConnectProjectId || "demo-project-id",
    
    // Required App Info
    appName: "PayStream Testnet",
    appDescription: "Decentralized Payroll Management - Testnet",
    appUrl: typeof window !== "undefined" ? window.location.origin : "http://localhost:8080",
    appIcon: "https://www.availproject.org/_next/static/media/avail_logo.9c818c5a.png",
  }),
);

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

const Web3Provider = ({ children }: { children: React.ReactNode }) => {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <ConnectKitProvider 
          theme="soft" 
          mode="light"
          options={{
            embedGoogleFonts: true,
            hideQuestionMarkCTA: true,
            hideTooltips: false,
          }}
        >
          <NexusProvider>{children}</NexusProvider>
        </ConnectKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
};

export default Web3Provider;