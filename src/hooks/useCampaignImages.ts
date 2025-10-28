import { useState, useEffect } from 'react';

export function useCampaignImages(campaignId: string) {
  const [campaignImage, setCampaignImage] = useState<string | null>(null);
  const [gallery, setGallery] = useState<any[]>([]);
  const [imageLoading, setImageLoading] = useState(true);
  const [galleryLoading, setGalleryLoading] = useState(false);

  useEffect(() => {
    if (!campaignId) return;
    
    let disposed = false;
    
    const fetchImages = async () => {
      try {
        setImageLoading(true);
        setGalleryLoading(true);
        
        const [imageResponse, galleryResponse] = await Promise.all([
          fetch(`/api/campaigns/${campaignId}/images`).catch(() => ({ ok: false })),
          fetch(`/api/campaigns/${campaignId}/gallery`).catch(() => ({ ok: false }))
        ]);
        
        if (!disposed) {
          if (imageResponse.ok) {
            try {
              const imageData = await imageResponse.json();
              setCampaignImage(imageData.imageUrl);
            } catch {
              setCampaignImage(null);
            }
          } else {
            setCampaignImage(null);
          }
          
          if (galleryResponse.ok) {
            try {
              const galleryData = await galleryResponse.json();
              setGallery(galleryData.gallery || []);
            } catch {
              setGallery([]);
            }
          } else {
            setGallery([]);
          }
        }
      } catch (error) {
        console.error('Error fetching images:', error);
        if (!disposed) {
          setCampaignImage(null);
          setGallery([]);
        }
      } finally {
        if (!disposed) {
          setImageLoading(false);
          setGalleryLoading(false);
        }
      }
    };

    const timer = setTimeout(fetchImages, 2000);
    
    return () => {
      disposed = true;
      clearTimeout(timer);
    };
  }, [campaignId]);

  return { campaignImage, gallery, imageLoading, galleryLoading, setGallery };
}
