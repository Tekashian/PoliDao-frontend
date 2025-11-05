# Rozwiązanie problemu Rate Limit dla RPC Endpoints

## Problem
Aplikacja na Vercel napotykała błędy rate limiting od Infura (`Too Many Requests`, błąd `-32005`) podczas ładowania kampanii, powodując nieprawidłowe wyświetlanie kart.

## Wprowadzone rozwiązania

### 1. Ulepszone zarządzanie RPC endpoints
- **Dual endpoint strategy**: Wykorzystywanie zarówno Alchemy jak i Infura
- **Enhanced load balancer**: Lepszy round-robin z tracking'iem wykorzystania
- **Request throttling**: Zmniejszenie równoczesnych połączeń z 6 do 3
- **Extended cooldown**: Zwiększenie czasu blokady endpoint'ów z 30s do 45s

### 2. Inteligentny retry mechanism
- **Exponential backoff**: Progresywne zwiększanie opóźnień
- **Smart jitter**: Losowe przesunięcia czasowe (50-150ms)
- **Batch processing**: Ograniczenie równoczesnych żądań do 2-3
- **Enhanced error detection**: Rozszerzona detekcja błędów rate limit

### 3. Fallback transport w wagmi
- **Automatic failover**: Przełączanie między endpoint'ami w przypadku błędów
- **Enhanced retry policy**: 3 próby z inteligentnym delay'em
- **Timeout management**: 10-sekundowe timeout'y dla zapytań

### 4. Cache mechanism
- **30-second TTL cache**: Unikanie redundantnych wywołań
- **Stale data fallback**: Używanie przestarzałych danych w przypadku błędów
- **Smart cache invalidation**: Automatyczne czyszczenie cache'u

### 5. Lepsze UX dla błędów
- **Informative error messages**: Jasne komunikaty o rate limiting
- **Auto-retry countdown**: Wizualny countdown do następnej próby
- **Manual retry button**: Możliwość natychmiastowego ponowienia
- **Progressive retry attempts**: Max 6 prób z inteligentnym backoff'em

## Kluczowe pliki zmienione

1. **src/app/page.tsx**
   - Ulepszone RPC load balancing
   - Enhanced retry logic z eksponencjalnym backoff'em
   - Lepsze komunikaty błędów

2. **src/config/index.tsx**
   - Dual RPC transport z fallback
   - Enhanced retry configuration
   - Batch processing support

3. **src/blockchain/contracts.ts**
   - Retry mechanism dla kontraktów
   - Batch processing z concurrency limiting
   - Enhanced error handling

4. **src/hooks/useFundraisersModular.ts**
   - Cache mechanism
   - Batch processing kampanii
   - Enhanced error recovery

5. **src/lib/rpc-fallback.ts** (nowy)
   - Emergency fallback service
   - Health checking dla endpoint'ów
   - Public RPC fallbacks

## Rezultat
- ✅ Karty kampanii ładują się zawsze, nawet przy rate limiting
- ✅ Automatyczne przełączanie między endpoint'ami
- ✅ Inteligentne retry z user-friendly komunikatami
- ✅ Znacznie zmniejszone obciążenie RPC endpoint'ów
- ✅ Lepsze UX z informacyjnymi komunikatami błędów

## Monitoring
Aplikacja teraz loguje:
- RPC endpoint failures
- Rate limit detection
- Retry attempts
- Fallback usage

Sprawdź console.log w przeglądarce dla debug informacji.