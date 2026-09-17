const fs = require('fs');

let content = fs.readFileSync('src/components/CustomerMemberView.tsx', 'utf-8');

// Add import if not present
if (!content.includes('initialStores')) {
  content = content.replace(/import \{.*\} from 'lucide-react';/, "$&\nimport { initialStores } from '../data/mockData';");
}

const replacement = `  const filteredStores = useMemo(() => {
    let result = stores.map(s => {
      if (!s.imageUrl || !s.mallName) {
        const fallback = initialStores.find(is => is.id === s.id);
        if (fallback) {
          return {
            ...fallback,
            ...s,
            imageUrl: s.imageUrl || fallback.imageUrl,
            mallName: s.mallName || fallback.mallName,
            address: s.address || fallback.address,
            city: s.city || fallback.city,
            region: s.region || fallback.region,
            whatsapp: s.whatsapp || fallback.whatsapp,
          };
        }
      }
      return s;
    }).filter(s => 
      s.name.toLowerCase().includes(storeSearch.toLowerCase()) ||
      (s.mallName && s.mallName.toLowerCase().includes(storeSearch.toLowerCase())) ||
      (s.city && s.city.toLowerCase().includes(storeSearch.toLowerCase())) ||
      (s.code && s.code.toLowerCase().includes(storeSearch.toLowerCase()))
    );

    if (userLocation) {
      result = result.map(s => {
        if (s.latitude !== undefined && s.longitude !== undefined) {
          return {
            ...s,
            distance: getDistanceFromLatLonInKm(userLocation.lat, userLocation.lng, s.latitude, s.longitude)
          };
        }
        return s;
      });
      result.sort((a, b) => {
        if (a.distance !== undefined && b.distance !== undefined) return a.distance - b.distance;
        if (a.distance !== undefined) return -1;
        if (b.distance !== undefined) return 1;
        return 0;
      });
    }
    return result;
  }, [stores, storeSearch, userLocation]);`;

content = content.replace(/  const filteredStores = useMemo\(\(\) => \{[\s\S]*?\}, \[stores, storeSearch, userLocation\]\);/, replacement);

fs.writeFileSync('src/components/CustomerMemberView.tsx', content);
console.log("CustomerMemberView patched successfully!");
