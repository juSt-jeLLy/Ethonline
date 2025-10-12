import { useState, useCallback, useRef } from "react";
import {
  NexusSDK,
  type OnAllowanceHookData,
  type OnIntentHookData,
} from "@avail-project/nexus-core";
import { useAccount, useSwitchChain } from "wagmi";

// Global window extension for wallet provider
declare global {
  interface Window {
    ethereum?: any;
  }
}

const useInitNexus = (sdk: NexusSDK) => {
  const [nexusSDK, setNexusSDK] = useState<NexusSDK | null>(null);
  const { address } = useAccount();
  const { switchChainAsync } = useSwitchChain();

  const intentRefCallback = useRef<OnIntentHookData | null>(null);
  const allowanceRefCallback = useRef<OnAllowanceHookData | null>(null);

  const initializeNexus = useCallback(async () => {
    if (!window.ethereum || !address) {
      console.error("Wallet not connected");
      return;
    }

    try {
      // Initialize with the wallet provider (ethereum)
      await sdk.initialize(window.ethereum);
      
      setNexusSDK(sdk);
      console.log("Nexus SDK initialized successfully");
    } catch (error) {
      console.error("Failed to initialize Nexus SDK:", error);
    }
  }, [sdk, address]);

  const deinitializeNexus = useCallback(() => {
    if (sdk.isInitialized()) {
      sdk.deinit();
      setNexusSDK(null);
      console.log("Nexus SDK deinitialized");
    }
  }, [sdk]);

  const attachEventHooks = useCallback(() => {
    // Set up allowance hook for token approvals
    sdk.setOnAllowanceHook(async (hookData: OnAllowanceHookData) => {
      console.log("Allowance hook triggered:", hookData.sources);
      allowanceRefCallback.current = hookData;
      
      // Auto-approve with minimum allowances for now
      // You can customize this to show a modal for user approval
      const allowances = hookData.sources.map(() => "min");
      hookData.allow(allowances);
    });

    // Set up intent hook for transaction previews
    sdk.setOnIntentHook((hookData: OnIntentHookData) => {
      console.log("Intent hook triggered:", hookData.intent);
      intentRefCallback.current = hookData;
      
      // Auto-approve for now
      // You can customize this to show a transaction preview modal
      hookData.allow();
    });

    console.log("Event hooks attached");
  }, [sdk]);

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