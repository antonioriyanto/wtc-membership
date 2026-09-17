const fs = require('fs');

const rawData = [
  { no: 1, city: "Bali", name: "Level 21 Mall Bali", rawAddress: "Mall Level 21 Bali Lantai Dasar No. 22 Jl. Teuku Umar No. 1, Dauh Puri Klod, Kec. Denpasar Barat, Bali 80113", phone: "0823 4087 4740", email: "wtc.bali21@watchclub.co.id", lat: -8.671, lng: 115.2076, code: "LVL21" },
  { no: 2, city: "Bali", name: "Trans Studio Mall Bali", rawAddress: "Trans Studio Mall Bali Lantai Dasar No. 16 Jl. Imam Bonjol 440, Pemecutan Klod Denpasar Barat, Bali - 80119", phone: "0813-5354-1830", email: "wtc.bali@watchclub.co.id", lat: -8.6946, lng: 115.1782, code: "BALI" },
  { no: 3, city: "Balikpapan", name: "e-Walk Mall Balikpapan", rawAddress: "Ewalk Balikpapan Superblock Lantai Dasar Jl. Jend Sudirman, Komp Balikpapan Kalimantan Timur 76114", phone: "0852-4756-5695", email: "wtc.ewalk@watchclub.co.id", lat: -1.277, lng: 116.8378, code: "EWALK" },
  { no: 4, city: "Balikpapan", name: "Pentacity Shopping Venue Balikpapan", rawAddress: "Penta City Shopping Avenue Mall Lantai UG Unit 43a Jl. Jend Sudirman Komp Bsb No. 47 Balikpapan Selatan, Kal-tim 76114", phone: "0821-5550-4156", email: "wtc.pentacity@watchclub.co.id", lat: -1.2772, lng: 116.8375, code: "PENTA" },
  { no: 5, city: "Bandung", name: "Trans Studio Mall Bandung", rawAddress: "Trans Studio Bandung Lantai 1 Unit 1 No. 160 Batununggal, Bandung Jawa Barat 40273", phone: "0821-2954-5114", email: "wtc.tsm@watchclub.co.id", lat: -6.9248, lng: 107.6366, code: "TSM" },
  { no: 6, city: "Bandung", name: "Summarecon Mall Bandung", rawAddress: "Mall Sumarecon Bandung Lantai Dasar No. 829 Jl. Bulevar Barat No. 75-89 Barat Bandung 40294", phone: "0821 2924 8180", email: "wtc.smb@watchclub.co.id", lat: -6.9535, lng: 107.7029, code: "SMB" },
  { no: 7, city: "Bandung", name: "23 Paskal Shopping Center Bandung", rawAddress: "23 Paskal Shopping Center Lantai 2 No. 86 Jl. Pasir Kaliki No. 25-17, Kb. Jeruk, Kec. Andir, Kota Bandung, Jawa Barat 40241", phone: "0822-6007-7509", email: "wtc.paskal23@watchclub.co.id", lat: -6.9152, lng: 107.596, code: "23PSC" },
  { no: 8, city: "Banjarmasin", name: "Duta Mall Banjarmasin 1", rawAddress: "Duta Mall Banjarmasin Lantai 2 Open Area Unit K5 No. 1 Jl. Ahmad Yani Km2 No. 98, Banjarmasin Kalimantan Selatan 70234", phone: "0823-5865-3360", email: "wtc.duta1@watchclub.co.id", lat: -3.3243, lng: 114.5936, code: "DTM1" },
  { no: 9, city: "Banjarmasin", name: "Duta Mall Banjarmasin 2", rawAddress: "Duta Mall Banjarmasin Lantai 2 Unit F11 Jl. Ahmad Yani Km2 No. 98, Banjarmasin Kalimantan Selatan 70234", phone: "0858-2234-1272", email: "wtc.duta2@watchclub.co.id", lat: -3.3243, lng: 114.5936, code: "DTM2" },
  { no: 10, city: "Kabupaten Bogor", name: "Cibinong City Mall Bogor", rawAddress: "Cibinong City Mall Lantai Dasar No. A15 Jl. Tegar Beriman No. 1, Pakan Sari Cibinong, Kab. Bogor 16914, Jawa Barat", phone: "0813-8323-5260", email: "wtc.ccm@watchclub.co.id", lat: -6.4716, lng: 106.8407, code: "CCM" },
  { no: 11, city: "Kabupaten Bogor", name: "AEON Mall Sentul City Bogor", rawAddress: "Mall Aeon Sentul City Lantai 1 Unit Island C-105 Jl. Mh. Thamrin, Citaringgul, Kec. Babakan Madang, Kab. Bogor Jawa Barat 16810", phone: "0821-1800-6041", email: "wtc.aeon@watchclub.co.id", lat: -6.5771, lng: 106.8625, code: "AMSC" },
  { no: 12, city: "Kota Bogor", name: "Botani Square Mall Bogor", rawAddress: "Botani Square Lantai G No. 106 Jl. Raya Pajajaran No. 40, Tugu Kujang Kec. Bogor Tengah, Jawa Barat 16127", phone: "0812-8114-0533", email: "wtc.bogor@watchclub.co.id", lat: -6.5986, lng: 106.8048, code: "BOS" },
  { no: 13, city: "Depok", name: "Trans Studio Mall Cibubur", rawAddress: "Trans Studio Mall Cibubur Lantai 1 No. 22 Jl. Alternatif Cibubur No. 230a, Harjamukti Kec. Cimanggis, Depok, Jawa Barat 16454", phone: "0813-8446-4286", email: "wtc.cibubur@watchclub.co.id", lat: -6.3683, lng: 106.9038, code: "CBB" },
  { no: 14, city: "Depok", name: "The Park Sawangan Depok", rawAddress: "The Park Sawangan Unit G No. 120 Jl. Raya Parung - Ciputat No. 1 Serua, Kec. Bojongsari, Depok, Jawa 16555", phone: "0812-1104-8706", email: "wtc.sawangan@watchclub.co.id", lat: -6.393, lng: 106.757, code: "SWG" },
  { no: 15, city: "Jakarta", name: "Kota Kasablanka Jakarta", rawAddress: "Mall Kota Kasablanka Lantai 1 Unit 153 Jl. Casablanca Raya Kav. 88, Menteng Dalam, Kec. Tebet Jakarta Selatan 12780", phone: "0821-2406-8243", email: "wtc.kokas@watchclub.co.id", lat: -6.2238, lng: 106.8436, code: "KOKAS" },
  { no: 16, city: "Jakarta", name: "Puri Indah Mall Jakarta", rawAddress: "Puri Indah Mall Puri Indah Mall 1 Lantai 1 No. 159 Jl. Puri Agung No. 1 Kembangan Selatan Kec. Kembangan Kota Jakarta Barat, DKI Jakarta 11610", phone: "0858-1741-8645", email: "wtc.puri@watchclub.co.id", lat: -6.1866, lng: 106.7348, code: "PIM" },
  { no: 17, city: "Makassar", name: "Mal Panakkukang Makassar", rawAddress: "Mall Panakkukang Lantai Dasar, Center Hall Jl. Boulevard, Komp Panakkukangmas Makassar, Sulawesi Selatan 90222", phone: "0822-9273-9741", email: "wtc.panakukang@watchclub.co.id", lat: -5.1583, lng: 119.4357, code: "KUKA" },
  { no: 18, city: "Makassar", name: "Trans Studio Mall Makassar", rawAddress: "Trans Studio Mall Makassar Lantai LG No. 130 Jl. Metro Tj. Bunga, Maccini Sombala Kec. Tamalate, Sulawesi Selatan 90224", phone: "0813-5477-4540", email: "wtc.fine@watchclub.co.id", lat: -5.1578, lng: 119.39, code: "FINE" },
  { no: 19, city: "Malang", name: "Mall Olympic Garden Malang 1", rawAddress: "Mall Olympic Garden Lantai Dasar Unit G No. 31 Jl. Kawi No. 24, Kauman, Kec. Klojen Malang, Jawa Timur 65116", phone: "0813-5704-5462", email: "wtc.mog1@watchclub.co.id", lat: -7.9739, lng: 112.6267, code: "MOG1" },
  { no: 20, city: "Malang", name: "Mall Olympic Garden Malang 2", rawAddress: "Mall Olympic Garden Lantai Dasar Unit G07 & G17 Jl. Kawi No. 24, Kauman, Kec. Klojen Malang, Jawa Timur 65116", phone: "0813-5704-5451", email: "wtc.mog2@watchclub.co.id", lat: -7.9739, lng: 112.6267, code: "MOG2" },
  { no: 21, city: "Manado", name: "Manado Town Square", rawAddress: "Manado Town Square Lantai Dasar No. 17 Jl. Piere Tendean, Boulevard Manado Sulawesi Utara 95114", phone: "0812-5742-8258", email: "wtc.mantos@watchclub.co.id", lat: -1.4883, lng: 124.8329, code: "MANTS" },
  { no: 22, city: "Manado", name: "Megamall Manado", rawAddress: "Megamall Manado Lantai 1 Kav 9 Kawasan Megamas Jl. Piere Tandean, Wenang Selatan Kec. Wenang, Sulawesi Utara 95111", phone: "0823-1853-5317", email: "wtc.megamallmanado@watchclub.co.id", lat: -1.4921, lng: 124.8361, code: "MEGAM" },
  { no: 23, city: "Palu", name: "Palu Grand Mall", rawAddress: "Palu Grand Mall, Lantai G No. 20 Jl. Diponegoro, Lere, Kec. Palu Bar Sulawesi Tengah Palu 94221", phone: "0812-4414-2057", email: "wtc.palu@watchclub.co.id", lat: -0.8876, lng: 119.8519, code: "PALU" },
  { no: 24, city: "Pontianak", name: "Ayani Megamall Pontianak", rawAddress: "Ayani Megamall Pontianak Lantai Dasar Bg No. 29 Jl. Ahmad Yani, Pontianak Selatan 78113", phone: "0857-7950-6887", email: "wtc.ayani@watchclub.co.id", lat: -0.0381, lng: 109.3392, code: "AYANI" },
  { no: 25, city: "Pontianak", name: "Gaia Bumi Raya City Pontianak", rawAddress: "Gaia Bumi Raya City Lantai 1 No. 45a Jl. Arteri Supadio, Sungai Raya, Kec. Sungai Raya, Kab. Kubu Raya Kalimantan Barat 78121", phone: "0896-3569-5872", email: "wtc.gaia@watchclub.co.id", lat: -0.0931, lng: 109.3813, code: "GAIA" },
  { no: 26, city: "Samarinda", name: "BIG Mall Samarinda", rawAddress: "Bigmall Samarinda Lantai Dasar Unit B2-b3 Jl. Untung Suropati No. 8, Samarinda Sungai Kunjang, Kalimantan Timur 75126", phone: "0812-5504-8418", email: "wtc.bigmall@watchclub.co.id", lat: -0.5133, lng: 117.1121, code: "BIG" },
  { no: 27, city: "Semarang", name: "Pollux Mall Paragon Semarang", rawAddress: "Paragon City Mall Lantai 1 No. 24 Jl. Pemuda No. 118, Sekayu Kec. Semarang Tengah Jawa Tengah 50132", phone: "0857-7950-6901", email: "wtc.paragon@watchclub.co.id", lat: -6.9803, lng: 110.4141, code: "PRG" },
  { no: 28, city: "Semarang", name: "Mal Ciputra Semarang", rawAddress: "Ciputra Mall Lantai 1 No. 8 Jl. Simpang Lima No. 1, Pekuden Kec. Semarang Tengah, Semarang Jawa Tengah 50125", phone: "0856-4126-9170", email: "wtc.ciputra@watchclub.co.id", lat: -6.9859, lng: 110.423, code: "CL" },
  { no: 29, city: "Semarang", name: "DP Mall Semarang", rawAddress: "Dp Mall Lantai 1 Island Unit 05 Jl. Pemuda No. 150, Sekayu, Kec. Semarang Tengah, Semarang, Jawa Tengah 50132", phone: "0821 3315 1171", email: "wtc.dpmall@watchclub.co.id", lat: -6.9818, lng: 110.4137, code: "DPM" },
  { no: 30, city: "Semarang", name: "23 Semarang Shopping Center", rawAddress: "23 Semarang Shopping Center Unit L3-09, Kawasan Poj Avenue, Kav. No.1 Poj City (kawasan Marina) Desa/kel. Tawangsari, Kec. Semarang Barat Kota Semarang, Jawa Tengah 50144", phone: "0821 641 0280", email: "wtc.smg23@watchclub.co.id", lat: -6.953, lng: 110.3831, code: "23SMG" },
  { no: 31, city: "Singkawang", name: "Alianyang Singkawang", rawAddress: "Ruko Watch Club Jl. Alianyang No. 70 & 71 Pasiran, Kalimantan Barat Singkawang 79123", phone: "0812-5347-6483", email: "wtc.singkawang@watchclub.co.id", lat: 0.9022, lng: 108.9749, code: "ALIAN" },
  { no: 32, city: "Singkawang", name: "Singkawang Grand Mall", rawAddress: "Singkawang Grand Mall Lantai Dasar No. 07 Jl. Aliananyang, Pasiran, Kota Singkawang Kec. Singkawang Barat, Kalimantan Barat 79123", phone: "0852-4878-1568", email: "wtc.sgm@watchclub.co.id", lat: 0.8931, lng: 108.9749, code: "SGM" },
  { no: 33, city: "Solo", name: "Solo Square", rawAddress: "Solo Square Lantai Dasar No. 50 Jl. Slamet Riyadi No. 451-455, Pajang Kec. Laweyan, Kota Surakarta Jawa Tengah 57146", phone: "0818-0411-8477", email: "wtc.sq@watchclub.co.id", lat: -7.5583, lng: 110.7891, code: "SQ" },
  { no: 34, city: "Solo", name: "Pakuwon Mall Solo Baru", rawAddress: "Pakuwon Mall Solo Baru Lantai Dasar Unit A No. 12 Jl. Ir. Soekarno, Dusun Ii, Madegondo Kec. Grogol, Kab. Sukoharjo Jawa Tengah 57146", phone: "0898-1158-211", email: "wtc.sobar@watchclub.co.id", lat: -7.5996, lng: 110.8143, code: "SOBAR" },
  { no: 35, city: "Solo", name: "The Park Mall Solo", rawAddress: "The Park Solo Lantai 1 No. 09c Jl. Ir. Soekarno, Solobaru, Madegondo Grogol Sukoharjo Jawa Tengah 57552", phone: "0821-3842-5749", email: "wtc.theparksolo@watchclub.co.id", lat: -7.5977, lng: 110.8166, code: "PARK" },
  { no: 36, city: "Yogyakarta", name: "Plaza Ambarrukmo Yogyakarta", rawAddress: "Plaza Ambarukmo Lantai Dasar Unit A6-a7 Jl. Laksa Adisucipto No. 80, Caturtunggal. Kec. Depok, Kab. Sleman Daerah Istimewa Yogyakarta 55281", phone: "0822-4138-8175", email: "wtc.amplaz@watchclub.co.id", lat: -7.7825, lng: 110.4011, code: "AMB" },
  { no: 37, city: "Yogyakarta", name: "Jogja City Mall", rawAddress: "Jogja City Mall Lantai Dasar No. 37 Jl. Magelang 18 No. 6, Kutu Patran Sinduadi, Kec. Melati, Kab. Sleman Daerah Istimewa Yogyakarta 55284", phone: "0822-2704-4629", email: "wtc.jcm@watchclub.co.id", lat: -7.7479, lng: 110.3582, code: "JCM" },
  { no: 38, city: "Yogyakarta", name: "Pakuwon Mall Jogja", rawAddress: "Pakuwon Mall Jogja Lantai Dasar Unit UG No. 12 Jl. Ring Road Utara, Kaliwaru, Condongcatur, Kec. Depok, Kabupaten Sleman, Daerah Istimewa Yogyakarta 55281", phone: "0898-1158-211", email: "wtc.pakuwon@watchclub.co.id", lat: -7.7599, lng: 110.398, code: "PMJ" },
  { no: 39, city: "Gorontalo", name: "Citimall Gorontalo", rawAddress: "Gorontalo Mall Lantai Dasar No. 28 Jl. Sultan Botutihe No. 2b Heledulaa Selatan, Kota Timur Gorontalo 96134", phone: "0812-8259-8103", email: "wtc.gorontalo@watchclub.co.id", lat: 0.5401, lng: 123.0641, code: "GTLO" },
  { no: 40, city: "Jayapura", name: "Mal Jayapura", rawAddress: "Mall Jayapura Gf-04 Jl. Sam Ratulangi, Bayangkara Jayapura Utara Papua 99112", phone: "0813-4420-2342", email: "wtc.jayapura@watchclub.co.id", lat: -2.5312, lng: 140.7099, code: "JYP" },
  { no: 41, city: "Kendari", name: "The Park Kendari", rawAddress: "Lippo Plaza Kendari Lantai Dasar Unit 8-9 Jl. Mt Haryono No. 61-63, Anaiwoi Kec. Kadia, Kendari Sulawesi Tenggara 93117", phone: "0853-4019-7149", email: "wtc.kendari@watchclub.co.id", lat: -3.9877, lng: 122.5186, code: "KDI" }
];

