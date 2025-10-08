'use client';

import React, { useRef, useEffect, useState } from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination } from 'swiper/modules';

type AutoWidthCarouselProps<T = any> = {
  title: string;
  items: T[];
  renderItem?: (item: T, index: number) => React.ReactNode;
  space?: number;
  slideWidthClass?: string;
};

// Fallback demo data (used only if no items provided AND no renderItem is given)
const demoItems = [
  {
    id: 1,
    title: 'Community Garden',
    description: 'Help us build a local garden for everyone.',
    image: 'https://images.unsplash.com/photo-1469474968028-56623f02e42e?q=80&w=1200&auto=format&fit=crop',
  },
  {
    id: 2,
    title: 'Education Fund',
    description: 'Support scholarships for talented kids.',
    image: 'https://images.unsplash.com/photo-1513258496099-48168024aec0?q=80&w=1200&auto=format&fit=crop',
  },
  {
    id: 3,
    title: 'Animal Shelter',
    description: 'Food and medicine for rescued animals.',
    image: 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?q=80&w=1200&auto=format&fit=crop',
  },
  {
    id: 4,
    title: 'Local Clinic',
    description: 'Medical equipment for our neighborhood clinic.',
    image: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?q=80&w=1200&auto=format&fit=crop',
  },
];

export default function AutoWidthCarousel<T = any>({
  title,
  items,
  renderItem,
}: AutoWidthCarouselProps<T>) {
  const prevRef = useRef<HTMLButtonElement | null>(null);
  const nextRef = useRef<HTMLButtonElement | null>(null);
  const [swiper, setSwiper] = useState<any>(null);

  const hasItems = Array.isArray(items) && items.length > 0;
  // Use demo only when no custom renderer provided
  const itemsToRender = hasItems ? items : (renderItem ? [] : (demoItems as unknown as T[]));

  // Bind external navigation once refs and swiper exist
  useEffect(() => {
    if (!swiper || !prevRef.current || !nextRef.current) return;
    swiper.params.navigation = {
      ...(swiper.params.navigation || {}),
      prevEl: prevRef.current,
      nextEl: nextRef.current,
    };
    swiper.navigation.destroy();
    swiper.navigation.init();
    swiper.navigation.update();
  }, [swiper]);

  return (
    <section className="w-full">
      <div className="max-w-screen-xl mx-auto px-4">
        <header className="mb-4">
          <h2 className="text-2xl font-bold text-gray-900">{title}</h2>
        </header>

        <div className="relative awc" style={{ ['--awc-gap' as any]: '10px' }}>
          {/* Nav buttons */}
          <button
            ref={prevRef}
            aria-label="Poprzednia karta"
            className="
              absolute left-0 top-1/2 -translate-y-1/2 z-10
              inline-flex items-center justify-center h-10 w-10 rounded-full
              border border-gray-200 bg-white
              text-emerald-600
              shadow-sm hover:shadow transition-all duration-200 ease-in-out
              hover:scale-105 hover:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500
            "
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path d="M15 19l-7-7 7-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
          <button
            ref={nextRef}
            aria-label="Następna karta"
            className="
              absolute right-0 top-1/2 -translate-y-1/2 z-10
              inline-flex items-center justify-center h-10 w-10 rounded-full
              border border-gray-200 bg-white
              text-emerald-600
              shadow-sm hover:shadow transition-all duration-200 ease-in-out
              hover:scale-105 hover:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500
            "
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path d="M9 5l7 7-7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>

          {/* Render Swiper only if there are items to show; otherwise show an empty state */}
          {itemsToRender.length === 0 ? (
            <div className="py-6 text-sm text-gray-500">Brak elementów do wyświetlenia.</div>
          ) : (
            <Swiper
              modules={[Navigation, Pagination]}
              slidesPerView={3}
              spaceBetween={0}
              breakpoints={{
                0:   { slidesPerView: 1, spaceBetween: 0 },
                640: { slidesPerView: 2, spaceBetween: 0 },
                1024:{ slidesPerView: 3, spaceBetween: 0 },
              }}
              speed={700}
              pagination={{ clickable: true }}
              onSwiper={setSwiper}
              watchOverflow
              className="!overflow-visible"
            >
              {itemsToRender.map((item: T | any, index: number) => (
                <SwiperSlide key={`slide-${index}`}>
                  <div className="w-full h-full">
                    {renderItem ? (
                      renderItem(item as T, index)
                    ) : (
                      // Fallback demo card (only used when renderItem is not provided)
                      <article
                        className="
                          box-border w-full
                          rounded-xl bg-white border border-gray-200
                          shadow-sm hover:shadow-md
                          transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]
                          hover:scale-[1.02] will-change-transform
                          flex flex-col
                        "
                      >
                        <div className="aspect-[16/10] w-full overflow-hidden rounded-t-xl">
                          <img
                            src={item.image}
                            alt={item.title}
                            className="h-full w-full object-cover"
                            loading="lazy"
                          />
                        </div>

                        <div className="p-4 flex-1 flex flex-col">
                          <h3 className="text-lg font-semibold text-gray-900 leading-snug mb-1">
                            {item.title}
                          </h3>
                          <p className="text-sm text-gray-600 mb-4 line-clamp-3">
                            {item.description}
                          </p>
                          <div className="mt-auto">
                            <button className="w-full inline-flex items-center justify-center h-10 rounded-lg bg-emerald-500 text-white font-medium hover:bg-emerald-600 transition-colors">
                              Donate
                            </button>
                          </div>
                        </div>
                      </article>
                    )}
                  </div>
                </SwiperSlide>
              ))}
            </Swiper>
          )}
        </div>
      </div>

      <style jsx global>{`
        /* Minimal Swiper base (replaces 'swiper/css') */
        .swiper { position: relative; overflow: hidden; list-style: none; padding: 0; margin: 0; }
        .swiper-wrapper { display: flex; box-sizing: content-box; transition-timing-function: cubic-bezier(0.22, 1, 0.36, 1) !important; }
        .swiper-slide { flex-shrink: 0; width: 100%; position: relative; display: flex; height: auto; }

        /* Navigation (replaces 'swiper/css/navigation') – we use custom buttons, keep disabled state only */
        .swiper-button-disabled { opacity: 0.45; cursor: not-allowed !important; transform: none !important; box-shadow: none !important; }

        /* Pagination (replaces 'swiper/css/pagination') */
        .swiper-pagination { position: static; margin-top: 14px; display: flex; justify-content: center; gap: 6px; }
        .swiper-pagination-bullet { width: 8px; height: 8px; background: rgba(0, 0, 0, 0.25); opacity: 1; transition: transform 200ms ease, background-color 200ms ease; border-radius: 50%; }
        .swiper-pagination-bullet-active { background: #10b981; transform: scale(1.12); }

        /* Ensure slides auto-height and flex layout */
        .swiper-slide { display: flex; height: auto; }

        /* Scoped, reliable 10px spacing for this component only */
        .awc .swiper-wrapper { gap: var(--awc-gap, 10px) !important; }
        .awc .swiper-slide { margin-right: 0 !important; }
      `}</style>
    </section>
  );
}