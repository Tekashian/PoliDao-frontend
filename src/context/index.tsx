'use client'

import { wagmiAdapter, projectId } from "../config/index"
import { createAppKit } from "@reown/appkit/react";
import { type Chain } from 'wagmi/chains';

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React, { type ReactNode } from 'react';
import { WagmiProvider, type Config } from "wagmi";
import { sepolia } from "@reown/appkit/networks";

const queryClient = new QueryClient();

if (!projectId) {
    throw new Error('Project Id is not defined. Check NEXT_PUBLIC_PROJECT_ID in your .env file or if it is hardcoded in config.');
}

console.log("[CONTEXT] Initializing Reown AppKit with Project ID:", projectId);

const metadata = {
    name: "PoliDao",
    description: "PoliDao - EVM ",
    url: typeof window !== 'undefined' ? window.location.origin : "https://default.example.com",
    icons: ["https://avatars.githubusercontent.com/u/37784886"]
};

const defaultNetworkChain = sepolia as unknown as Chain;

createAppKit({
    adapters: [wagmiAdapter],
    projectId,
    networks: [sepolia] as unknown as [Chain, ...Chain[]],
    defaultNetwork: defaultNetworkChain,
    metadata,
    features: {
        analytics: true,
        email: true,
        socials: ['google', 'x', 'github', 'discord', 'farcaster'],
        emailShowWallets: true
    },
    themeMode: 'light',
    themeVariables: {
        '--w3m-accent': '#10b981',
        '--w3m-accent-fill-color': '#ffffff',
        '--w3m-color-mix': '#10b981',
        '--w3m-color-mix-strength': 40,
        '--w3m-border-radius-master': '12px',
        '--w3m-overlay-background-color': 'rgba(0,0,0,0.45)',
        '--w3m-background-color': '#ffffff'
    } as unknown as Record<string, string>
});

function ContextProvider({ children }: { children: ReactNode }) {
    const config = wagmiAdapter.wagmiConfig as Config;

    return (
        <WagmiProvider config={config}>
            <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
        </WagmiProvider>
    );
}

export default ContextProvider;