const watchStoreImages = [
  "https://images.unsplash.com/photo-1549429532-6804ff69b22b?w=800&q=80",
  "https://images.unsplash.com/photo-1587836171822-7772c7247596?w=800&q=80",
  "https://images.unsplash.com/photo-1622434641406-a158123450f9?w=800&q=80",
  "https://images.unsplash.com/photo-1610423089694-82a0d0149021?w=800&q=80",
  "https://images.unsplash.com/photo-1594534475808-b18fc33b045e?w=800&q=80",
  "https://images.unsplash.com/photo-1548678967-f1fc1ca0c113?w=800&q=80",
  "https://images.unsplash.com/photo-1614164185128-e4ec99c436d7?w=800&q=80"
];

function getRegion(city) {
  if (['Jakarta', 'Depok', 'Kabupaten Bogor', 'Kota Bogor'].includes(city)) return 'Jabodetabek';
  if (['Bandung'].includes(city)) return 'Jawa Barat';
  if (['Semarang', 'Solo', 'Yogyakarta'].includes(city)) return 'Jawa Tengah & DIY';
  if (['Malang'].includes(city)) return 'Jawa Timur';
  if (['Bali'].includes(city)) return 'Bali & Nusa Tenggara';
  if (['Balikpapan', 'Banjarmasin', 'Pontianak', 'Samarinda', 'Singkawang'].includes(city)) return 'Kalimantan';
  if (['Makassar', 'Manado', 'Palu', 'Gorontalo', 'Kendari'].includes(city)) return 'Sulawesi';
  if (['Jayapura'].includes(city)) return 'Papua';
  return 'Jabodetabek';
}

