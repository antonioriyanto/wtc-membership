export type MembershipTier = 'BLUE' | 'SILVER' | 'GOLD' | 'PLATINUM';

export interface TierBenefitItem {
  id: string;
  title: string;
  description: string;
  iconType: 'percent' | 'gift' | 'service' | 'sparkle';
  fullDetails: string;
  howToUse: string;
  terms: string[];
  badgeText?: string;
}

export const TIER_BENEFITS_DATA: Record<MembershipTier, TierBenefitItem[]> = {
  BLUE: [
    {
      id: 'blue-member-price',
      title: 'Member Price',
      description: 'Diskon/harga eksklusif member untuk produk tertentu',
      iconType: 'percent',
      badgeText: 'Harga Khusus',
      fullDetails: 'Dapatkan harga khusus member atau potongan harga eksklusif pada kurasi koleksi jam tangan, strap original, dan aksesori pilihan di seluruh boutique resmi Watch Club Indonesia.',
      howToUse: 'Tunjukkan kartu digital member Anda di kasir saat bertransaksi di boutique. Staf kami akan memverifikasi diskon member price langsung pada sistem kasir POS.',
      terms: [
        'Berlaku untuk seluruh member aktif tier BLUE ke atas.',
        'Berlaku untuk model jam tangan dan aksesori bertanda khusus Member Price.',
        'Dapat digabungkan dengan program cicilan 0% sesuai ketentuan bank rekanan.'
      ]
    },
    {
      id: 'blue-point-reward',
      title: 'Point Reward',
      description: 'Dapatkan 1 poin setiap belanja Rp10.000, tukar 100 poin = Rp10.000',
      iconType: 'sparkle',
      badgeText: 'Poin Belanja',
      fullDetails: 'Program perolehan poin loyalitas resmi Watch Club Indonesia ("Time for Better You"). Anda mendapatkan 1 Poin Reward untuk setiap pembelanjaan senilai Rp 10.000 di seluruh boutique Watch Club. Poin ini dapat ditukarkan langsung saat transaksi berikutnya dengan nilai konversi 100 Poin = Rp 10.000 (Rp 100 per poin) untuk memotong nilai belanja jam tangan maupun aksesori.',
      howToUse: 'Cukup tunjukkan QR Code Member Anda di kasir saat pembayaran. Kasir akan memindai kode dan saldo poin Anda akan langsung bertambah secara real-time setelah transaksi berhasil. Untuk penukaran poin, infokan ke kasir jumlah saldo poin yang ingin digunakan sebagai diskon.',
      terms: [
        'Perhitungan standar: Rp 10.000 belanja = 1 Poin Reward.',
        'Nilai konversi penukaran: 100 Poin = potongan harga Rp 10.000.',
        'Poin berlaku selama 12 bulan sejak tanggal transaksi belanja diterbitkan.',
        'Poin tidak dapat diuangkan dan tidak dapat dipindahtangankan ke akun orang lain.'
      ]
    },
    {
      id: 'blue-birthday-special',
      title: 'Birthday Special',
      description: 'Voucher ulang tahun Rp50.000, min. transaksi Rp500.000',
      iconType: 'gift',
      badgeText: 'Ulang Tahun',
      fullDetails: 'Rayakan hari istimewa Anda bersama Watch Club! Member Blue berhak mendapatkan e-voucher ulang tahun senilai Rp 50.000 untuk melengkapi momen spesial Anda dengan jam tangan idaman.',
      howToUse: 'Voucher otomatis terbit di menu "Your Active Vouchers" pada tanggal 1 di bulan ulang tahun Anda. Tunjukkan voucher kepada kasir saat berbelanja di gerai Watch Club.',
      terms: [
        'Berlaku dengan minimum transaksi belanja Rp 500.000.',
        'Masa aktif voucher adalah 30 hari kalender sejak tanggal diterbitkan.',
        'Pastikan data tanggal lahir telah terisi dengan benar di profil member Anda.'
      ]
    },
    {
      id: 'blue-complimentary-care',
      title: 'Complimentary Care',
      description: 'Gratis Time Check, Strap Adjustment, dan Watch Cleaning ringan',
      iconType: 'service',
      badgeText: 'Layanan Gratis',
      fullDetails: 'Layanan purnajual dan perawatan jam tangan gratis di seluruh boutique Watch Club: Pemeriksaan akurasi waktu (Time Check), pemotongan/penyesuaian rantai jam (Strap Adjustment), dan pembersihan ringan jam tangan (Light Ultrasonic Cleaning).',
      howToUse: 'Bawa jam tangan Anda beserta kartu member digital ke counter Watch Club terdekat. Teknisi kami akan langsung melakukan pengecekan dan penyesuaian di tempat.',
      terms: [
        'Berlaku untuk jam tangan original yang dibeli di jaringan Watch Club.',
        'Gratis hingga 3 kali perawatan per tahun kalender.',
        'Tidak mencakup penggantian suku cadang utama atau servis berat mesin jam.'
      ]
    }
  ],
  SILVER: [
    {
      id: 'silver-point-multiplier',
      title: '1.25x Point Multiplier',
      description: 'Perolehan poin 25% lebih cepat di setiap transaksi',
      iconType: 'sparkle',
      badgeText: 'Bonus 1.25x',
      fullDetails: 'Nikmati akselerasi perolehan poin sebesar 25% lebih cepat (1.25x Multiplier). Untuk setiap kelipatan Rp 10.000 pembelanjaan, Anda mendapatkan 1,25 Poin (misalnya transaksi Rp 2.000.000 langsung menghasilkan 250 Poin), membuat akumulasi poin penukaran voucher jauh lebih efisien.',
      howToUse: 'Poin bonus otomatis terkalkulasi saat kasir memasukkan transaksi Anda dengan memindai member Silver Anda.',
      terms: [
        'Berlaku otomatis selama status tier Silver Anda aktif.',
        'Berlaku untuk semua metode pembayaran resmi di gerai Watch Club se-Indonesia.'
      ]
    },
    {
      id: 'silver-service-discount',
      title: 'Service Discount',
      description: 'Diskon khusus untuk servis dan perbaikan jam',
      iconType: 'service',
      badgeText: 'Diskon Servis',
      fullDetails: 'Potongan harga khusus 10% untuk biaya perawatan, servis mesin jam berkala, penggantian baterai original bergaransi, dan pemolesan jam tangan di Watch Club Service Center resmi.',
      howToUse: 'Tunjukkan kartu member digital Silver kepada staf customer care saat menyerahkan jam tangan untuk servis.',
      terms: [
        'Diskon 10% berlaku untuk jasa perbaikan dan servis berkala.',
        'Tidak dapat digabungkan dengan promo paket servis lainnya.'
      ]
    },
    {
      id: 'silver-double-point',
      title: 'Double Point Campaign',
      description: 'Akses promo poin ganda pada periode tertentu',
      iconType: 'sparkle',
      badgeText: 'Promo Spesial',
      fullDetails: 'Hak istimewa mengikuti kampanye Poin Ganda (2x Points) pada momentum perayaan khusus seperti Payday Campaign, Anniversary Watch Club, dan hari libur nasional pilihan.',
      howToUse: 'Lakukan transaksi belanja pada tanggal berlangsungnya kampanye yang diinformasikan melalui aplikasi atau WhatsApp resmi.',
      terms: [
        'Periode kampanye diumumkan resmi secara berkala.',
        'Maksimal perolehan poin ganda mengikuti ketentuan promo aktif.'
      ]
    },
    {
      id: 'silver-birthday-voucher',
      title: 'Birthday Voucher Rp100.000',
      description: 'Voucher ulang tahun spesial, min. transaksi Rp1.000.000',
      iconType: 'gift',
      badgeText: 'Ulang Tahun',
      fullDetails: 'Hadiah istimewa bagi member Silver: E-voucher ulang tahun senilai Rp 100.000 untuk menyambut hari kelahiran Anda dengan jam tangan baru.',
      howToUse: 'Voucher otomatis tersedia di tab "Active Vouchers" pada bulan ulang tahun Anda. Tunjukkan kepada kasir saat pembayaran.',
      terms: [
        'Minimum transaksi pembelanjaan Rp 1.000.000.',
        'Masa berlaku 30 hari kalender sejak tanggal diterbitkan.',
        'Berlaku 1 voucher per member per tahun.'
      ]
    },
    {
      id: 'silver-extra-promo',
      title: 'Extra Member Promo & Complimentary Care',
      description: 'Akses promo khusus dan perawatan gratis',
      iconType: 'percent',
      badgeText: 'Perawatan Ekstra',
      fullDetails: 'Akses prioritas pada program promo brand eksklusif serta layanan perawatan jam tangan gratis (Time Check, Strap Adjustment, dan Ultrasonic Cleaning) tanpa batasan kuota kunjungan.',
      howToUse: 'Tunjukkan kartu member Silver saat berkunjung ke store Watch Club mana pun.',
      terms: [
        'Berlaku di seluruh 40+ boutique Watch Club di seluruh Indonesia.'
      ]
    }
  ],
  GOLD: [
    {
      id: 'gold-point-multiplier',
      title: '1.5x Point Multiplier',
      description: 'Perolehan poin 50% lebih tinggi per transaksi',
      iconType: 'sparkle',
      badgeText: 'Bonus 1.5x',
      fullDetails: 'Perolehan poin 50% lebih tinggi (1.5x Multiplier) di setiap transaksi. Setiap belanja Rp 10.000 menghasilkan 1,5 Poin, mempercepat pencapaian penukaran voucher bernilai jutaan rupiah.',
      howToUse: 'Kalkulasi poin bonus 1.5x diterapkan otomatis oleh sistem saat transaksi diselesaikan kasir.',
      terms: [
        'Berlaku aktif selama masa kepemilikan tier Gold.',
        'Berlaku di seluruh gerai Watch Club se-Indonesia.'
      ]
    },
    {
      id: 'gold-priority-service',
      title: 'Priority Service',
      description: 'Jalur antrean servis dan perawatan jam prioritas',
      iconType: 'service',
      badgeText: 'Fast Track',
      fullDetails: 'Fasilitas antrean prioritas (Fast Track) di seluruh counter servis dan klaim garansi resmi. Jam tangan Anda diprioritaskan oleh Master Horologist dengan estimasi pengerjaan lebih cepat.',
      howToUse: 'Informasikan status tier Gold Anda saat menyerahkan unit jam di Service Center.',
      terms: [
        'Prioritas penanganan unit servis sesuai ketersediaan komponen suku cadang pabrikan.'
      ]
    },
    {
      id: 'gold-early-access',
      title: 'Early Access & Brand Event',
      description: 'Akses peluncuran produk baru lebih awal dan undangan brand event',
      iconType: 'sparkle',
      badgeText: 'Undangan VIP',
      fullDetails: 'Undangan VIP eksklusif untuk peluncuran koleksi jam tangan edisi terbatas (Limited Edition) serta hak pre-order koleksi terbaru sebelum dirilis untuk publik umum.',
      howToUse: 'Undangan resmi akan dikirim melalui WhatsApp dan notifikasi aplikasi. Konfirmasi kehadiran Anda via tautan RSVP.',
      terms: [
        'Kapasitas terbatas untuk setiap event private gathering.',
        'Hak pre-order berlaku 1 unit per member untuk model edisi terbatas.'
      ]
    },
    {
      id: 'gold-birthday-voucher',
      title: 'Birthday Voucher Rp150.000',
      description: 'Voucher ulang tahun spesial, min. transaksi Rp1.500.000',
      iconType: 'gift',
      badgeText: 'Ulang Tahun',
      fullDetails: 'Apresiasi ulang tahun berkelas untuk member Gold: E-voucher belanja senilai Rp 150.000 untuk melengkapi perayaan hari kelahiran Anda.',
      howToUse: 'Gunakan e-voucher yang aktif di tab voucher saat bertransaksi di kasir boutique Watch Club.',
      terms: [
        'Minimum transaksi pembelanjaan Rp 1.500.000.',
        'Masa aktif 30 hari kalender sejak tanggal diterbitkan.'
      ]
    },
    {
      id: 'gold-service-discount',
      title: 'Service Discount & Double Point',
      description: 'Diskon perbaikan dan promo poin ganda',
      iconType: 'percent',
      badgeText: 'Diskon 15%',
      fullDetails: 'Potongan harga istimewa 15% untuk seluruh biaya jasa servis dan suku cadang tertentu, ditambah kepastian partisipasi pada seluruh kampanye Double Points tahunan.',
      howToUse: 'Tunjukkan kartu member digital Gold pada kasir atau teknisi Watch Club.',
      terms: [
        'Berlaku di seluruh Watch Club Service Center resmi se-Indonesia.'
      ]
    }
  ],
  PLATINUM: [
    {
      id: 'platinum-point-multiplier',
      title: '2.0x Point Multiplier',
      description: 'Perolehan poin maksimal hingga 2x lipat setiap transaksi',
      iconType: 'sparkle',
      badgeText: 'Poin Maksimal 2x',
      fullDetails: 'Kasta tertinggi pengumpulan reward: Dapatkan 2x Lipat Poin (2.0x Multiplier) di setiap transaksi belanja. Setiap Rp 10.000 langsung menghasilkan 2 Poin Reward penuh.',
      howToUse: 'Poin 2x lipat terhitung otomatis oleh sistem POS omnichannel tanpa syarat tambahan.',
      terms: [
        'Eksklusif untuk member pemegang status Platinum Tier.',
        'Berlaku tanpa batas maksimal perolehan poin per transaksi.'
      ]
    },
    {
      id: 'platinum-vip-shopping',
      title: 'VIP Private Shopping',
      description: 'Akses eksklusif ke private shopping dan quarterly VIP events',
      iconType: 'sparkle',
      badgeText: 'Private Lounge',
      fullDetails: 'Pengalaman berbelanja privat setelah jam operasional reguler boutique dengan asistensi Personal Horology Consultant, sajian hidangan khusus, dan suasana belanja eksklusif tanpa gangguan.',
      howToUse: 'Hubungi Dedicated Concierge WhatsApp Watch Club untuk menjadwalkan sesi private shopping Anda.',
      terms: [
        'Reservasi dilakukan minimal 2 hari kerja sebelum tanggal kunjungan.',
        'Dapat membawa hingga 2 orang pendamping tamu khusus.'
      ]
    },
    {
      id: 'platinum-special-gift',
      title: 'Special Gift',
      description: 'Hadiah eksklusif khusus member Platinum',
      iconType: 'gift',
      badgeText: 'Hadiah Tahunan',
      fullDetails: 'Kado eksklusif tahunan dari jajaran direksi Watch Club (seperti Luxury Watch Winder otomatis, Premium Leather Watch Roll, atau merchandise luxury horology collector edition).',
      howToUse: 'Paket hadiah akan dikirimkan ke alamat domisili terdaftar Anda atau dapat diambil di Flagship Boutique Watch Club terdekat.',
      terms: [
        'Diberikan 1 kali setiap tahun untuk member Platinum aktif.',
        'Item hadiah dapat bervariasi setiap periode kalender program.'
      ]
    },
    {
      id: 'platinum-birthday-voucher',
      title: 'Birthday Voucher Rp250.000',
      description: 'Voucher ulang tahun tertinggi, min. transaksi Rp2.500.000',
      iconType: 'gift',
      badgeText: 'Ulang Tahun Platinum',
      fullDetails: 'Hadiah ulang tahun tertinggi Watch Club: E-Voucher belanja senilai Rp 250.000 sebagai bentuk penghargaan tertinggi atas loyalitas Anda.',
      howToUse: 'Aktifkan voucher di tab "Active Vouchers" dan tunjukkan kepada kasir saat transaksi.',
      terms: [
        'Minimum transaksi pembelanjaan Rp 2.500.000.',
        'Masa aktif 30 hari kalender sejak tanggal penerbitan voucher.'
      ]
    },
    {
      id: 'platinum-concierge',
      title: 'Full Priority & Concierge',
      description: 'Layanan servis prioritas utama dan early access promo',
      iconType: 'service',
      badgeText: 'Personal Concierge',
      fullDetails: 'Layanan VIP Concierge terpadu: Bantuan pencarian model jam tangan langka ke jaringan global, prioritas servis mesin nomor 1, gratis pemolesan (Free Polish) 1 unit jam tangan per tahun, dan antar-jemput unit servis.',
      howToUse: 'Tersedia jalur komunikasi prioritas via WhatsApp Concierge 24/7 untuk seluruh kebutuhan horologi Anda.',
      terms: [
        'Layanan gratis pemolesan berlaku 1x per tahun kalender.',
        'Layanan concierge bersifat personal dan tidak dapat dialihkan.'
      ]
    }
  ]
};
