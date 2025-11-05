// src/lib/rpc-fallback.ts
// Emergency fallback service for when primary RPC endpoints fail

export class RPCFallbackService {
  private static instance: RPCFallbackService;
  private fallbackEndpoints: string[] = [];
  private lastWorkingEndpoint: string | null = null;
  private healthChecks = new Map<string, { healthy: boolean; lastCheck: number }>();

  private constructor() {
    this.initializeFallbackEndpoints();
  }

  static getInstance(): RPCFallbackService {
    if (!RPCFallbackService.instance) {
      RPCFallbackService.instance = new RPCFallbackService();
    }
    return RPCFallbackService.instance;
  }

  private initializeFallbackEndpoints() {
    // Public Sepolia endpoints as emergency fallbacks
    this.fallbackEndpoints = [
      'https://rpc.sepolia.org',
      'https://ethereum-sepolia.publicnode.com',
      'https://rpc2.sepolia.org',
      'https://sepolia.gateway.tenderly.co',
    ];
  }

  async healthCheck(endpoint: string): Promise<boolean> {
    const cached = this.healthChecks.get(endpoint);
    const now = Date.now();
    
    // Use cached result if less than 5 minutes old
    if (cached && (now - cached.lastCheck) < 300000) {
      return cached.healthy;
    }

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          method: 'eth_blockNumber',
          params: [],
          id: 1
        }),
        signal: AbortSignal.timeout(5000) // 5 second timeout
      });

      const result = await response.json();
      const healthy = !!result.result && typeof result.result === 'string';
      
      this.healthChecks.set(endpoint, { healthy, lastCheck: now });
      return healthy;
    } catch {
      this.healthChecks.set(endpoint, { healthy: false, lastCheck: now });
      return false;
    }
  }

  async getWorkingEndpoint(): Promise<string | null> {
    // Try last working endpoint first
    if (this.lastWorkingEndpoint && await this.healthCheck(this.lastWorkingEndpoint)) {
      return this.lastWorkingEndpoint;
    }

    // Check fallback endpoints
    for (const endpoint of this.fallbackEndpoints) {
      if (await this.healthCheck(endpoint)) {
        this.lastWorkingEndpoint = endpoint;
        return endpoint;
      }
    }

    return null;
  }

  async makeRPCCall(method: string, params: any[] = []): Promise<any> {
    const endpoint = await this.getWorkingEndpoint();
    
    if (!endpoint) {
      throw new Error('No healthy RPC endpoints available');
    }

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        method,
        params,
        id: Date.now()
      }),
      signal: AbortSignal.timeout(10000) // 10 second timeout
    });

    const result = await response.json();
    
    if (result.error) {
      throw new Error(`RPC Error: ${result.error.message}`);
    }

    return result.result;
  }

  // Clear caches when needed
  clearHealthCache() {
    this.healthChecks.clear();
    this.lastWorkingEndpoint = null;
  }
}

export const rpcFallback = RPCFallbackService.getInstance();