function parseFloorAndStreet(rawAddress) {
  // Try matching "Lantai ... Jl." or "Unit ... Jl." or "Ruko ... Jl."
  const jlIndex = rawAddress.indexOf('Jl.');
  const kawasanIndex = rawAddress.indexOf('Kawasan');
  const batununggalIndex = rawAddress.indexOf('Batununggal');
  
  let splitIndex = -1;
  if (jlIndex !== -1) splitIndex = jlIndex;
  else if (kawasanIndex !== -1) splitIndex = kawasanIndex;
  else if (batununggalIndex !== -1) splitIndex = batununggalIndex;
  
  if (splitIndex !== -1) {
    const part1 = rawAddress.substring(0, splitIndex).trim().replace(/,\s*$/, '');
    const street = rawAddress.substring(splitIndex).trim();
    
    // In part1, remove the mall name prefix if it has Lantai / Unit
    const lantaiMatch = part1.match(/(Lantai\s+[^\,]+|Unit\s+[^\,]+|Ruko\s+[^\,]+|Gf-\d+)/i);
    let floorUnit = lantaiMatch ? lantaiMatch[0].trim() : part1;
    // clean up leading mall name from floorUnit if present
    return {
      floorUnit: floorUnit,
      address: street,
      fullAddress: rawAddress
    };
  }

  return {
    floorUnit: 'Lantai Dasar',
    address: rawAddress,
    fullAddress: rawAddress
  };
}

