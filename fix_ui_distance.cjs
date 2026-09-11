const fs = require('fs');

let content = fs.readFileSync('src/components/CustomerMemberView.tsx', 'utf-8');

// We need to add geolocation state and logic.
// 1. Add state: userLocation, locationError
// 2. Add useEffect to get geolocation
// 3. Add Haversine formula
// 4. Modify filteredStores sorting and mapping.

// I will do this safely using string replacement

if (!content.includes('const [userLocation')) {
  // Add state right after activeTab
  content = content.replace(
    /const \[activeTab, setActiveTab\] = useState\('HOME'\);/,
    `const [activeTab, setActiveTab] = useState('HOME');
  const [userLocation, setUserLocation] = useState<{lat: number, lng: number} | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);`
  );
  
  // Add Haversine function
  content = content.replace(
    /const CustomerMemberView = \(\{ member \}: \{ member: Member \} \) => \{/,
    `// Haversine formula to calculate distance in km
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

const CustomerMemberView = ({ member }: { member: Member } ) => {`
  );
  
  // Add useEffect for Geolocation
  content = content.replace(
    /useEffect\(\(\) => \{\n    if \(!db\) return;/,
    `useEffect(() => {
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
  }, []);

  useEffect(() => {
    if (!db) return;`
  );
  
  // Update filteredStores logic to calculate distance and sort
  content = content.replace(
    /const filteredStores = stores\.filter\(s =>\s*s\.name\.toLowerCase\(\)\.includes\(storeSearchQuery\.toLowerCase\(\)\)\s*\);/g,
    `const filteredStores = stores
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
    });`
  );
  
  // Update UI to show distance
  const oldStoreHeader = `<h3 className="text-base sm:text-lg font-bold text-white leading-snug drop-shadow-md">
                        {store.name}
                      </h3>`;
  const newStoreHeader = `<h3 className="text-base sm:text-lg font-bold text-white leading-snug drop-shadow-md">
                        {store.name}
                      </h3>
                      {store.distance !== undefined && (
                        <div className="flex items-center gap-1 text-xs font-semibold text-white/90 drop-shadow-md mt-1">
                          <MapPin className="w-3 h-3 text-emerald-400" />
                          <span>
                            {store.distance < 1 
                              ? \`\${Math.round(store.distance * 1000)} m dari Anda\` 
                              : \`\${store.distance.toFixed(1)} km dari Anda\`}
                          </span>
                        </div>
                      )}`;
  content = content.replace(oldStoreHeader, newStoreHeader);
  
  // Add a UI hint about location
  const oldSearchBar = `<div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />`;
  const newSearchBar = `<div className="mb-4">
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
  content = content.replace(oldSearchBar, newSearchBar);
  
  fs.writeFileSync('src/components/CustomerMemberView.tsx', content);
}
