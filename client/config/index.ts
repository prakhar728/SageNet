
// config/index.tsx

import { cookieStorage, createStorage, http } from '@wagmi/core'
import { WagmiAdapter } from '@reown/appkit-adapter-wagmi'
import { defineChain } from '@reown/appkit/networks'

// Get projectId from https://cloud.reown.com
export const projectId = process.env.NEXT_PUBLIC_WALLET_CONNECT;

if (!projectId) {
  throw new Error('Project ID is not defined')
}

export const eduChainMainnet = defineChain({
    id: 41923,
    caipNetworkId: 'eip155:41923',
    chainNamespace: 'eip155',
    name: 'EDU Chain',
    nativeCurrency: {
      decimals: 18,
      name: 'EDU',
      symbol: 'EDU',
    },
    rpcUrls: {
      default: {
        http: ['https://rpc.edu-chain.raas.gelato.cloud'],
        webSocket: ['wss://ws.edu-chain.raas.gelato.cloud'],
      },
    },
    blockExplorers: {
      default: { name: 'EduChain Blockscout', url: 'https://explorer.edu-chain.raas.gelato.cloud' },
    },
  });
  
  export const eduChainTestnet = defineChain({
    id: 656476,
    caipNetworkId: 'eip155:656476',
    chainNamespace: 'eip155',
    name: 'EDU Chain Testnet',
    nativeCurrency: {
      decimals: 18,
      name: 'EDU',
      symbol: 'EDU',
    },
    rpcUrls: {
      default: {
        http: ['https://rpc.open-campus-codex.gelato.digital'],
        webSocket: ['wss://ws.open-campus-codex.gelato.digital'],
      },
    },
    blockExplorers: {
      default: { name: 'Testnet Explorer', url: 'https://explorer.open-campus-codex.gelato.digital' },
    },

  });


export const networks = [eduChainMainnet, eduChainTestnet];

//Set up the Wagmi Adapter (Config)
export const wagmiAdapter = new WagmiAdapter({
  storage: createStorage({
    storage: cookieStorage
  }),
  ssr: true,
  projectId,
  networks
})

export const config = wagmiAdapter.wagmiConfig