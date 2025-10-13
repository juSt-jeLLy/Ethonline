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
        network: "testnet",
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

    // Check if we're on a testnet chain
    const testnetChainIds = [11155111, 84532, 421614, 11155420, 80002];
    if (chain && !testnetChainIds.includes(chain.id)) {
      setError(`Please switch to a testnet network (Sepolia, Base Sepolia, etc.)`);
      console.warn(`Current chain ${chain.id} is not a testnet. Please switch.`);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      console.log("Initializing Nexus SDK on TESTNET...");
      await initializeNexus();
      attachEventHooks();
      setIsInitialized(true);
      console.log("Nexus SDK initialized successfully on TESTNET");
    } catch (error) {
      console.error("Failed to initialize Nexus:", error);
      setError(error instanceof Error ? error.message : "Failed to initialize Nexus");
      setIsInitialized(false);
    } finally {
      setIsLoading(false);
    }
  }, [sdk, connector, address, chain, attachEventHooks, initializeNexus]);

  // Auto-initialize when wallet connects to testnet
  useEffect(() => {
    if (isConnected && connector && address && !isInitialized && !isLoading) {
      const testnetChainIds = [11155111, 84532, 421614, 11155420, 80002];
      
      if (chain && testnetChainIds.includes(chain.id)) {
        console.log("Wallet connected to testnet, initializing Nexus...");
        handleInit();
      } else {
        setError("Please connect to a testnet network");
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