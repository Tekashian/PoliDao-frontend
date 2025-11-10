# WebSocket Implementation Guide

## Overview
Stworzono nowy hook `useFundraisersWebSocket` który używa Alchemy WebSocket do pobierania danych z blockchain w czasie rzeczywistym.

## Zalety WebSocket vs HTTP
- **Real-time updates**: Automatyczne aktualizacje gdy ktoś utworzy kampanię lub wpłaci donację
- **Szybsze**: Nie trzeba pollować API co kilka sekund
- **Wydajniejsze**: Jedna trwała koneksja zamiast wielu requestów HTTP
- **Rate limit friendly**: Mniej requestów = łatwiej mieścić się w limitach

## Jak używać

### 1. Dodaj zmienną środowiskową (już jest w .env)
```env
NEXT_PUBLIC_ALCHEMY_API_KEY=OZo02Nr_k_eBJZBrU4JP9nY3t5oRbz5D
NEXT_PUBLIC_ALCHEMY_WS_URL=wss://eth-sepolia.g.alchemy.com/v2/OZo02Nr_k_eBJZBrU4JP9nY3t5oRbz5D
```

### 2. Import hooka
```typescript
import { useFundraisersWebSocket } from '@/hooks/useFundraisersWebSocket';
```

### 3. Użyj w komponencie
```typescript
function MyComponent() {
  const { 
    fundraisers,     // Lista kampanii
    count,           // Liczba kampanii
    isLoading,       // Czy trwa ładowanie
    isConnected,     // Czy WebSocket jest połączony
    error,           // Błąd (jeśli wystąpił)
    refresh          // Funkcja do ręcznego odświeżenia
  } = useFundraisersWebSocket();

  if (isLoading) return <div>Ładowanie...</div>;
  if (error) return <div>Błąd: {error.message}</div>;
  
  return (
    <div>
      <p>Status: {isConnected ? '🟢 Połączony' : '🔴 Rozłączony'}</p>
      <p>Liczba kampanii: {count}</p>
      {fundraisers.map(campaign => (
        <CampaignCard key={campaign.id} campaign={campaign} />
      ))}
    </div>
  );
}
```

## Porównanie z poprzednim hookiem

### Poprzedni hook (useFundraisersModular)
```typescript
// HTTP polling - musisz ręcznie odświeżać
const { fundraisers, count, isLoading, load } = useFundraisersModular();

// Trzeba periodycznie wywołać load()
useEffect(() => {
  const interval = setInterval(() => {
    load();
  }, 10000); // co 10 sekund
  return () => clearInterval(interval);
}, [load]);
```

### Nowy hook (useFundraisersWebSocket)
```typescript
// Real-time updates - automatyczne!
const { fundraisers, count, isLoading, isConnected } = useFundraisersWebSocket();

// Nie musisz nic robić - aktualizacje przychodzą automatycznie
// gdy ktoś:
// - Utworzy nową kampanię → automatycznie dodana do listy
// - Wpłaci donację → automatycznie zaktualizowana kwota
// - Zmieni status → automatycznie odświeżony
```

## Wydarzenia nasłuchiwane

1. **FundraiserCreated** - Nowa kampania
   ```typescript
   // Automatycznie dodaje nową kampanię do listy
   setFundraisers(prev => [...prev, newFundraiser]);
   ```

2. **DonationReceived** - Nowa donacja
   ```typescript
   // Automatycznie aktualizuje raisedAmount, donorsCount, percentage
   setFundraisers(prev => prev.map(f => 
     f.id === fundraiserId ? { ...f, raisedAmount: newAmount } : f
   ));
   ```

3. **FundraiserStatusChanged** - Zmiana statusu
   ```typescript
   // Automatycznie pobiera nowe dane i aktualizuje status
   ```

## Reconnect Logic
Hook automatycznie próbuje reconnect co 5 sekund jeśli połączenie zostanie zerwane:
```typescript
setTimeout(() => {
  console.log('🔄 Retrying WebSocket connection...');
  initializeWebSocket();
}, 5000);
```

## Performance

### Batching
Hook ładuje kampanie w batchach po 10:
```typescript
const batchSize = 10;
for (let i = 1; i <= total; i += batchSize) {
  // Load 10 fundraisers in parallel
}
```

