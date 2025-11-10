// Example: How to integrate WebSocket hook into page.tsx
// Replace the old useFundraisersModular with useFundraisersWebSocket

import { useFundraisersWebSocket } from '@/hooks/useFundraisersWebSocket';

// BEFORE (old HTTP polling):
// const { fundraisers, count, isLoading, error, load } = useFundraisersModular(0, 50);

// AFTER (new WebSocket real-time):
const { 
  fundraisers,      // Same API - array of campaigns
  count,            // Same API - total count
  isLoading,        // Same API - loading state
  isConnected,      // NEW - WebSocket connection status
  error,            // Same API - error state
  refresh           // NEW - manual refresh function (replaces load)
} = useFundraisersWebSocket();

// Add connection status indicator in your UI:
{isConnected ? (
  <span style={{ color: 'green' }}>🟢 Live Updates</span>
) : (
  <span style={{ color: 'red' }}>🔴 Connecting...</span>
)}

// The rest of your code stays the same!
// fundraisers will automatically update when:
// - New campaign is created
// - Someone donates
// - Campaign status changes

// No need for manual polling anymore!
// Remove any setInterval/setTimeout for refreshing data

// Example: Remove this old polling code
// useEffect(() => {
//   const interval = setInterval(() => {
//     load();
//   }, 10000);
//   return () => clearInterval(interval);
// }, [load]);
