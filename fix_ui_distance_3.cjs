const fs = require('fs');
let content = fs.readFileSync('src/components/CustomerMemberView.tsx', 'utf-8');

// I will just use indexOf and slice to be absolutely sure.
if (!content.includes('navigator.geolocation')) {
  // Add states
  const stateInjection = `  const [userLocation, setUserLocation] = useState<{lat: number, lng: number} | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);`;
  content = content.replace(/(const \[storeSearchQuery, setStoreSearchQuery\] = useState\(''\);)/, `$1\n${stateInjection}`);

  // Add Haversine Function
  const haversineFunction = `// Haversine formula to calculate distance in km
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371; // Radius of the earth in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2); 
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
  return R * c; // Distance in km
}

`;
  content = content.replace(/(export default function CustomerMemberView)/, `${haversineFunction}$1`);

  // Add Geolocation Effect
  const geoEffect = `useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
        },
        (error) => {
          console.warn("Location error:", error);
          setLocationError("Akses lokasi ditolak atau tidak tersedia.");
        }
      );
    }
  }, []);\n\n  `;
  content = content.replace(/(useEffect\(\(\) => \{\n    if \(\!db\) return;)/, `${geoEffect}$1`);

  // Update filtered stores logic
  const oldFilteredStores = `const filteredStores = stores.filter(s => 
    s.name.toLowerCase().includes(storeSearchQuery.toLowerCase())
  );`;
  const newFilteredStores = `const filteredStores = stores
    .filter(s => s.name.toLowerCase().includes(storeSearchQuery.toLowerCase()))
    .map(store => {
      let distance = undefined;
      if (userLocation && store.latitude && store.longitude) {
        distance = calculateDistance(userLocation.lat, userLocation.lng, store.latitude, store.longitude);
      }
      return { ...store, distance };
    })
    .sort((a, b) => {
      if (a.distance !== undefined && b.distance !== undefined) {
        return a.distance - b.distance;
      }
      return 0;
    });`;
  
  if (content.includes(oldFilteredStores)) {
    content = content.replace(oldFilteredStores, newFilteredStores);
  } else {
    // try a more generic replacement
    content = content.replace(/const filteredStores = stores\.filter\(s =>[\s\S]*?storeSearchQuery\.toLowerCase\(\)\)\n\s*\);/, newFilteredStores);
  }

  // Update rendering to show distance
  const oldStoreName = `{store.name}
                      </h3>`;
  const newStoreName = `{store.name}
                      </h3>
                      {store.distance !== undefined && (
                        <div className="flex items-center gap-1 text-[0.65rem] font-bold text-emerald-300 drop-shadow-md mt-0.5">
                          <MapPin className="w-3 h-3" />
                          <span>
                            {store.distance < 1 
                              ? \`\${Math.round(store.distance * 1000)} METER DARI ANDA\` 
                              : \`\${store.distance.toFixed(1)} KM DARI ANDA\`}
                          </span>
                        </div>
                      )}`;
  content = content.replace(new RegExp(oldStoreName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), newStoreName);

  // Add banner
  const oldSearch = `<div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />`;
  const newSearch = `<div className="mb-4">
              {locationError && (
                <div className="text-xs text-amber-600 bg-amber-50 p-2 rounded-lg border border-amber-100 mb-3 flex items-start gap-2">
                  <MapPin className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>Aktifkan akses GPS/Lokasi pada browser Anda untuk melihat cabang toko terdekat.</span>
                </div>
              )}
              {userLocation && (
                <div className="text-xs text-emerald-600 bg-emerald-50 p-2 rounded-lg border border-emerald-100 mb-3 flex items-start gap-2">
                  <MapPin className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>Toko diurutkan berdasarkan jarak terdekat dari lokasi Anda saat ini.</span>
                </div>
              )}
            </div>
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />`;
  content = content.replace(oldSearch, newSearch);

  fs.writeFileSync('src/components/CustomerMemberView.tsx', content);
  console.log("Applied changes to CustomerMemberView.tsx");
}