### Caching
Dane są przechowywane w state i automatycznie aktualizowane tylko gdy coś się zmieni na blockchainie.

## Migration Guide

### Krok 1: Zamień import
```diff
- import { useFundraisersModular } from '@/hooks/useFundraisersModular';
+ import { useFundraisersWebSocket } from '@/hooks/useFundraisersWebSocket';
```

### Krok 2: Zamień hook call
```diff
- const { fundraisers, count, isLoading, error, load } = useFundraisersModular();
+ const { fundraisers, count, isLoading, error, isConnected, refresh } = useFundraisersWebSocket();
```

### Krok 3: Usuń polling logic (jeśli był)
```diff
- useEffect(() => {
-   const interval = setInterval(() => load(), 10000);
-   return () => clearInterval(interval);
- }, [load]);
```

### Krok 4: (Opcjonalnie) Dodaj indicator połączenia
```diff
+ {isConnected ? '🟢 Live' : '🔴 Connecting...'}
```

## Troubleshooting

### Problem: "WebSocket URL not configured"
**Rozwiązanie**: Sprawdź czy masz `NEXT_PUBLIC_ALCHEMY_API_KEY` w .env

### Problem: WebSocket się rozłącza
**Rozwiązanie**: Hook automatycznie reconnect. Sprawdź console logi:
```
🔌 Connecting to WebSocket...
✅ WebSocket connected
👂 Setting up event listeners...
```

### Problem: Dane nie aktualizują się
**Rozwiązanie**: 
1. Sprawdź czy `isConnected === true`
2. Sprawdź console logi czy wydarzenia przychodzą
3. Spróbuj ręcznego refresh: `refresh()`

## Vercel Deployment

### Krok 1: Dodaj env variables w Vercel Dashboard
```
Settings → Environment Variables

NEXT_PUBLIC_ALCHEMY_API_KEY=OZo02Nr_k_eBJZBrU4JP9nY3t5oRbz5D
NEXT_PUBLIC_ALCHEMY_WS_URL=wss://eth-sepolia.g.alchemy.com/v2/OZo02Nr_k_eBJZBrU4JP9nY3t5oRbz5D
```

### Krok 2: Redeploy
```bash
git push origin main
```

### Krok 3: Test
Otwórz Vercel deployment i sprawdź console:
```
🔌 Connecting to WebSocket...
✅ WebSocket connected
📊 Loading 10 fundraisers...
✅ Loaded 10 fundraisers
👂 Setting up event listeners...
✅ Event listeners active
```

## Przykład użycia w page.tsx

```typescript
// src/app/page.tsx
'use client';

import { useFundraisersWebSocket } from '@/hooks/useFundraisersWebSocket';
import CampaignCard from '@/components/CampaignCard';

export default function HomePage() {
  const { 
    fundraisers, 
    count, 
    isLoading, 
    isConnected,
    error 
  } = useFundraisersWebSocket();

  if (isLoading) {
    return <div>Ładowanie kampanii...</div>;
  }

  if (error) {
    return <div>Błąd: {error.message}</div>;
  }

  return (
    <div>
      <div className="status-bar">
        Status: {isConnected ? '🟢 Live' : '🔴 Connecting...'}
        <span>{count} kampanii</span>
      </div>
      
      <div className="campaigns-grid">
        {fundraisers.map(campaign => (
          <CampaignCard 
            key={campaign.id.toString()} 
            campaign={campaign} 
          />
        ))}
      </div>
    </div>
  );
}
```

## Next Steps

1. **Test locally**: `npm run dev` i sprawdź czy WebSocket się łączy
2. **Monitor console**: Zobacz logi real-time updates
3. **Test events**: Utwórz nową kampanię i zobacz czy automatycznie się pojawi
4. **Deploy to Vercel**: Push do repo i sprawdź na produkcji

## Benefits Summary

✅ **Real-time updates** - Automatyczne aktualizacje bez ręcznego refreshowania
✅ **Szybsze ładowanie** - WebSocket to jedna trwała koneksja
✅ **Rate limit friendly** - Mniej requestów do API
✅ **Better UX** - Użytkownicy widzą zmiany natychmiast
✅ **Auto-reconnect** - Automatyczne łączenie po disconnect
✅ **Production ready** - Gotowe do deployment na Vercel