const detailedFloorUnits = {
  1: "Lantai Dasar No. 22",
  2: "Lantai Dasar No. 16",
  3: "Lantai Dasar",
  4: "Lantai UG Unit 43a",
  5: "Lantai 1 Unit 1 No. 160",
  6: "Lantai Dasar No. 829",
  7: "Lantai 2 No. 86",
  8: "Lantai 2 Open Area Unit K5 No. 1",
  9: "Lantai 2 Unit F11",
  10: "Lantai Dasar No. A15",
  11: "Lantai 1 Unit Island C-105",
  12: "Lantai G No. 106",
  13: "Lantai 1 No. 22",
  14: "Unit G No. 120",
  15: "Lantai 1 Unit 153",
  16: "Lantai 1 No. 159",
  17: "Lantai Dasar, Center Hall",
  18: "Lantai LG No. 130",
  19: "Lantai Dasar Unit G No. 31",
  20: "Lantai Dasar Unit G07 & G17",
  21: "Lantai Dasar No. 17",
  22: "Lantai 1 Kav 9 Kawasan Megamas",
  23: "Lantai G No. 20",
  24: "Lantai Dasar Bg No. 29",
  25: "Lantai 1 No. 45a",
  26: "Lantai Dasar Unit B2-b3",
  27: "Lantai 1 No. 24",
  28: "Lantai 1 No. 8",
  29: "Lantai 1 Island Unit 05",
  30: "Unit L3-09",
  31: "Ruko Watch Club No. 70 & 71",
  32: "Lantai Dasar No. 07",
  33: "Lantai Dasar No. 50",
  34: "Lantai Dasar Unit A No. 12",
  35: "Lantai 1 No. 09c",
  36: "Lantai Dasar Unit A6-a7",
  37: "Lantai Dasar No. 37",
  38: "Lantai Dasar Unit UG No. 12",
  39: "Lantai Dasar No. 28",
  40: "Lantai GF-04",
  41: "Lantai Dasar Unit 8-9"
};

