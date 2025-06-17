// src/context/index.tsx
'use client'

// Importy z twojego pliku config/index.tsx
// Upewnij się, że plik config/index.tsx poprawnie eksportuje projectId i networks
import { wagmiAdapter, projectId, networks as appNetworks } from "../config/index"
import { createAppKit } from "@reown/appkit/react"; // Upewnij się, że używasz /react jeśli tak jest w najnowszej dokumentacji
import { type Chain } from 'wagmi/chains'; // Potrzebne do rzutowania typu dla defaultNetwork

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React, { type ReactNode } from 'react';
// Usunęliśmy import cookieToInitialState
import { WagmiProvider, type Config } from "wagmi";

const queryClient = new QueryClient();

// To sprawdzenie jest dobre, ale upewnij się, że problem leży w wartości, a nie tylko w tym sprawdzeniu
if (!projectId) {
    // Ten błąd powinien zatrzymać budowanie, jeśli NEXT_PUBLIC_PROJECT_ID nie jest ustawione
    throw new Error('Project Id is not defined. Check NEXT_PUBLIC_PROJECT_ID in your .env file or if it is hardcoded in config. (Error from context/index.tsx)');
}

// --- DODANY CONSOLE.LOG ---
// Wyświetlamy projectId, które będzie użyte do inicjalizacji Reown AppKit
console.log("[CONTEXT] Attempting to initialize Reown AppKit with Project ID:", projectId);
// --------------------------

const metadata = {
    name: "PoliDao", // Możesz dostosować
    description: "PoliDao - EVM ", // Możesz dostosować
    url: typeof window !== 'undefined' ? window.location.origin : "https://default.example.com", // Domyślny URL dla SSR
    icons: ["https://avatars.githubusercontent.com/u/37784886"] // Przykładowa ikona, zmień na swoją
};

// Ustalenie defaultNetwork. Zakładamy, że appNetworks (z config/index.tsx) to [sepolia]
// Jeśli appNetworks jest puste, defaultNetworkChain będzie undefined.
const defaultNetworkChain = appNetworks.length > 0 ? appNetworks[0] as unknown as Chain : undefined;

if (!defaultNetworkChain && appNetworks.length > 0) {
    console.warn("Warning: Could not determine defaultNetworkChain correctly, ensure `networks` in `config/index.tsx` is an array of Chain objects from `@reown/appkit/networks` or `wagmi/chains`.");
} else if (appNetworks.length === 0) {
    console.error("ERROR: The `networks` array in `config/index.tsx` is empty. Reown AppKit requires at least one network.");
    // Możesz tu rzucić błędem, aby zatrzymać aplikację, jeśli to krytyczne
    // throw new Error("Reown AppKit requires at least one network defined in config/index.tsx.");
}


const modal = createAppKit({
    adapters: [wagmiAdapter],
    projectId, // Tutaj używane jest projectId
    // Upewnij się, że appNetworks jest poprawnie zdefiniowaną tablicą Chain[] w config/index.tsx
    // i że zawiera przynajmniej jedną sieć, np. [sepolia]
    networks: appNetworks as [Chain, ...Chain[]], // Rzutowanie dla createAppKit; upewnij się, że appNetworks nie jest puste
    defaultNetwork: defaultNetworkChain, // Może być undefined, jeśli appNetworks jest puste
    metadata,
    features: {
        analytics: true, // Włącz/wyłącz według potrzeb
        email: true,     // Włącz/wyłącz według potrzeb
        socials: ['google', 'x', 'github', 'discord', 'farcaster'], // Dostosuj listę
        emailShowWallets: true
    },
    themeMode: 'light', // Możesz zmienić na 'dark' lub 'system'
    themeVariables: {
        '--w3m-accent': '#68CC9C', // Przykładowy kolor akcentu
        '--w3m-color-mix': '#68CC9C',
        '--w3m-color-mix-strength': 40,
        '--w3m-border-radius-master': '4px', // Przykładowy promień zaokrąglenia
    }
});

// ContextProvider nie przyjmuje już propsów związanych z cookies/headers
function ContextProvider({ children }: { children: ReactNode }) {
    const config = wagmiAdapter.wagmiConfig as Config;

    return (
        // WagmiProvider jest teraz bez `initialState`
        <WagmiProvider config={config}>
            <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
        </WagmiProvider>
    );
}

export default ContextProvider;
