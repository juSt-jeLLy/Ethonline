import type {
  EthereumProvider,
  NexusSDK,
  OnAllowanceHookData,
  OnIntentHookData,
} from "@avail-project/nexus-core";
import { useRef, useState } from "react";
import { useAccount } from "wagmi";

const useInitNexus = (sdk: NexusSDK) => {
  const { connector } = useAccount();
  const [nexusSDK, setNexusSDK] = useState<NexusSDK | null>(null);
  const intentRefCallback = useRef<OnIntentHookData | null>(null);
  const allowanceRefCallback = useRef<OnAllowanceHookData | null>(null);

  const initializeNexus = async () => {
    try {
      if (sdk.isInitialized()) {
        console.log("Nexus is already initialized");
        setNexusSDK(sdk);
        return;
      }

      if (!connector) {
        throw new Error("No wallet connector available");
      }

      const provider = (await connector?.getProvider()) as EthereumProvider;
      
      if (!provider) {
        throw new Error("No Ethereum provider found from wallet connector");
      }

      // Check if provider has accounts with proper typing
      const accounts = await provider.request({ method: 'eth_accounts' }) as string[];
      
      if (!accounts || accounts.length === 0) {
        throw new Error("No accounts found in wallet. Please ensure your wallet is unlocked.");
      }

      console.log("Initializing Nexus SDK with provider on TESTNET...");
      
      // Force testnet initialization
      await sdk.initialize(provider);
      setNexusSDK(sdk);
      
      // Verify network
      const currentNetwork = await provider.request({ method: 'net_version' });
      console.log(`Current network ID: ${currentNetwork}`);
      
      console.log("Nexus SDK initialized successfully on TESTNET");
      
    } catch (error) {
      console.error("Error initializing Nexus:", error);
      throw error;
    }
  };

  const deinitializeNexus = async () => {
    try {
      if (!sdk.isInitialized()) {
        console.log("Nexus is not initialized, skipping deinit");
        return;
      }
      await sdk.deinit();
      setNexusSDK(null);
      console.log("Nexus deinitialized successfully");
    } catch (error) {
      console.error("Error deinitializing Nexus:", error);
    }
  };

  const attachEventHooks = () => {
    if (!sdk.isInitialized()) {
      console.warn("Cannot attach event hooks: Nexus SDK not initialized");
      return;
    }

    sdk.setOnAllowanceHook((data: OnAllowanceHookData) => {
      console.log("Nexus Allowance Hook:", data);
      allowanceRefCallback.current = data;
    });

    sdk.setOnIntentHook((data: OnIntentHookData) => {
      console.log("Nexus Intent Hook:", data);
      intentRefCallback.current = data;
    });

    console.log("Nexus event hooks attached");
  };

  return {
    nexusSDK,
    initializeNexus,
    deinitializeNexus,
    attachEventHooks,
    intentRefCallback,
    allowanceRefCallback,
  };
};

export default useInitNexus;