const detailedStreets = {
  1: "Jl. Teuku Umar No. 1, Dauh Puri Klod, Kec. Denpasar Barat, Bali 80113",
  2: "Jl. Imam Bonjol 440, Pemecutan Klod Denpasar Barat, Bali - 80119",
  3: "Jl. Jend Sudirman, Komp Balikpapan Kalimantan Timur 76114",
  4: "Jl. Jend Sudirman Komp Bsb No. 47 Balikpapan Selatan, Kal-tim 76114",
  5: "Batununggal, Bandung Jawa Barat 40273",
  6: "Jl. Bulevar Barat No. 75-89 Barat Bandung 40294",
  7: "Jl. Pasir Kaliki No. 25-17, Kb. Jeruk, Kec. Andir, Kota Bandung, Jawa Barat 40241",
  8: "Jl. Ahmad Yani Km2 No. 98, Banjarmasin Kalimantan Selatan 70234",
  9: "Jl. Ahmad Yani Km2 No. 98, Banjarmasin Kalimantan Selatan 70234",
  10: "Jl. Tegar Beriman No. 1, Pakan Sari Cibinong, Kab. Bogor 16914, Jawa Barat",
  11: "Jl. Mh. Thamrin, Citaringgul, Kec. Babakan Madang, Kab. Bogor Jawa Barat 16810",
  12: "Jl. Raya Pajajaran No. 40, Tugu Kujang Kec. Bogor Tengah, Jawa Barat 16127",
  13: "Jl. Alternatif Cibubur No. 230a, Harjamukti Kec. Cimanggis, Depok, Jawa Barat 16454",
  14: "Jl. Raya Parung - Ciputat No. 1 Serua, Kec. Bojongsari, Depok, Jawa 16555",
  15: "Jl. Casablanca Raya Kav. 88, Menteng Dalam, Kec. Tebet Jakarta Selatan 12780",
  16: "Jl. Puri Agung No. 1 Kembangan Selatan Kec. Kembangan Kota Jakarta Barat, DKI Jakarta 11610",
  17: "Jl. Boulevard, Komp Panakkukangmas Makassar, Sulawesi Selatan 90222",
  18: "Jl. Metro Tj. Bunga, Maccini Sombala Kec. Tamalate, Sulawesi Selatan 90224",
  19: "Jl. Kawi No. 24, Kauman, Kec. Klojen Malang, Jawa Timur 65116",
  20: "Jl. Kawi No. 24, Kauman, Kec. Klojen Malang, Jawa Timur 65116",
  21: "Jl. Piere Tendean, Boulevard Manado Sulawesi Utara 95114",
  22: "Jl. Piere Tandean, Wenang Selatan Kec. Wenang, Sulawesi Utara 95111",
  23: "Jl. Diponegoro, Lere, Kec. Palu Bar Sulawesi Tengah Palu 94221",
  24: "Jl. Ahmad Yani, Pontianak Selatan 78113",
  25: "Jl. Arteri Supadio, Sungai Raya, Kec. Sungai Raya, Kab. Kubu Raya Kalimantan Barat 78121",
  26: "Jl. Untung Suropati No. 8, Samarinda Sungai Kunjang, Kalimantan Timur 75126",
  27: "Jl. Pemuda No. 118, Sekayu Kec. Semarang Tengah Jawa Tengah 50132",
  28: "Jl. Simpang Lima No. 1, Pekuden Kec. Semarang Tengah, Semarang Jawa Tengah 50125",
  29: "Jl. Pemuda No. 150, Sekayu, Kec. Semarang Tengah, Semarang, Jawa Tengah 50132",
  30: "Kawasan Poj Avenue, Kav. No.1 Poj City (kawasan Marina) Desa/kel. Tawangsari, Kec. Semarang Barat Kota Semarang, Jawa Tengah 50144",
  31: "Jl. Alianyang No. 70 & 71 Pasiran, Kalimantan Barat Singkawang 79123",
  32: "Jl. Aliananyang, Pasiran, Kota Singkawang Kec. Singkawang Barat, Kalimantan Barat 79123",
  33: "Jl. Slamet Riyadi No. 451-455, Pajang Kec. Laweyan, Kota Surakarta Jawa Tengah 57146",
  34: "Jl. Ir. Soekarno, Dusun Ii, Madegondo Kec. Grogol, Kab. Sukoharjo Jawa Tengah 57146",
  35: "Jl. Ir. Soekarno, Solobaru, Madegondo Grogol Sukoharjo Jawa Tengah 57552",
  36: "Jl. Laksa Adisucipto No. 80, Caturtunggal. Kec. Depok, Kab. Sleman Daerah Istimewa Yogyakarta 55281",
  37: "Jl. Magelang 18 No. 6, Kutu Patran Sinduadi, Kec. Melati, Kab. Sleman Daerah Istimewa Yogyakarta 55284",
  38: "Jl. Ring Road Utara, Kaliwaru, Condongcatur, Kec. Depok, Kabupaten Sleman, Daerah Istimewa Yogyakarta 55281",
  39: "Jl. Sultan Botutihe No. 2b Heledulaa Selatan, Kota Timur Gorontalo 96134",
  40: "Jl. Sam Ratulangi, Bayangkara Jayapura Utara Papua 99112",
  41: "Jl. Mt Haryono No. 61-63, Anaiwoi Kec. Kadia, Kendari Sulawesi Tenggara 93117"
};

