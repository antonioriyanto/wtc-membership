import React from 'react';
import { StoreBranch } from '../types';
import { Building, MapPin, ExternalLink, Navigation } from 'lucide-react';
import { WhatsAppLogo } from './WhatsAppLogo';

interface StoreCardProps {
  store: StoreBranch;
  index?: number;
}

export const StoreCard: React.FC<StoreCardProps> = ({ store, index }) => {
  const phoneToCall = store.whatsapp || store.phone || '0812-9868-8888';
  const cleanPhone = phoneToCall.replace(/[^0-9]/g, '');
  const waNumber = cleanPhone.startsWith('0') 
    ? '62' + cleanPhone.slice(1) 
    : (cleanPhone.startsWith('62') ? cleanPhone : '62' + cleanPhone);

  const hasCoords = typeof store.latitude === 'number' && !isNaN(store.latitude) && typeof store.longitude === 'number' && !isNaN(store.longitude);
  const mapsUrl = hasCoords
    ? `https://www.google.com/maps/search/?api=1&query=${store.latitude},${store.longitude}`
    : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent([store.mallName || store.name, store.address, store.city, 'Indonesia'].filter(Boolean).join(', '))}`;

  return (
    <div 
      id={`store-card-${store.id || index}`}
      className="bg-white dark:bg-white/5 rounded-2xl border border-black/5 dark:border-white/10 shadow-sm dark:shadow-none overflow-hidden flex flex-col transition-all duration-300 hover:border-black/10 dark:hover:border-white/20 hover:shadow-md"
    >
      {/* 1. Image & Overlay Badges with Luxury Glassmorphism */}
      <div className="relative w-full aspect-[16/9] sm:aspect-[20/9] bg-neutral-100 dark:bg-neutral-800/50 overflow-hidden border-b border-black/5 dark:border-white/10">
        <img 
          src={store.imageUrl || (store as any).image || 'https://images.unsplash.com/photo-1549429532-6804ff69b22b?w=800&q=80'} 
          alt={store.name}
          className="w-full h-full object-cover object-center transition-transform duration-500 hover:scale-105"
          loading="lazy"
          onError={(e) => {
            e.currentTarget.onerror = null;
            e.currentTarget.src = 'https://images.unsplash.com/photo-1548678967-f1fc1ca0c113?w=800&q=80';
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/10 to-transparent"></div>

        {/* Glassmorphism Distance Badge Overlay (Only if distance is known, no Boutique Resmi) */}
        {typeof store.distance === 'number' && !isNaN(store.distance) && (
          <div className="absolute top-3 right-3 flex items-center gap-2">
            <div className="flex items-center gap-1.5 text-[11px] font-medium text-white bg-black/40 backdrop-blur-md px-3 py-1 rounded-full border border-white/15 shadow-sm">
              <Navigation className="w-3 h-3 stroke-[1.5] text-white/90" />
              <span>
                {store.distance < 1 
                  ? `${Math.round(store.distance * 1000)} m` 
                  : `${store.distance.toFixed(1)} km`}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* 2. Card Content & Generous Spacing */}
      <div className="p-5 sm:p-6 flex flex-col gap-3.5">
        {/* City Tag - Minimalist, No loud background */}
        <div className="flex items-center justify-between gap-2">
          <span className="text-[11px] font-semibold tracking-[0.2em] uppercase text-neutral-400 dark:text-neutral-500">
            {store.city || 'INDONESIA'}
          </span>
          {store.distance !== undefined && (
            <span className="text-[11px] text-neutral-400 dark:text-neutral-500 font-normal">
              {store.distance < 1 ? `${Math.round(store.distance * 1000)} m` : `${store.distance.toFixed(1)} km`} dari lokasi
            </span>
          )}
        </div>

        {/* Store Title - Sleek & confident */}
        <div>
          <h3 className="text-lg sm:text-xl font-semibold tracking-tight text-neutral-900 dark:text-neutral-100 leading-snug">
            {store.mallName || store.name}
          </h3>
        </div>

        {/* Store Details (Floor Unit & Street Address) - Clean vertical list, NO bulky grey boxes */}
        <div className="flex flex-col gap-2.5 text-[13px] text-neutral-600 dark:text-neutral-400">
          {/* Floor & Unit */}
          <div className="flex items-center gap-2.5">
            <Building className="w-4 h-4 text-neutral-400 dark:text-neutral-500 shrink-0 stroke-[1.5]" />
            <span className="font-normal text-neutral-700 dark:text-neutral-300">
              {store.floorUnit || 'Boutique Area'}
            </span>
          </div>

          {/* Full Address + Subtle Minimal Maps Link */}
          <div className="flex items-start gap-2.5">
            <MapPin className="w-4 h-4 text-neutral-400 dark:text-neutral-500 shrink-0 mt-0.5 stroke-[1.5]" />
            <div className="flex flex-col gap-1 min-w-0 flex-1">
              <span className="font-normal text-neutral-600 dark:text-neutral-400 leading-relaxed">
                {store.address || store.fullAddress}
              </span>
              <a 
                href={mapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                title="Buka lokasi di Google Maps"
                className="inline-flex items-center gap-1.5 text-[12px] font-medium text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white transition-colors group/map mt-0.5 self-start"
              >
                <span className="underline underline-offset-4 decoration-neutral-300 dark:decoration-neutral-700 group-hover/map:decoration-neutral-900 dark:group-hover/map:decoration-white">
                  Lihat di Google Maps
                </span>
                <ExternalLink className="w-3 h-3 stroke-[1.5] transition-transform group-hover/map:translate-x-0.5" />
              </a>
            </div>
          </div>
        </div>

        {/* WhatsApp Action Button with Official WhatsApp Logo */}
        <a 
          href={`https://wa.me/${waNumber}`}
          target="_blank"
          rel="noopener noreferrer"
          title="Hubungi WhatsApp Boutique"
          className="mt-1 w-full h-11 px-4 rounded-xl bg-neutral-950 hover:bg-neutral-800 text-white dark:bg-white dark:hover:bg-neutral-100 dark:text-neutral-950 flex items-center justify-between transition-all duration-200 cursor-pointer shadow-xs group/wa"
        >
          <div className="flex items-center gap-2.5">
            <WhatsAppLogo className="w-4 h-4 text-[#25D366] shrink-0" />
            <span className="text-[13px] font-medium tracking-tight">
              Hubungi WhatsApp
            </span>
          </div>
          <span className="text-xs text-neutral-400 dark:text-neutral-500 font-mono tracking-wider group-hover/wa:text-neutral-200 dark:group-hover/wa:text-neutral-700 transition-colors">
            {phoneToCall}
          </span>
        </a>
      </div>
    </div>
  );
};
