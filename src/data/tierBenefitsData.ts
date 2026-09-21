export type MembershipTier = 'BLUE' | 'SILVER' | 'GOLD' | 'PLATINUM';

export interface TierBenefitItem {
  id: string;
  title: string;
  description: string;
  iconType: 'percent' | 'gift' | 'service' | 'sparkle';
}

export const TIER_BENEFITS_DATA: Record<MembershipTier, TierBenefitItem[]> = {
  BLUE: [
    {
      id: 'blue-member-price',
      title: 'Member Price',
      description: 'Diskon/harga eksklusif member untuk produk tertentu',
      iconType: 'percent'
    },
    {
      id: 'blue-point-reward',
      title: 'Point Reward',
      description: 'Dapatkan 1 poin setiap belanja Rp10.000, tukar 100 poin = Rp10.000',
      iconType: 'sparkle'
    },
    {
      id: 'blue-birthday-special',
      title: 'Birthday Special',
      description: 'Voucher ulang tahun Rp50.000, min. transaksi Rp500.000',
      iconType: 'gift'
    },
    {
      id: 'blue-complimentary-care',
      title: 'Complimentary Care',
      description: 'Gratis Time Check, Strap Adjustment, dan Watch Cleaning ringan',
      iconType: 'service'
    }
  ],
  SILVER: [
    {
      id: 'silver-point-multiplier',
      title: '1.25x Point Multiplier',
      description: 'Perolehan poin 25% lebih cepat di setiap transaksi',
      iconType: 'sparkle'
    },
    {
      id: 'silver-service-discount',
      title: 'Service Discount',
      description: 'Diskon khusus untuk servis dan perbaikan jam',
      iconType: 'service'
    },
    {
      id: 'silver-double-point',
      title: 'Double Point Campaign',
      description: 'Akses promo poin ganda pada periode tertentu',
      iconType: 'sparkle'
    },
    {
      id: 'silver-birthday-voucher',
      title: 'Birthday Voucher Rp100.000',
      description: 'Voucher ulang tahun spesial, min. transaksi Rp1.000.000',
      iconType: 'gift'
    },
    {
      id: 'silver-extra-promo',
      title: 'Extra Member Promo & Complimentary Care',
      description: 'Akses promo khusus dan perawatan gratis',
      iconType: 'percent'
    }
  ],
  GOLD: [
    {
      id: 'gold-point-multiplier',
      title: '1.5x Point Multiplier',
      description: 'Perolehan poin 50% lebih tinggi per transaksi',
      iconType: 'sparkle'
    },
    {
      id: 'gold-priority-service',
      title: 'Priority Service',
      description: 'Jalur antrean servis dan perawatan jam prioritas',
      iconType: 'service'
    },
    {
      id: 'gold-early-access',
      title: 'Early Access & Brand Event',
      description: 'Akses peluncuran produk baru lebih awal dan undangan brand event',
      iconType: 'sparkle'
    },
    {
      id: 'gold-birthday-voucher',
      title: 'Birthday Voucher Rp150.000',
      description: 'Voucher ulang tahun spesial, min. transaksi Rp1.500.000',
      iconType: 'gift'
    },
    {
      id: 'gold-service-discount',
      title: 'Service Discount & Double Point',
      description: 'Diskon perbaikan dan promo poin ganda',
      iconType: 'percent'
    }
  ],
  PLATINUM: [
    {
      id: 'platinum-point-multiplier',
      title: '2.0x Point Multiplier',
      description: 'Perolehan poin maksimal hingga 2x lipat setiap transaksi',
      iconType: 'sparkle'
    },
    {
      id: 'platinum-vip-shopping',
      title: 'VIP Private Shopping',
      description: 'Akses eksklusif ke private shopping dan quarterly VIP events',
      iconType: 'sparkle'
    },
    {
      id: 'platinum-special-gift',
      title: 'Special Gift',
      description: 'Hadiah eksklusif khusus member Platinum',
      iconType: 'gift'
    },
    {
      id: 'platinum-birthday-voucher',
      title: 'Birthday Voucher Rp250.000',
      description: 'Voucher ulang tahun tertinggi, min. transaksi Rp2.500.000',
      iconType: 'gift'
    },
    {
      id: 'platinum-concierge',
      title: 'Full Priority & Concierge',
      description: 'Layanan servis prioritas utama dan early access promo',
      iconType: 'service'
    }
  ]
};
