/* eslint-disable react-refresh/only-export-components */
import useInitNexus from "@/hooks/useInitNexus";
import {
  NexusSDK,
  type OnAllowanceHookData,
  type OnIntentHookData,
} from "@avail-project/nexus-core";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useAccount, useSwitchChain } from "wagmi";

const appNetwork = import.meta.env.VITE_APP_NETWORK || "mainnet"; // Default to mainnet

interface NexusContextType {
  nexusSDK: NexusSDK | null;
  intentRefCallback: React.RefObject<OnIntentHookData | null>;
  allowanceRefCallback: React.RefObject<OnAllowanceHookData | null>;
  handleInit: () => Promise<void>;
  isInitialized: boolean;
  isLoading: boolean;
  error: string | null;
}

const NexusContext = createContext<NexusContextType | null>(null);

const NexusProvider = ({ children }: { children: React.ReactNode }) => {
  const [isInitialized, setIsInitialized] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { switchChain } = useSwitchChain();
  
  const sdk = useMemo(
    () =>
      new NexusSDK({
        network: appNetwork as "mainnet" | "testnet",
        debug: true,
      }),
    [],
  );
  
  const { isConnected, connector, address, chain } = useAccount();
  const {
    nexusSDK,
    initializeNexus,
    deinitializeNexus,
    attachEventHooks,
    intentRefCallback,
    allowanceRefCallback,
  } = useInitNexus(sdk);

  const handleInit = useCallback(async () => {
    if (sdk.isInitialized()) {
      console.log("Nexus already initialized");
      setIsInitialized(true);
      return;
    }
    
    if (!connector) {
      setError("No wallet connector available");
      return;
    }

    if (!address) {
      setError("No wallet address found");
      return;
    }

    // Determine chain IDs and network name based on appNetwork
    const networkName = appNetwork === "testnet" ? "TESTNET" : "MAINNET";
    const chainIds = appNetwork === "testnet"
      ? [11155111, 84532, 421614, 11155420, 80002] // Sepolia, Base Sepolia, Arbitrum Sepolia, Optimism Sepolia, Polygon Amoy
      : [1, 8453, 42161, 10, 137]; // Ethereum Mainnet, Base, Arbitrum, Optimism, Polygon

    if (chain && !chainIds.includes(chain.id)) {
      setError(`Please switch to a ${networkName.toLowerCase()} network (Ethereum, Base, etc. for mainnet / Sepolia, Base Sepolia, etc. for testnet)`);
      console.warn(`Current chain ${chain.id} is not a ${networkName.toLowerCase()}. Please switch.`);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      console.log(`Initializing Nexus SDK on ${networkName}...`);
      await initializeNexus();
      attachEventHooks();
      setIsInitialized(true);
      console.log(`Nexus SDK initialized successfully on ${networkName}`);
    } catch (error) {
      console.error("Failed to initialize Nexus:", error);
      setError(error instanceof Error ? error.message : "Failed to initialize Nexus");
      setIsInitialized(false);
    } finally {
      setIsLoading(false);
    }
  }, [sdk, connector, address, chain, attachEventHooks, initializeNexus]);

  // Auto-initialize when wallet connects
  useEffect(() => {
    if (isConnected && connector && address && !isInitialized && !isLoading) {
      const networkName = appNetwork === "testnet" ? "testnet" : "mainnet";
      const chainIds = appNetwork === "testnet"
        ? [11155111, 84532, 421614, 11155420, 80002] // Sepolia, Base Sepolia, Arbitrum Sepolia, Optimism Sepolia, Polygon Amoy
        : [1, 8453, 42161, 10, 137]; // Ethereum Mainnet, Base, Arbitrum, Optimism, Polygon
      
      if (chain && chainIds.includes(chain.id)) {
        console.log(`Wallet connected to ${networkName}, initializing Nexus...`);
        handleInit();
      } else {
        setError(`Please connect to a ${networkName} network`);
      }
    }
  }, [isConnected, connector, address, chain, isInitialized, isLoading, handleInit]);

  // Cleanup when wallet disconnects
  useEffect(() => {
    if (!isConnected) {
      console.log("Wallet disconnected, cleaning up Nexus...");
      deinitializeNexus();
      setIsInitialized(false);
      setError(null);
    }
  }, [isConnected, deinitializeNexus]);

  const value = useMemo(
    () => ({
      nexusSDK,
      intentRefCallback,
      allowanceRefCallback,
      handleInit,
      isInitialized,
      isLoading,
      error,
    }),
    [
      nexusSDK, 
      intentRefCallback, 
      allowanceRefCallback, 
      handleInit, 
      isInitialized, 
      isLoading, 
      error,
    ],
  );

  return (
    <NexusContext.Provider value={value}>
      {children}
    </NexusContext.Provider>
  );
};

export function useNexus() {
  const context = useContext(NexusContext);
  if (!context) {
    throw new Error("useNexus must be used within a NexusProvider");
  }
  return context;
}

export default NexusProvider;