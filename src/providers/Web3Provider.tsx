import { WagmiProvider, createConfig, http } from "wagmi";
import {
  mainnet,
  base,
  arbitrum,
  optimism,
  polygon,
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
const appNetwork = import.meta.env.VITE_APP_NETWORK || "mainnet"; // Default to mainnet

// Validate environment variable
if (!walletConnectProjectId) {
  console.warn("VITE_WALLETCONNECT_PROJECT_ID is not set. WalletConnect will not work.");
}

const getChainsConfig = () => {
  if (appNetwork === "testnet") {
    return {
      chains: [sepolia, baseSepolia, arbitrumSepolia, optimismSepolia, polygonAmoy],
      transports: {
        [sepolia.id]: http(),
        [baseSepolia.id]: http(),
        [arbitrumSepolia.id]: http(),
        [optimismSepolia.id]: http(),
        [polygonAmoy.id]: http(),
      },
      appName: "PayStream Testnet",
      appDescription: "Decentralized Payroll Management - Testnet",
    };
  } else {
    return {
      chains: [mainnet, base, arbitrum, optimism, polygon],
      transports: {
        [mainnet.id]: http(),
        [base.id]: http(),
        [arbitrum.id]: http(),
        [optimism.id]: http(),
        [polygon.id]: http(),
      },
      appName: "PayStream",
      appDescription: "Decentralized Payroll Management",
    };
  }
};

const { chains, transports, appName, appDescription } = getChainsConfig();

const config = createConfig(
  getDefaultConfig({
    chains,
    transports,
    walletConnectProjectId: walletConnectProjectId || "demo-project-id",
    
    // Required App Info
    appName,
    appDescription,
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