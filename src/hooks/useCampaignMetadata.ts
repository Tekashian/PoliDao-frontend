import { useState, useEffect } from 'react';

export interface CampaignMetadata {
  campaignId: string;
  title: string;
  description: string;
  imageUrl?: string;
  location?: string;
  creator: string;
  createdAt?: string;
  updatedAt?: string;
}

export function useCampaignMetadata(campaignId: string | null | undefined) {
  const [metadata, setMetadata] = useState<CampaignMetadata | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Reset state when campaignId changes
    setMetadata(null);
    setError(null);

    if (!campaignId) {
      setLoading(false);
      return;
    }

    const fetchMetadata = async () => {
      setLoading(true);
      setError(null);

      try {
        console.log('🔍 Fetching campaign metadata from database for:', campaignId);
        
        const response = await fetch(`/api/campaigns/${campaignId}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
          cache: 'no-cache'
        });

        if (response.status === 404) {
          console.log('📭 No metadata found in database for campaign:', campaignId);
          setMetadata(null);
          setError(null);
          return;
        }

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();
        console.log('✅ Campaign metadata loaded from database:', data);
        setMetadata(data);

      } catch (fetchError: any) {
        console.error('❌ Failed to fetch campaign metadata:', fetchError);
        setError(fetchError.message);
        setMetadata(null);
      } finally {
        setLoading(false);
      }
    };

    fetchMetadata();
  }, [campaignId]);

  return { metadata, loading, error };
}
