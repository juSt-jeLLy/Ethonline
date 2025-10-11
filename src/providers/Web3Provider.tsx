import { NexusProvider } from '@avail-project/nexus-widgets'
import { WagmiProvider } from 'wagmi'
import { defineChain, type Chain } from 'viem'
import {
  base,
  polygon,
  arbitrum,
  optimism,
  scroll,
  avalanche,
  bsc,
  baseSepolia,
  arbitrumSepolia,
  optimismSepolia,
  polygonAmoy,
  mainnet,
  kaia,
  sepolia,
} from 'wagmi/chains'

import { createContext, useContext, useMemo, useState, ReactNode } from 'react'
import type { NexusNetwork } from '@avail-project/nexus-widgets'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import '@rainbow-me/rainbowkit/styles.css'
import {
  getDefaultConfig,
  RainbowKitProvider,
  Theme,
} from '@rainbow-me/rainbowkit'
import { merge } from 'lodash'

const walletConnectProjectId = import.meta.env.VITE_WALLETCONNECT_PROJECT_ID || 'YOUR_PROJECT_ID'

// Hyperliquid HyperEVM custom chain
const hyperEVM = defineChain({
  id: 999,
  name: 'HyperEVM',
  nativeCurrency: { name: 'HYPE', symbol: 'HYPE', decimals: 18 },
  rpcUrls: {
    default: { http: ['https://rpc.hyperliquid.xyz/evm'] },
  },
  blockExplorers: {
    default: { name: 'HyperEVM Scan', url: 'https://hyperevmscan.io' },
  },
})

const sophon = defineChain({
  id: 50104,
  name: 'Sophon',
  nativeCurrency: {
    decimals: 18,
    name: 'Sophon',
    symbol: 'SOPH',
  },
  rpcUrls: {
    default: {
      http: ['https://rpc.sophon.xyz'],
      webSocket: ['wss://rpc.sophon.xyz/ws'],
    },
  },
  blockExplorers: {
    default: {
      name: 'Sophon Block Explorer',
      url: 'https://explorer.sophon.xyz',
    },
  },
})

// Add chain icons for RainbowKit
type RainbowKitChain = Chain & { iconUrl?: string; iconBackground?: string }

const hyperEVMWithIcon: RainbowKitChain = {
  ...hyperEVM,
  iconUrl:
    'https://assets.coingecko.com/coins/images/50882/standard/hyperliquid.jpg?1729431300',
  iconBackground: '#0a3cff',
}

const sophonWithIcon: RainbowKitChain = {
  ...sophon,
  iconUrl:
    'https://assets.coingecko.com/coins/images/38680/standard/sophon_logo_200.png?1747898236',
  iconBackground: '#6b5cff',
}

const config = getDefaultConfig({
  appName: 'PayStream',
  projectId: walletConnectProjectId,
  chains: [
    mainnet,
    base,
    polygon,
    arbitrum,
    optimism,
    scroll,
    avalanche,
    bsc,
    sophonWithIcon,
    kaia,
    hyperEVMWithIcon,
    sepolia,
    baseSepolia,
    arbitrumSepolia,
    optimismSepolia,
    polygonAmoy,
  ],
})

// Custom theme matching your design system
const customTheme: Theme = {
  blurs: {
    modalOverlay: 'blur(4px)',
  },
  colors: {
    accentColor: 'hsl(45, 93%, 47%)', // Bright yellow for testing
    accentColorForeground: 'hsl(0, 0%, 0%)',
    actionButtonBorder: 'hsl(220, 13%, 91%)',
    actionButtonBorderMobile: 'hsl(220, 13%, 91%)',
    actionButtonSecondaryBackground: 'hsl(220, 14%, 96%)',
    closeButton: 'hsl(240, 5%, 50%)',
    closeButtonBackground: 'hsl(220, 14%, 96%)',
    connectButtonBackground: 'hsl(0, 0%, 100%)',
    connectButtonBackgroundError: 'hsl(0, 84%, 60%)',
    connectButtonInnerBackground: 'hsl(220, 14%, 96%)',
    connectButtonText: 'hsl(240, 10%, 10%)',
    connectButtonTextError: 'hsl(0, 84%, 60%)',
    connectionIndicator: 'hsl(142, 76%, 36%)',
    downloadBottomCardBackground: 'hsl(220, 14%, 96%)',
    downloadTopCardBackground: 'hsl(0, 0%, 100%)',
    error: 'hsl(0, 84%, 60%)',
    generalBorder: 'hsl(220, 13%, 91%)',
    generalBorderDim: 'hsl(220, 14%, 96%)',
    menuItemBackground: 'hsl(220, 14%, 96%)',
    modalBackdrop: 'rgba(0, 0, 0, 0.5)',
    modalBackground: 'hsl(0, 0%, 100%)',
    modalBorder: 'hsl(220, 13%, 91%)',
    modalText: 'hsl(240, 10%, 10%)',
    modalTextDim: 'hsl(240, 5%, 50%)',
    modalTextSecondary: 'hsl(240, 5%, 50%)',
    profileAction: 'hsl(220, 14%, 96%)',
    profileActionHover: 'hsl(220, 13%, 91%)',
    profileForeground: 'hsl(0, 0%, 100%)',
    selectedOptionBorder: 'hsl(262, 83%, 58%)',
    standby: 'hsl(45, 93%, 47%)',
  },
  fonts: {
    body: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
  },
  radii: {
    actionButton: '16px',
    connectButton: '16px',
    menuButton: '16px',
    modal: '16px',
    modalMobile: '16px',
  },
  shadows: {
    connectButton: '0 4px 12px rgba(0, 0, 0, 0.1)',
    dialog: '0 8px 32px rgba(31, 38, 135, 0.15)',
    profileDetailsAction: '0 2px 6px rgba(0, 0, 0, 0.05)',
    selectedOption: '0 2px 6px rgba(0, 0, 0, 0.05)',
    selectedWallet: '0 2px 6px rgba(0, 0, 0, 0.05)',
    walletLogo: '0 2px 6px rgba(0, 0, 0, 0.05)',
  },
}

const queryClient = new QueryClient()

interface Web3ContextValue {
  network: NexusNetwork
  setNetwork: React.Dispatch<React.SetStateAction<NexusNetwork>>
}

const Web3Context = createContext<Web3ContextValue | null>(null)

interface Web3ProviderProps {
  children: ReactNode
}

const Web3Provider = ({ children }: Web3ProviderProps) => {
  const [network, setNetwork] = useState<NexusNetwork>('mainnet')
  const value = useMemo(() => ({ network, setNetwork }), [network])

  return (
    <Web3Context.Provider value={value}>
      <WagmiProvider config={config}>
        <QueryClientProvider client={queryClient}>
          <RainbowKitProvider modalSize="compact" theme={customTheme}>
            <NexusProvider
              config={{
                debug: true,
                network: 'mainnet',
              }}
            >
              {children}
            </NexusProvider>
          </RainbowKitProvider>
        </QueryClientProvider>
      </WagmiProvider>
    </Web3Context.Provider>
  )
}

export function useWeb3Context() {
  const context = useContext(Web3Context)
  if (!context) {
    throw new Error('useWeb3Context must be used within a Web3Provider')
  }
  return context
}

export default Web3Provider