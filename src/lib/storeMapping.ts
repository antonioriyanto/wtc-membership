export type PosType = 'A' | 'B';

export interface StoreBranchInfo {
  name: string;
  posA: string | null;
  posB: string | null;
}

export const WATCH_CLUB_BRANCHES: StoreBranchInfo[] = [
  { name: "23 Paskal Shopping Center Bandung", posA: "C0085", posB: "C0042" },
  { name: "23 Semarang Shopping Center", posA: "C0087", posB: "C0045" },
  { name: "AEON Mall Sentul City Bogor", posA: "C0083", posB: "C0039" },
  { name: "Alianyang Singkawang", posA: "C0078", posB: "C0031" },
  { name: "Ayani Megamall Pontianak", posA: "C0003", posB: null },
  { name: "BIG Mall Samarinda", posA: "C0035", posB: "C0013" },
  { name: "Botani Square Mall Bogor", posA: "C0007", posB: "C0030" },
  { name: "Cibinong City Mall Bogor", posA: "C0028", posB: null },
  { name: "Citimall Gorontalo", posA: "C0020", posB: null },
  { name: "DP Mall Semarang", posA: "C0084", posB: "C0041" },
  { name: "Duta Mall Banjarmasin 1", posA: "C0054", posB: "C0040" },
  { name: "Duta Mall Banjarmasin 2", posA: "C0067", posB: "C0007" },
  { name: "e-Walk Mall Balikpapan", posA: "C0018", posB: null },
  { name: "Gaia Bumi Raya City Pontianak", posA: "C0076", posB: "C0020" },
  { name: "Jogja City Mall", posA: "C0030", posB: "C0028" },
  { name: "Kota Kasablanka Jakarta", posA: "C0074", posB: "C0019" },
  { name: "Level 21 Mall Bali", posA: "C0081", posB: "C0037" },
  { name: "Mal Ciputra Semarang", posA: "C0043", posB: "C0023" },
  { name: "Mal Jayapura", posA: "C0023", posB: "C0006" },
  { name: "Mal Panakkukang Makassar", posA: "C0009", posB: "C0029" },
  { name: "Mall Olympic Garden Malang 1", posA: "C0013", posB: null },
  { name: "Mall Olympic Garden Malang 2", posA: "C0071", posB: "C0011" },
  { name: "Manado Town Square", posA: "C0017", posB: null },
  { name: "Megamall Manado", posA: "C0002", posB: "C0034" },
  { name: "Pakuwon Mall Jogja", posA: "C0044", posB: "C0022" },
  { name: "Pakuwon Mall Solo Baru", posA: "C0022", posB: "C0027" },
  { name: "Palu Grand Mall", posA: "C0079", posB: "C0032" },
  { name: "Pentacity Shopping Venue Balikpapan", posA: "C0041", posB: "C0035" },
  { name: "Plaza Ambarrukmo Yogyakarta", posA: "C0005", posB: "C0033" },
  { name: "Pollux Mall Paragon Semarang", posA: "C0015", posB: null },
  { name: "Puri Indah Mall Jakarta", posA: "C0086", posB: "C0044" },
  { name: "Singkawang Grand Mall", posA: "C0082", posB: "C0038" },
  { name: "Solo Square", posA: "C0010", posB: "C0021" },
  { name: "Summarecon Mall Bandung", posA: "C0080", posB: "C0036" },
  { name: "The Park Kendari", posA: "C0024", posB: "C0001" },
  { name: "The Park Mall Solo", posA: "C0027", posB: null },
  { name: "The Park Sawangan Depok", posA: "C0072", posB: "C0012" },
  { name: "Trans Studio Mall Bali", posA: "C0064", posB: "C0004" },
  { name: "Trans Studio Mall Bandung", posA: "C0019", posB: "C0026" },
  { name: "Trans Studio Mall Cibubur", posA: "C0063", posB: "C0003" },
  { name: "Trans Studio Mall Makassar", posA: null, posB: null }
];

export function getStoreCode(branchName: string, posType: PosType): string | null {
  const store = WATCH_CLUB_BRANCHES.find(b => b.name === branchName);
  if (!store) return null;
  return posType === 'A' ? store.posA : store.posB;
}

export function getBranchInfoByCode(posCode: string): { name: string, posType: PosType } | null {
  if (!posCode) return null;
  const upperCode = posCode.toUpperCase();
  
  for (const store of WATCH_CLUB_BRANCHES) {
    if (store.posA === upperCode) {
      return { name: store.name, posType: 'A' };
    }
    if (store.posB === upperCode) {
      return { name: store.name, posType: 'B' };
    }
  }
  
  return null;
}