const finalStores = rawData.map((item, idx) => {
  const floorUnit = detailedFloorUnits[item.no];
  const address = detailedStreets[item.no];
  const region = getRegion(item.city);
  const cleanPhone = item.phone.replace(/[^0-9]/g, '');
  const waNumber = cleanPhone.startsWith('0') ? '62' + cleanPhone.slice(1) : cleanPhone;

  return {
    id: item.code,
    code: item.code,
    name: item.name,
    mallName: item.name,
    city: item.city,
    region: region,
    floorUnit: floorUnit,
    address: address,
    fullAddress: item.rawAddress,
    location: `${item.name}, ${item.city}`,
    type: 'STORE',
    isActive: true,
    phone: item.phone,
    whatsapp: item.phone,
    waNumber: waNumber,
    email: item.email,
    latitude: item.lat,
    longitude: item.lng,
    managerName: "Branch Manager",
    cashierCount: 1,
    status: "ONLINE",
    todayTransactions: 0,
    todayRevenue: 0,
    todayPointsIssued: 0,
    activePromosCount: 0,
    imageUrl: watchStoreImages[idx % watchStoreImages.length]
  };
});

// Add HO (Head Office)
finalStores.push({
  id: "HO",
  code: "HO",
  name: "Head Office",
  mallName: "PIK Avenue",
  city: "Jakarta Utara",
  region: "Jabodetabek",
  floorUnit: "Head Office Suite",
  address: "PIK Avenue, Pantai Indah Kapuk, Kamal Muara, Penjaringan, Jakarta Utara 14470",
  fullAddress: "PIK Avenue, Pantai Indah Kapuk, Kamal Muara, Penjaringan, Jakarta Utara 14470",
  location: "PIK Avenue, Jakarta Utara",
  type: "HO",
  isActive: true,
  phone: "021-2986-8888",
  whatsapp: "0812-9868-8888",
  waNumber: "6281298688888",
  email: "wtc.ho@watchclub.co.id",
  latitude: -6.1086,
  longitude: 106.7397,
  managerName: "General Manager",
  cashierCount: 5,
  status: "ONLINE",
  todayTransactions: 0,
  todayRevenue: 0,
  todayPointsIssued: 0,
  activePromosCount: 0,
  imageUrl: "https://images.unsplash.com/photo-1497366216548-37526070297c?w=800&q=80"
});

fs.writeFileSync('generated_stores_data.json', JSON.stringify(finalStores, null, 2));
console.log(`Generated ${finalStores.length} stores successfully!`);
